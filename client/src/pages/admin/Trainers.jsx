import { useEffect, useState, useCallback } from "react";
import PortalLayout from "../../components/PortalLayout";
import AddTrainerModal from "./AddTrainerModal";
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

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchTrainers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/trainers");
      setTrainers(data.items);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("You don't have permission to view trainers.");
      } else {
        setError("Could not load trainers.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  function handleCreated() {
    setShowAddModal(false);
    fetchTrainers();
  }

  return (
    <PortalLayout title="Admin Panel" navItems={NAV}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Trainers</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {trainers.length} total
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-titan-500 hover:bg-titan-600 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Trainer
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
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Employee ID</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Phone</th>
              <th className="text-left px-4 py-3 font-medium">Courses</th>
              <th className="text-left px-4 py-3 font-medium">Campus</th>
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
            {!loading && trainers.length === 0 && !error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No trainers yet. Click "Add Trainer" to add one.
                </td>
              </tr>
            )}
            {!loading &&
              trainers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {t.full_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.employee_id}</td>
                  <td className="px-4 py-3 text-slate-600">{t.email}</td>
                  <td className="px-4 py-3 text-slate-600">{t.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.courses?.length ? t.courses.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.campus || "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddTrainerModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </PortalLayout>
  );
}
