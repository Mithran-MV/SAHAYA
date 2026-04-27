/**
 * Wire-format types returned by the SAHAYA backend REST API.
 * All timestamps are ISO-8601 strings so they JSON-serialize cleanly.
 */

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
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  verifiedAt?: string | null;
}

export interface ApiNeedsResponse {
  count: number;
  needs: Need[];
}

export interface NeedsStats {
  total: number;
  open: number;
  resolved: number;
  avgResolutionMs: number;
  byType: Record<string, number>;
  byUrgency: Record<string, number>;
  byLanguage: Record<string, number>;
}
