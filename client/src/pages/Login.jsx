import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IconEye } from "../components/icons";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME = {
  super_admin: "/admin",
  sub_admin: "/admin",
  trainer: "/trainer",
  student: "/student",
};

export default function Login() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const role = await login(loginId, password);
      navigate(ROLE_HOME[role] || "/login");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Something went wrong. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10">
        <div className="flex justify-center mb-3">
          <img
            src="/titan-logo.png"
            alt="Titan SMS"
            className="h-16 object-contain"
          />
        </div>

        <h1 className="text-center text-lg font-semibold text-slate-900 mb-6">
          Admin Panel
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              <span className="text-red-500">*</span> Email
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-slate-50"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              <span className="text-red-500">*</span> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 pr-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-slate-50"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                <IconEye
                  width={18}
                  height={18}
                  style={{ opacity: showPassword ? 1 : 0.45 }}
                />
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold tracking-wide rounded-md py-2.5 text-sm transition-colors"
          >
            {submitting ? "Signing in..." : "LOGIN"}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Trainer or Student?{" "}
          <Link to="/trainer/login" className="text-blue-600 hover:underline">
            Go to Portal Login
          </Link>
        </p>
      </div>
    </div>
  );
}
