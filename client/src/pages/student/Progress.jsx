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

export default function StudentProgress() {
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/me/enrollments")
      .then(({ data }) => setEnrollments(data.items))
      .catch((err) =>
        setError(err.response?.data?.detail || "Could not load your courses."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalLayout title="Student Portal" navItems={NAV}>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Progress</h1>
      <p className="text-sm text-slate-500 mb-6">
        Chapter-by-chapter completion will appear here once Course
        modules/topics are built.
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {!loading && enrollments.length === 0 && !error && (
        <p className="text-sm text-slate-400">
          You're not enrolled in any course yet.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {enrollments.map((e) => (
          <div
            key={e.id}
            className="bg-white border border-slate-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-slate-900">{e.course}</h2>
              <Badge value={e.status} />
            </div>
            <p className="text-sm text-slate-500">{e.campus}</p>
            <p className="text-sm text-slate-500">Roll #{e.roll_number}</p>
            <p className="text-sm text-slate-500">{e.slot_schedule}</p>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
