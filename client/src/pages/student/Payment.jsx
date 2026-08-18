import { useEffect, useState } from "react";
import PortalLayout from "../../components/PortalLayout";
import Badge from "../../components/Badge";
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

export default function StudentPayment() {
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [vouchers, setVouchers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/api/me/enrollments");
        setEnrollments(data.items);
        if (data.items.length > 0) setEnrollmentId(data.items[0].id);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Could not load your enrollments.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!enrollmentId) return;
    api
      .get("/api/me/vouchers", { params: { enrollment_id: enrollmentId } })
      .then(({ data }) => setVouchers(data.items))
      .catch(() => setError("Could not load vouchers."));
  }, [enrollmentId]);

  function copyInvoice(invoiceNumber) {
    navigator.clipboard.writeText(invoiceNumber);
    setCopiedId(invoiceNumber);
    setTimeout(() => setCopiedId(""), 1500);
  }

  return (
    <PortalLayout title="Student Portal" navItems={NAV}>
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Payment</h1>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {!loading && enrollments.length > 1 && (
        <div className="mb-4 max-w-sm">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Course
          </label>
          <select
            value={enrollmentId}
            onChange={(e) => setEnrollmentId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
          >
            {enrollments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.course}
              </option>
            ))}
          </select>
        </div>
      )}

      {!loading && enrollments.length === 0 && !error && (
        <p className="text-sm text-slate-400">
          You're not enrolled in any course yet.
        </p>
      )}

      {enrollments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Invoice</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Month</th>
                <th className="text-left px-4 py-3 font-medium">Due date</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No fee vouchers yet.
                  </td>
                </tr>
              )}
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-2 text-slate-800">
                    <button
                      onClick={() => copyInvoice(v.invoice_number)}
                      className="hover:underline"
                      title="Click to copy"
                    >
                      {v.invoice_number}
                    </button>
                    {copiedId === v.invoice_number && (
                      <span className="text-xs text-green-600 ml-2">
                        Copied!
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600 capitalize">
                    {v.type}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{v.month || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{v.due_date}</td>
                  <td className="px-4 py-2 text-slate-600">Rs {v.amount}</td>
                  <td className="px-4 py-2">
                    <Badge value={v.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-2">
          How to pay
        </h2>
        <ol className="text-sm text-slate-600 list-decimal list-inside space-y-1">
          <li>Copy the invoice number for the voucher you want to pay.</li>
          <li>
            Open JazzCash (or your usual payment method) and pay using that
            invoice number.
          </li>
          <li>
            Show your payment receipt to the office — they'll mark your voucher
            as Paid.
          </li>
        </ol>
      </div>
    </PortalLayout>
  );
}
