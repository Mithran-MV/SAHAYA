import { Router } from 'express';
import { listAllNeeds, listResolutions } from '../domain/repo';
import { store } from '../lib/store';
import type { Need } from '../domain/types';

export const apiRouter = Router();

/**
 * Public REST API for the dashboard.
 * Privacy: no PII fields are ever returned. Only `reporter.publicId`,
 * `reporter.displayName` (first name only), and de-identified `assignedTo` IDs.
 */

apiRouter.get('/needs', async (req, res, next) => {
  try {
    const limitRaw = Number.parseInt(String(req.query.limit ?? '200'), 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200;
    const needs = await listAllNeeds(limit);
    res.json({
      count: needs.length,
      needs: needs.map(stripInternal),
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/stats', async (_req, res, next) => {
  try {
    const needs = await listAllNeeds(500);
    const stats = computeStats(needs);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/volunteers', async (_req, res, next) => {
  try {
    const list = [...store.volunteers.values()]
      .filter((v) => v.active)
      .map((v) => ({
        publicId: v.publicId,
        name: v.name.split(/\s+/)[0], // first name only
        skills: v.skills,
        serviceArea: v.serviceArea
          ? {
              lat: v.serviceArea.lat,
              lng: v.serviceArea.lng,
              area: v.serviceArea.formattedAddress,
            }
          : null,
        serviceRadiusKm: v.serviceRadiusKm,
      }));
    res.json({ count: list.length, volunteers: list });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/resolutions', async (_req, res, next) => {
  try {
    const list = await listResolutions();
    res.json({
      count: list.length,
      resolutions: list.map((r) => ({
        id: r.id,
        needId: r.needId,
        volunteerPublicId: r.volunteerPublicId,
        photoUrl: r.photoUrl,
        verified: r.verified,
        verificationConfidence: r.verificationConfidence,
        verificationReason: r.verificationReason,
        resolvedAt: r.resolvedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/snapshot', (_req, res) => {
  res.json(store.snapshot());
});

function stripInternal(n: Need) {
  // Don't echo any internal-only fields (none today, but future-proof).
  return {
    id: n.id,
    reporter: n.reporter,
    rawText: n.rawText,
    rawQuote: n.rawQuote,
    needType: n.needType,
    urgency: n.urgency,
    locationHint: n.locationHint,
    location: n.location,
    beneficiaryCount: n.beneficiaryCount,
    language: n.language,
    status: n.status,
    assignedTo: n.assignedTo,
    reasoning: n.reasoning,
    verifiedPhotoUrl: n.verifiedPhotoUrl ?? null,
    latestPhotoUrl: n.latestPhotoUrl ?? null,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    resolvedAt: n.resolvedAt ?? null,
    verifiedAt: n.verifiedAt ?? null,
  };
}

interface NeedsStats {
  total: number;
  open: number;
  resolved: number;
  avgResolutionMs: number;
  byType: Record<string, number>;
  byUrgency: Record<string, number>;
  byLanguage: Record<string, number>;
}

function computeStats(needs: Need[]): NeedsStats {
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
