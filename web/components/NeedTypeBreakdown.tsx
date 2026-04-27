'use client';
import { useNeeds } from '@/lib/useNeeds';

const TYPE_ICONS: Record<string, string> = {
  food: '🍚',
  water: '💧',
  health: '🩺',
  shelter: '🏠',
  education: '📚',
  sanitation: '🧼',
  safety: '🛡️',
  infrastructure: '🛠️',
  other: '•',
};

const TYPE_LABELS: Record<string, string> = {
  food: 'Food',
  water: 'Water',
  health: 'Health',
  shelter: 'Shelter',
  education: 'Education',
  sanitation: 'Sanitation',
  safety: 'Safety',
  infrastructure: 'Infrastructure',
  other: 'Other',
};

export default function NeedTypeBreakdown() {
  const { stats, loading } = useNeeds();
  const types = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);
  const max = types.length > 0 ? Math.max(...types.map(([, n]) => n)) : 1;

  if (loading || types.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h2 className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-4">
        By need category
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {types.map(([type, count]) => (
          <div
            key={type}
            className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{TYPE_ICONS[type] ?? '•'}</span>
              <span className="text-xs text-slate-300 font-medium">
                {TYPE_LABELS[type] ?? type}
              </span>
              <span className="ml-auto text-sm font-display font-semibold text-emerald-300">
                {count}
              </span>
            </div>
            <div className="h-1 bg-slate-800 rounded overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
