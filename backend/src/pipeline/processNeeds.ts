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
  geocoded: Array<GeoLocation | null>;
}

/**
 * Geocode each need's locationHint (best-effort), ensure the ASHA worker
 * record exists, persist the needs to the in-memory store, and return the
 * new IDs so the caller can dispatch volunteers downstream.
 */
export async function processExtraction(
  extraction: ExtractionResult,
  raw: RawReporter,
): Promise<ProcessOutcome> {
  const geocoded: Array<GeoLocation | null> = isMapsConfigured()
    ? await geocodeMany(extraction.needs.map((n) => n.locationHint ?? null))
    : extraction.needs.map(() => null);

  const geocodedCount = geocoded.filter((g) => g !== null).length;

  const reporter = await ensureAshaWorker(raw);
  const savedIds = await persistNeedsFromExtraction({
    reporter,
    extraction,
    geocoded,
  });

  logger.info(
    { savedIds: savedIds.length, geocodedCount },
    'extraction processed',
  );
  return { savedIds, geocodedCount, geocoded };
}
