import { useEffect, useState } from "react";
import api from "../../api/client";

function statusLabel(status) {
  const labels = {
    pending: "Pending",
    late: "Late",
    approved: "Approved",
    not_approved: "Not Approved",
  };

  return labels[status] || status;
}

function statusClass(status) {
  switch (status) {
    case "approved":
      return "bg-green-50 text-green-700 border-green-200";

    case "not_approved":
      return "bg-red-50 text-red-700 border-red-200";

    case "late":
      return "bg-orange-50 text-orange-700 border-orange-200";

    default:
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
}

export default function AssignmentsTab({ slotId }) {
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);

  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [selectedSubmission, setSelectedSubmission] = useState(null);

  function fetchAssignments() {
    if (!slotId) return;

    setLoading(true);
    setError("");

    api
      .get("/api/me/assignments", {
        params: { slot_id: slotId },
      })
      .then(({ data }) => {
        setAssignments(data.items || []);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Could not load assignments.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchAssignments();
  }, [slotId]);

  async function openSubmissions(assignment) {
    setSelectedAssignment(assignment);
    setSelectedSubmission(null);
    setLoadingSubmissions(true);
    setError("");

    try {
      const { data } = await api.get(
        `/api/me/assignments/${assignment.id}/submissions`,
      );

      setSubmissions(data.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load submissions.");
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  function closeSubmissions() {
    setSelectedAssignment(null);
    setSelectedSubmission(null);
    setSubmissions([]);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Assignments</h2>

          <p className="text-sm text-slate-500 mt-1">
            Create assignments and review student submissions.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-titan-500 hover:bg-titan-600 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + New Assignment
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
              <th className="text-left px-4 py-3 font-medium">Title</th>

              <th className="text-left px-4 py-3 font-medium">Topics</th>

              <th className="text-left px-4 py-3 font-medium">Due Date</th>

              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  Loading assignments...
                </td>
              </tr>
            )}

            {!loading && assignments.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No assignments yet.
                </td>
              </tr>
            )}

            {!loading &&
              assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-800">
                      {assignment.title}
                    </div>

                    {assignment.is_hackathon && (
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        Hackathon
                      </span>
                    )}

                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {assignment.instructions}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {assignment.topics?.length
                      ? assignment.topics.join(", ")
                      : "—"}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {assignment.due_date}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openSubmissions(assignment)}
                        className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md"
                      >
                        View Submissions
                      </button>

                      <button
                        onClick={() => setEditing(assignment)}
                        className="text-xs font-medium text-titan-600 hover:text-titan-700"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <AssignmentModal
          slotId={slotId}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            fetchAssignments();
          }}
        />
      )}

      {editing && (
        <AssignmentModal
          slotId={slotId}
          assignment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchAssignments();
          }}
        />
      )}

      {selectedAssignment && (
        <SubmissionsModal
          assignment={selectedAssignment}
          submissions={submissions}
          loading={loadingSubmissions}
          selectedSubmission={selectedSubmission}
          setSelectedSubmission={setSelectedSubmission}
          onClose={closeSubmissions}
          onUpdated={async () => {
            await openSubmissions(selectedAssignment);
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
}

function AssignmentModal({ slotId, assignment, onClose, onSaved }) {
  const isEdit = Boolean(assignment);

  const [title, setTitle] = useState(assignment?.title || "");

  const [instructions, setInstructions] = useState(
    assignment?.instructions || "",
  );

  const [links, setLinks] = useState(assignment?.links || []);

  const [linkInput, setLinkInput] = useState("");

  const [topics, setTopics] = useState(assignment?.topics || []);

  const [topicInput, setTopicInput] = useState("");

  const [dueDate, setDueDate] = useState(assignment?.due_date || "");

  const [isHackathon, setIsHackathon] = useState(
    assignment?.is_hackathon || false,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addLink() {
    const value = linkInput.trim();

    if (!value) return;

    setLinks((prev) => [...prev, value]);
    setLinkInput("");
  }

  function addTopic() {
    const value = topicInput.trim();

    if (!value) return;

    setTopics((prev) => [...prev, value]);
    setTopicInput("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim() || !instructions.trim() || !dueDate) {
      setError("Title, description, and due date are required.");
      return;
    }

    setError("");
    setSaving(true);

    const payload = {
      title: title.trim(),
      instructions: instructions.trim(),
      links,
      images: assignment?.images || [],
      topics,
      is_hackathon: isHackathon,
      due_date: dueDate,
    };

    try {
      if (isEdit) {
        await api.patch(`/api/me/assignments/${assignment.id}`, payload);
      } else {
        await api.post("/api/me/assignments", {
          slot_id: slotId,
          ...payload,
        });
      }

      onSaved();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save assignment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            {isEdit ? "Edit Assignment" : "Create New Assignment"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Title *
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Description *
            </label>

            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Write assignment instructions..."
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reference Links
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={addLink}
                className="px-3 py-2 rounded-md border border-slate-300 text-sm"
              >
                Add
              </button>
            </div>

            {links.length > 0 && (
              <div className="space-y-1 mt-2">
                {links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 bg-slate-50 rounded-md px-3 py-2 text-xs"
                  >
                    <span className="truncate">{link}</span>

                    <button
                      type="button"
                      onClick={() =>
                        setLinks((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Topics
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="React, API, MongoDB..."
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={addTopic}
                className="px-3 py-2 rounded-md border border-slate-300 text-sm"
              >
                Add
              </button>
            </div>

            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {topics.map((topic, index) => (
                  <span
                    key={index}
                    className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-1"
                  >
                    {topic}

                    <button
                      type="button"
                      onClick={() =>
                        setTopics((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="ml-1 text-slate-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Due Date *
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isHackathon}
              onChange={(e) => setIsHackathon(e.target.checked)}
            />
            Hackathon assignment
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-slate-600 px-4 py-2 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              {saving
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmissionsModal({
  assignment,
  submissions,
  loading,
  selectedSubmission,
  setSelectedSubmission,
  onClose,
  onUpdated,
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">Submissions</h2>

            <p className="text-xs text-slate-500 mt-1">{assignment.title}</p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <p className="text-sm text-slate-400 text-center py-8">
              Loading submissions...
            </p>
          )}

          {!loading && submissions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">
                No students have submitted this assignment yet.
              </p>
            </div>
          )}

          {!loading && submissions.length > 0 && (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {submission.student_name}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Submitted:{" "}
                        {submission.submitted_at
                          ? new Date(submission.submitted_at).toLocaleString()
                          : "—"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium border rounded-full px-3 py-1.5 ${statusClass(
                          submission.status,
                        )}`}
                      >
                        {statusLabel(submission.status)}
                      </span>

                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSubmission && (
          <ReviewSubmissionModal
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
            onUpdated={async () => {
              setSelectedSubmission(null);
              await onUpdated();
            }}
          />
        )}
      </div>
    </div>
  );
}

function ReviewSubmissionModal({ submission, onClose, onUpdated }) {
  const [status, setStatus] = useState(submission.status);

  const [feedback, setFeedback] = useState(submission.feedback || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveReview() {
    if (status !== "approved" && status !== "not_approved") {
      setError("Please select Approved or Not Approved.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.patch(`/api/me/submissions/${submission.id}`, {
        status,
        feedback: feedback.trim() || null,
      });

      await onUpdated();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update submission.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Review Submission</h2>

          <p className="text-xs text-slate-500 mt-1">
            {submission.student_name}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              Submitted Work
            </h3>

            {submission.links?.length > 0 ? (
              <div className="space-y-2">
                {submission.links.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm text-titan-600 hover:underline break-all bg-slate-50 border border-slate-100 rounded-md px-3 py-2"
                  >
                    {link}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No links submitted.</p>
            )}

            {submission.files?.length > 0 && (
              <div className="mt-3 space-y-2">
                {submission.files.map((file, index) => (
                  <a
                    key={index}
                    href={file}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm text-titan-600 hover:underline break-all"
                  >
                    File {index + 1}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Result
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus("approved")}
                className={`flex-1 px-4 py-2 rounded-md border text-sm font-medium ${
                  status === "approved"
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                ✓ Approved
              </button>

              <button
                type="button"
                onClick={() => setStatus("not_approved")}
                className={`flex-1 px-4 py-2 rounded-md border text-sm font-medium ${
                  status === "not_approved"
                    ? "bg-red-600 border-red-600 text-white"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                ✕ Not Approved
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Feedback
            </label>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Write feedback for the student..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-slate-600 px-4 py-2 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveReview}
              disabled={saving}
              className="bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              {saving ? "Saving..." : "Save Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
