import type {
  AshaWorker,
  Need,
  Resolution,
  Volunteer,
} from '../domain/types';
import { logger } from './logger';

/**
 * In-memory data store for SAHAYA.
 *
 * Why in-memory: this build deliberately avoids Firebase / external databases.
 * For a hackathon demo, the lifecycle is:
 *   1. On Cloud Run cold start, seed the 47 demo needs (idempotent).
 *   2. Real WhatsApp inbound writes accumulate during the instance's lifetime.
 *   3. When the instance scales to zero (~10 min idle), state resets and
 *      the next request re-seeds. Production would swap this for Postgres
 *      or Cloud Storage-backed JSON snapshotting.
 *
 * Single-process — Cloud Run with min-instances=1 is recommended for live demos
 * so that volunteer state and recent reports persist for the duration.
 */
class InMemoryStore {
  needs = new Map<string, Need>();
  volunteers = new Map<string, Volunteer>();
  ashaWorkers = new Map<string, AshaWorker>();
  resolutions = new Map<string, Resolution>();

  private seededAt: string | null = null;

  isSeeded(): boolean {
    return this.seededAt !== null;
  }

  markSeeded(): void {
    this.seededAt = new Date().toISOString();
    logger.info(
      {
        needs: this.needs.size,
        volunteers: this.volunteers.size,
        ashaWorkers: this.ashaWorkers.size,
        resolutions: this.resolutions.size,
        at: this.seededAt,
      },
      'in-memory store seeded',
    );
  }

  reset(): void {
    this.needs.clear();
    this.volunteers.clear();
    this.ashaWorkers.clear();
    this.resolutions.clear();
    this.seededAt = null;
  }

  snapshot() {
    return {
      seededAt: this.seededAt,
      counts: {
        needs: this.needs.size,
        volunteers: this.volunteers.size,
        ashaWorkers: this.ashaWorkers.size,
        resolutions: this.resolutions.size,
      },
    };
  }
}

export const store = new InMemoryStore();
