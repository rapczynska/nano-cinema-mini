/**
 * Exercise 3 · Summarizer (task API) — SOLUTION
 *
 * Page:  http://localhost:4200/lab/3
 * Guide: workshop/exercises/3-summarizer.md
 */
import { readTextStream } from '@nano-cinema/browser-ai';

/** What every input of this summarizer is about. */
export const sharedContext = 'Programme notes for a film shown at Nano Cinema.';

export interface SummarizeHooks {
  /** Called with a fraction between 0 and 1 while the model downloads. */
  onDownloadProgress?: (loaded: number) => void;
  signal?: AbortSignal;
}

/**
 * Step 1 · Describe the summary you want.
 * No prompt to write: a task API takes typed options.
 */
export function summaryOptions(
  type: SummarizerType,
  length: SummarizerLength,
  format: SummarizerFormat,
): SummarizerCreateCoreOptions {
  return {
    type,
    length,
    format,
    expectedInputLanguages: ['en'],
    outputLanguage: 'en',
  };
}

/** Availability check and create(), shared by both ways to summarize. */
async function createSummarizer(
  options: SummarizerCreateCoreOptions,
  hooks: SummarizeHooks,
): Promise<Summarizer> {
  if (typeof Summarizer === 'undefined') {
    throw new Error('The Summarizer API is not available in this browser.');
  }
  // The options decide availability: language and format matter.
  if ((await Summarizer.availability(options)) === 'unavailable') {
    throw new Error('The Summarizer cannot run with these options on this device.');
  }
  return Summarizer.create({
    ...options,
    sharedContext,
    signal: hooks.signal,
    monitor(monitor) {
      monitor.addEventListener('downloadprogress', (event) => {
        hooks.onDownloadProgress?.(event.loaded);
      });
    },
  });
}

/**
 * Step 2 · Summarize one text and clean up.
 * The same lifecycle as the Prompt API: availability → create → use → destroy.
 */
export async function summarize(
  text: string,
  options: SummarizerCreateCoreOptions,
  hooks: SummarizeHooks = {},
): Promise<string> {
  const summarizer = await createSummarizer(options, hooks);
  try {
    return await summarizer.summarize(text, { signal: hooks.signal });
  } finally {
    summarizer.destroy(); // Also when summarize() throws.
  }
}

/**
 * Stretch · Stream the summary.
 * summarizeStreaming() returns a ReadableStream, like promptStreaming().
 */
export async function summarizeStreaming(
  text: string,
  options: SummarizerCreateCoreOptions,
  onText: (textSoFar: string) => void,
  hooks: SummarizeHooks = {},
): Promise<string> {
  const summarizer = await createSummarizer(options, hooks);
  try {
    const stream = summarizer.summarizeStreaming(text, { signal: hooks.signal });
    return await readTextStream(stream, onText, hooks.signal);
  } finally {
    summarizer.destroy();
  }
}
