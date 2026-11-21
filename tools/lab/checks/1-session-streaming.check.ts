import { conciergeOptions, createConcierge, streamAnswer } from '@exercise/1-session-streaming/exercise';
import { uninstallSimulatedAi } from '@nano-cinema/browser-ai';
import { movies } from '@nano-cinema/catalogue';
import { describe, expect, it } from 'vitest';
import { callsTo, expectClearError, rejectionOf, useSimulatedAi, wait } from './support';

describe('Exercise 1 · Session and streaming', () => {
  const simulation = useSimulatedAi();

  describe('Step 1 · createConcierge()', () => {
    it('asks availability() with conciergeOptions', async () => {
      await createConcierge();
      const [availability] = callsTo(simulation(), 'LanguageModel', 'availability');
      expect(availability, 'call LanguageModel.availability(conciergeOptions)').toBeDefined();
      expect(availability.args[0]).toEqual(conciergeOptions);
    });

    it('creates the session with the same options', async () => {
      await createConcierge();
      const [create] = callsTo(simulation(), 'LanguageModel', 'create');
      expect(create, 'call LanguageModel.create()').toBeDefined();
      expect(create.args[0]).toMatchObject(conciergeOptions);
    });

    it('starts with a system prompt that holds the catalogue', async () => {
      await createConcierge();
      const [create] = callsTo(simulation(), 'LanguageModel', 'create');
      const { initialPrompts = [] } = create.args[0] as LanguageModelCreateOptions;
      const [system] = initialPrompts;
      expect(system?.role, 'the first initial prompt is the system message').toBe('system');
      for (const movie of movies) {
        expect(system.content, `the system prompt names ${movie.title}`).toContain(movie.title);
      }
    });

    it('adds one example turn after the system prompt: user, then assistant', async () => {
      await createConcierge();
      const [create] = callsTo(simulation(), 'LanguageModel', 'create');
      const { initialPrompts = [] } = create.args[0] as LanguageModelCreateOptions;
      const roles = initialPrompts.slice(1).map((message) => message.role);
      expect(roles.slice(0, 2)).toEqual(['user', 'assistant']);
    });

    it('passes the AbortSignal to create()', async () => {
      const controller = new AbortController();
      await createConcierge(controller.signal);
      const [create] = callsTo(simulation(), 'LanguageModel', 'create');
      expect((create.args[0] as LanguageModelCreateOptions).signal).toBe(controller.signal);
    });

    it('throws a clear Error when the browser has no Prompt API', async () => {
      uninstallSimulatedAi(); // Now `LanguageModel` is undefined.
      expectClearError(await rejectionOf(createConcierge()), 'LanguageModel');
    });

    it('throws when availability() answers "unavailable", without calling create()', async () => {
      simulation().config.availability = { LanguageModel: 'unavailable' };
      await rejectionOf(createConcierge());
      expect(callsTo(simulation(), 'LanguageModel', 'create')).toHaveLength(0);
    });
  });

  describe('Step 2 · streamAnswer()', () => {
    it('reports the growing text chunk by chunk and returns the whole answer', async () => {
      const session = await createConcierge();
      const seen: string[] = [];
      const answer = await streamAnswer(session, 'Something short and funny', (text) => seen.push(text));

      expect(callsTo(simulation(), 'LanguageModel', 'promptStreaming'), 'use session.promptStreaming()').toHaveLength(1);
      expect(seen.length, 'onText runs once per chunk').toBeGreaterThan(3);
      for (let i = 1; i < seen.length; i++) {
        expect(seen[i].startsWith(seen[i - 1]), 'each call gets the text so far: append the chunks').toBe(true);
      }
      expect(seen.at(-1)).toBe(answer);
      expect(answer).toContain('Big Buck Bunny');
    });

    it('keeps the conversation in the session: a follow-up is about the earlier pick', async () => {
      const session = await createConcierge();
      await streamAnswer(session, 'An atmospheric adventure', () => undefined);
      const followUp = await streamAnswer(session, 'Is it suitable for young kids?', () => undefined);
      expect(followUp).toContain('Sintel');
    });

    it('passes the AbortSignal to promptStreaming()', async () => {
      const session = await createConcierge();
      const controller = new AbortController();
      await streamAnswer(session, 'Something short and funny', () => undefined, controller.signal);
      const [call] = callsTo(simulation(), 'LanguageModel', 'promptStreaming');
      expect((call.args[1] as LanguageModelPromptOptions | undefined)?.signal).toBe(controller.signal);
    });

    it('stops on abort: it rejects, and no text arrives after Stop', async () => {
      const session = await createConcierge();
      const controller = new AbortController();
      const seen: string[] = [];
      const answer = streamAnswer(
        session,
        'Describe all three films in detail',
        (text) => {
          seen.push(text);
          if (seen.length === 3) controller.abort(); // The viewer presses Stop.
        },
        controller.signal,
      );

      await expect(answer).rejects.toMatchObject({ name: 'AbortError' });
      await wait(20);
      expect(seen, 'no chunk after Stop').toHaveLength(3);
    });
  });
});
