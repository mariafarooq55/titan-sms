import { useEffect, useState } from "react";
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

export default function TrainerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState([]);
  const [newLink, setNewLink] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  function loadProfile() {
    setLoading(true);
    api
      .get("/api/me/trainer/profile")
      .then(({ data }) => setProfile(data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Could not load profile."),
      )
      .finally(() => setLoading(false));
  }

  function openEdit() {
    setPhone(profile.phone || "");
    setBio(profile.bio || "");
    setPhotoUrl(profile.photo_url || "");
    setSocialLinks(profile.social_links || []);
    setNewLink("");
    setSaveError("");
    setEditing(true);
  }

  function addLink() {
    const trimmed = newLink.trim();

    if (!trimmed) return;

    setSocialLinks((links) => [...links, trimmed]);
    setNewLink("");
  }

  function removeLink(index) {
    setSocialLinks((links) => links.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaveError("");
    setSaving(true);

    try {
      const { data } = await api.patch("/api/me/trainer/profile", {
        phone,
        bio,
        photo_url: photoUrl,
        social_links: socialLinks,
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
    <PortalLayout title="Trainer Portal" navItems={NAV}>
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
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-xl font-semibold text-blue-700">
                  {initial}
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 mb-6 px-1">
            <h1 className="text-xl font-semibold text-slate-900">
              {profile.full_name}
            </h1>

            <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              Trainer
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Personal Information
              </h2>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">Email</dt>
                  <dd className="text-slate-800">{profile.email}</dd>
                </div>

                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">Employee ID</dt>
                  <dd className="text-slate-800">{profile.employee_id}</dd>
                </div>

                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">Hourly Rate</dt>
                  <dd className="text-slate-800">
                    {profile.hourly_rate ? `${profile.hourly_rate}/hr` : "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">Phone</dt>
                  <dd className="text-slate-800">
                    {profile.phone || "Not provided"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Bio + Social */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">Bio</h2>

              <p className="text-sm text-slate-600 italic mb-4">
                {profile.bio || "No bio added yet."}
              </p>

              <h2 className="text-sm font-semibold text-slate-900 mb-2">
                Social Links
              </h2>

              {profile.social_links?.length ? (
                <ul className="space-y-1">
                  {profile.social_links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No social links added yet.
                </p>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mt-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Security
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
                {pwSubmitting ? "Updating..." : "Update Password"}
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
              Update your profile information below.
            </p>

            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-3">
                {saveError}
              </div>
            )}

            <div className="space-y-4">
              {/* Photo URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Photo URL
                </label>

                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bio
                </label>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Social Links
                </label>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://linkedin.com/in/you"
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />

                  <button
                    type="button"
                    onClick={addLink}
                    className="text-sm text-blue-600 border border-blue-200 rounded-md px-3 hover:bg-blue-50"
                  >
                    + Add
                  </button>
                </div>

                {socialLinks.length > 0 && (
                  <ul className="space-y-1">
                    {socialLinks.map((link, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-sm bg-slate-50 rounded px-2 py-1"
                      >
                        <span className="truncate">{link}</span>

                        <button
                          type="button"
                          onClick={() => removeLink(i)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Modal buttons */}
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
