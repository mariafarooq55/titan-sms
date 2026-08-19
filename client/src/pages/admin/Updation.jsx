import { useEffect, useState } from "react";
import PortalLayout from "../../components/PortalLayout";
import api from "../../api/client";
import {
  IconGrid,
  IconUsers,
  IconCheckSquare,
  IconCalendar,
  IconUser,
  IconEdit,
} from "../../components/icons";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: IconGrid },
  { label: "Students", href: "/admin/students", icon: IconUsers },
  { label: "Attendance", href: "/admin/attendance", icon: IconCheckSquare },
  { label: "Slots", href: "/admin/slots", icon: IconCalendar },
  { label: "Trainers", href: "/admin/trainers", icon: IconUsers },
  { label: "Setup", href: "/admin/setup", icon: IconEdit },
  { label: "Updation", href: "/admin/updation", icon: IconEdit },
  { label: "Profile", href: "/admin/profile", icon: IconUser },
];

const STATUS_OPTIONS = ["enrolled", "dropout", "failed", "passed", "completed"];

export default function Updation() {
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState("");
  const [rollNumbers, setRollNumbers] = useState("");
  const [status, setStatus] = useState("passed");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/slots").then(({ data }) => {
      setSlots(data.items);
      if (data.items.length > 0) setSlotId(data.items[0].id);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setSubmitting(true);
    try {
      const list = rollNumbers
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      const { data } = await api.post("/api/updation", {
        slot_id: slotId,
        roll_numbers: list,
        status,
        message: message || undefined,
      });
      setResult(data);
      setRollNumbers("");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalLayout title="Admin Panel" navItems={NAV}>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Updation</h1>
      <p className="text-sm text-slate-500 mb-6">
        Change status for many students at once by pasting their roll numbers.
      </p>

      <div className="max-w-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Slot
          </label>
          <select
            value={slotId}
            onChange={(e) => setSlotId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
          >
            {slots.length === 0 && <option value="">No slots available</option>}
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.course} — {s.campus} — {s.schedule}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Roll numbers (comma-separated)
            </label>
            <textarea
              value={rollNumbers}
              onChange={(e) => setRollNumbers(e.target.value)}
              rows={3}
              placeholder="1, 2, 3, 4"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500 capitalize"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message (optional)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Final exam results"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !slotId}
            className="bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            {submitting ? "Updating..." : "Update"}
          </button>
        </form>

        {result && (
          <div className="mt-6 space-y-2 text-sm">
            <p className="text-green-700">
              ✓ Updated: {result.updated.length || "none"}
              {result.updated.length > 0 && ` (${result.updated.join(", ")})`}
            </p>
            {result.not_found.length > 0 && (
              <p className="text-red-700">
                Not found: {result.not_found.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
