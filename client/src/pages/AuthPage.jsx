import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, register, clearError } from "../store/authSlice.js";
import { Pencil, Eye, EyeOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="anim-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function AuthPage({ mode }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused]   = useState("");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const isLogin = mode === "login";

  useEffect(() => {
    dispatch(clearError());
    setForm({ username: "", email: "", password: "" });
  }, [mode]);

  useEffect(() => { if (error) toast.error(error); }, [error]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isLogin
      ? login({ email: form.email, password: form.password })
      : register(form);
    const res = await dispatch(action);
    if (!res.error) {
      toast.success(isLogin ? "Welcome back!" : "Account created!");
      navigate("/dashboard");
    }
  };

  const inputStyle = (name) => ({
    height: 36,
    padding: "0 36px 0 10px",
    fontSize: 13,
    color: "#fafafa",
    background: "#1f1f23",
    border: `1px solid ${focused === name ? "#7c3aed" : "#27272a"}`,
    borderRadius: 8,
    width: "100%",
    outline: "none",
    transition: "border-color 150ms, box-shadow 150ms",
    boxShadow: focused === name ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0f0f11" }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(124,58,237,0.12), transparent)",
        }}
      />

      <div className="w-full max-w-sm relative anim-scale-bounce">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8 group">
          <div
            className="w-7 h-7 rounded flex items-center justify-center transition-all duration-200 group-hover:scale-110"
            style={{ background: "#7c3aed", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}
          >
            <Pencil size={13} className="text-white" />
          </div>
          <span className="font-semibold text-md tracking-tight">CollabBoard</span>
        </Link>

        <div className="card p-6" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          <div className="mb-5">
            <h1 className="font-semibold" style={{ fontSize: 18, color: "#fafafa" }}>
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#71717a" }}>
              {isLogin ? "Sign in to your workspace" : "Start collaborating in seconds"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <div className="anim-slide-down">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#a1a1aa" }}>
                  Username
                </label>
                <input
                  style={inputStyle("username")}
                  placeholder="your_username"
                  value={form.username}
                  onChange={set("username")}
                  onFocus={() => setFocused("username")}
                  onBlur={() => setFocused("")}
                  required minLength={3}
                  autoComplete="username"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#a1a1aa" }}>Email</label>
              <input
                type="email"
                style={inputStyle("email")}
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused("")}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#a1a1aa" }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  style={{ ...inputStyle("password"), paddingRight: 36 }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set("password")}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  required minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors duration-150"
                  style={{ color: "#52525b", background: "none", border: "none", cursor: "pointer" }}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn btn-lg"
              style={{ width: "100%", marginTop: 4 }}
            >
              {loading
                ? <><Spinner /> Please wait...</>
                : <>{isLogin ? "Sign in" : "Create account"} <ArrowRight size={14} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "#71717a" }}>
            {isLogin ? "Don't have an account? " : "Already have one? "}
            <Link
              to={isLogin ? "/register" : "/login"}
              className="font-medium transition-colors duration-150 hover:opacity-80"
              style={{ color: "#8b5cf6" }}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
