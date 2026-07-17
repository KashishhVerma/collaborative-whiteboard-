import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Room from "../models/Room.js";

// roomCode -> Map(socketId -> { userId, username })
const roomUsers = new Map();

async function authenticate(socket) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(decoded.id).select("-password");
  } catch {
    return null;
  }
}

function getRoomUserList(roomCode) {
  const map = roomUsers.get(roomCode);
  if (!map) return [];
  return Array.from(map.values());
}

function broadcastUserList(io, roomCode) {
  io.to(roomCode).emit("room:users", { users: getRoomUserList(roomCode) });
}

export function setupSocketHandlers(io) {
  io.on("connection", async (socket) => {
    const user = await authenticate(socket);
    if (!user) {
      socket.emit("error", { message: "Authentication failed" });
      socket.disconnect(true);
      return;
    }

    socket.user = user;
    socket.currentRoom = null;

    console.log(`[connect] ${user.username} (${socket.id})`);

    // ── JOIN ROOM ─────────────────────────────────────────────────────────────
    socket.on("room:join", async ({ roomCode }) => {
      if (!roomCode) return;
      const code = roomCode.toUpperCase().trim();

      try {
        const room = await Room.findOne({ code });
        if (!room) {
          socket.emit("room:error", { message: "Room not found" });
          return;
        }

        // Leave previous room if any
        if (socket.currentRoom && socket.currentRoom !== code) {
          leaveRoom(io, socket, socket.currentRoom);
        }

        // Join socket room
        socket.join(code);
        socket.currentRoom = code;

        // Track user
        if (!roomUsers.has(code)) roomUsers.set(code, new Map());
        roomUsers.get(code).set(socket.id, {
          socketId: socket.id,
          userId: user._id.toString(),
          username: user.username,
        });

        // Send history to THIS user only
        socket.emit("canvas:history", { canvasData: room.canvasData || "[]" });
        socket.emit("chat:history", { messages: room.chatMessages.slice(-100) });
        socket.emit("notes:history", { notes: room.notes || [] });
        socket.emit("room:joined", { room: { name: room.name, code: room.code } });

        // Broadcast updated user list to ALL in room
        broadcastUserList(io, code);

        // Tell others someone joined
        socket.to(code).emit("room:user_joined", { username: user.username });

        console.log(`[join] ${user.username} → room ${code}`);
      } catch (err) {
        console.error("[room:join error]", err.message);
        socket.emit("room:error", { message: "Could not join room" });
      }
    });

    // ── CANVAS DRAW ───────────────────────────────────────────────────────────
    // Broadcast stroke to all OTHER users in room
    socket.on("canvas:draw", ({ roomCode, stroke }) => {
      if (!roomCode || !stroke) return;
      socket.to(roomCode.toUpperCase()).emit("canvas:draw", { stroke });
    });

    // ── CANVAS CLEAR ──────────────────────────────────────────────────────────
    socket.on("canvas:clear", async ({ roomCode }) => {
      if (!roomCode) return;
      const code = roomCode.toUpperCase();
      io.to(code).emit("canvas:clear");
      try {
        await Room.findOneAndUpdate({ code }, { canvasData: "[]" });
      } catch (err) {
        console.error("[canvas:clear error]", err.message);
      }
    });

    // ── CANVAS REQUEST HISTORY ───────────────────────────────────────────────
    // Canvas component requests history when it mounts after socket already joined
    socket.on("canvas:request_history", async ({ roomCode }) => {
      if (!roomCode) return;
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (room) socket.emit("canvas:history", { canvasData: room.canvasData || "[]" });
      } catch (err) {
        console.error("[canvas:request_history error]", err.message);
      }
    });

    // ── CANVAS SAVE ───────────────────────────────────────────────────────────
    socket.on("canvas:save", async ({ roomCode, canvasData }) => {
      if (!roomCode) return;
      try {
        await Room.findOneAndUpdate(
          { code: roomCode.toUpperCase() },
          { canvasData: canvasData || "[]" }
        );
        socket.emit("canvas:saved");
      } catch (err) {
        console.error("[canvas:save error]", err.message);
        socket.emit("room:error", { message: "Failed to save board" });
      }
    });

    // ── CURSOR MOVE ───────────────────────────────────────────────────────────
    socket.on("cursor:move", ({ roomCode, x, y }) => {
      if (!roomCode) return;
      socket.to(roomCode.toUpperCase()).emit("cursor:move", {
        socketId: socket.id,
        username: user.username,
        x,
        y,
      });
    });

    // ── CHAT MESSAGE ──────────────────────────────────────────────────────────
    socket.on("chat:message", async ({ roomCode, message }) => {
      if (!roomCode || !message?.trim()) return;
      const code = roomCode.toUpperCase();
      const msg = {
        userId: user._id.toString(),
        username: user.username,
        message: message.trim().slice(0, 1000),
        type: "text",
        timestamp: new Date(),
      };
      // Broadcast to ALL in room (including sender) so sender sees it too
      io.to(code).emit("chat:message", msg);
      // Persist
      try {
        await Room.findOneAndUpdate(
          { code },
          { $push: { chatMessages: { $each: [msg], $slice: -200 } } }
        );
      } catch (err) {
        console.error("[chat:message error]", err.message);
      }
    });

    // ── NOTES ─────────────────────────────────────────────────────────────────
    socket.on("note:add", async ({ roomCode, note }) => {
      if (!roomCode || !note) return;
      const code = roomCode.toUpperCase();
      io.to(code).emit("note:add", { note });
      try {
        await Room.findOneAndUpdate({ code }, { $push: { notes: note } });
      } catch (err) {
        console.error("[note:add error]", err.message);
      }
    });

    socket.on("note:update", async ({ roomCode, note }) => {
      if (!roomCode || !note) return;
      const code = roomCode.toUpperCase();
      socket.to(code).emit("note:update", { note });
      try {
        await Room.findOneAndUpdate(
          { code, "notes.id": note.id },
          { $set: { "notes.$.text": note.text, "notes.$.x": note.x, "notes.$.y": note.y } }
        );
      } catch (err) {
        console.error("[note:update error]", err.message);
      }
    });

    socket.on("note:delete", async ({ roomCode, noteId }) => {
      if (!roomCode || !noteId) return;
      const code = roomCode.toUpperCase();
      io.to(code).emit("note:delete", { noteId });
      try {
        await Room.findOneAndUpdate({ code }, { $pull: { notes: { id: noteId } } });
      } catch (err) {
        console.error("[note:delete error]", err.message);
      }
    });

    // ── CANVAS UNDO ───────────────────────────────────────────────────────────
    // Broadcast updated stroke history to all others so they can re-render
    socket.on("canvas:undo", async ({ roomCode, strokes }) => {
      if (!roomCode) return;
      const code = roomCode.toUpperCase();
      socket.to(code).emit("canvas:undo", { strokes });
      // Also persist
      try {
        await Room.findOneAndUpdate({ code }, { canvasData: JSON.stringify(strokes) });
      } catch (err) {
        console.error("[canvas:undo error]", err.message);
      }
    });

    // ── IMAGE UPLOAD ──────────────────────────────────────────────────────────
    // Image is sent as base64 — broadcast to room, not persisted (too large)
    socket.on("image:add", ({ roomCode, image }) => {
      if (!roomCode || !image) return;
      socket.to(roomCode.toUpperCase()).emit("image:add", { image });
    });

    // ── EMOJI REACTIONS ───────────────────────────────────────────────────────
    socket.on("emoji:react", ({ roomCode, emoji, x, y }) => {
      if (!roomCode || !emoji) return;
      socket.to(roomCode.toUpperCase()).emit("emoji:react", { emoji, x, y, username: user.username });
    });

    // ── LEAVE ROOM ────────────────────────────────────────────────────────────
    socket.on("room:leave", ({ roomCode }) => {
      if (!roomCode) return;
      leaveRoom(io, socket, roomCode.toUpperCase());
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[disconnect] ${user.username} — ${reason}`);
      if (socket.currentRoom) {
        leaveRoom(io, socket, socket.currentRoom);
      }
    });
  });
}

function leaveRoom(io, socket, roomCode) {
  if (!roomCode) return;
  const code = roomCode.toUpperCase();
  socket.leave(code);

  const users = roomUsers.get(code);
  if (users) {
    users.delete(socket.id);
    if (users.size === 0) roomUsers.delete(code);
  }

  broadcastUserList(io, code);
  socket.to(code).emit("room:user_left", { username: socket.user?.username });

  if (socket.currentRoom === code) socket.currentRoom = null;
  console.log(`[leave] ${socket.user?.username} ← room ${code}`);
}
