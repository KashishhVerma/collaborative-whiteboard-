import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createRoom, joinRoom, fetchMyRooms } from "../store/roomSlice.js";
import { logout } from "../store/authSlice.js";
import { Pencil, Plus, Hash, LogOut, Clock, Users, Copy, ArrowRight, LayoutGrid } from "lucide-react";
import { Spinner, EmptyState, Tooltip } from "../components/ui/Primitives.jsx";
import toast from "react-hot-toast";

function RoomCard({ room, onClick }) {
  const copyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.code);
    toast.success("Code copied!");
  };

  return (
    <div
      onClick={onClick}
      className="card-hover p-4 cursor-pointer group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Open room ${room.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "#fafafa" }}>{room.name}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs" style={{ color: "#71717a" }}>
              <Clock size={10} />
              {new Date(room.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "#71717a" }}>
              <Users size={10} /> {room.members?.length || 0}
            </span>
          </div>
        </div>
        <button
          onClick={copyCode}
          className="badge badge-accent gap-1 flex-shrink-0 hover:opacity-80 transition-opacity font-mono"
          aria-label={`Copy room code ${room.code}`}
        >
          {room.code} <Copy size={9} />
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch  = useNavigate() && useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);
  const { myRooms, loading } = useSelector((s) => s.room);
  const [tab, setTab]         = useState("create");
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode]     = useState("");

  useEffect(() => { dispatch(fetchMyRooms()); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;
    const res = await dispatch(createRoom({ name: createName.trim() }));
    if (!res.error) {
      toast.success("Room created!");
      navigate(`/board/${res.payload.room.code}`);
    } else {
      toast.error(res.payload);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const res = await dispatch(joinRoom({ code: joinCode.trim() }));
    if (!res.error) {
      navigate(`/board/${res.payload.room.code}`);
    } else {
      toast.error(res.payload);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0f0f11" }}>
      {/* Nav */}
      <header
        className="flex items-center justify-between px-5 h-14 border-b flex-shrink-0"
        style={{ background: "#18181b", borderColor: "#27272a" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#7c3aed" }}>
            <Pencil size={12} className="text-white" />
          </div>
          <span className="font-semibold text-md tracking-tight" style={{ color: "#fafafa" }}>CollabBoard</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: "#71717a" }}>
            {user?.username}
          </span>
          <Tooltip label="Sign out">
            <button
              onClick={() => { dispatch(logout()); navigate("/"); }}
              className="btn-icon"
              aria-label="Sign out"
            >
              <LogOut size={14} style={{ color: "#71717a" }} />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#fafafa" }}>Your boards</h1>
          <p className="text-sm mt-1" style={{ color: "#71717a" }}>Create a new board or join an existing one.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create / Join */}
          <div>
            {/* Tabs */}
            <div
              className="flex gap-0.5 p-1 mb-4 rounded-lg"
              style={{ background: "#18181b", border: "1px solid #27272a" }}
              role="tablist"
            >
              {["create", "join"].map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-1.5 rounded text-sm font-medium transition-all duration-150 capitalize"
                  style={tab === t
                    ? { background: "#0F0F11", color: "#fff" }
                    : { color: "#71717a" }
                  }
                >
                  {t === "create" ? "Create room" : "Join room"}
                </button>
              ))}
            </div>

            {tab === "create" ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#a1a1aa" }}>Room name</label>
                  <input
                    className="input"
                    placeholder="e.g. DSA Practice"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading || !createName.trim()} className="btn-primary btn">
                  {loading ? <Spinner size={13} /> : <Plus size={14} />}
                  {loading ? "Creating..." : "Create room"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#a1a1aa" }}>Room code</label>
                  <input
                    className="input font-mono text-center tracking-widest"
                    style={{ fontSize: "16px", letterSpacing: "0.2em", textTransform: "uppercase" }}
                    placeholder="ENTER CODE"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading || joinCode.length < 6} className="btn-primary btn">
                  {loading ? <Spinner size={13} /> : <Hash size={14} />}
                  {loading ? "Joining..." : "Join room"}
                </button>
              </form>
            )}
          </div>

          {/* Recent rooms */}
          <div>
            <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: "#52525b" }}>
              Recent rooms
            </p>
            {myRooms.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={LayoutGrid}
                  title="No rooms yet"
                  description="Create your first board to get started."
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {myRooms.map((room) => (
                  <RoomCard
                    key={room._id}
                    room={room}
                    onClick={() => navigate(`/board/${room.code}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
