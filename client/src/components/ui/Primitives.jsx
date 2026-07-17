// Reusable UI primitives — import from here across the app

export function Spinner({ size = 14, className = "" }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      className={`animate-spin ${className}`}
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Divider({ className = "" }) {
  return <div className={`divider ${className}`} aria-hidden="true" />;
}

export function Badge({ children, variant = "default", className = "" }) {
  const v = variant === "accent" ? "badge-accent" : "badge";
  return <span className={`${v} ${className}`}>{children}</span>;
}

export function SkeletonLine({ w = "100%", h = 14, className = "" }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: w, height: h }}
      aria-hidden="true"
    />
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(124,58,237,0.1)", color: "#8b5cf6" }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="text-xs text-text-2 mt-0.5 leading-relaxed">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function Tooltip({ label, children }) {
  return (
    <div className="relative group/tip inline-flex">
      {children}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                   opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50"
      >
        <div
          className="text-xs font-medium px-2 py-1 rounded whitespace-nowrap"
          style={{ background: "#27272a", color: "#fafafa", border: "1px solid #3f3f46" }}
        >
          {label}
        </div>
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 -mt-px"
          style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid #27272a" }}
        />
      </div>
    </div>
  );
}
