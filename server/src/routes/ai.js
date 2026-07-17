import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const SYSTEM = `You are a diagram generator for a collaborative whiteboard. Return ONLY a valid JSON array. No markdown, no explanation.

IMPORTANT RULES:
- Canvas is 700px wide, 450px tall
- ALL coordinates must be within these bounds
- For any diagram, first plan the layout carefully so shapes don't overlap badly
- Always include text labels so the diagram is understandable

Each element must be one of these exact formats:

Shape: { "tool": "rect"|"circle"|"diamond", "x1": number, "y1": number, "x2": number, "y2": number, "color": "#hexcolor" }
Line/Arrow: { "tool": "line"|"arrow", "x1": number, "y1": number, "x2": number, "y2": number, "color": "#hexcolor" }
Text label: { "tool": "text", "x1": number, "y1": number, "x2": number, "y2": number, "text": "label here", "color": "#hexcolor" }

LAYOUT GUIDELINES:
- For flowcharts: start at top (y=50), flow downward, each step ~80px apart
- For trees: root at top-center (x=350, y=40), branches spread left/right
- For system diagrams: components spread across canvas with arrows connecting them
- Boxes should be ~120x50px minimum
- Always add text labels centered inside or near each shape
- Use bright colors: #7c5cfc, #ec4899, #06b6d4, #10b981, #f59e0b, #ef4444
- Text should be white #fafafa or light colored

Example for "login flow":
[
  {"tool":"rect","x1":250,"y1":20,"x2":450,"y2":70,"color":"#7c5cfc"},
  {"tool":"text","x1":300,"y1":52,"x2":400,"y2":70,"text":"User Login","color":"#fafafa"},
  {"tool":"arrow","x1":350,"y1":70,"x2":350,"y2":120,"color":"#a1a1aa"},
  {"tool":"rect","x1":200,"y1":120,"x2":500,"y2":170,"color":"#06b6d4"},
  {"tool":"text","x1":270,"y1":152,"x2":430,"y2":170,"text":"Check Credentials","color":"#fafafa"},
  {"tool":"arrow","x1":280,"y1":170,"x2":150,"y2":230,"color":"#ef4444"},
  {"tool":"arrow","x1":420,"y1":170,"x2":520,"y2":230,"color":"#10b981"},
  {"tool":"rect","x1":60,"y1":230,"x2":240,"y2":280,"color":"#ef4444"},
  {"tool":"text","x1":100,"y1":262,"x2":200,"y2":280,"text":"Error: Retry","color":"#fafafa"},
  {"tool":"rect","x1":390,"y1":230,"x2":600,"y2":280,"color":"#10b981"},
  {"tool":"text","x1":430,"y1":262,"x2":560,"y2":280,"text":"Dashboard","color":"#fafafa"}
]`;

async function tryGroq(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("No Groq key");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Draw a diagram for: ${prompt}` },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }
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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }
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
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.2-3b-instruct:free",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Draw a diagram for: ${prompt}` },
      ],
      max_tokens: 1000,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

function parseShapes(raw) {
  if (!raw) throw new Error("Empty response from AI");
  console.log("[AI RAW]", raw.substring(0, 500));

  const clean = raw.replace(/```json|```/g, "").trim();
  const match = clean.match(/\[[\s\S]*?\]/);
  if (!match) throw new Error("No JSON array in response");

  let shapes;
  try {
    shapes = JSON.parse(match[0]);
  } catch (e) {
    throw new Error("Invalid JSON: " + e.message);
  }

  if (!Array.isArray(shapes)) throw new Error("Response is not an array");

  const valid = shapes.filter((s) => {
    const ok = s.tool &&
      (typeof s.x1 === "number" || typeof s.x1 === "string") &&
      (typeof s.y1 === "number" || typeof s.y1 === "string") &&
      (s.tool !== "text" || s.text); // text tool needs text field
    if (!ok) console.log("[AI] skipping invalid shape:", s);
    return ok;
  }).map((s) => ({
    tool:   s.tool,
    x1:     Number(s.x1),
    y1:     Number(s.y1),
    x2:     Number(s.x2 ?? s.x1 + 100),
    y2:     Number(s.y2 ?? s.y1 + 80),
    color:  s.color || "#7c5cfc",
    ...(s.text && { text: s.text }),
  }));

  console.log("[AI] valid shapes:", valid.length);
  if (valid.length === 0) throw new Error("No valid shapes after filtering");
  return valid;
}

router.post("/diagram", protect, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ message: "Prompt required" });

  console.log("[AI] prompt:", prompt);
  console.log("[AI] keys available:", {
    groq:       !!process.env.GROQ_API_KEY,
    gemini:     !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
  });

  const providers = [
    { name: "Groq",       fn: () => tryGroq(prompt) },
    { name: "Gemini",     fn: () => tryGemini(prompt) },
    { name: "OpenRouter", fn: () => tryOpenRouter(prompt) },
  ];

  const errors = [];

  for (const { name, fn } of providers) {
    try {
      console.log(`[AI] trying ${name}...`);
      const raw    = await fn();
      const shapes = parseShapes(raw);
      console.log(`[AI] ${name} success — ${shapes.length} shapes`);
      return res.json({ shapes, provider: name });
    } catch (err) {
      console.warn(`[AI] ${name} failed:`, err.message);
      errors.push(`${name}: ${err.message}`);
    }
  }

  console.error("[AI] all providers failed:", errors);
  res.status(503).json({ message: "AI unavailable", errors });
});

export default router;