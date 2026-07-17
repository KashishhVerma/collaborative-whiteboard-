import { Link } from "react-router-dom";
import { Pencil, Users, MessageSquare, Zap, StickyNote, Image, ArrowRight, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Pencil,        title: "Real-time canvas",    desc: "Draw together with pen, shapes, and arrows. Every stroke syncs in under 50ms." },
  { icon: Users,         title: "Live presence",        desc: "See who's online and where they're pointing. Collaborative by default." },
  { icon: MessageSquare, title: "Built-in chat",        desc: "Discuss without leaving the board. Chat history persists across sessions." },
  { icon: StickyNote,    title: "Sticky notes",         desc: "Drop draggable notes anywhere on the canvas for quick annotations." },
  { icon: Sparkles,      title: "AI Diagram Generator", desc: "Describe a concept — AI draws a labeled diagram on the board instantly." },
  { icon: Zap,           title: "Persistent boards",    desc: "Auto-saved after every stroke. Join any room and pick up where you left off." },
];

// Tiny animated canvas preview
function CanvasPreview() {
  return (
    <div
      className="relative w-full max-w-lg mx-auto mt-14 rounded-xl overflow-hidden anim-slide-up"
      style={{
        animationDelay: "300ms",
        border: "1px solid #27272a",
        background: "#0f0f11",
        backgroundImage: "radial-gradient(circle, #27272a 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        height: 200,
        boxShadow: "0 0 60px rgba(124,58,237,0.15), 0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* Fake toolbar */}
      <div className="absolute left-3 top-3 flex flex-col gap-1.5">
        {["#7c3aed","#ec4899","#06b6d4","#10b981"].map((c,i) => (
          <div key={i} className="w-5 h-5 rounded" style={{ background: c, opacity: 0.8 }} />
        ))}
      </div>
      {/* Fake strokes SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 200">
        <rect x="80" y="30" width="120" height="50" rx="6" fill="none" stroke="#7c3aed" strokeWidth="2"
          strokeDasharray="400" strokeDashoffset="0"
          style={{ animation: "draw-in 1s ease 0.5s both", strokeDasharray: 400 }} />
        <text x="140" y="60" textAnchor="middle" fill="#a78bfa" fontSize="12"
          style={{ animation: "fadeIn 0.5s ease 1.2s both", opacity: 0 }}>
          Frontend
        </text>
        <line x1="200" y1="55" x2="260" y2="55" stroke="#3f3f46" strokeWidth="1.5"
          markerEnd="url(#arr)"
          style={{ animation: "draw-in 0.5s ease 1.4s both" }} />
        <rect x="260" y="30" width="120" height="50" rx="6" fill="none" stroke="#06b6d4" strokeWidth="2"
          style={{ animation: "draw-in 0.8s ease 1.6s both", strokeDasharray: 400 }} />
        <text x="320" y="60" textAnchor="middle" fill="#67e8f9" fontSize="12"
          style={{ animation: "fadeIn 0.5s ease 2s both", opacity: 0 }}>
          Backend
        </text>
        <rect x="270" y="110" width="100" height="40" rx="6" fill="none" stroke="#10b981" strokeWidth="2"
          style={{ animation: "draw-in 0.8s ease 2.2s both", strokeDasharray: 400 }} />
        <text x="320" y="135" textAnchor="middle" fill="#6ee7b7" fontSize="12"
          style={{ animation: "fadeIn 0.5s ease 2.6s both", opacity: 0 }}>
          MongoDB
        </text>
        <line x1="320" y1="80" x2="320" y2="110" stroke="#3f3f46" strokeWidth="1.5"
          style={{ animation: "draw-in 0.4s ease 2.8s both" }} />
        {/* Cursor */}
        <g style={{ animation: "fadeIn 0.3s ease 3s both", opacity: 0 }}>
          <path d="M400 50 L400 70 L404 65 L407 73 L409 72 L406 64 L411 64Z"
            fill="#7c3aed" stroke="#fff" strokeWidth="0.8" />
          <rect x="413" y="55" width="40" height="14" rx="4" fill="#7c3aed" opacity="0.9" />
          <text x="433" y="65" textAnchor="middle" fill="white" fontSize="8">kashish</text>
        </g>
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3z" fill="#3f3f46" />
          </marker>
        </defs>
      </svg>
      {/* Fake chat messages */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5 w-28">
        {[
          { text: "nice diagram!", color: "#7c3aed", right: true },
          { text: "add DB layer?", color: "#1f1f23", right: false },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.right ? "justify-end" : "justify-start"}`}
            style={{ animation: `slideUp 0.3s ease ${3.2 + i * 0.3}s both`, opacity: 0 }}>
            <div className="text-white rounded-lg px-2 py-1" style={{ background: m.color, fontSize: 9 }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col page-enter" style={{ background: "#0f0f11", color: "#fafafa" }}>
      {/* Nav */}
      <header
        className="flex items-center justify-between px-6 h-14 border-b sticky top-0 z-50"
        style={{ borderColor: "#27272a", background: "rgba(15,15,17,0.85)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-2 anim-fade">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: "#7c3aed", boxShadow: "0 0 12px rgba(124,58,237,0.4)" }}
          >
            <Pencil size={12} className="text-white" />
          </div>
          <span className="font-semibold text-md tracking-tight">CollabBoard</span>
        </div>
        <nav className="flex items-center gap-2 anim-fade">
          <Link to="/login" className="btn-ghost btn text-sm">Sign in</Link>
          <Link to="/register" className="btn-primary btn text-sm btn-lg">
            Get started <ArrowRight size={13} />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center text-center px-6 pt-20 pb-10">
        <div
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full mb-8 anim-scale-bounce"
          style={{
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.25)",
            color: "#a78bfa",
          }}
        >
          <Zap size={11} /> Real-time · Multi-user · AI-powered
        </div>

        <h1
          className="font-bold tracking-tight leading-none mb-5 anim-slide-up"
          style={{ fontSize: "clamp(36px,7vw,68px)", letterSpacing: "-0.03em", animationDelay: "60ms" }}
        >
          Draw. Explain.
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Together.
          </span>
        </h1>

        <p
          className="text-md max-w-md mb-10 leading-relaxed anim-slide-up"
          style={{ color: "#a1a1aa", animationDelay: "120ms" }}
        >
          A shared whiteboard for teaching DSA, system design, and anything visual —
          with live chat, AI diagrams, and sticky notes.
        </p>

        <div className="flex items-center gap-3 flex-wrap justify-center anim-slide-up" style={{ animationDelay: "180ms" }}>
          <Link to="/register" className="btn-primary btn btn-lg hover-lift">
            Create a board <ArrowRight size={14} />
          </Link>
          <Link to="/login" className="btn-outline btn btn-lg hover-lift">
            Join a room
          </Link>
        </div>

        <CanvasPreview />

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-16 max-w-3xl w-full text-left stagger">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="card card-hover p-4 anim-slide-up hover-lift"
            >
              <div
                className="w-7 h-7 rounded flex items-center justify-center mb-3"
                style={{ background: "rgba(124,58,237,0.1)" }}
              >
                <Icon size={14} style={{ color: "#8b5cf6" }} />
              </div>
              <p className="text-sm font-semibold mb-1">{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "#71717a" }}>{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer
        className="text-center py-5 text-xs border-t"
        style={{ borderColor: "#27272a", color: "#52525b" }}
      >
        CollabBoard · Built with MERN + Socket.io · Made with ❤️
      </footer>
    </div>
  );
}
