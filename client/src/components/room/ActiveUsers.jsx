import { useSelector } from "react-redux";
import { Tooltip } from "../ui/Primitives.jsx";

const COLORS = ["#7c3aed","#db2777","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#6366f1"];
const getColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

export default function ActiveUsers() {
  const { activeUsers } = useSelector((s) => s.room);
  const { user }        = useSelector((s) => s.auth);

  if (!activeUsers.length) return null;

  const visible = activeUsers.slice(0, 5);
  const extra   = activeUsers.length - 5;

  return (
    <div className="flex items-center gap-2" aria-label={`${activeUsers.length} users online`}>
      <div className="flex -space-x-1.5">
        {visible.map((u, i) => {
          const me = u.userId === user?._id?.toString();
          const label = me ? `${u.username} (you)` : u.username;
          return (
            <Tooltip key={u.socketId} label={label}>
              <div
                className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 transition-transform duration-150 hover:scale-110 hover:z-10 relative"
                style={{
                  width: 26, height: 26,
                  fontSize: 10,
                  background: getColor(u.username),
                  border: "2px solid #0f0f11",
                  zIndex: visible.length - i,
                }}
                aria-label={label}
              >
                {u.username?.[0]?.toUpperCase()}
              </div>
            </Tooltip>
          );
        })}
        {extra > 0 && (
          <Tooltip label={`${extra} more`}>
            <div
              className="rounded-full flex items-center justify-center font-medium flex-shrink-0"
              style={{ width: 26, height: 26, fontSize: 10, background: "#27272a", color: "#a1a1aa", border: "2px solid #0f0f11" }}
            >
              +{extra}
            </div>
          </Tooltip>
        )}
      </div>
      <span className="text-xs hidden sm:block" style={{ color: "#71717a" }}>
        {activeUsers.length} online
      </span>
    </div>
  );
}
