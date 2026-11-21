/**
 * Exercise 2 · Structured output (Prompt API) — SOLUTION
 *
 * Page:  http://localhost:4200/lab/2
 * Guide: workshop/exercises/2-structured-output.md
 */
import { findMovie, movies } from '@nano-cinema/catalogue';

/** A recommendation your code can trust: the id is a real catalogue id. */
export interface Recommendation {
  movieId: string;
  reason: string;
}

/**
 * Step 1 · Describe the answer as a JSON Schema.
 * The enum restricts movieId to the ids of the catalogue.
 */
export function recommendationSchema(): object {
  return {
    type: 'object',
    properties: {
      movieId: { type: 'string', enum: movies.map((movie) => movie.id) },
      reason: { type: 'string' },
    },
    required: ['movieId', 'reason'],
    additionalProperties: false,
  };
}

/**
 * Step 2 · Turn an unknown value into a trusted Recommendation, or throw.
 * The schema guarantees the shape. This function checks the meaning.
 */
export function validateRecommendation(value: unknown): Recommendation {
  if (typeof value !== 'object' || value === null) {
    throw new Error('The recommendation is not an object.');
  }
  const { movieId, reason } = value as Record<string, unknown>;
  if (typeof movieId !== 'string' || !findMovie(movieId)) {
    throw new Error(`"${String(movieId)}" is not a film in the catalogue.`);
  }
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new Error('The recommendation has no reason.');
  }
  return { movieId, reason: reason.trim() };
}

/**
 * Step 3 · Ask with responseConstraint, parse, validate.
 */
export async function recommend(
  session: LanguageModel,
  request: string,
  signal?: AbortSignal,
): Promise<Recommendation> {
  const text = await session.prompt(request, {
    responseConstraint: recommendationSchema(),
    signal,
  });
  // Constrained decoding means this always parses. It may still be a bad pick.
  return validateRecommendation(JSON.parse(text));
}
