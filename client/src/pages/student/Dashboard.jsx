import { useAuth } from "../../context/AuthContext";
import PortalLayout from "../../components/PortalLayout";
import {
  IconGrid,
  IconBook,
  IconCheckSquare,
  IconIdCard,
  IconEdit,
  IconFileText,
  IconUser,
} from "../../components/icons";

export default function StudentDashboard() {
  const { slotId, loadingSlot } = useAuth();

  /*
   * Assignment navigation is now controlled by
   * AuthContext's globally loaded slotId.
   *
   * StudentDashboard no longer makes its own
   * enrollment request.
   */

  const NAV = [
    { label: "Dashboard", href: "/student", icon: IconGrid },
    { label: "Progress", href: "/student/progress", icon: IconBook },
    { label: "Attendance", href: "/student/attendance", icon: IconCheckSquare },
    { label: "Payment", href: "/student/payment", icon: IconIdCard },
    { label: "Assignment", href: "/student/assignment", icon: IconEdit },
    { label: "Quiz", href: "/student/quiz", icon: IconFileText },
    { label: "Profile", href: "/student/profile", icon: IconUser },
  ];

  return (
    <PortalLayout title="Student Portal" navItems={NAV}>
      {/* ==================== HEADER ==================== */}

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Dashboard</h1>

        <p className="text-sm text-slate-500">
          Add attendance summary, assignments summary, and fee table here.
        </p>
      </div>

      {/* ==================== LOADING SLOT ==================== */}

      {loadingSlot && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-500">
            Loading your course information...
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Your Assignment section will be available when your course
            information is loaded.
          </p>
        </div>
      )}

      {/* ==================== NO SLOT ==================== */}

      {!loadingSlot && !slotId && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-sm font-medium text-yellow-800">
            No course slot was found.
          </p>

          <p className="text-xs text-yellow-700 mt-1">
            You are not currently enrolled in a course slot.
          </p>
        </div>
      )}

      {/* ==================== SLOT FOUND ==================== */}

      {!loadingSlot && slotId && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-800">
            Course information loaded successfully.
          </p>

          <p className="text-xs text-green-700 mt-1">
            Your Assignment section is ready.
          </p>
        </div>
      )}
    </PortalLayout>
  );
}
