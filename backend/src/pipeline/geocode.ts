import { geocodeAddress } from '../lib/maps';
import { logger } from '../lib/logger';
import type { GeoLocation } from '../domain/types';

const DEFAULT_REGION_CONTEXT = 'Coimbatore district, Tamil Nadu, India';

/**
 * Take a free-form location hint as spoken by an ASHA worker
 * ("Ward 4 in Kallur", "anganwadi 3") and resolve it to lat/lng.
 *
 * We append a region context so that ambiguous village names
 * resolve to the correct district.
 */
export async function geocodeLocationHint(
  hint: string | null | undefined,
  regionContext: string = DEFAULT_REGION_CONTEXT,
): Promise<GeoLocation | null> {
  if (!hint || hint.trim().length === 0) return null;
  const augmented = `${hint.trim()}, ${regionContext}`;
  const result = await geocodeAddress(augmented);
  if (result) {
    logger.info(
      { hint, lat: result.lat, lng: result.lng, address: result.formattedAddress },
      'geocoded location hint',
    );
  } else {
    logger.warn({ hint }, 'geocode returned no usable result');
  }
  return result;
}

export async function geocodeMany(
  hints: Array<string | null | undefined>,
): Promise<Array<GeoLocation | null>> {
  return Promise.all(
    hints.map((h) => geocodeLocationHint(h).catch(() => null)),
  );
}
