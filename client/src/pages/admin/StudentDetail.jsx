import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PortalLayout from "../../components/PortalLayout";
import Badge from "../../components/Badge";
import EditStudentModal from "./EditStudentModal";
import EnrollModal from "./EnrollModal";
import PaymentsModal from "./PaymentsModal";
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
  { label: "Trainers", href: "/admin/trainers", icon: IconUser },
  { label: "Updation", href: "/admin/updation", icon: IconEdit },
  { label: "Profile", href: "/admin/profile", icon: IconUser },
];

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  const [error, setError] = useState("");
  const [enrollmentError, setEnrollmentError] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  async function fetchStudent() {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(`/api/students/${id}`);
      setStudent(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Student not found.");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to view this student.");
      } else {
        setError("Could not load student.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchEnrollments() {
    setLoadingEnrollments(true);
    setEnrollmentError("");

    try {
      const { data } = await api.get("/api/enrollments", {
        params: { student_id: id },
      });

      setEnrollments(data.items || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setEnrollmentError("You don't have permission to view enrollments.");
      } else {
        setEnrollmentError("Could not load enrollments.");
      }
    } finally {
      setLoadingEnrollments(false);
    }
  }

  useEffect(() => {
    fetchStudent();
    fetchEnrollments();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleEnrolled() {
    setShowEnroll(false);
    fetchEnrollments();
  }

  return (
    <PortalLayout title="Admin Panel" navItems={NAV}>
      <button
        onClick={() => navigate("/admin/students")}
        className="text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        ← Back to Students
      </button>

      {loading && <p className="text-slate-400 text-sm">Loading...</p>}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {student && (
        <>
          {/* Student Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {student.full_name}
              </h1>

              <div className="flex items-center gap-2 mt-1">
                <Badge value={student.status} />
                <Badge value={student.payment_status} />
              </div>
            </div>

            <button
              onClick={() => setShowEdit(true)}
              className="bg-titan-500 hover:bg-titan-600 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Edit
            </button>
          </div>

          {/* Student Information */}
          <div className="grid grid-cols-2 gap-6">
            <Section title="Personal">
              <Row label="Father name" value={student.father_name} />
              <Row label="CNIC" value={student.cnic} />
              <Row label="Father's CNIC" value={student.father_cnic} />
              <Row label="Gender" value={student.gender} />
              <Row label="Date of birth" value={student.dob} />
              <Row label="Address" value={student.address} />
            </Section>

            <Section title="Contact">
              <Row label="Phone" value={student.phone} />
              <Row label="Father's phone" value={student.father_phone} />
              <Row label="Email" value={student.email} />
            </Section>

            <Section title="Education">
              <Row
                label="Last qualification"
                value={student.last_qualification}
              />
              <Row label="Computer level" value={student.computer_level} />
              <Row
                label="Has laptop"
                value={student.has_laptop ? "Yes" : "No"}
              />
            </Section>

            <Section title="Course">
              <Row label="Course" value={student.course} />
              <Row label="Campus" value={student.campus} />
              <Row label="Batch" value={student.batch} />
            </Section>
          </div>

          {/* Enrollments */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Enrollments
                </h2>
                <p className="text-sm text-slate-500">
                  Courses this student is enrolled in.
                </p>
              </div>

              <button
                onClick={() => setShowEnroll(true)}
                className="bg-titan-500 hover:bg-titan-600 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                + Enroll in Slot
              </button>
            </div>

            {enrollmentError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
                {enrollmentError}
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {loadingEnrollments ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  Loading enrollments...
                </p>
              ) : enrollments.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  This student is not enrolled in any course yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">
                        Course
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Roll #
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Campus
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Trainer
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Payment
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td className="px-4 py-3 text-slate-800 font-medium">
                          {enrollment.course || "—"}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          #{enrollment.roll_number}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {enrollment.campus || "—"}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {enrollment.trainer || "—"}
                        </td>

                        <td className="px-4 py-3">
                          <Badge value={enrollment.status} />
                        </td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedEnrollment(enrollment)}
                            className="text-titan-600 hover:text-titan-700 font-medium"
                          >
                            Payments
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit Student */}
      {showEdit && student && (
        <EditStudentModal
          student={student}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            fetchStudent();
          }}
        />
      )}

      {/* Enroll Student */}
      {showEnroll && student && (
        <EnrollModal
          student={student}
          onClose={() => setShowEnroll(false)}
          onEnrolled={handleEnrolled}
        />
      )}

      {/* Payments */}
      {selectedEnrollment && (
        <PaymentsModal
          enrollment={selectedEnrollment}
          onClose={() => setSelectedEnrollment(null)}
        />
      )}
    </PortalLayout>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-800 mb-3">{title}</h2>

      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 text-right">{value || "—"}</span>
    </div>
  );
}
