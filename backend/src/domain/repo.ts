import { randomUUID } from 'node:crypto';
import { getDb, Timestamp, FieldValue } from '../lib/firebase';
import { logger } from '../lib/logger';
import { haversineKm } from '../lib/geo';
import type {
  ExtractionResult,
  GeoLocation,
  Need,
  NeedReporter,
  NeedType,
  RawReporter,
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

/* ----- ASHA workers ----- */

export async function ensureAshaWorker(raw: RawReporter): Promise<NeedReporter> {
  const db = getDb();
  const docId = normalizePhoneId(raw.phone);
  const ref = db.collection('asha_workers').doc(docId);
  const snap = await ref.get();

  if (snap.exists) {
    const data = snap.data() as { publicId?: string; name?: string | null };
    await ref.update({
      lastSeenAt: Timestamp.now(),
      reportedNeedsCount: FieldValue.increment(0),
    });
    return {
      publicId: data.publicId ?? docId,
      displayName: firstName(data.name ?? raw.name),
    };
  }

  const publicId = randomUUID();
  await ref.set({
    id: docId,
    phone: raw.phone,
    name: raw.name,
    waId: raw.waId,
    publicId,
    createdAt: Timestamp.now(),
    lastSeenAt: Timestamp.now(),
    reportedNeedsCount: 0,
  });
  return { publicId, displayName: firstName(raw.name) };
}

/* ----- Needs ----- */

export interface PersistNeedsInput {
  reporter: NeedReporter;
  extraction: ExtractionResult;
  geocoded: Array<GeoLocation | null>;
}

export async function persistNeedsFromExtraction(
  input: PersistNeedsInput,
): Promise<string[]> {
  const db = getDb();
  const now = Timestamp.now();
  const batch = db.batch();
  const ids: string[] = [];

  for (let i = 0; i < input.extraction.needs.length; i++) {
    const n = input.extraction.needs[i];
    const loc = input.geocoded[i] ?? null;
    const ref = db.collection('needs').doc();
    batch.set(ref, {
      id: ref.id,
      reporter: input.reporter,
      rawText: input.extraction.transcription,
      rawQuote: n.rawQuote,
      needType: n.needType,
      urgency: n.urgency,
      locationHint: n.locationHint ?? null,
      location: loc,
      beneficiaryCount: n.beneficiaryCount ?? null,
      language: input.extraction.language,
      status: 'open' as const,
      assignedTo: null,
      reasoning: n.reasoning ?? null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    });
    ids.push(ref.id);
  }

  await batch.commit();
  logger.info(
    { count: ids.length, reporter: input.reporter.publicId },
    'persisted needs',
  );
  return ids;
}

export async function listOpenNeeds(limit = 100): Promise<Need[]> {
  const db = getDb();
  const snap = await db
    .collection('needs')
    .where('status', '==', 'open')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as Need);
}

export async function getNeed(id: string): Promise<Need | null> {
  const db = getDb();
  const snap = await db.collection('needs').doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as Need;
}

export async function assignNeedToVolunteer(
  needId: string,
  volunteerPublicId: string,
): Promise<void> {
  const db = getDb();
  await db.collection('needs').doc(needId).update({
    status: 'assigned',
    assignedTo: volunteerPublicId,
    updatedAt: Timestamp.now(),
  });
}

export async function claimNeed(
  needId: string,
  volunteerPublicId: string,
): Promise<boolean> {
  const db = getDb();
  const ref = db.collection('needs').doc(needId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const need = snap.data() as Need;
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
    tx.update(ref, {
      status: 'in_progress',
      assignedTo: volunteerPublicId,
      updatedAt: Timestamp.now(),
    });
    return true;
  });
}

export async function releaseNeed(
  needId: string,
  volunteerPublicId: string,
): Promise<boolean> {
  const db = getDb();
  const ref = db.collection('needs').doc(needId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const need = snap.data() as Need;
    if (need.assignedTo !== volunteerPublicId) return false;
    tx.update(ref, {
      status: 'open',
      assignedTo: null,
      updatedAt: Timestamp.now(),
    });
    return true;
  });
}

/* ----- Volunteers ----- */

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
  const db = getDb();
  const docId = normalizePhoneId(input.raw.phone);
  const ref = db.collection('volunteers').doc(docId);
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data() as Volunteer;
    await ref.update({
      name: input.name || data.name,
      updatedAt: Timestamp.now(),
    });
    return { id: docId, publicId: data.publicId };
  }
  const publicId = randomUUID();
  await ref.set({
    id: docId,
    phone: input.raw.phone,
    name: input.name,
    skills: input.skills ?? [],
    serviceArea: input.serviceArea ?? null,
    serviceRadiusKm: input.serviceRadiusKm ?? 10,
    active: input.active ?? false,
    publicId,
    createdAt: Timestamp.now(),
  });
  return { id: docId, publicId };
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
  const db = getDb();
  const docId = normalizePhoneId(phone);
  await db
    .collection('volunteers')
    .doc(docId)
    .update({ ...patch, updatedAt: Timestamp.now() });
}

export async function getVolunteerByPhone(
  phone: string,
): Promise<Volunteer | null> {
  const db = getDb();
  const docId = normalizePhoneId(phone);
  const snap = await db.collection('volunteers').doc(docId).get();
  if (!snap.exists) return null;
  return snap.data() as Volunteer;
}

export async function findNearestVolunteer(
  need: Need,
): Promise<Volunteer | null> {
  if (!need.location) return null;
  const db = getDb();
  const snap = await db
    .collection('volunteers')
    .where('active', '==', true)
    .where('skills', 'array-contains', need.needType)
    .get();

  let best: { volunteer: Volunteer; dist: number } | null = null;
  for (const doc of snap.docs) {
    const v = doc.data() as Volunteer;
    if (!v.serviceArea) continue;
    const dist = haversineKm(need.location, v.serviceArea);
    if (dist > v.serviceRadiusKm) continue;
    if (!best || dist < best.dist) best = { volunteer: v, dist };
  }
  return best?.volunteer ?? null;
}

/* ----- Resolutions ----- */

export async function findLatestActiveNeedForVolunteer(
  volunteerPublicId: string,
): Promise<Need | null> {
  const db = getDb();
  const snap = await db
    .collection('needs')
    .where('assignedTo', '==', volunteerPublicId)
    .where('status', 'in', ['in_progress', 'assigned'])
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data() as Need;
}

export interface SaveResolutionInput {
  needId: string;
  volunteerPublicId: string;
  photoUrl: string;
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
  const db = getDb();
  const now = Timestamp.now();
  const ref = db.collection('resolutions').doc();

  await db.runTransaction(async (tx) => {
    const needRef = db.collection('needs').doc(input.needId);
    const needSnap = await tx.get(needRef);
    if (!needSnap.exists) {
      throw new Error(`Need ${input.needId} not found`);
    }

    tx.set(ref, {
      id: ref.id,
      needId: input.needId,
      volunteerPublicId: input.volunteerPublicId,
      photoUrl: input.photoUrl,
      verified: input.verification.verified,
      verificationConfidence: input.verification.confidence,
      verificationReason: input.verification.reason,
      observations: input.verification.observations ?? null,
      resolvedAt: now,
    });

    if (input.verification.verified) {
      tx.update(needRef, {
        status: 'verified',
        resolvedAt: now,
        verifiedAt: now,
        verifiedPhotoUrl: input.photoUrl,
        latestPhotoUrl: input.photoUrl,
        updatedAt: now,
      });
    } else {
      tx.update(needRef, {
        latestPhotoUrl: input.photoUrl,
        updatedAt: now,
      });
    }
  });

  logger.info(
    {
      resolutionId: ref.id,
      needId: input.needId,
      verified: input.verification.verified,
    },
    'resolution saved',
  );
  return ref.id;
}
