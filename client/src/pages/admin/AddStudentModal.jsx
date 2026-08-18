import { useState } from "react";
import api from "../../api/client";

const emptyForm = {
  full_name: "",
  father_name: "",
  cnic: "",
  phone: "",
  email: "",
  father_cnic: "",
  father_phone: "",
  gender: "",
  address: "",
  last_qualification: "",
  computer_level: "",
  has_laptop: false,
  course: "",
  campus: "",
  batch: "",
};

export default function AddStudentModal({ onClose, onCreated }) {
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
      // Drop empty-string optional fields so backend validators don't choke on ""
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== "")
      );
      await api.post("/api/students", payload);
      onCreated();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : detail || "Could not create student."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Add Student</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name" required value={form.full_name} onChange={(v) => update("full_name", v)} />
            <Field label="Father name" required value={form.father_name} onChange={(v) => update("father_name", v)} />
            <Field label="CNIC" required placeholder="4230112223334" value={form.cnic} onChange={(v) => update("cnic", v)} />
            <Field label="Phone" required placeholder="03001234567" value={form.phone} onChange={(v) => update("phone", v)} />
            <Field label="Email" value={form.email} onChange={(v) => update("email", v)} />
            <Field label="Father's CNIC" value={form.father_cnic} onChange={(v) => update("father_cnic", v)} />
            <Field label="Father's phone" placeholder="03001234567" value={form.father_phone} onChange={(v) => update("father_phone", v)} />
            <Field label="Gender" value={form.gender} onChange={(v) => update("gender", v)} />
            <Field label="Last qualification" value={form.last_qualification} onChange={(v) => update("last_qualification", v)} />
            <Field label="Computer level" value={form.computer_level} onChange={(v) => update("computer_level", v)} />
            <Field label="Course" value={form.course} onChange={(v) => update("course", v)} />
            <Field label="Campus" value={form.campus} onChange={(v) => update("campus", v)} />
            <Field label="Batch" value={form.batch} onChange={(v) => update("batch", v)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.has_laptop}
              onChange={(e) => update("has_laptop", e.target.checked)}
              className="rounded border-slate-300"
            />
            Has a laptop
          </label>

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
              {submitting ? "Saving..." : "Save student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
      />
    </div>
  );
}
