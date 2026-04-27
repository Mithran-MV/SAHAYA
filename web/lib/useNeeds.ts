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

/**
 * The dashboard prefers live polling against the backend (`NEXT_PUBLIC_API_URL`).
 * If that env var is not set OR the backend is unreachable, it falls back to a
 * bundled `demo.json` snapshot so the page is always demoable in static-only
 * deployments (e.g. GitHub Pages).
 *
 * The demo.json path respects Next.js `basePath` so it works both at `/`
 * (local dev) and `/SAHAYA/` (GH Pages).
 */
function demoJsonUrl(): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return `${basePath}/demo.json`;
}

interface DemoBundle {
  needs: Need[];
  stats?: NeedsStats;
}

async function fetchDemo(signal?: AbortSignal): Promise<DemoBundle> {
  const res = await fetch(demoJsonUrl(), { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`demo.json ${res.status}`);
  return (await res.json()) as DemoBundle;
}

export function useNeeds() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [serverStats, setServerStats] = useState<NeedsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'live' | 'demo' | null>(null);
  const aborted = useRef(false);

  useEffect(() => {
    aborted.current = false;
    const controller = new AbortController();

    const apiBase = getApiBase();

    const tryDemoFallback = async () => {
      try {
        const demo = await fetchDemo(controller.signal);
        if (aborted.current) return;
        setNeeds(demo.needs ?? []);
        setServerStats(demo.stats ?? null);
        setLoading(false);
        setSource('demo');
        setError(null);
      } catch (err) {
        if (!aborted.current) {
          const message = err instanceof Error ? err.message : String(err);
          setError(`Demo data unavailable: ${message}`);
          setLoading(false);
        }
      }
    };

    if (!apiBase) {
      tryDemoFallback();
      return () => {
        aborted.current = true;
        controller.abort();
      };
    }

    let firstLiveOk = false;
    const tickLive = async () => {
      try {
        const [n, s] = await Promise.all([
          fetchNeeds(controller.signal),
          fetchStats(controller.signal),
        ]);
        if (aborted.current) return;
        setNeeds(n.needs);
        setServerStats(s);
        setLoading(false);
        setSource('live');
        setError(null);
        firstLiveOk = true;
      } catch (err) {
        if (controller.signal.aborted) return;
        // Only fall back if we never got a live response. Once live, transient
        // errors don't blow away the dashboard.
        if (!firstLiveOk && !aborted.current) {
          await tryDemoFallback();
        }
      }
    };

    tickLive();
    const interval = setInterval(tickLive, POLL_INTERVAL_MS);

    return () => {
      aborted.current = true;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo<NeedsStats>(() => {
    if (serverStats) return serverStats;
    return computeStatsLocally(needs);
  }, [serverStats, needs]);

  return { needs, stats, loading, error, source };
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
