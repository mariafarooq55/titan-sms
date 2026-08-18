import { useEffect, useState } from "react";
import PortalLayout from "../../components/PortalLayout";
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

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [lastQualification, setLastQualification] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  function loadAll() {
    setLoading(true);
    Promise.all([api.get("/api/me/student"), api.get("/api/me/enrollments")])
      .then(([profileRes, enrollRes]) => {
        setProfile(profileRes.data);
        setEnrollments(enrollRes.data.items || []);
      })
      .catch((err) =>
        setError(err.response?.data?.detail || "Could not load profile."),
      )
      .finally(() => setLoading(false));
  }

  function openEdit() {
    setPhone(profile.phone || "");
    setEmail(profile.email || "");
    setAddress(profile.address || "");
    setGender(profile.gender || "");
    setDob(profile.dob || "");
    setLastQualification(profile.last_qualification || "");
    setSaveError("");
    setEditing(true);
  }

  async function handleSave() {
    setSaveError("");
    setSaving(true);
    try {
      const { data } = await api.patch("/api/me/student", {
        phone,
        email,
        address,
        gender,
        dob: dob || null,
        last_qualification: lastQualification,
      });
      setProfile(data);
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.detail || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

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

  const initial = profile?.full_name?.[0]?.toUpperCase() || "?";

  return (
    <PortalLayout title="Student Portal" navItems={NAV}>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Loading profile...</p>}

      {!loading && profile && (
        <div className="max-w-4xl">
          {/* Cover + avatar */}
          <div className="relative bg-blue-600 rounded-2xl h-32">
            <button
              onClick={openEdit}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 text-sm font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5"
            >
              ✎ Edit Profile
            </button>

            <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full bg-white p-1">
              <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-xl font-semibold text-blue-700">
                {initial}
              </div>
            </div>
          </div>

          <div className="mt-12 mb-6 px-1">
            <h1 className="text-xl font-semibold text-slate-900">
              {profile.full_name}
            </h1>
            <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              Student
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Contact Info
              </h2>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">Email</dt>
                  <dd className="text-slate-800">
                    {profile.email || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">Phone</dt>
                  <dd className="text-slate-800">{profile.phone}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">Address</dt>
                  <dd className="text-slate-800">
                    {profile.address || "Not provided"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Personal Information */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Personal Information
              </h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">Gender</dt>
                  <dd className="text-slate-800">
                    {profile.gender || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">
                    Date of Birth
                  </dt>
                  <dd className="text-slate-800">
                    {profile.dob || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">
                    Last Qualification
                  </dt>
                  <dd className="text-slate-800">
                    {profile.last_qualification || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">CNIC</dt>
                  <dd className="text-slate-800">{profile.cnic}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Enrolled Courses
              </h2>
              <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">
                {enrollments.length}
              </span>
            </div>
            {enrollments.length === 0 ? (
              <p className="text-sm text-slate-400">No courses enrolled.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {enrollments.map((e) => (
                  <li key={e.id} className="py-2 text-sm">
                    <p className="text-slate-800 font-medium">{e.course}</p>
                    <p className="text-slate-400 text-xs">
                      {e.campus} · Roll #{e.roll_number} · {e.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mt-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Change Password
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

            <form
              onSubmit={handleChangePassword}
              className="space-y-4 max-w-sm"
            >
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

      {/* Edit Profile modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Edit Profile
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Update your contact and personal information.
            </p>

            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-3">
                {saveError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gender
                  </label>
                  <input
                    type="text"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Qualification
                </label>
                <input
                  type="text"
                  value={lastQualification}
                  onChange={(e) => setLastQualification(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-sm text-slate-600 px-4 py-2 rounded-md hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-md"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
