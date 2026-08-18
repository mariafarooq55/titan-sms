import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import api from "../../api/client";

function todayPlus30() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export default function PaymentsModal({ enrollment, onClose }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [type, setType] = useState("monthly");
  const [month, setMonth] = useState("");
  const [dueDate, setDueDate] = useState(todayPlus30());
  const [amount, setAmount] = useState("");
  const [generating, setGenerating] = useState(false);

  async function fetchVouchers() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/vouchers", {
        params: { enrollment_id: enrollment.id },
      });
      setVouchers(data.items);
    } catch {
      setError("Could not load vouchers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!amount) {
      setError("Enter an amount.");
      return;
    }
    setError("");
    setGenerating(true);
    try {
      await api.post("/api/vouchers", {
        enrollment_id: enrollment.id,
        type,
        month: type === "monthly" ? month || undefined : undefined,
        due_date: dueDate,
        amount: Number(amount),
      });
      setAmount("");
      setMonth("");
      fetchVouchers();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate voucher.");
    } finally {
      setGenerating(false);
    }
  }

  async function togglePaid(voucher) {
    try {
      await api.patch(`/api/vouchers/${voucher.id}`, {
        status: voucher.status === "paid" ? "pending" : "paid",
      });
      fetchVouchers();
    } catch {
      setError("Could not update voucher.");
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Payments</h2>
            <p className="text-xs text-slate-400">
              {enrollment.course} — Roll #{enrollment.roll_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Invoice</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Month</th>
                  <th className="text-left px-4 py-3 font-medium">Due</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && vouchers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      No vouchers yet.
                    </td>
                  </tr>
                )}
                {!loading &&
                  vouchers.map((v) => (
                    <tr key={v.id}>
                      <td className="px-4 py-2 text-slate-800">
                        {v.invoice_number}
                      </td>
                      <td className="px-4 py-2 text-slate-600 capitalize">
                        {v.type}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {v.month || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{v.due_date}</td>
                      <td className="px-4 py-2 text-slate-600">
                        Rs {v.amount}
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => togglePaid(v)}>
                          <Badge value={v.status} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            Generate voucher
          </h3>
          <form onSubmit={handleGenerate} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
              >
                <option value="registration">Registration</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {type === "monthly" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Month (e.g. 2026-08)
                </label>
                <input
                  type="text"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  placeholder="2026-08"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Amount (Rs)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500 focus:border-titan-500"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                disabled={generating}
                className="w-full bg-titan-500 hover:bg-titan-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </form>
          <p className="text-xs text-slate-400 mt-2">
            Students pay outside the system (e.g. JazzCash) — this only records
            the voucher and whether it's paid. Click the status badge above to
            toggle Paid/Pending.
          </p>
        </div>
      </div>
    </div>
  );
}
