import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addNote, updateNote, removeNote } from "../../store/roomSlice.js";
import { getSocket } from "../../services/socket.js";
import { X, GripVertical } from "lucide-react";

const NOTE_COLORS = ["#facc15", "#4ade80", "#60a5fa", "#f87171", "#e879f9", "#fb923c"];

export default function StickyNotes({ roomCode }) {
  const dispatch = useDispatch();
  const { notes } = useSelector((s) => s.room);
  const { user } = useSelector((s) => s.auth);
  const dragging = useRef(null);

  const addNewNote = () => {
    const note = {
      id: Date.now().toString(),
      x: 80 + Math.random() * 200,
      y: 80 + Math.random() * 150,
      text: "",
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      createdBy: user?.username,
    };
    dispatch(addNote(note));
    getSocket()?.emit("note:add", { roomCode, note });
  };

  const deleteNote = (id) => {
    dispatch(removeNote(id));
    getSocket()?.emit("note:delete", { roomCode, noteId: id });
  };

  const updateText = (note, text) => {
    const updated = { ...note, text };
    dispatch(updateNote(updated));
  };

  const saveText = (note) => {
    getSocket()?.emit("note:update", { roomCode, note });
  };

  const startDrag = (e, note) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") return;
    e.preventDefault();
    const startX = e.clientX - note.x;
    const startY = e.clientY - note.y;
    dragging.current = { id: note.id, startX, startY };

    const onMove = (ev) => {
      if (!dragging.current) return;
      const updated = { ...note, x: ev.clientX - dragging.current.startX, y: ev.clientY - dragging.current.startY };
      dispatch(updateNote(updated));
    };
    const onUp = () => {
      if (dragging.current) {
        const n = notes.find((n) => n.id === dragging.current.id);
        if (n) getSocket()?.emit("note:update", { roomCode, note: n });
        dragging.current = null;
      }
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <>
      {notes.map((note) => (
        <div key={note.id} onMouseDown={(e) => startDrag(e, note)}
          className="absolute w-44 shadow-xl rounded-lg overflow-hidden flex flex-col z-30 select-none"
          style={{ left: note.x, top: note.y, backgroundColor: note.color, minHeight: 120 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 cursor-grab active:cursor-grabbing"
            style={{ backgroundColor: "rgba(0,0,0,0.1)" }}>
            <div className="flex items-center gap-1">
              <GripVertical size={12} className="opacity-50" />
              <span className="text-[10px] opacity-60 font-medium">{note.createdBy}</span>
            </div>
            <button onClick={() => deleteNote(note.id)} className="opacity-50 hover:opacity-100 transition-opacity">
              <X size={12} />
            </button>
          </div>
          {/* Text */}
          <textarea
            className="flex-1 bg-transparent text-gray-900 text-xs p-2 resize-none focus:outline-none placeholder-gray-600/50 min-h-[80px]"
            placeholder="Write a note..."
            value={note.text}
            onChange={(e) => updateText(note, e.target.value)}
            onBlur={() => saveText(note)}
          />
        </div>
      ))}

      {/* Floating add button */}
      <button onClick={addNewNote}
        className="absolute bottom-4 right-4 z-40 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-xs px-3 py-1.5 rounded-full shadow-lg transition-colors flex items-center gap-1">
        + Note
      </button>
    </>
  );
}
