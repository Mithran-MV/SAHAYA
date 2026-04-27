'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from './firebase';
import type { Need } from './types';

export interface NeedsStats {
  total: number;
  open: number;
  resolved: number;
  avgResolutionMs: number;
  byType: Record<string, number>;
  byUrgency: Record<string, number>;
  byLanguage: Record<string, number>;
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!isFirebaseConfigured()) {
      // Fallback to demo dataset bundled with the static export.
      fetch('/demo.json')
        .then((r) => (r.ok ? r.json() : { needs: [] }))
        .then((data) => {
          if (!cancelled) {
            setNeeds(data.needs ?? []);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.warn('demo.json unavailable', err);
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    const db = getDb();
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'needs'),
      orderBy('createdAt', 'desc'),
      limit(200),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (cancelled) return;
        const items = snap.docs.map((d) => d.data() as Need);
        setNeeds(items);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore listen failed:', err);
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const stats = useMemo<NeedsStats>(() => computeStats(needs), [needs]);
  return { needs, stats, loading, error };
}

function computeStats(needs: Need[]): NeedsStats {
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
      const start = n.createdAt?.seconds;
      const end = n.resolvedAt?.seconds ?? n.verifiedAt?.seconds;
      if (start && end && end > start) {
        resolvedTimeSum += (end - start) * 1000;
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
