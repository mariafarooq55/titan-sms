import { useEffect, useState } from "react";
import PortalLayout from "../../components/PortalLayout";
import { useAuth } from "../../context/AuthContext";
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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getQuizStatus(quiz) {
  if (!quiz.expiry_date) {
    return {
      label: "Active",
      className: "bg-green-50 text-green-700 border-green-200",
    };
  }

  if (quiz.expiry_date < todayStr()) {
    return {
      label: "Expired",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    };
  }

  return {
    label: "Active",
    className: "bg-green-50 text-green-700 border-green-200",
  };
}

export default function StudentQuiz() {
  const { slotId, loadingSlot, loadStudentSlot } = useAuth();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  async function loadQuizzes() {
    try {
      setLoading(true);
      setError("");

      let currentSlotId = slotId;

      /*
       * If AuthContext has not loaded the student's slot yet,
       * ask it to load the enrollment.
       */
      if (!currentSlotId) {
        currentSlotId = await loadStudentSlot();
      }

      if (!currentSlotId) {
        setError(
          "No course slot was found for your account. Please contact the office.",
        );
        return;
      }

      const response = await api.get("/api/me/quizzes", {
        params: {
          slot_id: currentSlotId,
        },
      });

      console.log("Student quizzes:", response.data);

      setQuizzes(response.data?.items || []);
    } catch (err) {
      console.error("Failed to load student quizzes:", err);

      setError(
        err.response?.data?.detail ||
          "Could not load quizzes. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Wait until AuthContext finishes loading the student's
   * enrollment before requesting quizzes.
   */
  useEffect(() => {
    if (loadingSlot) {
      return;
    }

    loadQuizzes();
  }, [slotId, loadingSlot]);

  function openQuiz(quiz) {
    if (quiz.already_attempted) {
      return;
    }

    const status = getQuizStatus(quiz);

    if (status.label === "Expired") {
      return;
    }

    setSelectedQuiz(quiz);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setSubmitMessage("");
  }

  function closeQuiz() {
    if (submitting) {
      return;
    }

    setSelectedQuiz(null);
    setAnswers([]);
    setSubmitMessage("");
  }

  function selectAnswer(questionIndex, optionIndex) {
    setAnswers((previous) => {
      const updated = [...previous];
      updated[questionIndex] = optionIndex;
      return updated;
    });
  }

  async function submitQuiz() {
    if (!selectedQuiz) {
      return;
    }

    const unanswered = answers.some((answer) => answer === null);

    if (unanswered) {
      setSubmitMessage("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMessage("");

      const response = await api.post("/api/me/quiz-attempts", {
        quiz_id: selectedQuiz.id,
        answers,
      });

      console.log("Quiz attempt submitted:", response.data);

      setSubmitMessage(
        `Quiz submitted successfully. Your score is ${response.data.score}/${response.data.total}.`,
      );

      /*
       * Reload quizzes so this quiz immediately becomes
       * "Completed" / "Already Submitted".
       */
      await loadQuizzes();

      /*
       * Keep the result visible for a moment.
       */
      setTimeout(() => {
        setSelectedQuiz(null);
        setAnswers([]);
        setSubmitMessage("");
      }, 1800);
    } catch (err) {
      console.error("Quiz submission failed:", err);

      setSubmitMessage(
        err.response?.data?.detail ||
          "Could not submit the quiz. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalLayout title="Student Portal" navItems={NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Quizzes</h1>

        <p className="text-sm text-slate-500 mt-1">
          Complete quizzes assigned by your trainer and view your submission
          status.
        </p>
      </div>

      {loading || loadingSlot ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-400">Loading quizzes...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!error && quizzes.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">📝</div>

              <h2 className="font-semibold text-slate-800">No quizzes yet</h2>

              <p className="text-sm text-slate-500 mt-1">
                Your trainer has not added any quizzes for this course yet.
              </p>
            </div>
          )}

          {!error && quizzes.length > 0 && (
            <div className="space-y-4">
              {quizzes.map((quiz) => {
                const status = getQuizStatus(quiz);
                const completed = quiz.already_attempted;

                return (
                  <div
                    key={quiz.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-slate-900">
                            {quiz.title}
                          </h2>

                          {completed && (
                            <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">
                              Completed
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                          <span>
                            Questions:{" "}
                            <strong className="text-slate-700">
                              {quiz.questions?.length || 0}
                            </strong>
                          </span>

                          <span>
                            Expiry:{" "}
                            <strong className="text-slate-700">
                              {quiz.expiry_date || "No expiry"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3">
                        <span
                          className={`text-xs font-medium border rounded-full px-3 py-1.5 ${status.className}`}
                        >
                          {completed ? "Completed" : status.label}
                        </span>

                        <button
                          type="button"
                          disabled={completed || status.label === "Expired"}
                          onClick={() => openQuiz(quiz)}
                          className={`text-sm font-medium px-4 py-2 rounded-md ${
                            completed || status.label === "Expired"
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-titan-500 hover:bg-titan-600 text-white"
                          }`}
                        >
                          {completed
                            ? "Already Submitted"
                            : status.label === "Expired"
                              ? "Expired"
                              : "Start Quiz"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedQuiz.title}
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  {selectedQuiz.questions?.length || 0} questions
                  {selectedQuiz.expiry_date
                    ? ` • Expires ${selectedQuiz.expiry_date}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={closeQuiz}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-700 text-xl disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {selectedQuiz.questions?.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="border border-slate-200 rounded-lg p-5"
                >
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">
                    {questionIndex + 1}. {question.text}
                  </h3>

                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => {
                      const selected = answers[questionIndex] === optionIndex;

                      return (
                        <button
                          key={optionIndex}
                          type="button"
                          onClick={() =>
                            selectAnswer(questionIndex, optionIndex)
                          }
                          disabled={submitting}
                          className={`w-full text-left rounded-md border px-4 py-3 text-sm transition ${
                            selected
                              ? "border-titan-500 bg-titan-50 text-titan-700"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border mr-3 text-xs">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>

                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {submitMessage && (
                <div
                  className={`rounded-md px-4 py-3 text-sm border ${
                    submitMessage.startsWith("Quiz submitted")
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {submitMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeQuiz}
                  disabled={submitting}
                  className="text-sm font-medium text-slate-600 px-4 py-2 rounded-md hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={submitting}
                  className="bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-md"
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
