import { useRef, useEffect, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { getSocket } from "../../services/socket.js";

// ─── Drawing utilities ────────────────────────────────────────────────────────

export function applyStroke(ctx, stroke) {
  const { tool, points, color, strokeWidth, fillColor } = stroke;
  if (!points || points.length === 0) return;
  if (tool === "image") return; // images handled separately in DOM

  ctx.save();
  ctx.strokeStyle = color || "#fff";
  ctx.lineWidth = strokeWidth || 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillStyle = fillColor && fillColor !== "transparent" ? fillColor : "transparent";

  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = (strokeWidth || 3) * 6;
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.beginPath();

  switch (tool) {
    case "pen":
    case "eraser": {
      if (points.length === 1) {
        ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const mx = (points[i].x + points[i + 1].x) / 2;
          const my = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
      }
      break;
    }
    case "line": {
      const [s, e] = [points[0], points[points.length - 1]];
      ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke();
      break;
    }
    case "arrow": {
      const [s, e] = [points[0], points[points.length - 1]];
      const angle = Math.atan2(e.y - s.y, e.x - s.x);
      const hw = Math.min(20, (strokeWidth || 3) * 5);
      ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x - hw * Math.cos(angle - Math.PI / 7), e.y - hw * Math.sin(angle - Math.PI / 7));
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x - hw * Math.cos(angle + Math.PI / 7), e.y - hw * Math.sin(angle + Math.PI / 7));
      ctx.stroke();
      break;
    }
    case "rect": {
      const [s, e] = [points[0], points[points.length - 1]];
      const w = e.x - s.x, h = e.y - s.y;
      if (fillColor && fillColor !== "transparent") ctx.fillRect(s.x, s.y, w, h);
      ctx.strokeRect(s.x, s.y, w, h);
      break;
    }
    case "circle": {
      const [s, e] = [points[0], points[points.length - 1]];
      const rx = Math.abs(e.x - s.x) / 2, ry = Math.abs(e.y - s.y) / 2;
      const cx = s.x + (e.x - s.x) / 2, cy = s.y + (e.y - s.y) / 2;
      ctx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
      if (fillColor && fillColor !== "transparent") ctx.fill();
      ctx.stroke();
      break;
    }
    case "diamond": {
      const [s, e] = [points[0], points[points.length - 1]];
      const cx = (s.x + e.x) / 2, cy = (s.y + e.y) / 2;
      ctx.moveTo(cx, s.y); ctx.lineTo(e.x, cy);
      ctx.lineTo(cx, e.y); ctx.lineTo(s.x, cy);
      ctx.closePath();
      if (fillColor && fillColor !== "transparent") ctx.fill();
      ctx.stroke();
      break;
    }
    case "text": {
      if (!stroke.text) break;
      const [s] = points;
      ctx.font = `${(strokeWidth || 3) * 4 + 10}px Inter, sans-serif`;
      ctx.fillStyle = color || "#fff";
      ctx.globalCompositeOperation = "source-over";
      ctx.fillText(stroke.text, s.x, s.y);
      break;
    }
    default: break;
  }
  ctx.restore();
}

export function replayAll(ctx, strokes) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const stroke of strokes) {
    if (stroke.tool !== "image") applyStroke(ctx, stroke);
  }
}

// ── Draggable/Resizable Image overlay ────────────────────────────────────────

function DraggableImage({ img, id, onUpdate, onDelete, darkMode }) {
  const [pos, setPos] = useState(img);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  const onMouseDown = (e) => {
    e.stopPropagation();
    const startX = e.clientX - pos.x;
    const startY = e.clientY - pos.y;
    const onMove = (ev) => setPos((p) => ({ ...p, x: ev.clientX - startX, y: ev.clientY - startY }));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setPos((p) => { onUpdate(id, p); return p; });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onResizeDown = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = pos.w;
    const startH = pos.h;
    const onMove = (ev) => setPos((p) => ({
      ...p,
      w: Math.max(40, startW + ev.clientX - startX),
      h: Math.max(40, startH + ev.clientY - startY),
    }));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setPos((p) => { onUpdate(id, p); return p; });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      className="absolute group"
      style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h, zIndex: 20 }}
      onMouseDown={onMouseDown}
    >
      <img
        src={pos.src}
        alt=""
        className="w-full h-full object-contain select-none pointer-events-none"
        style={{ border: "2px dashed rgba(124,92,252,0.5)", borderRadius: 4 }}
        draggable={false}
      />
      {/* Delete */}
      <button
        onMouseDown={(e) => { e.stopPropagation(); onDelete(id); }}
        className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center z-30 cursor-pointer"
      >×</button>
      {/* Resize handle */}
      <div
        onMouseDown={onResizeDown}
        className="absolute bottom-0 right-0 w-4 h-4 bg-accent rounded-tl cursor-se-resize hidden group-hover:block z-30"
      />
      {/* Move cursor hint */}
      <div className="absolute inset-0 cursor-move" />
    </div>
  );
}

// ─── Main Canvas ──────────────────────────────────────────────────────────────

export default function Canvas({ roomCode, darkMode }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const { tool, color, strokeWidth, fillColor } = useSelector((s) => s.canvas);

  const isDrawing = useRef(false);
  const currentPoints = useRef([]);
  const startPt = useRef(null);
  const strokeHistory = useRef([]);   // non-image strokes
  const redoStack = useRef([]);
  const saveTimer = useRef(null);

  // Images stored separately as DOM elements
  const [images, setImages] = useState([]);
  const imagesRef = useRef([]);

  const toolRef = useRef({ tool, color, strokeWidth, fillColor });
  useEffect(() => { toolRef.current = { tool, color, strokeWidth, fillColor }; }, [tool, color, strokeWidth, fillColor]);

  // ── Auto-save (debounced) ────────────────────────────────────────────────────
  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const saveable = strokeHistory.current.map(({ imageEl, ...r }) => r);
      // Also save image positions
      const imgData = imagesRef.current.map(({ src, x, y, w, h, id }) => ({
        tool: "image", id, src, x, y, w, h,
        points: [{ x, y }, { x: x + w, y: y + h }],
        color: "#fff", strokeWidth: 1, fillColor: "transparent",
        imageData: src,
      }));
      const all = JSON.stringify([...saveable, ...imgData]);
      getSocket()?.emit("canvas:save", { roomCode, canvasData: all });
    }, 1500);
  }, [roomCode]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
  };

  // ── Resize ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !overlay) return;
      const p = canvas.parentElement;
      const w = p.clientWidth, h = p.clientHeight;
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w; canvas.height = h;
      overlay.width = w; overlay.height = h;
      replayAll(canvas.getContext("2d"), strokeHistory.current);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, []);

  // ── Socket listeners ─────────────────────────────────────────────────────────
  // ── Socket listeners — exposed via ref so BoardPage can call them directly ──
  // Store handlers in ref so BoardPage can wire them up
  useEffect(() => {
    function onHistory({ canvasData }) {
      console.log("[canvas] onHistory called, data length:", canvasData?.length);
      try {
        const all = JSON.parse(canvasData || "[]");
        const drawStrokes = all.filter((s) => s.tool !== "image");
        const imgStrokes = all.filter((s) => s.tool === "image");
        strokeHistory.current = drawStrokes;
        redoStack.current = [];
        const canvas = canvasRef.current;
        if (canvas) replayAll(canvas.getContext("2d"), drawStrokes);
        const restored = imgStrokes.map((s) => ({
          id: s.id || Date.now().toString(),
          src: s.imageData || s.src,
          x: s.x ?? s.points?.[0]?.x ?? 100,
          y: s.y ?? s.points?.[0]?.y ?? 100,
          w: s.w ?? (s.points ? s.points[1].x - s.points[0].x : 200),
          h: s.h ?? (s.points ? s.points[1].y - s.points[0].y : 150),
        })).filter((i) => i.src);
        imagesRef.current = restored;
        setImages([...restored]);
      } catch (err) { console.error("[canvas:history]", err); }
    }

    function onRemoteDraw({ stroke }) {
      if (stroke.tool === "image") {
        const newImg = {
          id: stroke.id || Date.now().toString(),
          src: stroke.imageData,
          x: stroke.points?.[0]?.x ?? 100,
          y: stroke.points?.[0]?.y ?? 100,
          w: stroke.points ? stroke.points[1].x - stroke.points[0].x : 200,
          h: stroke.points ? stroke.points[1].y - stroke.points[0].y : 150,
        };
        if (newImg.src) {
          imagesRef.current = [...imagesRef.current, newImg];
          setImages([...imagesRef.current]);
        }
        return;
      }
      strokeHistory.current.push(stroke);
      redoStack.current = [];
      const canvas = canvasRef.current;
      if (canvas) applyStroke(canvas.getContext("2d"), stroke);
    }

    function onClear() {
      strokeHistory.current = [];
      redoStack.current = [];
      imagesRef.current = [];
      setImages([]);
      const canvas = canvasRef.current;
      if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    }

    function onUndo({ strokes }) {
      const drawStrokes = strokes.filter((s) => s.tool !== "image");
      strokeHistory.current = drawStrokes;
      const canvas = canvasRef.current;
      if (canvas) replayAll(canvas.getContext("2d"), strokeHistory.current);
    }

    // Expose handlers so BoardPage can attach them to socket directly
    window.__canvasHandlers = { onHistory, onRemoteDraw, onClear, onUndo };

    // Also try attaching directly if socket exists
    const s = getSocket();
    if (s) {
      s.off("canvas:history", onHistory);
      s.off("canvas:draw", onRemoteDraw);
      s.off("canvas:clear", onClear);
      s.off("canvas:undo", onUndo);
      s.on("canvas:history", onHistory);
      s.on("canvas:draw", onRemoteDraw);
      s.on("canvas:clear", onClear);
      s.on("canvas:undo", onUndo);
    }

    return () => {
      window.__canvasHandlers = null;
      const s = getSocket();
      if (s) {
        s.off("canvas:history", onHistory);
        s.off("canvas:draw", onRemoteDraw);
        s.off("canvas:clear", onClear);
        s.off("canvas:undo", onUndo);
      }
    };
  }, [roomCode]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "z") { e.preventDefault(); handleUndo(); }
      if (e.key === "y") { e.preventDefault(); handleRedo(); }
      if (e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (!strokeHistory.current.length) return;
    const last = strokeHistory.current.pop();
    redoStack.current.push(last);
    replayAll(canvasRef.current?.getContext("2d"), strokeHistory.current);
    getSocket()?.emit("canvas:undo", { roomCode, strokes: strokeHistory.current });
    scheduleSave();
  }, [roomCode, scheduleSave]);

  const handleRedo = useCallback(() => {
    if (!redoStack.current.length) return;
    const stroke = redoStack.current.pop();
    strokeHistory.current.push(stroke);
    applyStroke(canvasRef.current?.getContext("2d"), stroke);
    getSocket()?.emit("canvas:draw", { roomCode, stroke });
    scheduleSave();
  }, [roomCode, scheduleSave]);

  const handleClear = useCallback(() => {
    strokeHistory.current = [];
    redoStack.current = [];
    imagesRef.current = [];
    setImages([]);
    canvasRef.current?.getContext("2d").clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    getSocket()?.emit("canvas:clear", { roomCode });
  }, [roomCode]);

  const handleSave = useCallback(() => {
    const saveable = strokeHistory.current.map(({ imageEl, ...r }) => r);
    const imgData = imagesRef.current.map(({ src, x, y, w, h, id }) => ({
      tool: "image", id, src, x, y, w, h,
      imageData: src,
      points: [{ x, y }, { x: x + w, y: y + h }],
      color: "#fff", strokeWidth: 1, fillColor: "transparent",
    }));
    getSocket()?.emit("canvas:save", { roomCode, canvasData: JSON.stringify([...saveable, ...imgData]) });
  }, [roomCode]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tmp = document.createElement("canvas");
    tmp.width = canvas.width; tmp.height = canvas.height;
    const ctx = tmp.getContext("2d");
    ctx.fillStyle = darkMode ? "#0d0d0f" : "#f5f5f5";
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    // Draw images first
    imagesRef.current.forEach((img) => {
      const el = new Image();
      el.src = img.src;
      ctx.drawImage(el, img.x, img.y, img.w, img.h);
    });
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement("a");
    a.download = `collabboard-${roomCode}.png`;
    a.href = tmp.toDataURL("image/png");
    a.click();
  }, [roomCode, darkMode]);

  // addStroke used by Toolbar for image upload
  const addImage = useCallback((imgObj) => {
    imagesRef.current = [...imagesRef.current, imgObj];
    setImages([...imagesRef.current]);
    scheduleSave();
  }, [scheduleSave]);

  const handleImageUpdate = useCallback((id, newPos) => {
    imagesRef.current = imagesRef.current.map((i) => i.id === id ? { ...i, ...newPos } : i);
    setImages([...imagesRef.current]);
    scheduleSave();
  }, [scheduleSave]);

  const handleImageDelete = useCallback((id) => {
    imagesRef.current = imagesRef.current.filter((i) => i.id !== id);
    setImages([...imagesRef.current]);
    scheduleSave();
  }, [scheduleSave]);

  useEffect(() => {
    window.__canvasActions = { handleUndo, handleRedo, handleClear, handleSave, handleDownload, addImage };
  }, [handleUndo, handleRedo, handleClear, handleSave, handleDownload, addImage]);

  // ── Draw handlers ────────────────────────────────────────────────────────────
  const startDraw = useCallback((e) => {
    if (e.cancelable) e.preventDefault();
    if (toolRef.current.tool === "image") return;
    isDrawing.current = true;
    const pos = getPos(e, canvasRef.current);
    currentPoints.current = [pos];
    startPt.current = pos;
  }, []);

  const draw = useCallback((e) => {
    if (e.cancelable) e.preventDefault();
    if (!isDrawing.current) return;
    const { tool: t, color: c, strokeWidth: sw, fillColor: fc } = toolRef.current;
    const pos = getPos(e, canvasRef.current);
    currentPoints.current.push(pos);

    getSocket()?.emit("cursor:move", { roomCode, x: pos.x, y: pos.y });

    const canvas = canvasRef.current;
    const overlay = overlayRef.current;

    if (t === "pen" || t === "eraser") {
      const pts = currentPoints.current;
      if (pts.length >= 2) {
        const ctx = canvas.getContext("2d");
        ctx.save();
        ctx.strokeStyle = t === "eraser" ? "rgba(0,0,0,1)" : c;
        ctx.lineWidth = t === "eraser" ? sw * 6 : sw;
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.globalCompositeOperation = t === "eraser" ? "destination-out" : "source-over";
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      const ctx = overlay.getContext("2d");
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      applyStroke(ctx, { tool: t, points: [startPt.current, pos], color: c, strokeWidth: sw, fillColor: fc });
    }
  }, [roomCode]);

  const endDraw = useCallback((e) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const { tool: t, color: c, strokeWidth: sw, fillColor: fc } = toolRef.current;
    const pts = currentPoints.current;
    if (!pts.length) return;

    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const finalPts = t === "pen" || t === "eraser" ? pts : [startPt.current, pts[pts.length - 1]];
    const stroke = { tool: t, points: finalPts, color: c, strokeWidth: sw, fillColor: fc, id: Date.now().toString() };

    if (t !== "pen" && t !== "eraser") {
      applyStroke(canvas.getContext("2d"), stroke);
      overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
    }

    strokeHistory.current.push(stroke);
    redoStack.current = [];
    // Emit to others — sender already drew locally
    getSocket()?.emit("canvas:draw", { roomCode, stroke });
    currentPoints.current = [];
    scheduleSave();
  }, [roomCode, scheduleSave]);

  // Non-passive touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { passive: false };
    canvas.addEventListener("touchstart", startDraw, opts);
    canvas.addEventListener("touchmove", draw, opts);
    canvas.addEventListener("touchend", endDraw, opts);
    return () => {
      canvas.removeEventListener("touchstart", startDraw, opts);
      canvas.removeEventListener("touchmove", draw, opts);
      canvas.removeEventListener("touchend", endDraw, opts);
    };
  }, [startDraw, draw, endDraw]);

  const cursorMap = { pen: "crosshair", eraser: "cell", line: "crosshair", arrow: "crosshair", rect: "crosshair", circle: "crosshair", diamond: "crosshair", image: "default" };

  return (
    <div
      className="relative w-full h-full"
      style={{
        backgroundColor: darkMode ? "#0d0d0f" : "#f8f8f8",
        backgroundImage: darkMode
          ? "radial-gradient(circle, #1e1e24 1px, transparent 1px)"
          : "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Drawing canvas */}
      <canvas ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: cursorMap[tool] || "crosshair" }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
      />
      {/* Shape preview overlay */}
      <canvas ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      {/* Draggable images layer */}
      {images.map((img) => (
        <DraggableImage
          key={img.id}
          id={img.id}
          img={img}
          darkMode={darkMode}
          onUpdate={handleImageUpdate}
          onDelete={handleImageDelete}
        />
      ))}
    </div>
  );
}
