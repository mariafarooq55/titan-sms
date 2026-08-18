const COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  enrolled: "bg-blue-50 text-blue-700 border-blue-200",
  active: "bg-green-50 text-green-700 border-green-200",
  dropout: "bg-red-50 text-red-700 border-red-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  passed: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  not_generated: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function Badge({ value }) {
  const style = COLORS[value] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${style} capitalize`}
    >
      {value?.replace("_", " ")}
    </span>
  );
}
