# SAHAYA — Data Model

Firestore collections and access semantics. Backend writes via the Admin SDK (bypasses rules); the public dashboard reads anonymized collections via the Web SDK.

## Privacy posture

- ASHA worker phone numbers and full names live **only** in `asha_workers` (private).
- Volunteer phone numbers live **only** in `volunteers` (private).
- The `needs` collection — the heart of the dashboard — contains only an opaque `reporter.publicId` and at most a first name in `reporter.displayName`.

## Collections

### `needs/{id}` — public read

| field | type | notes |
|---|---|---|
| `id` | string | matches doc id |
| `reporter.publicId` | string (UUID) | opaque, joins back to `asha_workers` only via Admin SDK |
| `reporter.displayName` | string \| null | first name only |
| `rawText` | string | full transcription (Tamil/Hindi/English script) |
| `rawQuote` | string | excerpt for this specific need |
| `needType` | enum | `food` \| `water` \| `health` \| `shelter` \| `education` \| `sanitation` \| `safety` \| `infrastructure` \| `other` |
| `urgency` | enum | `critical` \| `high` \| `medium` \| `low` |
| `locationHint` | string \| null | original location words from voice ("Ward 4 Kallur") |
| `location` | `{lat, lng, formattedAddress}` \| null | geocoded |
| `beneficiaryCount` | int \| null | only if explicitly mentioned |
| `language` | enum | `ta` \| `hi` \| `en` \| `unknown` |
| `status` | enum | `open` \| `assigned` \| `in_progress` \| `resolved` \| `verified` \| `rejected` |
| `assignedTo` | string \| null | volunteer publicId |
| `reasoning` | string \| null | one-line justification from Gemini |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |
| `resolvedAt` | Timestamp \| null | populated in Phase 5 |

### `asha_workers/{phoneDigits}` — backend only

| field | type | notes |
|---|---|---|
| `id` | string | digits-only phone (e.g. `919999999999`) |
| `phone` | string | full E.164 (`+91...`) |
| `name` | string \| null | full name from WhatsApp profile |
| `waId` | string \| null | Twilio WA ID |
| `publicId` | string (UUID) | shared with `needs.reporter.publicId` |
| `createdAt` | Timestamp | |
| `lastSeenAt` | Timestamp | |
| `reportedNeedsCount` | int | |

### `volunteers/{id}` — backend only

| field | type | notes |
|---|---|---|
| `id` | string | digits-only phone |
| `phone` | string | full E.164 |
| `name` | string | |
| `skills` | NeedType[] | |
| `serviceArea` | `{lat, lng, formattedAddress}` \| null | center of their service area |
| `serviceRadiusKm` | number | how far they're willing to travel |
| `active` | bool | |
| `publicId` | string (UUID) | safe to share publicly |
| `createdAt` | Timestamp | |

### `resolutions/{id}` — public read

| field | type | notes |
|---|---|---|
| `id` | string | |
| `needId` | string | |
| `volunteerPublicId` | string | |
| `photoUrl` | string \| null | uploaded "fixed it" photo |
| `verified` | bool | Gemini Vision verdict |
| `verificationConfidence` | number \| null | 0..1 |
| `verificationReason` | string \| null | one-line explanation |
| `resolvedAt` | Timestamp | |

### `stats/{id}` — public read (Phase 7)

Aggregates computed by a daily job (or seed script):

| field | type | notes |
|---|---|---|
| `date` | string | `YYYY-MM-DD` |
| `totalNeeds` | int | |
| `resolvedNeeds` | int | |
| `avgResolutionMs` | number | mean wall-clock time-to-resolve |
| `byType` | map<NeedType, int> | |
| `byUrgency` | map<Urgency, int> | |

## Indexes

Composite indexes (defined in `firestore.indexes.json`):

- `needs` — `status` ASC + `createdAt` DESC (dashboard "open needs" feed)
- `needs` — `needType` ASC + `createdAt` DESC (filter by category)
- `needs` — `urgency` ASC + `createdAt` DESC (filter by severity)
