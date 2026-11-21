/**
 * Exercise 2 · Structured output (Prompt API)
 *
 * Page:  http://localhost:4200/lab/2
 * Guide: workshop/exercises/2-structured-output.md
 * Check: npm run lab:check 2      Stuck? npm run lab:solve 2
 */
import { findMovie, movies } from '@nano-cinema/catalogue';
import { todo } from '../shared/todo';

/** A recommendation your code can trust: the id is a real catalogue id. */
export interface Recommendation {
  movieId: string;
  reason: string;
}

/**
 * Step 1 · Describe the answer as a JSON Schema.
 *
 * Return a schema for an object with two required string properties:
 *   - movieId: restricted with `enum` to the ids of the catalogue,
 *              `movies.map((movie) => movie.id)`
 *   - reason
 * Forbid other keys with `additionalProperties: false`.
 */
export function recommendationSchema(): object {
  return todo('Step 1 · recommendationSchema()', 'Return a JSON Schema with an enum of the catalogue ids.');
}

/**
 * Step 2 · Turn an unknown value into a trusted Recommendation, or throw.
 *
 * The schema guarantees the shape. This function checks the meaning. Throw an
 * Error when:
 *   - the value is not an object,
 *   - movieId is not the id of a film: `findMovie(movieId)` finds nothing,
 *   - reason is not a non-empty string.
 * Otherwise return `{ movieId, reason }`.
 */
export function validateRecommendation(value: unknown): Recommendation {
  return todo('Step 2 · validateRecommendation()', 'Check the id against the catalogue with findMovie().');
}

/**
 * Step 3 · Ask with responseConstraint, parse, validate.
 *
 * 1. `const text = await session.prompt(request, { responseConstraint: recommendationSchema(), signal });`
 * 2. `JSON.parse(text)`, then return the result of `validateRecommendation()`.
 */
export async function recommend(
  session: LanguageModel,
  request: string,
  signal?: AbortSignal,
): Promise<Recommendation> {
  return todo('Step 3 · recommend()', 'Prompt with responseConstraint, JSON.parse, then validate.');
}
