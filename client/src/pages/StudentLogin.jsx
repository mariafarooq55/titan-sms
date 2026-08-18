import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME = {
  super_admin: "/admin",
  sub_admin: "/admin",
  trainer: "/trainer",
  student: "/student",
};

export default function StudentLogin() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      navigate(ROLE_HOME[role] || "/student/login");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Something went wrong. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-10">
      <div className="flex justify-center mb-4">
        <img
          src="/titan-logo.png"
          alt="Titan SMS"
          className="h-16 object-contain"
        />
      </div>

      <h1 className="text-xl font-semibold text-slate-900 mb-6">
        Portal Login
      </h1>

      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          Student Login
        </h2>
        <p className="text-sm text-blue-600 mb-5">
          Kindly provide your CNIC and password to access the student portal.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              CNIC <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-slate-50"
              placeholder="Enter your CNIC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 pr-14 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-slate-50"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold tracking-wide rounded-md py-2.5 text-sm transition-colors"
          >
            {submitting ? "Signing in..." : "LOGIN"}
          </button>

          <div className="text-center">
            <Link
              to="/student/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>

      <Link
        to="/trainer/login"
        className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-sm py-3 mt-4 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        Login as trainer
      </Link>

      <p className="text-xs text-slate-400 text-center mt-4">
        Admin?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Go to Admin Login
        </Link>
      </p>
    </div>
  );
}
