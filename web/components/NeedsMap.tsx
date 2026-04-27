'use client';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useMemo } from 'react';
import { useNeeds } from '@/lib/useNeeds';
import type { Need } from '@/lib/types';

const COIMBATORE = { lat: 11.0168, lng: 76.9558 };

export default function NeedsMap() {
  const { needs, loading } = useNeeds();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const points = useMemo(
    () =>
      needs
        .filter((n) => n.location)
        .map((n) => ({
          lat: n.location!.lat,
          lng: n.location!.lng,
          weight: urgencyWeight(n.urgency),
        })),
    [needs],
  );

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 h-full grid place-items-center text-slate-400">
        <div className="text-center text-sm px-6">
          <div className="text-slate-300 mb-1">Map unavailable</div>
          <div className="text-xs text-slate-500">
            Set <code className="bg-slate-800 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{' '}
            in <code className="bg-slate-800 px-1 rounded">web/.env.local</code>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800/60 overflow-hidden h-full relative">
      <APIProvider apiKey={apiKey} libraries={['visualization']}>
        <Map
          defaultCenter={COIMBATORE}
          defaultZoom={9}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          className="w-full h-full"
        >
          <HeatmapLayer points={points} />
        </Map>
      </APIProvider>
      <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur rounded-lg px-3 py-2 border border-slate-800/60 text-xs">
        <div className="font-semibold text-emerald-300">Live needs heatmap</div>
        <div className="text-slate-400">
          {loading ? 'Loading…' : `${points.length} mapped of ${needs.length} reported`}
        </div>
      </div>
      <Legend />
    </div>
  );
}

function HeatmapLayer({
  points,
}: {
  points: { lat: number; lng: number; weight: number }[];
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g?.maps?.visualization) return;

    const heatmap = new g.maps.visualization.HeatmapLayer({
      data: points.map((p) => ({
        location: new g.maps.LatLng(p.lat, p.lng),
        weight: p.weight,
      })),
      radius: 35,
      opacity: 0.75,
      gradient: [
        'rgba(0, 0, 0, 0)',
        'rgba(16, 185, 129, 0.6)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.95)',
      ],
    });
    heatmap.setMap(map);
    return () => heatmap.setMap(null);
  }, [map, points]);
  return null;
}

function Legend() {
  return (
    <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur rounded-lg px-3 py-2 border border-slate-800/60 text-[11px] text-slate-300 flex items-center gap-3">
      <span>Urgency</span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />low
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-blue-500" />med
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-amber-500" />high
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-red-500" />critical
      </span>
    </div>
  );
}

function urgencyWeight(urgency: Need['urgency']): number {
  switch (urgency) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}
