/**
 * Exercise 4 · Detect and translate (task APIs)
 *
 * Page:  http://localhost:4200/lab/4
 * Guide: workshop/exercises/4-translation.md
 * Check: npm run lab:check 4      Stuck? npm run lab:solve 4
 */
import type { Cue } from '@nano-cinema/catalogue';
import { todo } from '../shared/todo';

export interface DetectedLanguage {
  /** A BCP 47 language tag such as "pl". */
  language: string;
  /** Between 0 and 1. */
  confidence: number;
}

/**
 * Step 1 · Detect the language of a text.
 *
 * 1. Feature-detect: throw when `typeof LanguageDetector === 'undefined'`.
 * 2. `const detector = await LanguageDetector.create({ signal });`
 * 3. `const [best] = await detector.detect(text, { signal });`
 *    detect() returns candidates sorted by confidence, best first.
 * 4. Return `{ language: best.detectedLanguage, confidence: best.confidence }`.
 * 5. `detector.destroy()` in `finally`.
 */
export async function detectLanguage(text: string, signal?: AbortSignal): Promise<DetectedLanguage> {
  return todo('Step 1 · detectLanguage()', 'LanguageDetector.create() → detect() → take the first candidate → destroy().');
}

/**
 * Step 2 · Translate caption cues and keep their timing.
 *
 * 1. Feature-detect: throw when `typeof Translator === 'undefined'`.
 * 2. Availability is per language pair:
 *    `await Translator.availability({ sourceLanguage, targetLanguage })`.
 *    Throw when it is 'unavailable'.
 * 3. Create ONE translator for all cues:
 *    `await Translator.create({ sourceLanguage, targetLanguage, signal })`.
 * 4. For each cue: `await translator.translate(cue.text, { signal })`.
 *    Return new cues: `{ ...cue, text }`. Never touch start and end.
 * 5. `translator.destroy()` in `finally`.
 */
export async function translateCues(
  cues: readonly Cue[],
  sourceLanguage: string,
  targetLanguage: string,
  signal?: AbortSignal,
): Promise<Cue[]> {
  return todo('Step 2 · translateCues()', 'Check the pair, create one translator, translate each cue, destroy().');
}
