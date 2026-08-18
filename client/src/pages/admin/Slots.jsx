import { useEffect, useState, useCallback } from "react";
import PortalLayout from "../../components/PortalLayout";
import AddSlotModal from "./AddSlotModal";
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

export default function Slots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/slots");
      setSlots(data.items);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("You don't have permission to view slots.");
      } else {
        setError("Could not load slots.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  function handleCreated() {
    setShowAddModal(false);
    fetchSlots();
  }

  async function handleToggle(slotId) {
    setTogglingId(slotId);
    try {
      await api.post(`/api/slots/${slotId}/toggle-registration`);
      fetchSlots();
    } catch {
      setError("Could not update registration status.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <PortalLayout title="Admin Panel" navItems={NAV}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Slots</h1>
          <p className="text-sm text-slate-500 mt-0.5">{slots.length} total</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-titan-500 hover:bg-titan-600 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Slot
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Schedule</th>
              <th className="text-left px-4 py-3 font-medium">Course</th>
              <th className="text-left px-4 py-3 font-medium">Campus</th>
              <th className="text-left px-4 py-3 font-medium">Trainer</th>
              <th className="text-left px-4 py-3 font-medium">Seats</th>
              <th className="text-left px-4 py-3 font-medium">Registration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  Loading...
                </td>
              </tr>
            )}
            {!loading && slots.length === 0 && !error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No slots yet. Click "Add Slot" to create one.
                </td>
              </tr>
            )}
            {!loading &&
              slots.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {s.schedule}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.course}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.campus}
                    <span className="text-slate-400"> · {s.city}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.trainer || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.seats_used}/{s.capacity}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(s.id)}
                      disabled={togglingId === s.id}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border disabled:opacity-50 ${
                        s.registration_open
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {s.registration_open ? "Open" : "Closed"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddSlotModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </PortalLayout>
  );
}
