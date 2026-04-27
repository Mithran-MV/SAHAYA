'use client';
import { useNeeds } from '@/lib/useNeeds';
import { Activity, CheckCircle2, Clock, Languages } from 'lucide-react';

export default function HeroStrip() {
  const { stats, loading } = useNeeds();

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <Stat
        icon={<Activity className="w-4 h-4" />}
        label="Needs reported"
        value={loading ? '—' : stats.total}
        accent="text-emerald-400"
        sub={
          stats.byUrgency.critical
            ? `${stats.byUrgency.critical} critical`
            : 'across all areas'
        }
      />
      <Stat
        icon={<CheckCircle2 className="w-4 h-4" />}
        label="Resolved"
        value={loading ? '—' : stats.resolved}
        accent="text-emerald-400"
        sub={
          stats.total > 0
            ? `${Math.round((stats.resolved / stats.total) * 100)}% resolution rate`
            : '—'
        }
      />
      <Stat
        icon={<Clock className="w-4 h-4" />}
        label="Avg time-to-resolve"
        value={loading ? '—' : formatMs(stats.avgResolutionMs)}
        accent="text-amber-400"
        sub="from voice → fixed"
      />
      <Stat
        icon={<Languages className="w-4 h-4" />}
        label="Languages active"
        value={loading ? '—' : Object.keys(stats.byLanguage).filter((l) => l !== 'unknown').length}
        accent="text-blue-400"
        sub={
          Object.keys(stats.byLanguage)
            .filter((l) => l !== 'unknown')
            .map((l) => l.toUpperCase())
            .join(' · ') || '—'
        }
      />
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 hover:bg-slate-900/60 transition">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400">
        <span className={accent}>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={`mt-1.5 text-3xl font-display font-semibold ${accent}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function formatMs(ms: number): string {
  if (!ms || !isFinite(ms)) return '—';
  const min = ms / 60_000;
  if (min < 60) return `${Math.round(min)}m`;
  const h = min / 60;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}
