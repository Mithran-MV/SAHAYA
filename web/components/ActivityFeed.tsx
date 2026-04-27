'use client';
import { useNeeds } from '@/lib/useNeeds';
import NeedCard from './NeedCard';

export default function ActivityFeed() {
  const { needs, loading } = useNeeds();
  const recent = needs.slice(0, 30);

  return (
    <section className="rounded-xl border border-slate-800/60 bg-slate-900/40 h-full flex flex-col">
      <header className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
          Live activity
        </h2>
        <span className="text-[11px] text-slate-500">
          {loading ? 'syncing…' : `${recent.length} shown`}
        </span>
      </header>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-2">
        {!loading && recent.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-12 px-4">
            No needs yet. <br />
            Send a WhatsApp voice note to test the pipeline.
          </div>
        )}
        {recent.map((n) => (
          <NeedCard key={n.id} need={n} />
        ))}
      </div>
    </section>
  );
}
