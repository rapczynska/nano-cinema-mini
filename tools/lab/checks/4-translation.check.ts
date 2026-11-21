import { detectLanguage, translateCues } from '@exercise/4-translation/exercise';
import { uninstallSimulatedAi } from '@nano-cinema/browser-ai';
import { announcementCues, phrasebook, polishRequest } from '@nano-cinema/catalogue';
import { describe, expect, it } from 'vitest';
import { callsTo, expectClearError, rejectionOf, useSimulatedAi } from './support';

describe('Exercise 4 · Detect and translate', () => {
  const simulation = useSimulatedAi();

  describe('Step 1 · detectLanguage()', () => {
    it('detects the Polish request as "pl" with its confidence', async () => {
      const detected = await detectLanguage(polishRequest);
      expect(detected.language).toBe('pl');
      expect(detected.confidence).toBeGreaterThan(0.5);
      expect(detected.confidence).toBeLessThanOrEqual(1);
    });

    it('detects English as "en"', async () => {
      expect((await detectLanguage('Welcome to Nano Cinema, the show starts in one minute.')).language).toBe('en');
    });

    it('destroys the detector', async () => {
      await detectLanguage(polishRequest);
      expect(callsTo(simulation(), 'LanguageDetector', 'create')).toHaveLength(1);
      expect(simulation().liveObjects('LanguageDetector'), 'call detector.destroy() in finally').toBe(0);
    });

    it('throws a clear Error when the browser has no Language Detector API', async () => {
      uninstallSimulatedAi(); // Now `LanguageDetector` is undefined.
      expectClearError(await rejectionOf(detectLanguage(polishRequest)), 'LanguageDetector');
    });
  });

  describe('Step 2 · translateCues()', () => {
    it('translates every cue', async () => {
      const translated = await translateCues(announcementCues, 'en', 'pl');
      expect(translated).toHaveLength(announcementCues.length);
      expect(translated.map((cue) => cue.text)).toEqual(
        announcementCues.map((cue) => phrasebook['en>pl'][cue.text]),
      );
    });

    it('keeps the start and end time of every cue', async () => {
      const translated = await translateCues(announcementCues, 'en', 'pl');
      expect(translated.map(({ start, end }) => ({ start, end }))).toEqual(
        announcementCues.map(({ start, end }) => ({ start, end })),
      );
    });

    it('returns new cues and leaves the originals alone', async () => {
      const before = JSON.stringify(announcementCues);
      const translated = await translateCues(announcementCues, 'en', 'pl');
      expect(JSON.stringify(announcementCues)).toBe(before);
      expect(translated[0]).not.toBe(announcementCues[0]);
    });

    it('checks the availability of the language pair', async () => {
      await translateCues(announcementCues, 'en', 'pl');
      const [availability] = callsTo(simulation(), 'Translator', 'availability');
      expect(availability, 'call Translator.availability({ sourceLanguage, targetLanguage })').toBeDefined();
      expect(availability.args[0]).toMatchObject({ sourceLanguage: 'en', targetLanguage: 'pl' });
    });

    it('uses one translator for all cues and destroys it', async () => {
      await translateCues(announcementCues, 'en', 'pl');
      expect(callsTo(simulation(), 'Translator', 'create'), 'create the translator once, not per cue').toHaveLength(1);
      expect(simulation().liveObjects('Translator'), 'call translator.destroy() in finally').toBe(0);
    });

    it('throws for a pair that is unavailable, without calling create()', async () => {
      await rejectionOf(translateCues(announcementCues, 'en', 'xx'));
      expect(callsTo(simulation(), 'Translator', 'create')).toHaveLength(0);
    });

    it('destroys the translator when a translation is aborted', async () => {
      simulation().config.latencyMs = 10; // Every translation now takes a moment.
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 15); // Stop in the middle of the cues.
      const error = await rejectionOf(translateCues(announcementCues, 'en', 'pl', controller.signal));
      expect(error).toMatchObject({ name: 'AbortError' });
      expect(simulation().liveObjects('Translator'), 'destroy() belongs in finally').toBe(0);
    });

    it('throws a clear Error when the browser has no Translator API', async () => {
      uninstallSimulatedAi(); // Now `Translator` is undefined.
      expectClearError(await rejectionOf(translateCues(announcementCues, 'en', 'pl')), 'Translator');
    });
  });
});
