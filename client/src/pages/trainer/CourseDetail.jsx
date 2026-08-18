import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PortalLayout from "../../components/PortalLayout";
import Badge from "../../components/Badge";
import AssignmentsTab from "./AssignmentsTab";
import QuizzesTab from "./QuizzesTab";
import api from "../../api/client";
import { IconGrid, IconCalendar } from "../../components/icons";

const NAV = [
  { label: "Dashboard", href: "/trainer", icon: IconGrid },
  { label: "Calendar", href: "/trainer/calendar", icon: IconCalendar },
];

const TABS = [
  "Students",
  "Attendance",
  "Assignments",
  "Quizzes",
  "Course Progress",
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CourseDetail() {
  const { slotId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("Students");
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStudents() {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get(`/api/me/slots/${slotId}/students`);

        if (!mounted) return;

        setStudents(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        console.error("Failed to load course students:", err);

        if (!mounted) return;

        const detail = err.response?.data?.detail;

        setError(
          typeof detail === "string" ? detail : "Could not load students.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      mounted = false;
    };
  }, [slotId]);

  return (
    <PortalLayout title="Trainer Portal" navItems={NAV}>
      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        type="button"
        onClick={() => navigate("/trainer")}
        className="text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        ← Back to Dashboard
      </button>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {/* =====================================================
          TABS
      ===================================================== */}

      <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-titan-500 text-titan-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* =====================================================
          STUDENTS
      ===================================================== */}

      {tab === "Students" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Roll #</th>

                <th className="text-left px-4 py-3 font-medium">Name</th>

                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && students.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No students enrolled in this slot yet.
                  </td>
                </tr>
              )}

              {!loading &&
                students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {s.roll_number}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {s.student_name}
                    </td>

                    <td className="px-4 py-3">
                      <Badge value={s.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================
          ATTENDANCE
      ===================================================== */}

      {tab === "Attendance" && (
        <AttendanceTab slotId={slotId} students={students} />
      )}

      {/* =====================================================
          ASSIGNMENTS
      ===================================================== */}

      {tab === "Assignments" && <AssignmentsTab slotId={slotId} />}

      {/* =====================================================
          QUIZZES
      ===================================================== */}

      {tab === "Quizzes" && <QuizzesTab slotId={slotId} />}

      {/* =====================================================
          COURSE PROGRESS
      ===================================================== */}

      {tab === "Course Progress" && (
        <CourseProgressTab slotId={slotId} students={students} />
      )}
    </PortalLayout>
  );
}

/* ============================================================
   ATTENDANCE TAB
============================================================ */

function AttendanceTab({ slotId, students }) {
  const [date, setDate] = useState(todayStr());
  const [savingRoll, setSavingRoll] = useState("");
  const [savedRolls, setSavedRolls] = useState({});
  const [error, setError] = useState("");

  async function mark(rollNumber, status) {
    setSavingRoll(rollNumber);
    setError("");

    try {
      await api.post("/api/me/attendance/mark", null, {
        params: {
          slot_id: slotId,
          roll_number: rollNumber,
          date,
          status,
        },
      });

      setSavedRolls((prev) => ({
        ...prev,
        [rollNumber]: status,
      }));
    } catch (err) {
      console.error("Failed to mark attendance:", err);

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string" ? detail : "Could not mark attendance.",
      );
    } finally {
      setSavingRoll("");
    }
  }

  return (
    <div>
      {/* DATE */}

      <div className="mb-4 max-w-xs">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Date
        </label>

        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSavedRolls({});
          }}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
        />
      </div>

      {/* ERROR */}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {/* TABLE */}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Roll #</th>

              <th className="text-left px-4 py-3 font-medium">Name</th>

              <th className="text-left px-4 py-3 font-medium">Mark</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {students.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No students enrolled in this slot yet.
                </td>
              </tr>
            )}

            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {s.roll_number}
                </td>

                <td className="px-4 py-3 text-slate-600">{s.student_name}</td>

                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {["present", "leave", "absent"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => mark(s.roll_number, st)}
                        disabled={savingRoll === s.roll_number}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize disabled:opacity-50 ${
                          savedRolls[s.roll_number] === st
                            ? "bg-titan-500 border-titan-500 text-white"
                            : "border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   COURSE PROGRESS TAB
============================================================ */

function CourseProgressTab({ slotId, students }) {
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * We first try to load progress from the backend.
   *
   * If your backend already has this endpoint, the data
   * will automatically be used.
   *
   * If it does not exist yet, we safely show the student
   * list instead of breaking the page.
   */
  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      try {
        setLoading(true);
        setError("");

        /*
         * Expected future/backend endpoint:
         *
         * GET /api/me/slots/{slotId}/progress
         *
         * This is intentionally isolated here so the rest
         * of CourseDetail remains unchanged.
         */
        const { data } = await api.get(`/api/me/slots/${slotId}/progress`);

        if (!mounted) return;

        const items = Array.isArray(data?.items) ? data.items : [];

        const progressMap = {};

        items.forEach((item) => {
          const key = item.student_id || item.roll_number || item.id;

          if (key !== undefined) {
            progressMap[String(key)] = item;
          }
        });

        setProgress(progressMap);
      } catch (err) {
        console.warn("Course progress endpoint is not available yet:", err);

        /*
         * Do not show a fatal error.
         *
         * The student list remains visible and the page
         * stays usable.
         */
        if (mounted) {
          setProgress({});
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      mounted = false;
    };
  }, [slotId]);

  /*
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   */

  if (!students.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <div className="text-4xl mb-3">📊</div>

        <h2 className="font-semibold text-slate-800">No students enrolled</h2>

        <p className="text-sm text-slate-500 mt-1">
          Course progress will appear here once students are enrolled.
        </p>
      </div>
    );
  }

  /*
   * ==========================================================
   * CALCULATE OVERALL DISPLAY
   * ==========================================================
   */

  const progressValues = students.map((student) => {
    const item =
      progress[String(student.id)] || progress[String(student.roll_number)];

    const value = Number(item?.progress_percentage ?? item?.percentage ?? 0);

    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  });

  const overallProgress =
    progressValues.length > 0
      ? Math.round(
          progressValues.reduce((sum, value) => sum + value, 0) /
            progressValues.length,
        )
      : 0;

  /*
   * ==========================================================
   * SUMMARY CARDS
   * ==========================================================
   */

  return (
    <div className="space-y-5">
      {/* HEADER */}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Course Progress
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Track the overall progress of students enrolled in this course.
        </p>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STUDENTS */}

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium uppercase text-slate-400">
            Total Students
          </p>

          <p className="text-2xl font-semibold text-slate-900 mt-2">
            {students.length}
          </p>
        </div>

        {/* OVERALL */}

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium uppercase text-slate-400">
            Overall Progress
          </p>

          <p className="text-2xl font-semibold text-slate-900 mt-2">
            {overallProgress}%
          </p>
        </div>

        {/* ASSIGNMENTS */}

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium uppercase text-slate-400">
            Assignments
          </p>

          <p className="text-sm font-medium text-slate-700 mt-3">
            Track through Assignments
          </p>

          <p className="text-xs text-slate-400 mt-1">Completion data</p>
        </div>

        {/* QUIZZES */}

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium uppercase text-slate-400">
            Quizzes
          </p>

          <p className="text-sm font-medium text-slate-700 mt-3">
            Track through Quizzes
          </p>

          <p className="text-xs text-slate-400 mt-1">Attempts and results</p>
        </div>
      </div>

      {/* OVERALL PROGRESS BAR */}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-slate-900">
              Overall Course Progress
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Average progress of all enrolled students.
            </p>
          </div>

          <span className="text-sm font-semibold text-titan-600">
            {overallProgress}%
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-titan-500 rounded-full transition-all duration-500"
            style={{
              width: `${overallProgress}%`,
            }}
          />
        </div>
      </div>

      {/* STUDENT PROGRESS */}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Student Progress</h3>

          <p className="text-xs text-slate-500 mt-1">
            Individual course progress.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Loading progress...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Roll #</th>

                  <th className="text-left px-5 py-3 font-medium">Student</th>

                  <th className="text-left px-5 py-3 font-medium">Progress</th>

                  <th className="text-left px-5 py-3 font-medium">
                    Percentage
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const item =
                    progress[String(student.id)] ||
                    progress[String(student.roll_number)];

                  const percentage = Number(
                    item?.progress_percentage ?? item?.percentage ?? 0,
                  );

                  const safePercentage = Number.isFinite(percentage)
                    ? Math.max(0, Math.min(100, percentage))
                    : 0;

                  return (
                    <tr key={student.id}>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {student.roll_number}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {student.student_name}
                      </td>

                      <td className="px-5 py-4 min-w-[220px]">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-titan-500 rounded-full transition-all"
                            style={{
                              width: `${safePercentage}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {safePercentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
