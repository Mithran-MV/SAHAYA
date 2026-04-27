import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger';
import { store } from '../lib/store';
import { haversineKm } from '../lib/geo';
import type {
  ExtractionResult,
  GeoLocation,
  Need,
  NeedReporter,
  NeedType,
  RawReporter,
  Resolution,
  Volunteer,
} from './types';

function normalizePhoneId(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return digits || `unknown_${randomUUID().slice(0, 8)}`;
}

function firstName(full: string | null): string | null {
  if (!full) return null;
  const trimmed = full.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0];
}

const nowIso = () => new Date().toISOString();

/* ------------- ASHA workers ------------- */

export async function ensureAshaWorker(raw: RawReporter): Promise<NeedReporter> {
  const id = normalizePhoneId(raw.phone);
  const existing = store.ashaWorkers.get(id);
  if (existing) {
    existing.lastSeenAt = nowIso();
    return {
      publicId: existing.publicId,
      displayName: firstName(existing.name ?? raw.name),
    };
  }

  const publicId = randomUUID();
  const now = nowIso();
  store.ashaWorkers.set(id, {
    id,
    phone: raw.phone,
    name: raw.name,
    waId: raw.waId,
    publicId,
    createdAt: now,
    lastSeenAt: now,
    reportedNeedsCount: 0,
  });
  return { publicId, displayName: firstName(raw.name) };
}

/* ------------- Needs ------------- */

export interface PersistNeedsInput {
  reporter: NeedReporter;
  extraction: ExtractionResult;
  geocoded: Array<GeoLocation | null>;
}

export async function persistNeedsFromExtraction(
  input: PersistNeedsInput,
): Promise<string[]> {
  const ids: string[] = [];
  const now = nowIso();

  input.extraction.needs.forEach((n, i) => {
    const id = randomUUID();
    const need: Need = {
      id,
      reporter: input.reporter,
      rawText: input.extraction.transcription,
      rawQuote: n.rawQuote,
      needType: n.needType,
      urgency: n.urgency,
      locationHint: n.locationHint ?? null,
      location: input.geocoded[i] ?? null,
      beneficiaryCount: n.beneficiaryCount ?? null,
      language: input.extraction.language,
      status: 'open',
      assignedTo: null,
      reasoning: n.reasoning ?? null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    };
    store.needs.set(id, need);
    ids.push(id);
  });

  logger.info(
    { count: ids.length, reporter: input.reporter.publicId },
    'persisted needs',
  );
  return ids;
}

export async function listOpenNeeds(limit = 100): Promise<Need[]> {
  return [...store.needs.values()]
    .filter((n) => n.status === 'open')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function listAllNeeds(limit = 200): Promise<Need[]> {
  return [...store.needs.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getNeed(id: string): Promise<Need | null> {
  return store.needs.get(id) ?? null;
}

export async function assignNeedToVolunteer(
  needId: string,
  volunteerPublicId: string,
): Promise<void> {
  const need = store.needs.get(needId);
  if (!need) return;
  need.status = 'assigned';
  need.assignedTo = volunteerPublicId;
  need.updatedAt = nowIso();
}

export async function claimNeed(
  needId: string,
  volunteerPublicId: string,
): Promise<boolean> {
  const need = store.needs.get(needId);
  if (!need) return false;
  if (
    need.status !== 'assigned' &&
    need.status !== 'open' &&
    need.status !== 'in_progress'
  ) {
    return false;
  }
  if (
    need.assignedTo &&
    need.assignedTo !== volunteerPublicId &&
    need.status !== 'open'
  ) {
    return false;
  }
  need.status = 'in_progress';
  need.assignedTo = volunteerPublicId;
  need.updatedAt = nowIso();
  return true;
}

export async function releaseNeed(
  needId: string,
  volunteerPublicId: string,
): Promise<boolean> {
  const need = store.needs.get(needId);
  if (!need) return false;
  if (need.assignedTo !== volunteerPublicId) return false;
  need.status = 'open';
  need.assignedTo = null;
  need.updatedAt = nowIso();
  return true;
}

/* ------------- Volunteers ------------- */

export interface EnsureVolunteerInput {
  raw: RawReporter;
  name: string;
  skills?: NeedType[];
  serviceArea?: GeoLocation | null;
  serviceRadiusKm?: number;
  active?: boolean;
}

export async function ensureVolunteer(
  input: EnsureVolunteerInput,
): Promise<{ id: string; publicId: string }> {
  const id = normalizePhoneId(input.raw.phone);
  const existing = store.volunteers.get(id);
  if (existing) {
    existing.name = input.name || existing.name;
    return { id, publicId: existing.publicId };
  }
  const publicId = randomUUID();
  store.volunteers.set(id, {
    id,
    phone: input.raw.phone,
    name: input.name,
    skills: input.skills ?? [],
    serviceArea: input.serviceArea ?? null,
    serviceRadiusKm: input.serviceRadiusKm ?? 10,
    active: input.active ?? false,
    publicId,
    createdAt: nowIso(),
  });
  return { id, publicId };
}

export async function updateVolunteer(
  phone: string,
  patch: Partial<
    Pick<
      Volunteer,
      'skills' | 'serviceArea' | 'serviceRadiusKm' | 'active' | 'name'
    >
  >,
): Promise<void> {
  const id = normalizePhoneId(phone);
  const v = store.volunteers.get(id);
  if (!v) return;
  Object.assign(v, patch);
}

export async function getVolunteerByPhone(
  phone: string,
): Promise<Volunteer | null> {
  return store.volunteers.get(normalizePhoneId(phone)) ?? null;
}

export async function listActiveVolunteers(): Promise<Volunteer[]> {
  return [...store.volunteers.values()].filter((v) => v.active);
}

export async function findNearestVolunteer(
  need: Need,
): Promise<Volunteer | null> {
  if (!need.location) return null;
  let best: { volunteer: Volunteer; dist: number } | null = null;
  for (const v of store.volunteers.values()) {
    if (!v.active) continue;
    if (!v.skills.includes(need.needType)) continue;
    if (!v.serviceArea) continue;
    const dist = haversineKm(need.location, v.serviceArea);
    if (dist > v.serviceRadiusKm) continue;
    if (!best || dist < best.dist) best = { volunteer: v, dist };
  }
  return best?.volunteer ?? null;
}

/* ------------- Resolutions ------------- */

export async function findLatestActiveNeedForVolunteer(
  volunteerPublicId: string,
): Promise<Need | null> {
  return (
    [...store.needs.values()]
      .filter(
        (n) =>
          n.assignedTo === volunteerPublicId &&
          (n.status === 'in_progress' || n.status === 'assigned'),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

export interface SaveResolutionInput {
  needId: string;
  volunteerPublicId: string;
  /** Backend-proxied URL to expose to clients (e.g. /media/<id>). */
  photoUrl: string;
  /** Original Twilio media URL — kept private so the proxy can refetch with auth. */
  twilioMediaUrl?: string | null;
  twilioMediaContentType?: string | null;
  verification: {
    verified: boolean;
    confidence: number;
    reason: string;
    observations?: string | null;
  };
}

export async function saveResolution(
  input: SaveResolutionInput,
): Promise<string> {
  const id = randomUUID();
  const now = nowIso();
  const resolution: Resolution = {
    id,
    needId: input.needId,
    volunteerPublicId: input.volunteerPublicId,
    photoUrl: input.photoUrl,
    twilioMediaUrl: input.twilioMediaUrl ?? null,
    twilioMediaContentType: input.twilioMediaContentType ?? null,
    verified: input.verification.verified,
    verificationConfidence: input.verification.confidence,
    verificationReason: input.verification.reason,
    observations: input.verification.observations ?? null,
    resolvedAt: now,
  };
  store.resolutions.set(id, resolution);

  const need = store.needs.get(input.needId);
  if (need) {
    if (input.verification.verified) {
      need.status = 'verified';
      need.verifiedPhotoUrl = input.photoUrl;
      need.verifiedAt = now;
      need.resolvedAt = now;
      need.latestPhotoUrl = input.photoUrl;
      need.updatedAt = now;
    } else {
      need.latestPhotoUrl = input.photoUrl;
      need.updatedAt = now;
    }
  }

  logger.info(
    {
      resolutionId: id,
      needId: input.needId,
      verified: input.verification.verified,
    },
    'resolution saved',
  );
  return id;
}

export async function getResolution(id: string): Promise<Resolution | null> {
  return store.resolutions.get(id) ?? null;
}

export async function listResolutions(): Promise<Resolution[]> {
  return [...store.resolutions.values()].sort((a, b) =>
    b.resolvedAt.localeCompare(a.resolvedAt),
  );
}
