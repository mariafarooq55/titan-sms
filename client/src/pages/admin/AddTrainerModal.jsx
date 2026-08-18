import { useState } from "react";
import api from "../../api/client";

const emptyForm = {
  employee_id: "",
  full_name: "",
  full_name_urdu: "",
  email: "",
  password: "",
  phone: "",
  bio: "",
  hourly_rate: "",
  city: "",
  campus: "",
  courses: "",
};

export default function AddTrainerModal({ onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ""),
      );
      if (payload.hourly_rate)
        payload.hourly_rate = Number(payload.hourly_rate);
      payload.courses = form.courses
        ? form.courses
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : [];

      await api.post("/api/trainers", payload);
      onCreated();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : detail || "Could not create trainer.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Add Trainer</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-400">
            This creates the trainer's login for the Trainer Portal too.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Employee ID"
              required
              value={form.employee_id}
              onChange={(v) => update("employee_id", v)}
            />
            <Field
              label="Full name"
              required
              value={form.full_name}
              onChange={(v) => update("full_name", v)}
            />
            <Field
              label="Full name (Urdu)"
              value={form.full_name_urdu}
              onChange={(v) => update("full_name_urdu", v)}
            />
            <Field
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
            />
            <Field
              label="Password"
              required
              type="password"
              value={form.password}
              onChange={(v) => update("password", v)}
            />
            <Field
              label="Phone"
              placeholder="03001234567"
              value={form.phone}
              onChange={(v) => update("phone", v)}
            />
            <Field
              label="Hourly rate (Rs)"
              type="number"
              value={form.hourly_rate}
              onChange={(v) => update("hourly_rate", v)}
            />
            <Field
              label="City"
              value={form.city}
              onChange={(v) => update("city", v)}
            />
            <Field
              label="Campus"
              value={form.campus}
              onChange={(v) => update("campus", v)}
            />
          </div>

          <Field
            label="Courses (comma-separated)"
            placeholder="Artificial Intelligence, Web Development"
            value={form.courses}
            onChange={(v) => update("courses", v)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white font-medium"
            >
              {submitting ? "Saving..." : "Save trainer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
      />
    </div>
  );
}
