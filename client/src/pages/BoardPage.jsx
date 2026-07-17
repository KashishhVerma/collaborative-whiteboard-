import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRoom, clearRoom, setActiveUsers,
  addChatMessage, setChatHistory,
  setNotes, addNote, updateNote, removeNote
} from "../store/roomSlice.js";
import { initSocket } from "../services/socket.js";
import Canvas from "../components/canvas/Canvas.jsx";
import Toolbar from "../components/canvas/Toolbar.jsx";
import Chat from "../components/chat/Chat.jsx";
import ActiveUsers from "../components/room/ActiveUsers.jsx";
import StickyNotes from "../components/room/StickyNotes.jsx";
import Loader from "../components/ui/Loader.jsx";
import {
  Pencil, ArrowLeft, Copy, MessageSquare, StickyNote,
  Timer, Smile, Share2, Sparkles, Sun, Moon, Check, X
} from "lucide-react";
import toast from "react-hot-toast";

// ── Avatar color ──────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#7c5cfc","#e879f9","#38bdf8","#34d399","#fb923c","#f87171"];
const getColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ── Remote cursor ─────────────────────────────────────────────────────────────
function RemoteCursor({ username, x, y }) {
  const col = getColor(username);
  return (
    <div className="pointer-events-none absolute z-40 transition-all duration-75"
      style={{ left: x, top: y, transform: "translate(-2px,-2px)" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M0 0L0 11L3 8L5.5 13L7.5 12L5 7L9 7Z"
          fill={col} stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
      </svg>
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white whitespace-nowrap mt-0.5 block"
        style={{ backgroundColor: col }}>
        {username}
      </span>
    </div>
  );
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function TimerWidget({ onClose, dark }) {
  const [totalSecs, setTotalSecs] = useState(300);
  const [left, setLeft] = useState(300);
  const [running, setRunning] = useState(false);
  const [mins, setMins] = useState("5");
  const iv = useRef(null);

  useEffect(() => {
    if (running) {
      iv.current = setInterval(() => {
        setLeft((s) => {
          if (s <= 1) {
            clearInterval(iv.current);
            setRunning(false);
            toast("⏰ Time's up!", { duration: 5000 });
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(iv.current);
    }
    return () => clearInterval(iv.current);
  }, [running]);

  const start = () => {
    const s = Math.max(1, parseInt(mins) || 5) * 60;
    setTotalSecs(s);
    setLeft(s);
    setRunning(true);
  };
  const reset = () => { setRunning(false); setLeft(totalSecs); };
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
  const pct = totalSecs > 0 ? left / totalSecs : 0;
  const danger = left < 60 && running;

  return (
    <div className={`rounded-xl p-4 w-52 shadow-2xl border ${dark ? "bg-surface border-border" : "bg-white border-gray-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-semibold flex items-center gap-1.5 ${dark ? "text-text" : "text-gray-800"}`}>
          <Timer size={14} /> Timer
        </span>
        <button onClick={onClose} className="text-text-muted hover:text-text"><X size={14} /></button>
      </div>
      <div className={`text-4xl font-mono text-center font-bold mb-3 ${danger ? "text-red-400" : "text-accent"}`}>
        {fmt(left)}
      </div>
      <div className={`w-full h-1.5 rounded-full mb-3 ${dark ? "bg-border" : "bg-gray-200"}`}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct * 100}%`, backgroundColor: danger ? "#f87171" : "#7c5cfc" }} />
      </div>
      {!running && (
        <div className="flex gap-2 mb-2 items-center">
          <input type="number" min="1" max="120" value={mins}
            onChange={(e) => setMins(e.target.value)}
            className="input-field text-center py-1 text-sm w-16" />
          <span className={`text-sm ${dark ? "text-text-muted" : "text-gray-500"}`}>min</span>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={running ? reset : start}
          className={`btn-primary flex-1 py-1.5 text-sm ${running ? "bg-red-500 hover:bg-red-600" : ""}`}>
          {running ? "Reset" : left === 0 ? "Restart" : "Start"}
        </button>
        {running && (
          <button onClick={() => setRunning(false)} className="btn-ghost py-1.5 px-3 text-sm">Pause</button>
        )}
      </div>
    </div>
  );
}

// ── Emoji reactions ───────────────────────────────────────────────────────────
const EMOJIS = ["👍","❤️","🔥","😂","😮","🎉","💡","✅","🤔","⭐"];

function FloatingEmoji({ emoji, id, onDone }) {
  const left = useRef(10 + Math.random() * 80);
  useEffect(() => { const t = setTimeout(() => onDone(id), 2200); return () => clearTimeout(t); }, []);
  return (
    <div className="pointer-events-none fixed z-[999] text-3xl select-none"
      style={{
        left: `${left.current}%`, bottom: "80px",
        animation: "floatUp 2.2s ease-out forwards",
      }}>
      {emoji}
    </div>
  );
}

// ── AI Diagram ────────────────────────────────────────────────────────────────
function AIDiagram({ onClose, roomCode, dark }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("cb_token");
      const res = await fetch("/api/ai/diagram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      console.log("[AI] response:", data);
      console.log("[AI] shapes:", data.shapes);
      if (!data.shapes) throw new Error(data.message || "No shapes returned");
      const { getSocket } = await import("../services/socket.js");
      const socket = getSocket();
      data.shapes.forEach((shape, i) => {
        setTimeout(() => {
          const stroke = {
            tool: shape.tool || "rect",
            points: [
              { x: Number(shape.x1) || 50, y: Number(shape.y1) || 50 },
              { x: Number(shape.x2) || 200, y: Number(shape.y2) || 150 },
            ],
            color: shape.color || "#7c5cfc",
            strokeWidth: shape.tool === "text" ? 2 : 2,
            fillColor: "transparent",
            id: `ai_${Date.now()}_${i}`,
            ...(shape.text && { text: shape.text }),
          };

          // Draw locally — try both paths
          const h = window.__canvasHandlers;
          if (h?.onRemoteDraw) {
            h.onRemoteDraw({ stroke });
          } else {
            // Fallback: direct canvas draw
            const canvas = document.querySelector("canvas");
            if (canvas) {
              import("../components/canvas/Canvas.jsx").then(({ applyStroke }) => {
                applyStroke(canvas.getContext("2d"), stroke);
              });
            }
          }

          // Broadcast to others
          socket?.emit("canvas:draw", { roomCode, stroke });
        }, i * 150);
      });

      // Auto-save after all shapes drawn
      setTimeout(() => {
        window.__canvasActions?.handleSave?.();
      }, data.shapes.length * 150 + 500);
      toast.success(`✨ ${data.shapes.length} shapes drawn!`);
      onClose();
    } catch (err) {
      toast.error("AI failed: " + err.message);
      console.error(err);
    }
    setLoading(false);
  };
  //     

  return (
    <div className={`rounded-xl p-4 w-72 shadow-2xl border ${dark ? "bg-surface border-border" : "bg-white border-gray-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-semibold flex items-center gap-1.5 ${dark ? "text-text" : "text-gray-800"}`}>
          <Sparkles size={14} className="text-accent-glow" /> AI Diagram
        </span>
        <button onClick={onClose} className="text-text-muted hover:text-text"><X size={14} /></button>
      </div>
      <p className={`text-xs mb-3 ${dark ? "text-text-muted" : "text-gray-500"}`}>
        Describe a concept — AI will draw it on the board for everyone.
      </p>
      <textarea
        className="input-field text-sm resize-none mb-3 "
         style={{ color: "#fafafa", background: "#1f1f23", minHeight: 80 }}
        rows={3}
        placeholder="e.g. Binary search tree, HTTP flow, React lifecycle..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate(); }}
      />
      <button onClick={generate} disabled={loading || !prompt.trim()} className="btn-primary w-full py-2 text-sm">
        {loading
          ? <span className="flex items-center gap-2 justify-center"><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Generating...</span>
          : "✨ Generate"}
      </button>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export default function BoardPage() {
  const { roomCode } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: room } = useSelector((s) => s.room);
  const { user } = useSelector((s) => s.auth);

  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [cursors, setCursors] = useState({});
  const [floats, setFloats] = useState([]);
  const [copied, setCopied] = useState(false);

  const socketRef = useRef(null);
  const code = roomCode?.toUpperCase();

  useEffect(() => {
    dispatch(clearRoom());
    setPageLoading(true);
    setNotFound(false);

    dispatch(fetchRoom(code)).then((res) => {
      if (res.error) { setNotFound(true); setPageLoading(false); return; }
      setPageLoading(false);

      const socket = initSocket();
      socketRef.current = socket;
      socket._pendingRoom = code;

      cleanListeners(socket);
      addListeners(socket);

      const doJoin = () => socket.emit("room:join", { roomCode: code });
      if (socket.connected) doJoin();
      else socket.once("connect", doJoin);
    });

    return () => {
      const s = socketRef.current;
      if (s) { s.emit("room:leave", { roomCode: code }); cleanListeners(s); s._pendingRoom = null; }
      dispatch(clearRoom());
    };
  }, [roomCode]);

  function addListeners(socket) {
    socket.on("room:joined", ({ room: r }) => {
      console.log("[board] room:joined:", r?.code);
      // Wire canvas handlers NOW — guaranteed timing
      const h = window.__canvasHandlers;
      if (h) {
        socket.off("canvas:history", h.onHistory);
        socket.off("canvas:draw", h.onRemoteDraw);
        socket.off("canvas:clear", h.onClear);
        socket.off("canvas:undo", h.onUndo);
        socket.on("canvas:history", h.onHistory);
        socket.on("canvas:draw", h.onRemoteDraw);
        socket.on("canvas:clear", h.onClear);
        socket.on("canvas:undo", h.onUndo);
      }
      // Request history AFTER listeners guaranteed attached
      socket.emit("canvas:request_history", { roomCode: code });
    });
    socket.on("room:error", ({ message }) => { toast.error(message); navigate("/dashboard"); });
    socket.on("room:users", ({ users }) => dispatch(setActiveUsers(users)));
    socket.on("room:user_joined", ({ username }) => toast(`${username} joined`, { icon: "👋", duration: 2000 }));
    socket.on("room:user_left", ({ username }) => {
      toast(`${username} left`, { icon: "🚪", duration: 2000 });
      setCursors((p) => { const n = { ...p }; Object.keys(n).forEach((k) => { if (n[k].username === username) delete n[k]; }); return n; });
    });
    socket.on("chat:history", ({ messages }) => dispatch(setChatHistory(messages)));
    socket.on("chat:message", (msg) => dispatch(addChatMessage(msg)));
    socket.on("canvas:saved", () => {});
    socket.on("notes:history", ({ notes }) => dispatch(setNotes(notes)));
    socket.on("note:add", ({ note }) => dispatch(addNote(note)));
    socket.on("note:update", ({ note }) => dispatch(updateNote(note)));
    socket.on("note:delete", ({ noteId }) => dispatch(removeNote(noteId)));
    socket.on("cursor:move", ({ socketId, username, x, y }) => {
      if (username === user?.username) return;
      setCursors((p) => ({ ...p, [socketId]: { username, x, y } }));
    });
    socket.on("emoji:react", ({ emoji }) => {
      const id = Date.now() + Math.random();
      setFloats((p) => [...p, { id, emoji }]);
    });
  }

  function cleanListeners(socket) {
    ["room:joined","room:error","room:users","room:user_joined","room:user_left",
     "chat:history","chat:message","canvas:saved",
     "notes:history","note:add","note:update","note:delete",
     "cursor:move","emoji:react",
    ].forEach((ev) => socket.removeAllListeners(ev));
  }

  const sendEmoji = (emoji) => {
    const id = Date.now() + Math.random();
    setFloats((p) => [...p, { id, emoji }]);
    socketRef.current?.emit("emoji:react", { roomCode: code, emoji });
    setEmojiOpen(false);
  };

  const shareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const closeAll = () => { setTimerOpen(false); setAiOpen(false); setEmojiOpen(false); };

  // Theme classes
  const bg = dark ? "bg-bg" : "bg-gray-100";
  const navBg = dark ? "bg-surface border-border" : "bg-white border-gray-200";
  const textCls = dark ? "text-text" : "text-gray-800";

  if (pageLoading) return <Loader text="Loading board..." />;
  if (notFound) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      <div className="card text-center p-8">
        <p className="text-lg mb-2">Room not found</p>
        <p className="text-text-muted text-sm mb-5">Check the code and try again.</p>
        <button onClick={() => navigate("/dashboard")} className="btn-primary">← Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${bg} ${textCls}`}>
      {/* Floating emojis */}
      {floats.map((f) => (
        <FloatingEmoji key={f.id} {...f} onDone={(id) => setFloats((p) => p.filter((x) => x.id !== id))} />
      ))}

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 py-2 border-b flex-shrink-0 z-20 ${navBg}`}>
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate("/dashboard")} className="tool-btn p-1.5 flex-shrink-0">
            <ArrowLeft size={15} />
          </button>
          <div className="w-6 h-6 bg-accent rounded flex items-center justify-center flex-shrink-0">
            <Pencil size={11} className="text-white" />
          </div>
          <span className={`font-semibold text-sm truncate max-w-[120px] ${textCls}`}>{room?.name || code}</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded border text-accent-glow bg-accent/10 border-accent/20 flex-shrink-0">
            {code}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <ActiveUsers />
          <div className="w-px h-5 bg-border mx-1" />

          <button onClick={shareLink} className="tool-btn p-2" title="Share link">
            {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
          </button>

          <button onClick={() => setDark(!dark)} className="tool-btn p-2" title="Toggle theme">
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Timer */}
          <div className="relative">
            <button onClick={() => { closeAll(); setTimerOpen((v) => !v); }}
              className={`tool-btn p-2 ${timerOpen ? "active" : ""}`} title="Timer">
              <Timer size={14} />
            </button>
            {timerOpen && (
              <div className="absolute right-0 top-10 z-50 animate-fade-in">
                <TimerWidget onClose={() => setTimerOpen(false)} dark={dark} />
              </div>
            )}
          </div>

          {/* Emoji */}
          <div className="relative">
            <button onClick={() => { closeAll(); setEmojiOpen((v) => !v); }}
              className={`tool-btn p-2 ${emojiOpen ? "active" : ""}`} title="React">
              <Smile size={14} />
            </button>
            {emojiOpen && (
              <div className={`absolute right-0 top-10 z-50 rounded-xl p-2 flex flex-wrap gap-1 w-44 shadow-2xl border animate-fade-in ${dark ? "bg-surface border-border" : "bg-white border-gray-200"}`}>
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => sendEmoji(e)}
                    className="text-xl hover:scale-125 transition-transform p-1 rounded">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI */}
          <div className="relative">
            <button onClick={() => { closeAll(); setAiOpen((v) => !v); }}
              className={`tool-btn p-2 ${aiOpen ? "active" : ""}`} title="AI Diagram">
              <Sparkles size={14} />
            </button>
            {aiOpen && (
              <div className="absolute right-0 top-10 z-50 animate-fade-in">
                <AIDiagram onClose={() => setAiOpen(false)} roomCode={code} dark={dark} />
              </div>
            )}
          </div>

          <button onClick={() => setNotesOpen(!notesOpen)} className={`tool-btn p-2 ${notesOpen ? "active" : ""}`} title="Sticky notes">
            <StickyNote size={14} />
          </button>

          <button onClick={() => setChatOpen(!chatOpen)} className={`tool-btn p-2 ${chatOpen ? "active" : ""}`} title="Chat">
            <MessageSquare size={14} />
          </button>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-shrink-0 p-2 overflow-y-auto">
          <Toolbar roomCode={code} />
        </div>

        <div className="flex-1 relative overflow-hidden min-w-0">
          {/* Pass darkMode prop to Canvas */}
          <Canvas roomCode={code} darkMode={dark} />

          {/* Remote cursors */}
          {Object.entries(cursors).map(([sid, cur]) => (
            <RemoteCursor key={sid} username={cur.username} x={cur.x} y={cur.y} />
          ))}

          {notesOpen && <StickyNotes roomCode={code} />}
        </div>

        <div className={`flex-shrink-0 overflow-hidden transition-all duration-200 ${chatOpen ? "w-72" : "w-0"}`}>
          {chatOpen && <div className="w-72 h-full"><Chat roomCode={code} darkMode={dark} /></div>}
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1);   opacity: 1; }
          100% { transform: translateY(-140px) scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
