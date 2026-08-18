import { useEffect, useState } from "react";
import PortalLayout from "../../components/PortalLayout";
import Badge from "../../components/Badge";
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
  { label: "Trainers", href: "/admin/trainers", icon: IconUser },
  { label: "Updation", href: "/admin/updation", icon: IconEdit },
  { label: "Profile", href: "/admin/profile", icon: IconUser },
];

const TABS = ["Mark", "View", "Multi"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Attendance() {
  const [tab, setTab] = useState("Mark");
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState("");

  useEffect(() => {
    api.get("/api/slots").then(({ data }) => {
      setSlots(data.items);
      if (data.items.length > 0) setSlotId(data.items[0].id);
    });
  }, []);

  return (
    <PortalLayout title="Admin Panel" navItems={NAV}>
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Attendance</h1>

      <div className="mb-4 max-w-sm">
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

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t
                ? "border-titan-500 text-titan-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {!slotId ? (
        <p className="text-sm text-slate-400">
          Create a slot first under Slots.
        </p>
      ) : (
        <>
          {tab === "Mark" && <MarkTab slotId={slotId} />}
          {tab === "View" && <ViewTab slotId={slotId} />}
          {tab === "Multi" && <MultiTab slotId={slotId} />}
        </>
      )}
    </PortalLayout>
  );
}

// ---------- Mark ----------
function MarkTab({ slotId }) {
  const [rollNumber, setRollNumber] = useState("");
  const [date, setDate] = useState(todayStr());
  const [status, setStatus] = useState("present");
  const [lookedUp, setLookedUp] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [marking, setMarking] = useState(false);
  const [recent, setRecent] = useState([]);

  async function fetchRecent() {
    try {
      const { data } = await api.get("/api/attendance/recent", {
        params: { slot_id: slotId },
      });
      setRecent(data.items);
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    setLookedUp(null);
    setError("");
    setSuccess("");
    fetchRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotId]);

  async function handleLookup(e) {
    e.preventDefault();
    if (!rollNumber.trim()) return;
    setError("");
    setSuccess("");
    setLookedUp(null);
    try {
      const { data } = await api.get("/api/attendance/lookup", {
        params: { slot_id: slotId, roll_number: rollNumber.trim() },
      });
      setLookedUp(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Roll number not found.");
    }
  }

  async function handleMark() {
    setMarking(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.post("/api/attendance/mark", {
        slot_id: slotId,
        roll_number: rollNumber.trim(),
        date,
        status,
      });
      setSuccess(
        data.was_updated
          ? `Updated to ${data.status} for ${data.student_name}`
          : `Marked ${data.status} for ${data.student_name}`,
      );
      setLookedUp(null);
      setRollNumber("");
      fetchRecent();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not mark attendance.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <form onSubmit={handleLookup} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Type or scan roll number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            autoFocus
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Find
          </button>
        </form>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2 mb-4">
            ✓ {success}
          </div>
        )}

        {lookedUp && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="font-semibold text-slate-900">
              {lookedUp.student_name}
            </p>
            <p className="text-sm text-slate-500">
              Roll #{lookedUp.roll_number}
            </p>
            {lookedUp.payment_warning && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠ This student has not paid
              </p>
            )}

            <div className="flex gap-2 mt-4">
              {["present", "leave", "absent"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 text-sm font-medium px-3 py-1.5 rounded-md border capitalize ${
                    status === s
                      ? "bg-titan-500 border-titan-500 text-white"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={handleMark}
              disabled={marking}
              className="mt-3 w-full bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              {marking ? "Saving..." : `Mark ${status}`}
            </button>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-2">
          Recently marked
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {recent.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-400">
                    Nothing marked yet
                  </td>
                </tr>
              )}
              {recent.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-slate-800">{r.student_name}</td>
                  <td className="px-4 py-2 text-slate-500">#{r.roll_number}</td>
                  <td className="px-4 py-2 text-slate-500">{r.date}</td>
                  <td className="px-4 py-2">
                    <Badge value={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- View ----------
function ViewTab({ slotId }) {
  const [rollNumber, setRollNumber] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setResult(null);
    setError("");
  }, [slotId]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!rollNumber.trim()) return;
    setError("");
    setResult(null);
    try {
      const { data } = await api.get("/api/attendance/view", {
        params: { slot_id: slotId, roll_number: rollNumber.trim() },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Roll number not found.");
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4 max-w-md">
        <input
          type="text"
          placeholder="Search roll number"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {result && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Stat
              label="Present"
              value={result.present_count}
              color="text-green-600"
            />
            <Stat
              label="Leave"
              value={result.leave_count}
              color="text-amber-600"
            />
            <Stat
              label="Absent"
              value={result.absent_count}
              color="text-red-600"
            />
            <Stat
              label="Percentage"
              value={`${result.percentage}%`}
              color="text-titan-600"
            />
          </div>

          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            {result.student_name} — Roll #{result.roll_number}
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.records.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      No attendance recorded yet
                    </td>
                  </tr>
                )}
                {result.records.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-slate-800">{r.date}</td>
                    <td className="px-4 py-2">
                      <Badge value={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

// ---------- Multi ----------
function MultiTab({ slotId }) {
  const [date, setDate] = useState(todayStr());
  const [rollNumbers, setRollNumbers] = useState("");
  const [status, setStatus] = useState("present");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

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
      const { data } = await api.post("/api/attendance/multi", {
        slot_id: slotId,
        date,
        roll_numbers: list,
        status,
      });
      setResult(data);
      setRollNumbers("");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not mark attendance.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
            >
              <option value="present">Present</option>
              <option value="leave">Leave</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

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

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          {submitting ? "Updating..." : "Update"}
        </button>
      </form>

      {result && (
        <div className="mt-6 space-y-2 text-sm">
          <p className="text-green-700">
            ✓ Marked: {result.marked.length || "none"}
            {result.marked.length > 0 && ` (${result.marked.join(", ")})`}
          </p>
          {result.updated.length > 0 && (
            <p className="text-titan-700">
              Updated: {result.updated.join(", ")}
            </p>
          )}
          {result.already_marked.length > 0 && (
            <p className="text-amber-700">
              Already {status}: {result.already_marked.join(", ")}
            </p>
          )}
          {result.not_found.length > 0 && (
            <p className="text-red-700">
              Not found: {result.not_found.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
