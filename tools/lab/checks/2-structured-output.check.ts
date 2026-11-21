import { recommend, recommendationSchema, validateRecommendation } from '@exercise/2-structured-output/exercise';
import { catalogueFacts, movies } from '@nano-cinema/catalogue';
import { describe, expect, it } from 'vitest';
import { callsTo, errorOf, useSimulatedAi } from './support';

const ids = movies.map((movie) => movie.id);

/** A session that knows the catalogue, as Exercise 1 builds it. */
function openSession(): Promise<LanguageModel> {
  return LanguageModel.create({
    initialPrompts: [{ role: 'system', content: `Catalogue: ${JSON.stringify(catalogueFacts())}` }],
  });
}

describe('Exercise 2 · Structured output', () => {
  const simulation = useSimulatedAi();

  describe('Step 1 · recommendationSchema()', () => {
    it('describes an object with the required strings movieId and reason', () => {
      const schema = recommendationSchema() as Record<string, any>;
      expect(schema['type']).toBe('object');
      expect(schema['properties']?.movieId?.type).toBe('string');
      expect(schema['properties']?.reason?.type).toBe('string');
      expect(schema['required']).toEqual(expect.arrayContaining(['movieId', 'reason']));
    });

    it('restricts movieId to the catalogue ids with an enum', () => {
      const schema = recommendationSchema() as Record<string, any>;
      expect(schema['properties']?.movieId?.enum).toEqual(expect.arrayContaining(ids));
    });

    it('forbids extra keys', () => {
      const schema = recommendationSchema() as Record<string, any>;
      expect(schema['additionalProperties']).toBe(false);
    });
  });

  describe('Step 2 · validateRecommendation()', () => {
    it('returns a recommendation for a real catalogue id', () => {
      expect(validateRecommendation({ movieId: 'bunny', reason: 'Short and funny.' })).toEqual({
        movieId: 'bunny',
        reason: 'Short and funny.',
      });
    });

    it('rejects an id that is not in the catalogue', () => {
      expect(errorOf(() => validateRecommendation({ movieId: 'titanic', reason: 'A classic.' }))).toBeInstanceOf(Error);
    });

    it('rejects a missing or empty reason', () => {
      expect(errorOf(() => validateRecommendation({ movieId: 'bunny' }))).toBeInstanceOf(Error);
      expect(errorOf(() => validateRecommendation({ movieId: 'bunny', reason: '  ' }))).toBeInstanceOf(Error);
    });

    it('rejects anything that is not an object', () => {
      expect(errorOf(() => validateRecommendation(null))).toBeInstanceOf(Error);
      expect(errorOf(() => validateRecommendation('bunny'))).toBeInstanceOf(Error);
      expect(errorOf(() => validateRecommendation(42))).toBeInstanceOf(Error);
    });
  });

  describe('Step 3 · recommend()', () => {
    it('prompts with the schema as responseConstraint', async () => {
      const session = await openSession();
      await recommend(session, 'A playful comedy with no dialogue');
      const [prompt] = callsTo(simulation(), 'LanguageModel', 'prompt');
      expect(prompt, 'use session.prompt()').toBeDefined();
      const options = prompt.args[1] as LanguageModelPromptOptions | undefined;
      expect(options?.responseConstraint, 'pass { responseConstraint }').toEqual(recommendationSchema());
    });

    it('returns the parsed, validated recommendation', async () => {
      const session = await openSession();
      const recommendation = await recommend(session, 'A playful comedy with no dialogue');
      expect(recommendation.movieId).toBe('bunny');
      expect(recommendation.reason.length).toBeGreaterThan(0);
    });

    it('passes the AbortSignal to prompt()', async () => {
      const session = await openSession();
      const controller = new AbortController();
      await recommend(session, 'An atmospheric adventure', controller.signal);
      const [prompt] = callsTo(simulation(), 'LanguageModel', 'prompt');
      expect((prompt.args[1] as LanguageModelPromptOptions).signal).toBe(controller.signal);
    });

    it('shape is not truth: a film outside the catalogue still gets a valid answer', async () => {
      const session = await openSession();
      const recommendation = await recommend(session, 'Show me Titanic');
      // The enum forces a catalogue id ("none" if you did the stretch step).
      expect([...ids, 'none']).toContain(recommendation.movieId);
    });
  });
});
