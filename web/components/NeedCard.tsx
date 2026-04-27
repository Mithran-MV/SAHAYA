import type { Need } from '@/lib/types';
import { CheckCircle2, MapPin, Users } from 'lucide-react';

const URGENCY_BG: Record<Need['urgency'], string> = {
  critical: 'bg-red-500/15 border-red-500/30 text-red-300',
  high: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  medium: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
  low: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
};

const STATUS_LABEL: Record<Need['status'], string> = {
  open: 'open',
  assigned: 'dispatched',
  in_progress: 'in progress',
  resolved: 'resolved',
  verified: '✓ verified',
  rejected: 'rejected',
};

const STATUS_TONE: Record<Need['status'], string> = {
  open: 'text-slate-400',
  assigned: 'text-blue-400',
  in_progress: 'text-amber-400',
  resolved: 'text-emerald-400',
  verified: 'text-emerald-300 font-semibold',
  rejected: 'text-red-400',
};

export default function NeedCard({ need }: { need: Need }) {
  const urgencyClass = URGENCY_BG[need.urgency] ?? URGENCY_BG.low;
  const ago = formatAgo(need.createdAt);
  const statusTone = STATUS_TONE[need.status] ?? '';

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 hover:bg-slate-900/40 transition">
      <header className="flex items-center gap-2 mb-1.5">
        <span
          className={`text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 border ${urgencyClass}`}
        >
          {need.urgency}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          {need.needType}
        </span>
        {need.language && need.language !== 'unknown' && (
          <span className="text-[10px] uppercase tracking-wider text-slate-600">
            {need.language}
          </span>
        )}
        <span className="text-[10px] uppercase tracking-wider text-slate-600 ml-auto">
          {ago}
        </span>
      </header>

      <p className="text-sm text-slate-200 line-clamp-2 leading-snug">
        {need.rawQuote}
      </p>

      <footer className="flex items-center gap-3 mt-2 text-xs text-slate-500">
        {need.locationHint && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[160px]">{need.locationHint}</span>
          </span>
        )}
        {need.beneficiaryCount && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {need.beneficiaryCount}
          </span>
        )}
        <span className={`ml-auto ${statusTone}`}>
          {STATUS_LABEL[need.status] ?? need.status}
        </span>
      </footer>

      {need.verifiedPhotoUrl && (
        <div className="mt-2 relative">
          <img
            src={need.verifiedPhotoUrl}
            alt="verification"
            className="rounded w-full h-24 object-cover"
            loading="lazy"
          />
          <span className="absolute top-1.5 left-1.5 bg-emerald-500/90 text-emerald-950 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            verified
          </span>
        </div>
      )}
    </article>
  );
}

function formatAgo(iso: string): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  const diffMs = Date.now() - t;
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
