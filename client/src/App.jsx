import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import TrainerProfile from "./pages/trainer/Profile";
import StudentProfile from "./pages/student/Profile";

import Profile from "./pages/admin/Profile";
import TrainerLogin from "./pages/TrainerLogin";
import StudentLogin from "./pages/StudentLogin";
import Login from "./pages/Login";
import AdminSetup from "./pages/admin/Setup";
// ============================================================
// ADMIN
// ============================================================

import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminStudentDetail from "./pages/admin/StudentDetail";
import AdminSlots from "./pages/admin/Slots";
import AdminTrainers from "./pages/admin/Trainers";
import AdminAttendance from "./pages/admin/Attendance";
import AdminUpdation from "./pages/admin/Updation";

// ============================================================
// TRAINER
// ============================================================

import TrainerDashboard from "./pages/trainer/Dashboard";
import TrainerCourseDetail from "./pages/trainer/CourseDetail";
import TrainerCalendar from "./pages/trainer/Calendar";
import TrainerAttendance from "./pages/trainer/Attendance";

// ============================================================
// STUDENT
// ============================================================

import StudentDashboard from "./pages/student/Dashboard";
import StudentProgress from "./pages/student/Progress";
import StudentAttendance from "./pages/student/Attendance";
import StudentPayment from "./pages/student/Payment";
import StudentAssignment from "./pages/student/Assignment";
import StudentQuiz from "./pages/student/Quiz";

// ============================================================
// HOME REDIRECT
// ============================================================

function HomeRedirect() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === "trainer") {
    return <Navigate to="/trainer" replace />;
  }

  if (role === "student") {
    return <Navigate to="/student" replace />;
  }

  if (role === "super_admin" || role === "sub_admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
}

// ============================================================
// APP
// ============================================================

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ==================================================
              HOME
          ================================================== */}

          <Route path="/" element={<HomeRedirect />} />

          {/* ==================================================
              LOGIN
          ================================================== */}

          <Route path="/login" element={<Login />} />

          {/* ==================================================
              ADMIN
          ================================================== */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "sub_admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/setup"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "sub_admin"]}>
                <AdminSetup />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "sub_admin"]}>
                <AdminStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students/:id"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "sub_admin"]}>
                <AdminStudentDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/slots"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "sub_admin"]}>
                <AdminSlots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/profile"
            element={
              <ProtectedRoute allowedRoles={["trainer"]}>
                <TrainerProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/trainers"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "sub_admin"]}>
                <AdminTrainers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "sub_admin"]}>
                <AdminAttendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/updation"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "sub_admin"]}>
                <AdminUpdation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              TRAINER
          ================================================== */}

          <Route
            path="/trainer"
            element={
              <ProtectedRoute allowedRoles={["trainer"]}>
                <TrainerDashboard />
              </ProtectedRoute>
            }
          />

          {/* TRAINER COURSE DETAIL */}

          <Route
            path="/trainer/course/:slotId"
            element={
              <ProtectedRoute allowedRoles={["trainer"]}>
                <TrainerCourseDetail />
              </ProtectedRoute>
            }
          />

          {/* TRAINER CALENDAR */}

          <Route
            path="/trainer/calendar"
            element={
              <ProtectedRoute allowedRoles={["trainer"]}>
                <TrainerCalendar />
              </ProtectedRoute>
            }
          />

          {/* TRAINER ATTENDANCE */}

          <Route
            path="/trainer/attendance"
            element={
              <ProtectedRoute allowedRoles={["trainer"]}>
                <TrainerAttendance />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              STUDENT DASHBOARD
          ================================================== */}

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              STUDENT PROGRESS
          ================================================== */}

          <Route
            path="/student/progress"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentProgress />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              STUDENT ATTENDANCE
          ================================================== */}

          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAttendance />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              STUDENT PAYMENT
          ================================================== */}

          <Route
            path="/student/payment"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentPayment />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              STUDENT ASSIGNMENT
          ================================================== */}

          <Route
            path="/student/assignment"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAssignment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/assignment/:slotId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAssignment />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              STUDENT QUIZ
          ================================================== */}

          <Route
            path="/student/quiz"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentQuiz />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              TRAINER LOGIN
          ================================================== */}

          <Route path="/trainer/login" element={<TrainerLogin />} />

          {/* ==================================================
              STUDENT LOGIN
          ================================================== */}

          <Route path="/student/login" element={<StudentLogin />} />

          {/* ==================================================
              UNKNOWN URL
          ================================================== */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
