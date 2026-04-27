import { randomUUID } from 'node:crypto';
import { getDb, Timestamp, FieldValue } from '../lib/firebase';
import { logger } from '../lib/logger';
import type {
  ExtractionResult,
  GeoLocation,
  Need,
  NeedReporter,
  RawReporter,
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

/**
 * Look up or create the ASHA worker record for this phone.
 * Returns the anonymized NeedReporter that goes into `needs.reporter`.
 */
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

export interface PersistNeedsInput {
  reporter: NeedReporter;
  extraction: ExtractionResult;
  geocoded: Array<GeoLocation | null>;
}

/**
 * Write all needs from one extraction to Firestore in a single batch.
 */
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
    const need: Omit<Need, 'createdAt' | 'updatedAt'> = {
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
      status: 'open',
      assignedTo: null,
      reasoning: n.reasoning ?? null,
    };
    batch.set(ref, { ...need, createdAt: now, updatedAt: now });
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
