import { Spinner } from "./Primitives.jsx";

export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3" style={{ background: "#0f0f11" }}>
      <div className="flex items-center gap-2" style={{ color: "#8b5cf6" }}>
        <Spinner size={18} />
        <span className="text-sm" style={{ color: "#a1a1aa" }}>{text}</span>
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex flex-col h-screen" style={{ background: "#0f0f11" }}>
      {/* Nav skeleton */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "#27272a", background: "#18181b" }}>
        <div className="flex items-center gap-3">
          <div className="skeleton w-6 h-6 rounded" />
          <div className="skeleton w-32 h-4 rounded" />
          <div className="skeleton w-14 h-5 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="skeleton w-20 h-6 rounded" />
        </div>
      </div>
      {/* Main skeleton */}
      <div className="flex flex-1 overflow-hidden">
        <div className="p-2">
          <div className="skeleton w-9 h-64 rounded-lg" />
        </div>
        <div className="flex-1" style={{
          background: "#0f0f11",
          backgroundImage: "radial-gradient(circle, #27272a 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />
        <div className="w-72 border-l p-3 flex flex-col gap-3" style={{ borderColor: "#27272a", background: "#18181b" }}>
          {[80, 60, 90, 50, 70].map((w, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div className={`skeleton h-8 rounded-lg`} style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
