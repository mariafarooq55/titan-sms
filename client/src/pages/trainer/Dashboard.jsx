import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../../components/PortalLayout";
import api from "../../api/client";
import {
  IconGrid,
  IconCalendar,
  IconCheckSquare,
  IconUser,
} from "../../components/icons";

const NAV = [
  { label: "Dashboard", href: "/trainer", icon: IconGrid },
  { label: "Calendar", href: "/trainer/calendar", icon: IconCalendar },
  { label: "Attendance", href: "/trainer/attendance", icon: IconCheckSquare },
  { label: "Profile", href: "/trainer/profile", icon: IconUser },
];

export default function TrainerDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get("/api/me/trainer/dashboard");
        setData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Could not load trainer dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <PortalLayout title="Trainer Portal" navItems={NAV}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Trainer Dashboard
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Manage your courses, students and attendance.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Active Courses"
              value={data?.active_courses ?? 0}
            />

            <StatCard
              label="Enrolled Students"
              value={data?.enrolled_students ?? 0}
            />

            <StatCard
              label="Total Assignments"
              value={data?.total_assignments ?? 0}
            />
          </div>

          {/* Courses */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">My Courses</h2>

            <p className="text-sm text-slate-500 mt-1">
              Courses assigned to you.
            </p>
          </div>

          {(!data?.slots || data.slots.length === 0) && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-sm text-slate-400">
                No courses have been assigned to you yet.
              </p>
            </div>
          )}

          {data?.slots?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.slots.map((slot) => {
                const enrolled = Number(slot.seats_used ?? 0);
                const capacity = Number(slot.capacity ?? 0);

                return (
                  <button
                    key={slot.id}
                    onClick={() => navigate(`/trainer/course/${slot.id}`)}
                    className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-titan-300 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {slot.course}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                          {slot.campus}
                          {slot.city ? ` · ${slot.city}` : ""}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          slot.registration_open
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {slot.registration_open ? "Open" : "Closed"}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-medium">Schedule:</span>{" "}
                        {slot.schedule || "—"}
                      </p>

                      {/* ================================
                          ENROLLED STUDENT COUNT
                      ================================= */}
                      <p>
                        <span className="font-medium">Students:</span>{" "}
                        <span className="font-semibold text-slate-800">
                          {enrolled}/{capacity}
                        </span>
                      </p>

                      {slot.start_date && (
                        <p>
                          <span className="font-medium">Start date:</span>{" "}
                          {slot.start_date}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-sm font-medium text-titan-600">
                        Open Course →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </PortalLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="text-3xl font-semibold text-slate-900 mt-2">{value}</p>
    </div>
  );
}
