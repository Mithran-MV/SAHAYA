'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchNeeds, fetchStats, getApiBase } from './api';
import type { Need, NeedsStats } from './types';

const POLL_INTERVAL_MS = 5_000;

const EMPTY_STATS: NeedsStats = {
  total: 0,
  open: 0,
  resolved: 0,
  avgResolutionMs: 0,
  byType: {},
  byUrgency: {},
  byLanguage: {},
};

export function useNeeds() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [serverStats, setServerStats] = useState<NeedsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const aborted = useRef(false);

  useEffect(() => {
    aborted.current = false;
    const controller = new AbortController();

    const apiBase = getApiBase();
    if (!apiBase) {
      setLoading(false);
      setError(
        'NEXT_PUBLIC_API_URL is not configured. The dashboard polls the backend for live data.',
      );
      return () => {
        aborted.current = true;
      };
    }

    const tick = async () => {
      try {
        const [n, s] = await Promise.all([
          fetchNeeds(controller.signal),
          fetchStats(controller.signal),
        ]);
        if (aborted.current) return;
        setNeeds(n.needs);
        setServerStats(s);
        setLoading(false);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        if (message === 'AbortError') return;
        if (!aborted.current) {
          setError(message);
          setLoading(false);
        }
      }
    };

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      aborted.current = true;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  // Prefer server-computed stats (matches the data we render); fall back to local compute
  // only if the server didn't return them yet (initial render).
  const stats = useMemo<NeedsStats>(() => {
    if (serverStats) return serverStats;
    return computeStatsLocally(needs);
  }, [serverStats, needs]);

  return { needs, stats, loading, error };
}

function computeStatsLocally(needs: Need[]): NeedsStats {
  if (needs.length === 0) return EMPTY_STATS;

  const byType: Record<string, number> = {};
  const byUrgency: Record<string, number> = {};
  const byLanguage: Record<string, number> = {};
  let resolved = 0;
  let resolvedTimeSum = 0;
  let resolvedTimeCount = 0;

  for (const n of needs) {
    byType[n.needType] = (byType[n.needType] ?? 0) + 1;
    byUrgency[n.urgency] = (byUrgency[n.urgency] ?? 0) + 1;
    byLanguage[n.language] = (byLanguage[n.language] ?? 0) + 1;

    if (n.status === 'verified' || n.status === 'resolved') {
      resolved++;
      const start = Date.parse(n.createdAt);
      const endIso = n.resolvedAt ?? n.verifiedAt;
      const end = endIso ? Date.parse(endIso) : NaN;
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
        resolvedTimeSum += end - start;
        resolvedTimeCount++;
      }
    }
  }

  return {
    total: needs.length,
    open: needs.filter((n) => n.status === 'open').length,
    resolved,
    avgResolutionMs:
      resolvedTimeCount > 0 ? resolvedTimeSum / resolvedTimeCount : 0,
    byType,
    byUrgency,
    byLanguage,
  };
}
