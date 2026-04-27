# SAHAYA — Data Model

In-memory data store and access semantics. The backend writes via the singleton `store` (`backend/src/lib/store.ts`); the public REST API exposes only anonymized projections.

## Privacy posture

- ASHA worker phone numbers and full names live **only** in `store.ashaWorkers`. No public endpoint returns them.
- Volunteer phone numbers live **only** in `store.volunteers`. No public endpoint returns them either; the `/api/volunteers` endpoint emits first-name + skills + service-area only.
- The public `/api/needs` endpoint emits an opaque `reporter.publicId` and at most a first name in `reporter.displayName`.
- Twilio Auth Token never leaves the backend. Photos uploaded by volunteers stay on Twilio; we proxy them at `/media/:resolutionId` after Basic-auth-fetching them server-side.

## Collections (in-memory `Map`s)

### `store.needs` — exposed via `/api/needs`

| field | type | notes |
|---|---|---|
| `id` | string (UUID) | |
| `reporter.publicId` | string (UUID) | opaque, joins back to `asha_workers` only via the backend |
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
| `verifiedPhotoUrl` | string \| null | proxied URL `/media/<resolutionId>` |
| `latestPhotoUrl` | string \| null | most-recent submitted photo (verified or not) |
| `createdAt` | string (ISO 8601) | |
| `updatedAt` | string (ISO 8601) | |
| `resolvedAt` | string \| null | |
| `verifiedAt` | string \| null | |

### `store.ashaWorkers` — backend-only

| field | type | notes |
|---|---|---|
| `id` | string | digits-only phone (e.g. `919999999999`) |
| `phone` | string | full E.164 (`+91...`) |
| `name` | string \| null | full name from WhatsApp profile |
| `waId` | string \| null | Twilio WA ID |
| `publicId` | string (UUID) | shared with `needs.reporter.publicId` |
| `createdAt` | string (ISO) | |
| `lastSeenAt` | string (ISO) | |
| `reportedNeedsCount` | int | |

### `store.volunteers` — backend-only (subset exposed via `/api/volunteers`)

| field | type | notes |
|---|---|---|
| `id` | string | digits-only phone |
| `phone` | string | full E.164 |
| `name` | string | |
| `skills` | NeedType[] | |
| `serviceArea` | `{lat, lng, formattedAddress}` \| null | center of their service area |
| `serviceRadiusKm` | number | |
| `active` | bool | |
| `publicId` | string (UUID) | safe to share publicly |
| `createdAt` | string (ISO) | |

### `store.resolutions` — exposed via `/api/resolutions`

| field | type | notes |
|---|---|---|
| `id` | string (UUID) | |
| `needId` | string | |
| `volunteerPublicId` | string | |
| `photoUrl` | string \| null | `/media/<resolutionId>` for Twilio photos, raw Unsplash URL for seed data |
| `twilioMediaUrl` | string \| null | **internal only**, used by `/media/:id` proxy. Never returned by `/api/*`. |
| `twilioMediaContentType` | string \| null | **internal only** |
| `verified` | bool | Gemini Vision verdict |
| `verificationConfidence` | number \| null | 0..1 |
| `verificationReason` | string \| null | one-line explanation |
| `observations` | string \| null | Vision's literal-description observations |
| `resolvedAt` | string (ISO) | |

## Lifecycle

```
open ──► assigned ──► in_progress ──► verified
   │                       │              ▲
   └─ (no match) ────► open  └─ (photo failed) ─ in_progress
```

- `open`: just created, no volunteer assigned yet
- `assigned`: backend dispatched a WhatsApp ping to the closest matching volunteer (auto)
- `in_progress`: volunteer accepted with `/v claim <id>`
- `resolved`: volunteer submitted a photo but Gemini Vision could not verify
- `verified`: Gemini Vision confirmed the photo matches the original need; `verifiedPhotoUrl` populated
- `rejected`: not currently used — reserved for future moderator action

## Why in-memory?

This build deliberately avoids Firebase, Postgres, Redis, and every other external store. The reason:

1. A hackathon demo runs for 3 minutes. Persisting state across days isn't a requirement.
2. Cloud Run with `min-instances=1` keeps the in-memory store warm between requests for the duration of the demo session.
3. Demo data is re-seeded on every cold start, so the dashboard is **always** alive — even if the instance dies.
4. The data layer is 250 lines of TypeScript. A judge can read the entire persistence story in 5 minutes.

For production:
- Swap `lib/store.ts` for a Postgres adapter using the same `Map`-like interface
- All the rest of the code (`domain/repo.ts`, every pipeline file, every route) keeps working unchanged
