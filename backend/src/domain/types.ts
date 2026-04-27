import { z } from 'zod';

export const NeedTypeSchema = z.enum([
  'food',
  'water',
  'health',
  'shelter',
  'education',
  'sanitation',
  'safety',
  'infrastructure',
  'other',
]);
export type NeedType = z.infer<typeof NeedTypeSchema>;

export const UrgencySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type Urgency = z.infer<typeof UrgencySchema>;

export const LanguageSchema = z.enum(['ta', 'hi', 'en', 'unknown']);
export type Language = z.infer<typeof LanguageSchema>;

export const NeedStatusSchema = z.enum([
  'open',
  'assigned',
  'in_progress',
  'resolved',
  'verified',
  'rejected',
]);
export type NeedStatus = z.infer<typeof NeedStatusSchema>;

export const ExtractedNeedSchema = z.object({
  needType: NeedTypeSchema,
  urgency: UrgencySchema,
  locationHint: z.string().nullable().optional(),
  beneficiaryCount: z.number().int().positive().nullable().optional(),
  rawQuote: z.string(),
  reasoning: z.string().optional(),
});
export type ExtractedNeed = z.infer<typeof ExtractedNeedSchema>;

export const ExtractionResultSchema = z.object({
  language: LanguageSchema,
  transcription: z.string(),
  needs: z.array(ExtractedNeedSchema),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

/**
 * Reporter info as it arrives from Twilio (PII; never exposed via the public API).
 */
export interface RawReporter {
  phone: string;
  name: string | null;
  waId: string | null;
}

/**
 * Anonymized reporter identity attached to each need (safe to expose publicly).
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

/**
 * All timestamps are ISO-8601 strings — easy to serialize, parse with `new Date()`.
 */
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
  verifiedAt?: string | null;
  latestPhotoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface AshaWorker {
  id: string;
  phone: string;
  name: string | null;
  waId: string | null;
  publicId: string;
  createdAt: string;
  lastSeenAt: string;
  reportedNeedsCount: number;
}

export interface Volunteer {
  id: string;
  phone: string;
  name: string;
  skills: NeedType[];
  serviceArea: GeoLocation | null;
  serviceRadiusKm: number;
  active: boolean;
  publicId: string;
  createdAt: string;
}

export interface Resolution {
  id: string;
  needId: string;
  volunteerPublicId: string;
  /**
   * Either a public URL (Unsplash for seed data) or a backend-proxied path
   * like `/media/<resolutionId>` for photos that originate from Twilio.
   */
  photoUrl: string | null;
  /** Original Twilio media URL — used by /media/:id proxy. Never sent to clients. */
  twilioMediaUrl?: string | null;
  twilioMediaContentType?: string | null;
  verified: boolean;
  verificationConfidence: number | null;
  verificationReason: string | null;
  observations: string | null;
  resolvedAt: string;
}
