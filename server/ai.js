import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── AI providers with fallback ────────────────────────────────────────────────

const SYSTEM = `You are a diagram generator for a whiteboard app. Return ONLY a valid JSON array of shapes. No markdown, no explanation, no code blocks.
Each shape must follow this exact format:
{ "tool": "rect"|"circle"|"line"|"arrow"|"diamond", "x1": number, "y1": number, "x2": number, "y2": number, "color": "#hexcolor" }
Canvas size is 700x450. Keep shapes within bounds. Use colors that contrast well on dark background. Generate 4-12 shapes.`;

async function tryGroq(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("No Groq key");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user",   content: `Draw a diagram for: ${prompt}` },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`Groq: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

async function tryGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No Gemini key");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM}\n\nDraw a diagram for: ${prompt}` }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.3 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function tryOpenRouter(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("No OpenRouter key");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "https://collabboard.app",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.2-3b-instruct:free",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user",   content: `Draw a diagram for: ${prompt}` },
      ],
      max_tokens: 1000,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

async function tryAnthropic(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("No Anthropic key");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: SYSTEM,
      messages: [{ role: "user", content: `Draw a diagram for: ${prompt}` }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text;
}

function parseShapes(raw) {
  if (!raw) throw new Error("Empty response");
  const clean = raw.replace(/```json|```/g, "").trim();
  // Find JSON array in response
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found");
  const shapes = JSON.parse(match[0]);
  if (!Array.isArray(shapes) || shapes.length === 0) throw new Error("Empty shapes array");
  // Validate each shape
  return shapes.filter((s) =>
    s.tool && typeof s.x1 === "number" && typeof s.y1 === "number" &&
    typeof s.x2 === "number" && typeof s.y2 === "number"
  );
}

router.post("/diagram", protect, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ message: "Prompt required" });

  const providers = [
    { name: "Groq",       fn: () => tryGroq(prompt) },
    { name: "Gemini",     fn: () => tryGemini(prompt) },
    { name: "OpenRouter", fn: () => tryOpenRouter(prompt) },
    { name: "Anthropic",  fn: () => tryAnthropic(prompt) },
  ];

  const errors = [];

  for (const { name, fn } of providers) {
    try {
      console.log(`[AI] Trying ${name}...`);
      const raw    = await fn();
      const shapes = parseShapes(raw);
      console.log(`[AI] ${name} succeeded — ${shapes.length} shapes`);
      return res.json({ shapes, provider: name });
    } catch (err) {
      console.warn(`[AI] ${name} failed:`, err.message);
      errors.push(`${name}: ${err.message}`);
    }
  }

  res.status(503).json({
    message: "All AI providers failed. Add at least one API key in server .env",
    errors,
  });
});

export default router;
