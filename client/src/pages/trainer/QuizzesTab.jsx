import { useEffect, useState } from "react";
import api from "../../api/client";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function QuizzesTab({ slotId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [viewingResults, setViewingResults] = useState(null);

  async function fetchQuizzes() {
    if (!slotId) {
      setError("Course slot was not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/api/me/quizzes", {
        params: {
          slot_id: slotId,
        },
      });

      setQuizzes(data?.items || []);
    } catch (err) {
      console.error("Failed to load quizzes:", err);

      setError(err.response?.data?.detail || "Could not load quizzes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuizzes();
  }, [slotId]);

  function statusFor(quiz) {
    if (!quiz.expiry_date) {
      return "Active";
    }

    return quiz.expiry_date < todayStr() ? "Expired" : "Active";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Quizzes</h2>

          <p className="text-sm text-slate-500 mt-1">
            Create quizzes and view student attempts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="bg-titan-500 hover:bg-titan-600 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + New Quiz
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
              <th className="text-left px-4 py-3 font-medium">Quiz</th>

              <th className="text-left px-4 py-3 font-medium">Questions</th>

              <th className="text-left px-4 py-3 font-medium">Expiry</th>

              <th className="text-left px-4 py-3 font-medium">Status</th>

              <th className="text-left px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  Loading quizzes...
                </td>
              </tr>
            )}

            {!loading && quizzes.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No quizzes yet. Create your first quiz.
                </td>
              </tr>
            )}

            {!loading &&
              quizzes.map((quiz) => {
                const status = statusFor(quiz);

                return (
                  <tr key={quiz.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {quiz.title}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {quiz.questions?.length || 0} question
                      {quiz.questions?.length !== 1 ? "s" : ""}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {quiz.expiry_date || "No expiry"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          status === "Active"
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setViewingResults(quiz)}
                        className="text-sm font-medium text-titan-600 hover:text-titan-700"
                      >
                        View Attempts
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateQuizModal
          slotId={slotId}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            fetchQuizzes();
          }}
        />
      )}

      {viewingResults && (
        <ResultsModal
          quiz={viewingResults}
          onClose={() => setViewingResults(null)}
        />
      )}
    </div>
  );
}

function emptyQuestion() {
  return {
    text: "",
    options: ["", ""],
    correct_index: 0,
  };
}

function CreateQuizModal({ slotId, onClose, onSaved }) {
  const [title, setTitle] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateQuestion(qIdx, field, value) {
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === qIdx
          ? {
              ...question,
              [field]: value,
            }
          : question,
      ),
    );
  }

  function updateOption(qIdx, oIdx, value) {
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === qIdx
          ? {
              ...question,
              options: question.options.map((option, optionIndex) =>
                optionIndex === oIdx ? value : option,
              ),
            }
          : question,
      ),
    );
  }

  function addOption(qIdx) {
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === qIdx
          ? {
              ...question,
              options: [...question.options, ""],
            }
          : question,
      ),
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(qIdx) {
    setQuestions((prev) => prev.filter((_, index) => index !== qIdx));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Quiz title is required.");
      return;
    }

    if (!questions.length) {
      setError("Add at least one question.");
      return;
    }

    for (const question of questions) {
      if (!question.text.trim()) {
        setError("Every question needs text.");
        return;
      }

      if (question.options.length < 2) {
        setError("Every question needs at least two options.");
        return;
      }

      if (question.options.some((option) => !option.trim())) {
        setError("Every option must be filled in.");
        return;
      }

      if (
        question.correct_index < 0 ||
        question.correct_index >= question.options.length
      ) {
        setError("Select a correct answer for every question.");
        return;
      }
    }

    try {
      setSaving(true);
      setError("");

      await api.post("/api/me/quizzes", {
        slot_id: slotId,
        title: title.trim(),
        expiry_date: expiryDate || null,
        questions: questions.map((question) => ({
          text: question.text.trim(),
          options: question.options.map((option) => option.trim()),
          correct_index: Number(question.correct_index),
        })),
      });

      onSaved();
    } catch (err) {
      console.error("Quiz creation failed:", err);

      setError(err.response?.data?.detail || "Could not create quiz.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Create Quiz</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Quiz title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HTML & CSS Quiz"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Expiry date
              </label>

              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
              />
            </div>
          </div>

          {questions.map((question, qIdx) => (
            <div key={qIdx} className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  Question {qIdx + 1}
                </h3>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                value={question.text}
                onChange={(e) => updateQuestion(qIdx, "text", e.target.value)}
                placeholder="Question text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
              />

              <div className="space-y-2">
                {question.options.map((option, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={question.correct_index === oIdx}
                      onChange={() =>
                        updateQuestion(qIdx, "correct_index", oIdx)
                      }
                      className="text-titan-600 focus:ring-titan-500"
                    />

                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                      placeholder={`Option ${oIdx + 1}`}
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addOption(qIdx)}
                className="text-xs font-medium text-titan-600 mt-3 hover:text-titan-700"
              >
                + Add option
              </button>

              <p className="text-xs text-slate-400 mt-1">
                Select the radio button next to the correct answer.
              </p>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="text-sm font-medium text-titan-600 hover:text-titan-700"
          >
            + Add another question
          </button>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="text-sm font-medium text-slate-600 px-4 py-2 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              {saving ? "Creating..." : "Create Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResultsModal({ quiz, onClose }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttempts() {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get(`/api/me/quizzes/${quiz.id}/attempts`);

      setAttempts(data?.items || []);
    } catch (err) {
      console.error("Failed to load quiz attempts:", err);

      setError(err.response?.data?.detail || "Could not load quiz attempts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttempts();
  }, [quiz.id]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">{quiz.title}</h2>

            <p className="text-xs text-slate-500 mt-1">Student quiz attempts</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">Loading attempts...</p>
            </div>
          )}

          {!loading && !error && attempts.length === 0 && (
            <div className="py-8 text-center">
              <div className="text-3xl mb-2">📝</div>

              <p className="text-sm font-medium text-slate-700">
                No attempts yet
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Student attempts will appear here after submission.
              </p>
            </div>
          )}

          {!loading && !error && attempts.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                      Student
                    </th>

                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                      Score
                    </th>

                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                      Submitted
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {attempts.map((attempt) => {
                    const percentage =
                      attempt.total > 0
                        ? Math.round((attempt.score / attempt.total) * 100)
                        : 0;

                    return (
                      <tr key={attempt.id}>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {attempt.student_name}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">
                              {attempt.score}/{attempt.total}
                            </span>

                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                percentage >= 50
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {percentage}%
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-500">
                          {attempt.submitted_at
                            ? new Date(attempt.submitted_at).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-titan-500 hover:bg-titan-600 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
