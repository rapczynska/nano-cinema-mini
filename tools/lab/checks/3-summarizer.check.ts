import { summarize, summarizeStreaming, summaryOptions } from '@exercise/3-summarizer/exercise';
import { uninstallSimulatedAi } from '@nano-cinema/browser-ai';
import { findMovie } from '@nano-cinema/catalogue';
import { describe, expect, it } from 'vitest';
import { callsTo, expectClearError, rejectionOf, stretch, useSimulatedAi } from './support';

const notes = findMovie('sintel')!.notes;

describe('Exercise 3 · Summarizer', () => {
  const simulation = useSimulatedAi();

  describe('Step 1 · summaryOptions()', () => {
    it('carries type, length and format', () => {
      expect(summaryOptions('teaser', 'long', 'plain-text')).toMatchObject({
        type: 'teaser',
        length: 'long',
        format: 'plain-text',
      });
    });

    it('declares English input and English output', () => {
      expect(summaryOptions('tldr', 'short', 'markdown')).toMatchObject({
        expectedInputLanguages: ['en'],
        outputLanguage: 'en',
      });
    });
  });

  describe('Step 2 · summarize()', () => {
    it('asks availability() with the options before it creates the summarizer', async () => {
      const options = summaryOptions('key-points', 'short', 'markdown');
      await summarize(notes, options);
      const [availability] = callsTo(simulation(), 'Summarizer', 'availability');
      expect(availability, 'call Summarizer.availability(options)').toBeDefined();
      expect(availability.args[0]).toMatchObject(options);
      const [create] = callsTo(simulation(), 'Summarizer', 'create');
      expect(create, 'call Summarizer.create()').toBeDefined();
      expect(create.args[0]).toMatchObject(options);
    });

    it('reports download progress through a monitor', async () => {
      const progress: number[] = [];
      await summarize(notes, summaryOptions('tldr', 'short', 'plain-text'), {
        onDownloadProgress: (loaded) => progress.push(loaded),
      });
      expect(progress, 'listen for "downloadprogress" in monitor()').toContain(1);
    });

    it('returns a summary whose shape follows the type', async () => {
      const points = await summarize(notes, summaryOptions('key-points', 'short', 'markdown'));
      expect(points.split('\n').length).toBeGreaterThanOrEqual(3);
      const headline = await summarize(notes, summaryOptions('headline', 'short', 'plain-text'));
      expect(headline.split('\n')).toHaveLength(1);
      expect(headline.length).toBeLessThan(points.length);
    });

    it('destroys the summarizer after the summary', async () => {
      await summarize(notes, summaryOptions('tldr', 'short', 'plain-text'));
      expect(simulation().liveObjects('Summarizer'), 'call summarizer.destroy()').toBe(0);
    });

    it('destroys the summarizer when summarize() fails: use finally', async () => {
      simulation().config.inputQuota = 10; // The notes no longer fit.
      const error = await rejectionOf(summarize(notes, summaryOptions('tldr', 'short', 'plain-text')));
      expect(error).toMatchObject({ name: 'QuotaExceededError' });
      expect(callsTo(simulation(), 'Summarizer', 'create')).toHaveLength(1);
      expect(simulation().liveObjects('Summarizer'), 'destroy() belongs in finally').toBe(0);
    });

    it('passes the AbortSignal to create() and to summarize()', async () => {
      const controller = new AbortController();
      await summarize(notes, summaryOptions('tldr', 'short', 'plain-text'), { signal: controller.signal });
      const [create] = callsTo(simulation(), 'Summarizer', 'create');
      expect((create.args[0] as SummarizerCreateOptions).signal).toBe(controller.signal);
      const [call] = callsTo(simulation(), 'Summarizer', 'summarize');
      expect((call.args[1] as SummarizerSummarizeOptions | undefined)?.signal).toBe(controller.signal);
    });

    it('throws when availability() answers "unavailable", without calling create()', async () => {
      simulation().config.availability = { Summarizer: 'unavailable' };
      await rejectionOf(summarize(notes, summaryOptions('tldr', 'short', 'plain-text')));
      expect(callsTo(simulation(), 'Summarizer', 'create')).toHaveLength(0);
    });

    it('throws a clear Error when the browser has no Summarizer API', async () => {
      const options = summaryOptions('tldr', 'short', 'plain-text');
      uninstallSimulatedAi(); // Now `Summarizer` is undefined.
      expectClearError(await rejectionOf(summarize(notes, options)), 'Summarizer');
    });
  });

  describe('Stretch · summarizeStreaming()', () => {
    it('streams the summary chunk by chunk and destroys the summarizer', (context) =>
      stretch(context, async () => {
        const seen: string[] = [];
        const summary = await summarizeStreaming(notes, summaryOptions('tldr', 'medium', 'plain-text'), (text) =>
          seen.push(text),
        );
        expect(callsTo(simulation(), 'Summarizer', 'summarizeStreaming')).toHaveLength(1);
        expect(seen.length).toBeGreaterThan(3);
        expect(seen.at(-1)).toBe(summary);
        expect(simulation().liveObjects('Summarizer')).toBe(0);
      }));
  });
});
