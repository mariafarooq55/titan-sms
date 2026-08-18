import { useEffect, useState } from "react";
import api from "../../api/client";

export default function EnrollModal({ student, onClose, onEnrolled }) {
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSlots() {
      try {
        const { data } = await api.get("/api/slots");
        setSlots(data.items.filter((s) => s.registration_open));
      } catch {
        setError("Could not load slots.");
      } finally {
        setLoading(false);
      }
    }
    loadSlots();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedSlotId) {
      setError("Pick a slot first.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/enrollments", {
        student_id: student.id,
        slot_id: selectedSlotId,
      });
      onEnrolled();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not enroll student.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Enroll in Slot</h2>
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

          {loading && (
            <p className="text-sm text-slate-400">Loading slots...</p>
          )}

          {!loading && slots.length === 0 && !error && (
            <p className="text-sm text-slate-400">
              No slots have registration open right now.
            </p>
          )}

          {!loading && slots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Choose a slot
              </label>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
              >
                <option value="">Select...</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.course} — {s.campus} — {s.schedule} ({s.seats_used}/
                    {s.capacity})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              disabled={submitting || slots.length === 0}
              className="px-4 py-2 text-sm rounded-md bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white font-medium"
            >
              {submitting ? "Enrolling..." : "Enroll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
