/**
 * Exercise 4 · Detect and translate (task APIs) — SOLUTION
 *
 * Page:  http://localhost:4200/lab/4
 * Guide: workshop/exercises/4-translation.md
 */
import type { Cue } from '@nano-cinema/catalogue';

export interface DetectedLanguage {
  /** A BCP 47 language tag such as "pl". */
  language: string;
  /** Between 0 and 1. */
  confidence: number;
}

/**
 * Step 1 · Detect the language of a text.
 * detect() returns candidates sorted by confidence: take the first.
 */
export async function detectLanguage(text: string, signal?: AbortSignal): Promise<DetectedLanguage> {
  if (typeof LanguageDetector === 'undefined') {
    throw new Error('The Language Detector API is not available in this browser.');
  }
  const detector = await LanguageDetector.create({ signal });
  try {
    const [best] = await detector.detect(text, { signal });
    if (!best) throw new Error('No language was detected.');
    return { language: best.detectedLanguage, confidence: best.confidence };
  } finally {
    detector.destroy();
  }
}

/**
 * Step 2 · Translate caption cues and keep their timing.
 * One translator for all cues. Translation changes the text, never the times.
 */
export async function translateCues(
  cues: readonly Cue[],
  sourceLanguage: string,
  targetLanguage: string,
  signal?: AbortSignal,
): Promise<Cue[]> {
  if (typeof Translator === 'undefined') {
    throw new Error('The Translator API is not available in this browser.');
  }

  // Availability is per language pair.
  const pair = { sourceLanguage, targetLanguage };
  if ((await Translator.availability(pair)) === 'unavailable') {
    throw new Error(`Cannot translate ${sourceLanguage} → ${targetLanguage} on this device.`);
  }

  const translator = await Translator.create({ ...pair, signal });
  try {
    const translated: Cue[] = [];
    for (const cue of cues) {
      const text = await translator.translate(cue.text, { signal });
      translated.push({ ...cue, text }); // start and end stay as they are.
    }
    return translated;
  } finally {
    translator.destroy();
  }
}
