import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { config } from '../lib/config';
import { logger } from '../lib/logger';
import type { Need } from '../domain/types';

let _client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (_client) return _client;
  if (!config.gemini.apiKey) throw new Error('GEMINI_API_KEY not configured');
  _client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return _client;
}

const MODEL = 'gemini-2.0-flash';

export const VerificationSchema = z.object({
  verified: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  observations: z.string().optional().nullable(),
});
export type Verification = z.infer<typeof VerificationSchema>;

export interface PhotoInput {
  data: Buffer;
  mimeType: string;
}

const PROMPT_TEMPLATE = (need: Need) => `You are SAHAYA's verification assistant.

A volunteer claims they have resolved a community need reported earlier by an ASHA worker. The photo attached to this message is their evidence. Decide whether the photo plausibly shows that the SPECIFIC need has been addressed.

Original need:
- Type: ${need.needType}
- Urgency: ${need.urgency}
- Reporter quote: "${need.rawQuote}"
- Location hint: ${need.locationHint ?? 'unspecified'}
- Reporter language: ${need.language}

Decision rubric:
- "verified" = true ONLY when the photo plausibly shows the SAME kind of issue resolved.
   Examples:
     - need was "tube well broken" -> photo shows a working tube well or a worker fixing one -> verified: true
     - need was "child has rashes, needs medical attention" -> photo shows a child being attended to by a health worker / ORS / clean clothes -> verified: true
     - need was "ration shortage" -> photo shows ration packets being delivered -> verified: true
- "verified" = false when the photo is unrelated, blurry to the point of useless, or shows the same problem unresolved.
- Be CONSERVATIVE: if you genuinely cannot tell, set verified=false with a reason.

Return STRICT JSON only, no markdown, no commentary:
{
  "verified": boolean,
  "confidence": number,        // 0.0 - 1.0
  "reason": string,            // ONE short English sentence
  "observations": string       // 1-2 sentences literally describing what's in the photo
}`;

export async function verifyResolutionPhoto(
  photo: PhotoInput,
  need: Need,
): Promise<Verification> {
  const ai = getClient();
  const t0 = Date.now();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: photo.mimeType,
              data: photo.data.toString('base64'),
            },
          },
          { text: PROMPT_TEMPLATE(need) },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 512,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty Gemini Vision response');

  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch (err) {
    logger.error({ rawPreview: text.slice(0, 200) }, 'gemini vision returned non-JSON');
    throw new Error('Gemini Vision response was not valid JSON');
  }
  const parsed = VerificationSchema.safeParse(obj);
  if (!parsed.success) {
    logger.error({ issues: parsed.error.issues, raw: obj }, 'verification schema mismatch');
    throw new Error('Verification response did not match schema');
  }

  logger.info(
    {
      ms: Date.now() - t0,
      needId: need.id,
      verified: parsed.data.verified,
      confidence: parsed.data.confidence,
    },
    'photo verification complete',
  );
  return parsed.data;
}
