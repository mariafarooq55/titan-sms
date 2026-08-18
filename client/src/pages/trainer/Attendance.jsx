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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/*
 * Convert any backend error into safe text.
 *
 * FastAPI 422 errors can look like:
 * {
 *   type: "...",
 *   loc: [...],
 *   msg: "...",
 *   input: "..."
 * }
 *
 * React cannot render that object directly.
 */
function getErrorMessage(error, fallback = "Something went wrong.") {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item?.msg) {
          return item.msg;
        }

        return "Invalid request.";
      })
      .join(", ");
  }

  if (detail && typeof detail === "object") {
    if (detail.msg) {
      return detail.msg;
    }

    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }

  if (typeof error?.response?.data === "string") {
    return error.response.data;
  }

  return fallback;
}

function statusButtonClass(selected, status) {
  if (!selected) {
    return "border-slate-300 text-slate-600 hover:bg-slate-50";
  }

  if (status === "present") {
    return "bg-green-500 border-green-500 text-white";
  }

  if (status === "leave") {
    return "bg-yellow-500 border-yellow-500 text-white";
  }

  if (status === "absent") {
    return "bg-red-500 border-red-500 text-white";
  }

  return "border-slate-300 text-slate-600";
}

export default function TrainerAttendance() {
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState("");
  const [date, setDate] = useState(todayStr());

  const [students, setStudents] = useState([]);

  /*
   * Attendance marked during this page session.
   *
   * We intentionally do NOT call GET /api/me/attendance here
   * because that endpoint is the student attendance endpoint
   * and requires enrollment_id.
   */
  const [attendance, setAttendance] = useState({});

  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingRoll, setSavingRoll] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /*
   * ============================================================
   * LOAD TRAINER SLOTS
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadSlots() {
      try {
        setLoadingSlots(true);
        setError("");

        const { data } = await api.get("/api/me/slots");

        const items = Array.isArray(data?.items) ? data.items : [];

        if (!mounted) return;

        setSlots(items);

        if (items.length > 0) {
          setSlotId(String(items[0].id));
        } else {
          setSlotId("");
        }
      } catch (err) {
        console.error("Failed to load trainer slots:", err);

        if (!mounted) return;

        setError(
          getErrorMessage(err, "Could not load your assigned course slots."),
        );
      } finally {
        if (mounted) {
          setLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ============================================================
   * LOAD STUDENTS WHEN COURSE OR DATE CHANGES
   * ============================================================
   */

  useEffect(() => {
    if (!slotId) {
      setStudents([]);
      setAttendance({});
      return;
    }

    loadStudents();
  }, [slotId]);

  async function loadStudents() {
    try {
      setLoadingStudents(true);
      setError("");
      setMessage("");

      /*
       * Only request the trainer's students.
       *
       * IMPORTANT:
       * Do NOT request /api/me/attendance here.
       * That endpoint belongs to student accounts.
       */
      const response = await api.get(`/api/me/slots/${slotId}/students`);

      const studentItems = Array.isArray(response.data?.items)
        ? response.data.items
        : [];

      setStudents(studentItems);

      /*
       * Reset session display when changing course.
       */
      setAttendance({});
    } catch (err) {
      console.error("Failed to load students:", err);

      setStudents([]);
      setAttendance({});

      setError(
        getErrorMessage(err, "Could not load students for this course."),
      );
    } finally {
      setLoadingStudents(false);
    }
  }

  /*
   * ============================================================
   * MARK ATTENDANCE
   * ============================================================
   */

  async function markAttendance(rollNumber, status) {
    if (!slotId) {
      setError("Please select a course first.");
      return;
    }

    if (!rollNumber) {
      setError("Student roll number is missing.");
      return;
    }

    try {
      setSavingRoll(String(rollNumber));
      setError("");
      setMessage("");

      /*
       * This is the same endpoint already used successfully
       * by CourseDetail.jsx.
       */
      await api.post("/api/me/attendance/mark", null, {
        params: {
          slot_id: slotId,
          roll_number: rollNumber,
          date,
          status,
        },
      });

      setAttendance((prev) => ({
        ...prev,
        [rollNumber]: status,
      }));

      setMessage(`Attendance updated for roll number ${rollNumber}.`);
    } catch (err) {
      console.error("Failed to mark attendance:", err);

      setError(getErrorMessage(err, "Could not save attendance."));
    } finally {
      setSavingRoll("");
    }
  }

  /*
   * ============================================================
   * CHANGE COURSE
   * ============================================================
   */

  function handleSlotChange(event) {
    const newSlotId = event.target.value;

    setSlotId(newSlotId);
    setAttendance({});
    setMessage("");
    setError("");
  }

  /*
   * ============================================================
   * CHANGE DATE
   * ============================================================
   */

  function handleDateChange(event) {
    setDate(event.target.value);

    /*
     * Attendance shown on screen belongs to the selected date.
     * Clear the local session state when date changes.
     */
    setAttendance({});

    setMessage("");
    setError("");
  }

  const selectedSlot = slots.find((slot) => String(slot.id) === String(slotId));

  return (
    <PortalLayout title="Trainer Portal" navItems={NAV}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Trainer Attendance
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Mark and update attendance for students in your assigned courses.
        </p>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {message && (
        <div className="mb-5 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* ======================================================
          COURSE + DATE
      ====================================================== */}

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* COURSE */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Course
            </label>

            <select
              value={slotId}
              onChange={handleSlotChange}
              disabled={loadingSlots}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
            >
              {loadingSlots && <option value="">Loading courses...</option>}

              {!loadingSlots && slots.length === 0 && (
                <option value="">No courses found</option>
              )}

              {!loadingSlots &&
                slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.course || "Course"} — {slot.campus || "Campus"}
                    {slot.city ? `, ${slot.city}` : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* DATE */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Attendance Date
            </label>

            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
            />
          </div>
        </div>

        {/* SELECTED COURSE INFO */}

        {selectedSlot && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span>
                Course:{" "}
                <strong className="text-slate-700">
                  {selectedSlot.course || "—"}
                </strong>
              </span>

              <span>
                Schedule:{" "}
                <strong className="text-slate-700">
                  {selectedSlot.schedule || "—"}
                </strong>
              </span>

              <span>
                Students:{" "}
                <strong className="text-slate-700">{students.length}</strong>
              </span>

              <span>
                Date: <strong className="text-slate-700">{date}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loadingStudents && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-400">Loading students...</p>
        </div>
      )}

      {/* ======================================================
          NO COURSE
      ====================================================== */}

      {!loadingStudents && !slotId && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">📋</div>

          <h2 className="font-semibold text-slate-800">No course selected</h2>

          <p className="text-sm text-slate-500 mt-1">
            Select a course to manage attendance.
          </p>
        </div>
      )}

      {/* ======================================================
          NO STUDENTS
      ====================================================== */}

      {!loadingStudents && slotId && students.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">👥</div>

          <h2 className="font-semibold text-slate-800">No students enrolled</h2>

          <p className="text-sm text-slate-500 mt-1">
            There are no students enrolled in this course yet.
          </p>
        </div>
      )}

      {/* ======================================================
          STUDENT TABLE
      ====================================================== */}

      {!loadingStudents && students.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* TABLE HEADER */}

          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Student Attendance</h2>

            <p className="text-xs text-slate-500 mt-1">
              Attendance date: {date}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Roll #</th>

                  <th className="text-left px-5 py-3 font-medium">Student</th>

                  <th className="text-left px-5 py-3 font-medium">Status</th>

                  <th className="text-left px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const rollNumber = student.roll_number;

                  const currentStatus = attendance[rollNumber];

                  const saving = String(savingRoll) === String(rollNumber);

                  return (
                    <tr key={student.id}>
                      {/* ROLL NUMBER */}

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {rollNumber}
                      </td>

                      {/* STUDENT */}

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {student.student_name || "Student"}
                        </p>

                        {student.phone && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {student.phone}
                          </p>
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        {currentStatus ? (
                          <span
                            className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                              currentStatus === "present"
                                ? "bg-green-50 text-green-700"
                                : currentStatus === "leave"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : currentStatus === "absent"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-slate-50 text-slate-600"
                            }`}
                          >
                            {currentStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Not marked
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {["present", "leave", "absent"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              disabled={saving}
                              onClick={() => markAttendance(rollNumber, status)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize disabled:opacity-50 ${statusButtonClass(
                                currentStatus === status,
                                status,
                              )}`}
                            >
                              {saving ? "Saving..." : status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
