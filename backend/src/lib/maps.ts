import { Client } from '@googlemaps/google-maps-services-js';
import { config } from './config';
import { logger } from './logger';
import type { GeoLocation } from '../domain/types';

let _client: Client | null = null;
function getClient(): Client {
  if (!_client) _client = new Client({});
  return _client;
}

export function isMapsConfigured(): boolean {
  return Boolean(config.maps.apiKey);
}

export async function geocodeAddress(address: string): Promise<GeoLocation | null> {
  if (!config.maps.apiKey) {
    logger.warn('GOOGLE_MAPS_API_KEY not set; geocode skipped');
    return null;
  }
  const trimmed = address.trim();
  if (trimmed.length === 0) return null;

  try {
    const res = await getClient().geocode({
      params: {
        address: trimmed,
        components: { country: 'IN' },
        key: config.maps.apiKey,
      },
      timeout: 5000,
    });
    const top = res.data.results[0];
    if (!top) {
      logger.info({ address: trimmed }, 'geocode: no results');
      return null;
    }
    return {
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
      formattedAddress: top.formatted_address,
    };
  } catch (err) {
    logger.error({ err, address: trimmed.slice(0, 80) }, 'geocode failed');
    return null;
  }
}
