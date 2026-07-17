import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTool, setColor, setStrokeWidth } from "../../store/canvasSlice.js";
import { getSocket } from "../../services/socket.js";
import { Pencil, Eraser, Minus, Square, Circle, Trash2, Save, Download, Undo2, Redo2, ArrowRight, ImageIcon } from "lucide-react";
import { Tooltip } from "../ui/Primitives.jsx";
import toast from "react-hot-toast";

const PALETTE = ["#fafafa","#7c3aed","#ec4899","#06b6d4","#10b981","#f59e0b","#ef4444","#f97316"];
const WIDTHS   = [{ v: 2, h: 2 }, { v: 4, h: 3 }, { v: 8, h: 5 }, { v: 16, h: 7 }];

const DiamondIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M7 1L13 7L7 13L1 7Z" />
  </svg>
);

const TOOLS = [
  { id: "pen",     icon: Pencil,     label: "Pen" },
  { id: "eraser",  icon: Eraser,     label: "Eraser" },
  { id: "line",    icon: Minus,      label: "Line" },
  { id: "arrow",   icon: ArrowRight, label: "Arrow" },
  { id: "rect",    icon: Square,     label: "Rectangle" },
  { id: "circle",  icon: Circle,     label: "Circle" },
  { id: "diamond", icon: DiamondIcon,label: "Diamond" },
];

function Sep() {
  return <div className="w-full mx-auto" style={{ height: 1, background: "#27272a", margin: "2px 0" }} />;
}

export default function Toolbar({ roomCode }) {
  const dispatch = useDispatch();
  const { tool, color, strokeWidth } = useSelector((s) => s.canvas);
  const fileRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      const imgEl = new Image();
      imgEl.onload = () => {
        const maxW = window.innerWidth * 0.4;
        const maxH = window.innerHeight * 0.4;
        const scale = Math.min(maxW / imgEl.width, maxH / imgEl.height, 1);
        const w = Math.round(imgEl.width * scale);
        const h = Math.round(imgEl.height * scale);
        const x = Math.round((window.innerWidth - w) / 2 - 60);
        const y = Math.round((window.innerHeight - h) / 2 - 40);
        const id = Date.now().toString();
        window.__canvasActions?.addImage({ id, src, x, y, w, h });
        const stroke = {
          tool: "image", id, imageData: src,
          points: [{ x, y }, { x: x + w, y: y + h }],
          color: "#fff", strokeWidth: 1, fillColor: "transparent",
        };
        getSocket()?.emit("canvas:draw", { roomCode, stroke });
        toast.success("Image added — drag to move");
      };
      imgEl.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div
      className="flex flex-col gap-1 p-1.5 select-none"
      style={{
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 10,
        width: 40,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      {/* Drawing tools */}
      {TOOLS.map(({ id, icon: Icon, label }) => (
        <Tooltip key={id} label={label}>
          <button
            onClick={() => dispatch(setTool(id))}
            className="tool-btn"
            aria-label={label}
            aria-pressed={tool === id}
            style={tool === id ? {
              background: "rgba(124,58,237,0.15)",
              borderColor: "rgba(124,58,237,0.3)",
              color: "#a78bfa",
            } : {}}
          >
            <Icon size={14} />
          </button>
        </Tooltip>
      ))}

      <Tooltip label="Upload image">
        <button onClick={() => fileRef.current?.click()} className="tool-btn" aria-label="Upload image">
          <ImageIcon size={14} />
        </button>
      </Tooltip>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} aria-hidden="true" />

      <Sep />

      {/* Color palette */}
      <div className="flex flex-col gap-1 items-center py-0.5">
        {PALETTE.map((c) => (
          <Tooltip key={c} label={c === "#fafafa" ? "White" : c}>
            <button
              onClick={() => { dispatch(setColor(c)); if (tool === "eraser") dispatch(setTool("pen")); }}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              style={{
                width: 18, height: 18,
                borderRadius: "50%",
                background: c,
                border: color === c ? "2px solid #fafafa" : "2px solid transparent",
                outline: color === c ? "2px solid #7c3aed" : "2px solid transparent",
                outlineOffset: 1,
                cursor: "pointer",
                transition: "transform 150ms, outline 150ms",
                transform: color === c ? "scale(1.15)" : "scale(1)",
                flexShrink: 0,
              }}
            />
          </Tooltip>
        ))}
        <Tooltip label="Custom color">
          <label
            aria-label="Custom color"
            style={{
              width: 18, height: 18, borderRadius: "50%",
              border: "1.5px dashed #3f3f46",
              cursor: "pointer", overflow: "hidden", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <input type="color" value={color} onChange={(e) => dispatch(setColor(e.target.value))}
              className="opacity-0 w-full h-full cursor-pointer absolute" />
            <span style={{ fontSize: 10, color: "#52525b", pointerEvents: "none" }}>+</span>
          </label>
        </Tooltip>
      </div>

      <Sep />

      {/* Stroke widths */}
      <div className="flex flex-col gap-1 items-center py-0.5">
        {WIDTHS.map(({ v, h }) => (
          <Tooltip key={v} label={`${v}px`}>
            <button
              onClick={() => dispatch(setStrokeWidth(v))}
              aria-label={`${v}px stroke`}
              aria-pressed={strokeWidth === v}
              className="flex items-center justify-center transition-all duration-150"
              style={{
                width: 28, height: 20, borderRadius: 4,
                background: strokeWidth === v ? "rgba(124,58,237,0.15)" : "transparent",
                border: `1px solid ${strokeWidth === v ? "rgba(124,58,237,0.3)" : "transparent"}`,
                cursor: "pointer",
              }}
            >
              <div style={{ width: 16, height: h, borderRadius: 99, background: "#a1a1aa" }} />
            </button>
          </Tooltip>
        ))}
      </div>

      <Sep />

      {/* Actions */}
      <Tooltip label="Undo (Ctrl+Z)">
        <button onClick={() => window.__canvasActions?.handleUndo()} className="tool-btn" aria-label="Undo">
          <Undo2 size={13} />
        </button>
      </Tooltip>
      <Tooltip label="Redo (Ctrl+Y)">
        <button onClick={() => window.__canvasActions?.handleRedo()} className="tool-btn" aria-label="Redo">
          <Redo2 size={13} />
        </button>
      </Tooltip>
      <Tooltip label="Save (Ctrl+S)">
        <button
          onClick={() => { window.__canvasActions?.handleSave(); toast.success("Board saved!"); }}
          className="tool-btn" aria-label="Save"
        >
          <Save size={13} />
        </button>
      </Tooltip>
      <Tooltip label="Download PNG">
        <button onClick={() => window.__canvasActions?.handleDownload()} className="tool-btn" aria-label="Download PNG">
          <Download size={13} />
        </button>
      </Tooltip>
      <Tooltip label="Clear board">
        <button
          onClick={() => { if (confirm("Clear the entire board?")) window.__canvasActions?.handleClear(); }}
          className="tool-btn"
          aria-label="Clear board"
          style={{ color: undefined }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
          onMouseLeave={(e) => e.currentTarget.style.color = ""}
        >
          <Trash2 size={13} />
        </button>
      </Tooltip>
    </div>
  );
}
