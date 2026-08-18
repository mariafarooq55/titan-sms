import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, role, loading, loadingSlot } = useAuth();

  /*
   * Wait for AuthContext initialization.
   *
   * For students, also wait until their course slot
   * has been loaded.
   *
   * This prevents the Assignment page from rendering
   * before slotId is available.
   */
  if (loading || (role === "student" && loadingSlot)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-titan-500" />

          <p className="text-sm text-slate-500">Loading your portal...</p>
        </div>
      </div>
    );
  }

  /*
   * Not logged in.
   */
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /*
   * Wrong role.
   */
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
