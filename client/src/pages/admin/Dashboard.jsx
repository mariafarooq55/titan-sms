import { useEffect, useState, useMemo } from "react";
import PortalLayout from "../../components/PortalLayout";
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

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/dashboard/summary")
      .then(({ data }) => setSummary(data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Could not load dashboard."),
      )
      .finally(() => setLoading(false));
  }, []);

  const boxes = summary
    ? [
        { label: "Total Students", value: summary.total_students },
        { label: "Enrolled Students", value: summary.enrolled_students },
        { label: "Courses", value: summary.courses },
        { label: "Cities", value: summary.cities },
        { label: "Campuses", value: summary.campuses },
        { label: "Trainers", value: summary.trainers },
        { label: "Active Slots", value: summary.active_slots },
        { label: "Registration Open", value: summary.registration_open_count },
      ]
    : [];

  return (
    <PortalLayout title="Admin Panel" navItems={NAV}>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <p className="text-xs text-slate-400">Loading...</p>
            </div>
          ))}
        {!loading &&
          boxes.map((b) => (
            <div
              key={b.label}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <p className="text-xs text-slate-500 tracking-wide uppercase font-medium">
                {b.label}
              </p>
              <p className="text-3xl font-semibold text-blue-600 mt-2">
                {b.value?.toLocaleString?.() ?? b.value}
              </p>
            </div>
          ))}
      </div>

      {!loading && summary && (
        <div className="grid grid-cols-1 gap-6">
          <BarChart
            title="Campus Analytics"
            subtitle="Student enrollment by campus location"
            data={summary.students_per_campus}
            itemNoun="campuses"
          />
          <BarChart
            title="Course Analytics"
            subtitle="Student enrollment distribution by course"
            data={summary.students_per_course}
            itemNoun="courses"
          />
        </div>
      )}
    </PortalLayout>
  );
}

const PAGE_SIZE = 10;

function niceMax(value) {
  if (value <= 0) return 10;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = Math.pow(10, exponent);
  const residual = value / magnitude;
  let niceResidual;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  else niceResidual = 10;
  return niceResidual * magnitude;
}

function BarChart({ title, subtitle, data, itemNoun = "items" }) {
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const copy = [...(data || [])];
    copy.sort((a, b) =>
      sortOrder === "desc" ? b.count - a.count : a.count - b.count,
    );
    return copy;
  }, [data, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  const max = niceMax(Math.max(1, ...sorted.map((d) => d.count)));
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((max / tickCount) * i),
  ).reverse();

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    setPage(1);
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const pageNumbers = useMemo(() => {
    const maxVisible = 6;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - 2);
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = end - maxVisible + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        <select
          value={sortOrder}
          onChange={handleSortChange}
          className="text-sm border border-slate-200 rounded-md px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="desc">High to Low</option>
          <option value="asc">Low to High</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">
          No enrollment data yet.
        </p>
      ) : (
        <>
          <div className="flex mt-6" style={{ height: 320 }}>
            <div className="flex flex-col justify-between text-xs text-slate-400 pr-3 text-right w-12 pb-6">
              {ticks.map((t) => (
                <span key={t}>{t.toLocaleString()}</span>
              ))}
            </div>

            <div className="relative flex-1">
              <div className="absolute inset-0 bottom-6 flex flex-col justify-between">
                {ticks.map((t, i) => (
                  <div key={i} className="border-t border-slate-100 w-full" />
                ))}
              </div>

              <div className="relative flex items-end justify-around h-full pb-6 gap-2">
                {pageItems.map((d) => {
                  const heightPct = (d.count / max) * 100;
                  return (
                    <div
                      key={d.label}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      <span className="text-xs font-medium text-slate-700 mb-1">
                        {d.count.toLocaleString()}
                      </span>
                      <div
                        className="w-full max-w-[48px] bg-blue-600 rounded-t-sm transition-all group-hover:bg-blue-700"
                        style={{ height: `${heightPct}%` }}
                        title={`${d.label}: ${d.count}`}
                      />
                      <span
                        className="text-[11px] text-slate-500 mt-2 w-full text-center truncate px-0.5"
                        title={d.label}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <span className="text-sm text-slate-400">
              Showing {pageStart + 1}-
              {Math.min(pageStart + PAGE_SIZE, sorted.length)} of{" "}
              {sorted.length} {itemNoun}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 disabled:opacity-40 hover:bg-slate-50"
              >
                &lt;
              </button>
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md border text-sm ${
                    p === currentPage
                      ? "border-blue-400 text-blue-600 font-semibold"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 disabled:opacity-40 hover:bg-slate-50"
              >
                &gt;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
