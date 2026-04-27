/**
 * Wire-format types for documents read from Firestore from the browser.
 *
 * Mirrors backend/src/domain/types.ts but uses {seconds, nanoseconds} for
 * Timestamps because that's what the Firebase Web SDK gives us.
 */

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface NeedReporter {
  publicId: string;
  displayName: string | null;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export type NeedType =
  | 'food'
  | 'water'
  | 'health'
  | 'shelter'
  | 'education'
  | 'sanitation'
  | 'safety'
  | 'infrastructure'
  | 'other';

export type Urgency = 'critical' | 'high' | 'medium' | 'low';

export type Language = 'ta' | 'hi' | 'en' | 'unknown';

export type NeedStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'verified'
  | 'rejected';

export interface Need {
  id: string;
  reporter: NeedReporter;
  rawText: string;
  rawQuote: string;
  needType: NeedType;
  urgency: Urgency;
  locationHint: string | null;
  location: GeoLocation | null;
  beneficiaryCount: number | null;
  language: Language;
  status: NeedStatus;
  assignedTo: string | null;
  reasoning: string | null;
  verifiedPhotoUrl?: string | null;
  latestPhotoUrl?: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  resolvedAt?: FirestoreTimestamp | null;
  verifiedAt?: FirestoreTimestamp | null;
}
