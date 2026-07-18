import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { getSocket } from "../../services/socket.js";
import { Send, MessageSquare } from "lucide-react";
import { EmptyState } from "../ui/Primitives.jsx";

const COLORS = ["#F1B5DF","#db2777","#0891b2","#059669","#d97706","#dc2626"];
const getColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

function fmt(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ username, size = 20 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45, background: getColor(username) }}
      aria-label={username}
    >
      {username?.[0]?.toUpperCase()}
    </div>
  );
}

export default function Chat({ roomCode, darkMode = true }) {
  const [input, setInput] = useState("");
  const { chatMessages } = useSelector((s) => s.room);
  const { user }         = useSelector((s) => s.auth);
  const bottomRef        = useRef(null);
  const inputRef         = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    getSocket()?.emit("chat:message", { roomCode, message: input.trim() });
    setInput("");
    inputRef.current?.focus();
  };

  const isMe = (msg) =>
    msg.userId === user?._id?.toString() || msg.username === user?.username;

  const bg     = darkMode ? "#18181b" : "#ffffff";
  const border = darkMode ? "#27272a" : "#e4e4e7";
  const inputBg = darkMode ? "#1f1f23" : "#f4f4f5";

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: bg, borderLeft: `1px solid ${border}` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-11 flex-shrink-0"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
          <span className="text-sm font-medium" style={{ color: darkMode ? "#fafafa" : "#18181b" }}>Chat</span>
        </div>
        <span className="text-xs" style={{ color: "#71717a" }}>{chatMessages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 min-h-0">
        {chatMessages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Start the conversation!"
          />
        ) : (
          chatMessages.map((msg, i) => {
            const me = isMe(msg);
            const showAvatar = !me && (i === 0 || chatMessages[i - 1]?.username !== msg.username);
            return (
              <div key={i} className={`flex gap-2 ${me ? "flex-row-reverse" : "flex-row"} items-end anim-slide-up`}>
                {!me && (
                  <div className="w-5 flex-shrink-0">
                    {showAvatar && <Avatar username={msg.username} />}
                  </div>
                )}
                <div className={`flex flex-col gap-0.5 max-w-[80%] ${me ? "items-end" : "items-start"}`}>
                  {showAvatar && !me && (
                    <span className="text-2xs px-1" style={{ color: "#71717a" }}>{msg.username}</span>
                  )}
                  <div
                    className="px-3 py-1.5 text-sm leading-relaxed break-words"
                    style={{
                      borderRadius: me ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                      background: me ? "#7c3aed" : (darkMode ? "#1f1f23" : "#f4f4f5"),
                      color: me ? "#fff" : (darkMode ? "#fafafa" : "#18181b"),
                      border: me ? "none" : `1px solid ${border}`,
                    }}
                  >
                    {msg.message}
                  </div>
                  <span className="text-2xs px-1" style={{ color: "#52525b" }}>{fmt(msg.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 flex-shrink-0" style={{ borderTop: `1px solid ${border}` }}>
        <form onSubmit={send} className="flex gap-2 items-center">
          <input
            ref={inputRef}
            className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg transition-all duration-150"
            style={{
              background: inputBg,
              border: `1px solid ${border}`,
              color: darkMode ? "#fafafa" : "#18181b",
              outline: "none",
            }}
            placeholder="Message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
            onBlur={(e) => { e.target.style.borderColor = border; e.target.style.boxShadow = "none"; }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn-icon transition-all duration-150"
            style={{
              background: input.trim() ? "#7c3aed" : "#27272a",
              color: "#fff",
              opacity: input.trim() ? 1 : 0.5,
            }}
            aria-label="Send message"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}
