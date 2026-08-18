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

const MODULE_LABELS = {
  dashboard: "Dashboard",
  students: "Students",
  attendance_view: "Attendance View",
  attendance_mark: "Attendance Mark",
  attendance_multi: "Attendance Multi",
  slots: "Slots",
  trainers: "Trainers",
  trainer_attendance: "Trainer Attendance",
  updation: "Updation",
};

const ROLE_LABELS = {
  super_admin: "Super Admin",
  sub_admin: "Sub Admin",
  trainer: "Trainer",
  student: "Student",
};

function Check({ value }) {
  return value ? (
    <span className="text-green-600">✓</span>
  ) : (
    <span className="text-slate-300">—</span>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/api/auth/me")
      .then(({ data }) => setProfile(data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Could not load profile."),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setPwSubmitting(true);
    try {
      await api.post("/api/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwError(err.response?.data?.detail || "Could not update password.");
    } finally {
      setPwSubmitting(false);
    }
  }

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <PortalLayout title="Admin Panel" navItems={NAV}>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Profile</h1>
      <p className="text-sm text-slate-500 mb-6">
        Your account and permissions.
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Loading profile...</p>}

      {!loading && profile && (
        <div className="max-w-2xl space-y-6">
          {/* Account */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Account
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-blue-600">Email / Login ID</dt>
                <dd className="text-slate-800">{profile.login_id}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-blue-600">Role</dt>
                <dd className="text-slate-800">
                  {ROLE_LABELS[profile.role] || profile.role}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-blue-600">Campus</dt>
                <dd className="text-slate-800">
                  {profile.campus_id
                    ? profile.campus_id
                    : isSuperAdmin
                      ? "All campuses (Super Admin)"
                      : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Permissions */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Permissions
            </h2>

            {isSuperAdmin ? (
              <p className="text-sm text-slate-600">
                Super Admin has full access to every module — no restrictions.
              </p>
            ) : profile.permissions.length === 0 ? (
              <p className="text-sm text-slate-400">
                No module permissions assigned yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                      <th className="py-2 font-medium">Module</th>
                      <th className="py-2 font-medium text-center">Read</th>
                      <th className="py-2 font-medium text-center">Write</th>
                      <th className="py-2 font-medium text-center">Update</th>
                      <th className="py-2 font-medium text-center">Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.permissions.map((p) => (
                      <tr key={p.module} className="border-t border-slate-100">
                        <td className="py-2.5 text-blue-600">
                          {MODULE_LABELS[p.module] || p.module}
                        </td>
                        <td className="py-2.5 text-center">
                          <Check value={p.can_read} />
                        </td>
                        <td className="py-2.5 text-center">
                          <Check value={p.can_write} />
                        </td>
                        <td className="py-2.5 text-center">
                          <Check value={p.can_update} />
                        </td>
                        <td className="py-2.5 text-center">
                          <Check value={p.can_export} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Change password */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Change password
            </h2>

            {pwError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-3">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2 mb-3">
                {pwSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Current password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
              </div>
              <button
                type="submit"
                disabled={pwSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
              >
                {pwSubmitting ? "Updating..." : "Update password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
