import { useEffect, useState } from "react";
import PortalLayout from "../../components/PortalLayout";
import Badge from "../../components/Badge";
import api from "../../api/client";
import {
  IconGrid,
  IconBook,
  IconCheckSquare,
  IconIdCard,
  IconEdit,
  IconFileText,
  IconUser,
} from "../../components/icons";

const NAV = [
  { label: "Dashboard", href: "/student", icon: IconGrid },
  { label: "Progress", href: "/student/progress", icon: IconBook },
  { label: "Attendance", href: "/student/attendance", icon: IconCheckSquare },
  { label: "Payment", href: "/student/payment", icon: IconIdCard },
  { label: "Assignment", href: "/student/assignment", icon: IconEdit },
  { label: "Quiz", href: "/student/quiz", icon: IconFileText },
  { label: "Profile", href: "/student/profile", icon: IconUser },
];

export default function StudentAttendance() {
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/api/me/enrollments");
        setEnrollments(data.items);
        if (data.items.length > 0) setEnrollmentId(data.items[0].id);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Could not load your enrollments.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!enrollmentId) return;
    api
      .get("/api/me/attendance", { params: { enrollment_id: enrollmentId } })
      .then(({ data }) => setResult(data))
      .catch(() => setError("Could not load attendance."));
  }, [enrollmentId]);

  return (
    <PortalLayout title="Student Portal" navItems={NAV}>
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Attendance</h1>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {!loading && enrollments.length > 1 && (
        <div className="mb-4 max-w-sm">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Course
          </label>
          <select
            value={enrollmentId}
            onChange={(e) => setEnrollmentId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
          >
            {enrollments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.course}
              </option>
            ))}
          </select>
        </div>
      )}

      {!loading && enrollments.length === 0 && !error && (
        <p className="text-sm text-slate-400">
          You're not enrolled in any course yet.
        </p>
      )}

      {result && (
        <>
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
        </>
      )}
    </PortalLayout>
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
