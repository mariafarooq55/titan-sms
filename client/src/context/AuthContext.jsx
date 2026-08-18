import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(localStorage.getItem("titan_role"));

  const [fullName, setFullName] = useState(localStorage.getItem("titan_name"));

  /*
   * Student course slot.
   *
   * This is stored globally so pages such as:
   * Dashboard
   * Assignment
   * Quiz
   * Attendance
   *
   * do not have to depend on Dashboard loading first.
   */
  const [slotId, setSlotId] = useState(localStorage.getItem("slotId") || null);

  /*
   * Auth initialization state.
   */
  const [loading, setLoading] = useState(true);

  /*
   * Student enrollment/slot loading state.
   */
  const [loadingSlot, setLoadingSlot] = useState(false);

  /*
   * Load student's enrolled course slot.
   */
  async function loadStudentSlot() {
    const currentRole = localStorage.getItem("titan_role");

    /*
     * Only students need a course slot.
     */
    if (currentRole !== "student") {
      setSlotId(null);
      localStorage.removeItem("slotId");
      return null;
    }

    try {
      setLoadingSlot(true);

      const response = await api.get("/api/me/enrollments");

      console.log("AuthContext - Student enrollments:", response.data);

      const enrollments = response.data?.items || [];

      if (enrollments.length === 0) {
        setSlotId(null);
        localStorage.removeItem("slotId");

        return null;
      }

      /*
       * Prefer an active enrollment.
       */
      const enrollment =
        enrollments.find(
          (item) => item.status !== "dropout" && item.status !== "dropped_out",
        ) || enrollments[0];

      if (!enrollment?.slot_id) {
        console.warn("Enrollment exists but slot_id is missing:", enrollment);

        setSlotId(null);
        localStorage.removeItem("slotId");

        return null;
      }

      const newSlotId = String(enrollment.slot_id);

      /*
       * Save in React state.
       */
      setSlotId(newSlotId);

      /*
       * Save locally as backup.
       */
      localStorage.setItem("slotId", newSlotId);

      console.log("AuthContext - slotId loaded:", newSlotId);

      return newSlotId;
    } catch (error) {
      console.error("AuthContext - Failed to load student slot:", error);

      /*
       * If API temporarily fails but we already have
       * a saved slotId, keep using it.
       */
      const savedSlotId = localStorage.getItem("slotId");

      if (savedSlotId) {
        setSlotId(savedSlotId);

        return savedSlotId;
      }

      setSlotId(null);

      return null;
    } finally {
      setLoadingSlot(false);
    }
  }

  /*
   * Initialize authentication when application starts.
   */
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const savedRole = localStorage.getItem("titan_role");

      const savedToken = localStorage.getItem("titan_token");

      /*
       * No existing login session.
       */
      if (!savedToken || !savedRole) {
        if (mounted) {
          setLoading(false);
        }

        return;
      }

      /*
       * Student:
       *
       * IMPORTANT:
       * Load the enrollment before marking AuthContext
       * as fully ready.
       */
      if (savedRole === "student") {
        await loadStudentSlot();
      }

      if (mounted) {
        setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Login.
   */
  async function login(loginId, password) {
    const { data } = await api.post("/api/auth/login", {
      login_id: loginId,
      password,
    });

    localStorage.setItem("titan_token", data.access_token);

    localStorage.setItem("titan_role", data.role);

    localStorage.setItem("titan_name", data.full_name);

    setRole(data.role);
    setFullName(data.full_name);

    /*
     * Student:
     *
     * Immediately load the student's course slot.
     */
    if (data.role === "student") {
      await loadStudentSlot();
    } else {
      setSlotId(null);
      localStorage.removeItem("slotId");
    }

    return data.role;
  }

  /*
   * Logout.
   */
  function logout() {
    localStorage.removeItem("titan_token");
    localStorage.removeItem("titan_role");
    localStorage.removeItem("titan_name");
    localStorage.removeItem("slotId");

    setRole(null);
    setFullName(null);
    setSlotId(null);
  }

  const isAuthenticated = Boolean(localStorage.getItem("titan_token"));

  return (
    <AuthContext.Provider
      value={{
        role,
        fullName,

        /*
         * Student course slot.
         */
        slotId,

        /*
         * Auth initialization.
         */
        loading,

        /*
         * Student slot loading.
         */
        loadingSlot,

        /*
         * Allows pages to refresh the student's slot.
         */
        loadStudentSlot,

        isAuthenticated,

        login,

        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
