/**
 * The "model" behind the simulated browser AI, for Nano Cinema.
 *
 * It is a keyword matcher, not a language model. It exists so that the labs
 * and the lab checks run on any laptop. Like a real model it only knows what
 * the session tells it: without the catalogue in a system prompt it cannot
 * name a single film, and without earlier turns it cannot answer a follow-up.
 */

import type { SimulatedPrompt, SimulationConfig } from '@nano-cinema/browser-ai';
import { type Movie, type MovieId, movies } from './catalogue';
import { phrasebook } from './cues';

const KEYWORDS: Readonly<Record<MovieId, readonly string[]>> = {
  sintel: [
    'adventure', 'atmospheric', 'fantasy', 'dragon', 'epic', 'quest',
    'journey', 'moving', 'sad', 'bittersweet', 'dramatic',
  ],
  dream: [
    'surreal', 'strange', 'weird', 'science', 'sci-fi', 'machine', 'dark',
    'thought-provoking', 'philosoph',
  ],
  bunny: [
    'funny', 'comedy', 'playful', 'kid', 'child', 'family', 'light', 'laugh',
    'rabbit', 'bunny', 'slapstick', 'no dialogue', 'without dialogue',
    'silent', 'cheerful', 'fun',
  ],
};

const textOf = (message: LanguageModelMessage): string =>
  typeof message.content === 'string'
    ? message.content
    : message.content.map((part) => String(part.value)).join('\n');

/** The films the system prompt mentions: all the simulated model "knows". */
function knownMovies(prompt: SimulatedPrompt): Movie[] {
  const system = prompt.initialPrompts
    .filter((message) => message.role === 'system')
    .map(textOf)
    .join('\n');
  return movies.filter(
    (movie) => system.includes(movie.title) || system.includes(`"${movie.id}"`),
  );
}

function score(movie: Movie, request: string): number {
  const title = request.includes(movie.title.toLowerCase()) ? 5 : 0;
  return (
    title + KEYWORDS[movie.id].filter((word) => request.includes(word)).length
  );
}

function bestMatch(candidates: readonly Movie[], request: string): Movie | undefined {
  const ranked = candidates
    .map((movie) => ({ movie, points: score(movie, request) }))
    .filter(({ points }) => points > 0)
    .sort((a, b) => b.points - a.points);
  return ranked[0]?.movie;
}

/** The film the assistant named most recently in this conversation. */
function lastPick(prompt: SimulatedPrompt, known: readonly Movie[]): Movie | undefined {
  const answers = prompt.turns.filter((message) => message.role === 'assistant');
  for (const answer of answers.reverse()) {
    const text = textOf(answer);
    const named = known.find(
      (movie) => text.includes(movie.title) || text.includes(`"${movie.id}"`),
    );
    if (named) return named;
  }
  return undefined;
}

function pitch(movie: Movie): string {
  const dialogue = movie.dialogue ? '' : ' It has no spoken dialogue.';
  return `a ${movie.minutes}-minute ${movie.genre} film that is ${movie.mood.join(', ')}.${dialogue}`;
}

function describe(movie: Movie): string {
  return `${movie.title} (${movie.year}, ${movie.minutes} minutes, ${movie.genre}), directed by ${movie.director}. ${movie.synopsis} ${movie.audience}`;
}

function followUp(movie: Movie, request: string): string {
  if (/\b(kids?|child|children|family|age|young)\b/.test(request)) {
    return `About ${movie.title}: ${movie.audience}`;
  }
  if (/\b(long|short|minutes|runtime|length)\b/.test(request)) {
    return `${movie.title} runs for about ${movie.minutes} minutes.`;
  }
  if (/\b(dialogue|language|subtitles?|spoken)\b/.test(request)) {
    return movie.dialogue
      ? `${movie.title} has spoken English dialogue.`
      : `${movie.title} has no spoken dialogue.`;
  }
  if (/\b(who|director|directed|made)\b/.test(request)) {
    return `${movie.title} was directed by ${movie.director} and released in ${movie.year}.`;
  }
  return `${movie.title}: ${movie.synopsis}`;
}

const FOLLOW_UP = /\b(is it|does it|was it|about it|will it|would it|can it|that one|this one)\b/;
const EVERYTHING = /\b(all three|all films|every film|each film|in detail|everything)\b/;

function answerInText(prompt: SimulatedPrompt, known: readonly Movie[]): string {
  const request = prompt.input.toLowerCase();

  if (known.length === 0) {
    return 'I do not know which films are showing. Nobody gave me a catalogue: put it in the system prompt.';
  }
  if (FOLLOW_UP.test(request)) {
    const previous = lastPick(prompt, known);
    return previous
      ? followUp(previous, request)
      : 'I am not sure which film you mean: we have not picked one in this conversation yet.';
  }
  if (EVERYTHING.test(request)) {
    return known.map(describe).join(' ');
  }
  const match = bestMatch(known, request);
  if (match) return `Try ${match.title}: ${pitch(match)}`;
  const titles = known.map((movie) => movie.title).join(', ');
  return `Nothing in the catalogue clearly matches that. Tell me a mood or a genre: tonight we show ${titles}.`;
}

/**
 * Fills the schema the way constrained decoding would: the shape is always
 * valid, whether or not the content is a good answer.
 */
function answerInJson(
  prompt: SimulatedPrompt,
  known: readonly Movie[],
  schema: Record<string, unknown>,
): string {
  const request = prompt.input.toLowerCase();
  const properties = (schema['properties'] ?? {}) as Record<
    string,
    { type?: string; enum?: unknown[] }
  >;
  const result: Record<string, unknown> = {};
  let reason = 'No clear preference: this is only the first film in the list.';

  for (const [name, property] of Object.entries(properties)) {
    if (Array.isArray(property.enum)) {
      const allowed = property.enum.map(String);
      const candidates = known.filter((movie) => allowed.includes(movie.id));
      const match = bestMatch(candidates, request);
      if (match) {
        result[name] = match.id;
        reason = `${match.title} is ${pitch(match)}`;
      } else if (allowed.includes('none')) {
        result[name] = 'none';
        reason = 'Nothing in the catalogue matches this request.';
      } else {
        // Forced to pick: valid JSON, weak answer.
        result[name] = allowed[0];
      }
    } else if (property.type === 'number' || property.type === 'integer') {
      result[name] = 0;
    } else if (property.type === 'boolean') {
      result[name] = false;
    } else {
      result[name] = '';
    }
  }
  for (const [name, property] of Object.entries(properties)) {
    if (result[name] === '' && property.type === 'string') result[name] = reason;
  }
  return JSON.stringify(result);
}

function answer(prompt: SimulatedPrompt): string {
  const known = knownMovies(prompt);
  return prompt.schema
    ? answerInJson(prompt, known, prompt.schema)
    : answerInText(prompt, known);
}

/** The simulation configuration the app and the lab checks share. */
export function cinemaSimulation(latencyMs = 45): SimulationConfig {
  return { answer, phrasebook, latencyMs };
}
