import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PortalLayout from "../../components/PortalLayout";
import api from "../../api/client";

function formatStatus(status) {
  if (!status) return "Not Submitted";

  const labels = {
    pending: "Pending Review",
    late: "Submitted Late",
    approved: "Approved",
    not_approved: "Not Approved",
    not_submitted: "Not Submitted",
  };

  return labels[status] || status;
}

function statusClass(status) {
  switch (status) {
    case "approved":
      return "bg-green-50 text-green-700 border-green-200";

    case "not_approved":
      return "bg-red-50 text-red-700 border-red-200";

    case "pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "late":
      return "bg-orange-50 text-orange-700 border-orange-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export default function StudentAssignment() {
  const { slotId } = useParams();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [submissionLinks, setSubmissionLinks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  async function loadAssignments() {
    if (!slotId) {
      setError("No course slot was found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/me/assignments", {
        params: {
          slot_id: slotId,
        },
      });

      console.log("Student assignments:", response.data);

      setAssignments(response.data?.items || []);
    } catch (err) {
      console.error("Failed to load assignments:", err);

      setError(err.response?.data?.detail || "Could not load assignments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, [slotId]);

  function openAssignment(assignment) {
    setSelectedAssignment(assignment);
    setSubmissionLinks("");
    setSubmitMessage("");
  }

  function closeAssignment() {
    setSelectedAssignment(null);
    setSubmissionLinks("");
    setSubmitMessage("");
  }

  async function submitAssignment(e) {
    e.preventDefault();

    if (!selectedAssignment) return;

    const links = submissionLinks
      .split("\n")
      .map((link) => link.trim())
      .filter(Boolean);

    if (links.length === 0) {
      setSubmitMessage("Please enter at least one submission link.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMessage("");

      await api.post("/api/me/submissions", {
        assignment_id: selectedAssignment.id,
        files: [],
        links,
      });

      setSubmitMessage("Assignment submitted successfully.");

      await loadAssignments();

      setTimeout(() => {
        closeAssignment();
      }, 1000);
    } catch (err) {
      console.error("Assignment submission failed:", err);

      setSubmitMessage(
        err.response?.data?.detail || "Could not submit assignment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalLayout
      title="Student Portal"
      navItems={[
        {
          label: "Dashboard",
          href: "/student",
        },
        {
          label: "Progress",
          href: "/student/progress",
        },
        {
          label: "Attendance",
          href: "/student/attendance",
        },
        {
          label: "Payment",
          href: "/student/payment",
        },
        {
          label: "Assignment",
          href: slotId ? `/student/assignment/${slotId}` : "/student",
        },
        {
          label: "Quiz",
          href: "/student/quiz",
        },
      ]}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Assignments</h1>

        <p className="text-sm text-slate-500 mt-1">
          View your assignments, submit your work, and track trainer feedback.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-400">Loading assignments...</p>
        </div>
      )}

      {!loading && !error && assignments.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">📚</div>

          <h2 className="font-semibold text-slate-800">No assignments yet</h2>

          <p className="text-sm text-slate-500 mt-1">
            Your trainer has not added any assignments for this course yet.
          </p>
        </div>
      )}

      {!loading && assignments.length > 0 && (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {assignment.title}
                    </h2>

                    {assignment.is_hackathon && (
                      <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">
                        Hackathon
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mt-2">
                    {assignment.instructions}
                  </p>

                  {assignment.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {assignment.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
                    <span>
                      Due:{" "}
                      <strong className="text-slate-700">
                        {assignment.due_date}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-3">
                  <span
                    className={`text-xs font-medium border rounded-full px-3 py-1.5 ${statusClass(
                      assignment.my_submission_status,
                    )}`}
                  >
                    {formatStatus(assignment.my_submission_status)}
                  </span>

                  <button
                    onClick={() => openAssignment(assignment)}
                    className="bg-titan-500 hover:bg-titan-600 text-white text-sm font-medium px-4 py-2 rounded-md"
                  >
                    View Assignment
                  </button>
                </div>
              </div>

              {assignment.links?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Reference Links
                  </p>

                  <div className="space-y-1">
                    {assignment.links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-titan-600 hover:underline break-all"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedAssignment.title}
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Due: {selectedAssignment.due_date}
                </p>
              </div>

              <button
                onClick={closeAssignment}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">
                  Instructions
                </h3>

                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {selectedAssignment.instructions}
                </p>
              </div>

              {selectedAssignment.topics?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">
                    Topics
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {selectedAssignment.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedAssignment.links?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">
                    Reference Links
                  </h3>

                  <div className="space-y-2">
                    {selectedAssignment.links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-titan-600 hover:underline break-all"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">
                  Submit Your Assignment
                </h3>

                <p className="text-xs text-slate-500 mb-3">
                  Add your GitHub, Google Drive, Google Docs, or other work
                  link. Put each link on a new line.
                </p>

                <form onSubmit={submitAssignment}>
                  <textarea
                    value={submissionLinks}
                    onChange={(e) => setSubmissionLinks(e.target.value)}
                    rows={5}
                    placeholder={
                      "https://github.com/...\nhttps://drive.google.com/..."
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
                  />

                  {submitMessage && (
                    <div className="mt-3 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      {submitMessage}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={closeAssignment}
                      className="text-sm font-medium text-slate-600 px-4 py-2 rounded-md hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
                    >
                      {submitting ? "Submitting..." : "Submit Assignment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
