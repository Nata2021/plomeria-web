
const colors: Record<string, string> = {
  Scheduled: 'bg-gray-100 text-gray-800',
  Dispatched: 'bg-indigo-100 text-indigo-800',
  OnRoute: 'bg-blue-100 text-blue-800',
  Arrived: 'bg-emerald-100 text-emerald-800',
  InService: 'bg-yellow-100 text-yellow-800',
  Paused: 'bg-orange-100 text-orange-800',
  Completed: 'bg-green-100 text-green-800',
  Invoiced: 'bg-purple-100 text-purple-800',
  Closed: 'bg-slate-200 text-slate-700',
};

export function StatusBadge({ value }: { value: string }) {
  const cls = colors[value] ?? 'bg-slate-100 text-slate-800';
  return <span className={`inline-block px-2 py-0.5 rounded text-sm ${cls}`}>{value}</span>;
}
