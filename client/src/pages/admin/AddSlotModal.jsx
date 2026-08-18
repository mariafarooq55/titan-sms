import { useState } from "react";
import api from "../../api/client";

const emptyForm = {
  schedule: "",
  city: "",
  campus: "",
  course: "",
  trainer: "",
  class_type: "",
  gender: "",
  start_date: "",
  end_date: "",
  trainer_hourly_rate: "",
  whatsapp_link: "",
  capacity: "",
};

export default function AddSlotModal({ onClose, onCreated }) {
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
      payload.capacity = Number(payload.capacity);
      if (payload.trainer_hourly_rate) {
        payload.trainer_hourly_rate = Number(payload.trainer_hourly_rate);
      }
      await api.post("/api/slots", payload);
      onCreated();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : detail || "Could not create slot.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Add Slot</h2>
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

          <Field
            label="Schedule"
            required
            placeholder="Mon/Wed/Fri 5:00 PM - 7:00 PM"
            value={form.schedule}
            onChange={(v) => update("schedule", v)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="City"
              required
              value={form.city}
              onChange={(v) => update("city", v)}
            />
            <Field
              label="Campus"
              required
              value={form.campus}
              onChange={(v) => update("campus", v)}
            />
            <Field
              label="Course"
              required
              value={form.course}
              onChange={(v) => update("course", v)}
            />
            <Field
              label="Trainer"
              value={form.trainer}
              onChange={(v) => update("trainer", v)}
            />
            <Field
              label="Class type"
              placeholder="Physical / Online"
              value={form.class_type}
              onChange={(v) => update("class_type", v)}
            />
            <Field
              label="Gender"
              placeholder="Male / Female / Mixed"
              value={form.gender}
              onChange={(v) => update("gender", v)}
            />
            <Field
              label="Start date"
              type="date"
              value={form.start_date}
              onChange={(v) => update("start_date", v)}
            />
            <Field
              label="End date"
              type="date"
              value={form.end_date}
              onChange={(v) => update("end_date", v)}
            />
            <Field
              label="Trainer hourly rate (Rs)"
              type="number"
              value={form.trainer_hourly_rate}
              onChange={(v) => update("trainer_hourly_rate", v)}
            />
            <Field
              label="Capacity"
              required
              type="number"
              value={form.capacity}
              onChange={(v) => update("capacity", v)}
            />
          </div>

          <Field
            label="WhatsApp group link"
            value={form.whatsapp_link}
            onChange={(v) => update("whatsapp_link", v)}
          />

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
              {submitting ? "Saving..." : "Save slot"}
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
