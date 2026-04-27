import { getDb, Timestamp } from '../lib/firebase';
import { logger } from '../lib/logger';
import type { ExtractionResult, Language, Need, ReportedBy } from './types';

export interface PersistNeedsInput {
  reportedBy: ReportedBy;
  extraction: ExtractionResult;
}

/**
 * Persist all needs from a single voice/text submission.
 * Returns the IDs of the newly created needs.
 */
export async function persistNeedsFromExtraction(
  input: PersistNeedsInput,
): Promise<string[]> {
  const db = getDb();
  const now = Timestamp.now();
  const batch = db.batch();
  const ids: string[] = [];

  for (const n of input.extraction.needs) {
    const ref = db.collection('needs').doc();
    const need: Omit<Need, 'createdAt' | 'updatedAt'> & {
      createdAt: typeof now;
      updatedAt: typeof now;
    } = {
      id: ref.id,
      reportedBy: input.reportedBy,
      rawText: input.extraction.transcription,
      rawQuote: n.rawQuote,
      needType: n.needType,
      urgency: n.urgency,
      locationHint: n.locationHint ?? null,
      location: null,
      beneficiaryCount: n.beneficiaryCount ?? null,
      language: input.extraction.language,
      status: 'open',
      assignedTo: null,
      reasoning: n.reasoning ?? null,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(ref, need);
    ids.push(ref.id);
  }

  await batch.commit();
  logger.info({ count: ids.length, reporter: input.reportedBy.phone }, 'persisted needs');
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

export async function ensureAshaWorker(reportedBy: ReportedBy): Promise<void> {
  const db = getDb();
  const id = reportedBy.phone.replace(/[^0-9]/g, '');
  if (!id) return;
  const ref = db.collection('asha_workers').doc(id);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({ lastSeenAt: Timestamp.now() });
  } else {
    await ref.set({
      id,
      phone: reportedBy.phone,
      name: reportedBy.name ?? null,
      waId: reportedBy.waId ?? null,
      createdAt: Timestamp.now(),
      lastSeenAt: Timestamp.now(),
      reportedNeedsCount: 0,
    });
  }
}
