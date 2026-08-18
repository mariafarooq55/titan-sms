import { useEffect, useMemo, useState } from "react";
import PortalLayout from "../../components/PortalLayout";
import api from "../../api/client";
import {
  IconGrid,
  IconCalendar,
  IconCheckSquare,
} from "../../components/icons";

const NAV = [
  { label: "Dashboard", href: "/trainer", icon: IconGrid },
  { label: "Calendar", href: "/trainer/calendar", icon: IconCalendar },
  { label: "Attendance", href: "/trainer/attendance", icon: IconCheckSquare },
];

function formatDate(date) {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseDate(date) {
  if (!date) return null;

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value;
}

export default function TrainerCalendar() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    async function loadSlots() {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get("/api/me/slots");

        setSlots(data?.items || []);
      } catch (err) {
        console.error("Failed to load trainer calendar:", err);

        setError(
          err.response?.data?.detail || "Could not load your course calendar.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSlots();
  }, []);

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const start = parseDate(slot.start_date);
      const end = parseDate(slot.end_date);

      if (!start && !end) {
        return true;
      }

      const monthStart = new Date(`${selectedMonth}-01T00:00:00`);

      const nextMonth = new Date(monthStart);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      if (start && start < nextMonth && (!end || end >= monthStart)) {
        return true;
      }

      if (end && end >= monthStart && end < nextMonth) {
        return true;
      }

      return false;
    });
  }, [slots, selectedMonth]);

  function changeMonth(amount) {
    const current = new Date(`${selectedMonth}-01T00:00:00`);

    current.setMonth(current.getMonth() + amount);

    setSelectedMonth(current.toISOString().slice(0, 7));
  }

  function goToToday() {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  }

  return (
    <PortalLayout title="Trainer Portal" navItems={NAV}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Trainer Calendar
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            View your assigned courses, schedules, and upcoming sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="border border-slate-300 bg-white text-slate-700 px-3 py-2 rounded-md hover:bg-slate-50"
          >
            ←
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-slate-300 bg-white rounded-md px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="border border-slate-300 bg-white text-slate-700 px-3 py-2 rounded-md hover:bg-slate-50"
          >
            →
          </button>

          <button
            type="button"
            onClick={goToToday}
            className="bg-titan-500 hover:bg-titan-600 text-white text-sm font-medium px-3 py-2 rounded-md"
          >
            Today
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-400">Loading your calendar...</p>
        </div>
      )}

      {!loading && !error && filteredSlots.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">📅</div>

          <h2 className="font-semibold text-slate-800">No courses scheduled</h2>

          <p className="text-sm text-slate-500 mt-1">
            There are no assigned course slots for this month.
          </p>
        </div>
      )}

      {!loading && filteredSlots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSlots.map((slot) => (
            <div
              key={slot.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {slot.course || "Course"}
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    {slot.campus || "Campus"}{" "}
                    {slot.city ? `• ${slot.city}` : ""}
                  </p>
                </div>

                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    slot.registration_open
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {slot.registration_open ? "Active" : "Closed"}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Start date</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(slot.start_date)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">End date</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(slot.end_date)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Schedule</span>
                  <span className="font-medium text-slate-800 text-right max-w-[60%]">
                    {slot.schedule || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Students</span>
                  <span className="font-medium text-slate-800">
                    {slot.seats_used ?? 0} / {slot.capacity ?? "—"}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">Slot ID: {slot.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
