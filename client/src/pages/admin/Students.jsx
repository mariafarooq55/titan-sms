import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../../components/PortalLayout";
import Badge from "../../components/Badge";
import AddStudentModal from "./AddStudentModal";
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
  { label: "Trainers", href: "/admin/trainers", icon: IconUsers },
  { label: "Setup", href: "/admin/setup", icon: IconEdit },
  { label: "Updation", href: "/admin/updation", icon: IconEdit },
  { label: "Profile", href: "/admin/profile", icon: IconUser },
];

const PAGE_SIZE = 20;

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/students", {
        params: { search: search || undefined, page, page_size: PAGE_SIZE },
      });
      setStudents(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("You don't have permission to view students.");
      } else {
        setError("Could not load students.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  function handleSearchChange(value) {
    setPage(1);
    setSearch(value);
  }

  function handleCreated() {
    setShowAddModal(false);
    setPage(1);
    fetchStudents();
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PortalLayout title="Admin Panel" navItems={NAV}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-titan-500 hover:bg-titan-600 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Student
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, CNIC, or phone..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full max-w-sm mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Father name</th>
              <th className="text-left px-4 py-3 font-medium">CNIC</th>
              <th className="text-left px-4 py-3 font-medium">Phone</th>
              <th className="text-left px-4 py-3 font-medium">Course</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  Loading...
                </td>
              </tr>
            )}
            {!loading && students.length === 0 && !error && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No students yet. Click "Add Student" to register one.
                </td>
              </tr>
            )}
            {!loading &&
              students.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/admin/students/${s.id}`)}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {s.full_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.father_name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.cnic}</td>
                  <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.course || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={s.payment_status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-md border border-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-md border border-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </PortalLayout>
  );
}
