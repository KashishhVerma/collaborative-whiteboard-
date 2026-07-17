import express from "express";
import Room from "../models/Room.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

// Create room
router.post("/create", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Room name required" });
    let code = genCode();
    let attempts = 0;
    while ((await Room.findOne({ code })) && attempts++ < 10) code = genCode();
    const room = await Room.create({
      name: name.trim(),
      code,
      createdBy: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join room
router.post("/join", protect, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Room code required" });
    const room = await Room.findOne({ code: code.toUpperCase().trim() });
    if (!room) return res.status(404).json({ message: "Room not found. Check the code." });
    const alreadyMember = room.members.some((m) => m.toString() === req.user._id.toString());
    if (!alreadyMember) {
      room.members.push(req.user._id);
      await room.save();
    }
    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get room by code
router.get("/:code", protect, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() }).populate("createdBy", "username");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my rooms
router.get("/", protect, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate("createdBy", "username")
      .sort({ updatedAt: -1 })
      .limit(20);
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
