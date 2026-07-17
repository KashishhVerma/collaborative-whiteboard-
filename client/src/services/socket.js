import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  return socket;
}

export function initSocket() {
  // Already connected — reuse
  if (socket?.connected) return socket;

  // Exists but disconnected — kill it cleanly
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = localStorage.getItem("cb_token");
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

  socket = io(serverUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

 socket.on("connect", () => {
    console.log("[socket] connected:", socket.id);
    if (socket._pendingRoom) {
      console.log("[socket] auto-rejoining:", socket._pendingRoom);
      // Small delay — let BoardPage listeners re-attach first
      setTimeout(() => {
        socket.emit("room:join", { roomCode: socket._pendingRoom });
      }, 300);
    }
  });

  socket.on("disconnect", (r) => console.log("[socket] disconnected:", r));
  socket.on("connect_error", (e) => console.error("[socket] error:", e.message));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket._pendingRoom = null;
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
