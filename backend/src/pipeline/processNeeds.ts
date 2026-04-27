import { isFirebaseConfigured } from '../lib/firebase';
import { isMapsConfigured } from '../lib/maps';
import { logger } from '../lib/logger';
import { ensureAshaWorker, persistNeedsFromExtraction } from '../domain/repo';
import { geocodeMany } from './geocode';
import type {
  ExtractionResult,
  GeoLocation,
  RawReporter,
} from '../domain/types';

export interface ProcessOutcome {
  savedIds: string[];
  geocodedCount: number;
  persisted: boolean;
  geocoded: Array<GeoLocation | null>;
}

/**
 * Orchestrate everything that should happen after Gemini returns an extraction:
 *
 *   1. Geocode each need's locationHint in parallel (best-effort).
 *   2. Ensure the ASHA worker record exists.
 *   3. Persist needs to Firestore in one batch.
 *
 * Each step gracefully degrades:
 *   - no Maps key  -> location stays null, persist still happens
 *   - no Firestore -> nothing is persisted but we still return the geocoded array
 *                     so the caller can compose a useful preview message
 */
export async function processExtraction(
  extraction: ExtractionResult,
  raw: RawReporter,
): Promise<ProcessOutcome> {
  const geocoded: Array<GeoLocation | null> = isMapsConfigured()
    ? await geocodeMany(extraction.needs.map((n) => n.locationHint ?? null))
    : extraction.needs.map(() => null);

  const geocodedCount = geocoded.filter((g) => g !== null).length;

  if (!isFirebaseConfigured()) {
    logger.warn('Firestore not configured; skipping persist (preview mode)');
    return { savedIds: [], geocodedCount, persisted: false, geocoded };
  }

  const reporter = await ensureAshaWorker(raw);
  const savedIds = await persistNeedsFromExtraction({
    reporter,
    extraction,
    geocoded,
  });

  return { savedIds, geocodedCount, persisted: true, geocoded };
}
