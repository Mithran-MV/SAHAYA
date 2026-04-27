import { GoogleGenAI } from '@google/genai';
import { config } from '../lib/config';
import { logger } from '../lib/logger';
import { ExtractionResultSchema, type ExtractionResult } from '../domain/types';

let _client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (_client) return _client;
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  _client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return _client;
}

export const GEMINI_MODEL = 'gemini-2.0-flash';

const SYSTEM_PROMPT = `You are SAHAYA, an extraction assistant for an ASHA (Accredited Social Health Activist) worker reporting community needs in rural India.

Input may be a voice note in Tamil, Hindi, or English (or a code-mix). The worker reports one or more urgent issues she observed in the village today.

Your job, in a single JSON response:
1. Detect the language: "ta" (Tamil), "hi" (Hindi), "en" (English), or "unknown".
2. Transcribe the audio faithfully into "transcription" (Latin script for ta/hi is acceptable).
3. Extract EVERY distinct community need. Output as "needs" array.

For EACH need:
- needType: one of ["food","water","health","shelter","education","sanitation","safety","infrastructure","other"]
- urgency:
    "critical" = life-threatening or must be addressed today
    "high" = within 48 hours
    "medium" = within this week
    "low" = not urgent
- locationHint: the location words exactly as said (e.g. "Ward 4 Kallur", "anganwadi 3"). null if not stated.
- beneficiaryCount: integer count if she explicitly says (e.g. "three children" -> 3), else null.
- rawQuote: the original-language sentence(s) for THIS need.
- reasoning: ONE short English line explaining your needType + urgency choice.

CRITICAL RULES
- Do not invent details. If location was not said, locationHint is null.
- Split distinct issues into separate need entries (a tube well + a sick child = 2 needs).
- Conservative urgency: only mark "critical" if the language strongly implies imminent danger.

Output STRICT JSON ONLY, no commentary, no markdown. Schema:

{
  "language": "ta" | "hi" | "en" | "unknown",
  "transcription": string,
  "needs": [
    {
      "needType": string,
      "urgency": string,
      "locationHint": string | null,
      "beneficiaryCount": number | null,
      "rawQuote": string,
      "reasoning": string
    }
  ]
}`;

export interface AudioInput {
  data: Buffer;
  mimeType: string;
}

async function callGemini(parts: Array<Record<string, unknown>>): Promise<string> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: parts as never }],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  });
  const text = response.text;
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

function parseExtraction(rawJson: string): ExtractionResult {
  let obj: unknown;
  try {
    obj = JSON.parse(rawJson);
  } catch (err) {
    logger.error({ err, rawPreview: rawJson.slice(0, 200) }, 'gemini returned non-JSON');
    throw new Error('Gemini response was not valid JSON');
  }
  const parsed = ExtractionResultSchema.safeParse(obj);
  if (!parsed.success) {
    logger.error({ issues: parsed.error.issues, raw: obj }, 'gemini schema mismatch');
    throw new Error('Gemini response did not match expected schema');
  }
  return parsed.data;
}

export async function extractNeedsFromAudio(audio: AudioInput): Promise<ExtractionResult> {
  const t0 = Date.now();
  const text = await callGemini([
    { inlineData: { mimeType: audio.mimeType, data: audio.data.toString('base64') } },
    { text: SYSTEM_PROMPT },
  ]);
  const result = parseExtraction(text);
  logger.info(
    {
      ms: Date.now() - t0,
      language: result.language,
      needs: result.needs.length,
      transcription: result.transcription.slice(0, 80),
    },
    'gemini audio extraction complete',
  );
  return result;
}

export async function extractNeedsFromText(transcription: string): Promise<ExtractionResult> {
  const t0 = Date.now();
  const text = await callGemini([
    {
      text:
        SYSTEM_PROMPT +
        '\n\nThis input is a TEXT TRANSCRIPTION (no audio). Use it directly as "transcription" and detect the language from the script:\n\n' +
        JSON.stringify(transcription),
    },
  ]);
  const result = parseExtraction(text);
  logger.info(
    { ms: Date.now() - t0, language: result.language, needs: result.needs.length },
    'gemini text extraction complete',
  );
  return result;
}
