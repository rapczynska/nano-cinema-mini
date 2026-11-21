/**
 * Exercise 3 · Summarizer (task API)
 *
 * Page:  http://localhost:4200/lab/3
 * Guide: workshop/exercises/3-summarizer.md
 * Check: npm run lab:check 3      Stuck? npm run lab:solve 3
 */
import { readTextStream } from '@nano-cinema/browser-ai';
import { todo } from '../shared/todo';

/** What every input of this summarizer is about. */
export const sharedContext = 'Programme notes for a film shown at Nano Cinema.';

export interface SummarizeHooks {
  /** Called with a fraction between 0 and 1 while the model downloads. */
  onDownloadProgress?: (loaded: number) => void;
  signal?: AbortSignal;
}

/**
 * Step 1 · Describe the summary you want.
 *
 * No prompt to write: a task API takes typed options. Return an object with
 * `type`, `length` and `format`, plus the languages:
 *   expectedInputLanguages: ['en'], outputLanguage: 'en'
 */
export function summaryOptions(
  type: SummarizerType,
  length: SummarizerLength,
  format: SummarizerFormat,
): SummarizerCreateCoreOptions {
  return todo('Step 1 · summaryOptions()', 'Return { type, length, format, expectedInputLanguages, outputLanguage }.');
}

/**
 * Step 2 · Summarize one text and clean up.
 *
 * The same lifecycle as the Prompt API: availability → create → use → destroy.
 *
 * 1. Feature-detect: throw when `typeof Summarizer === 'undefined'`.
 * 2. `await Summarizer.availability(options)`: throw when it is 'unavailable'.
 * 3. `const summarizer = await Summarizer.create({ ...options, sharedContext,
 *      signal: hooks.signal, monitor(monitor) { … } });`
 *    In `monitor`, listen for 'downloadprogress' and pass `event.loaded` to
 *    `hooks.onDownloadProgress?.()`.
 * 4. `try { return await summarizer.summarize(text, { signal: hooks.signal }); }`
 *    `finally { summarizer.destroy(); }`
 */
export async function summarize(
  text: string,
  options: SummarizerCreateCoreOptions,
  hooks: SummarizeHooks = {},
): Promise<string> {
  return todo('Step 2 · summarize()', 'availability() → create() with a monitor → summarize() → destroy() in finally.');
}

/**
 * Stretch · Stream the summary.
 *
 * As step 2, but call `summarizer.summarizeStreaming(text, { signal })` and
 * read the stream with the given helper:
 *   return await readTextStream(stream, onText, hooks.signal);
 */
export async function summarizeStreaming(
  text: string,
  options: SummarizerCreateCoreOptions,
  onText: (textSoFar: string) => void,
  hooks: SummarizeHooks = {},
): Promise<string> {
  return todo('Stretch · summarizeStreaming()', 'Use summarizer.summarizeStreaming() and readTextStream().');
}
