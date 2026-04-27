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

export interface ReportedBy {
  phone: string;
  name?: string | null;
  waId?: string | null;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface Need {
  id: string;
  reportedBy: ReportedBy;
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
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  resolvedAt?: FirebaseFirestore.Timestamp | null;
}

export interface Volunteer {
  id: string;
  phone: string;
  name: string;
  skills: NeedType[];
  serviceArea: GeoLocation | null;
  serviceRadiusKm: number;
  active: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Resolution {
  id: string;
  needId: string;
  volunteerId: string;
  photoUrl: string | null;
  verified: boolean;
  verificationConfidence: number | null;
  verificationReason: string | null;
  resolvedAt: FirebaseFirestore.Timestamp;
}
