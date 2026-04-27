import type { ApiNeedsResponse, NeedsStats } from './types';

export function getApiBase(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return null;
  return url.replace(/\/+$/, '');
}

export async function fetchNeeds(signal?: AbortSignal): Promise<ApiNeedsResponse> {
  const base = getApiBase();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL not configured');
  const res = await fetch(`${base}/api/needs?limit=200`, {
    signal,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`needs ${res.status}`);
  return (await res.json()) as ApiNeedsResponse;
}

export async function fetchStats(signal?: AbortSignal): Promise<NeedsStats> {
  const base = getApiBase();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL not configured');
  const res = await fetch(`${base}/api/stats`, {
    signal,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return (await res.json()) as NeedsStats;
}
