import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  userId: String,
  username: String,
  message: String,
  type: { type: String, default: "text" }, // text | system
  timestamp: { type: Date, default: Date.now },
});

const noteSchema = new mongoose.Schema({
  id: String,
  x: Number,
  y: Number,
  text: String,
  color: String,
  createdBy: String,
});

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    canvasData: { type: String, default: "[]" },
    chatMessages: { type: [chatMessageSchema], default: [] },
    notes: { type: [noteSchema], default: [] },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
