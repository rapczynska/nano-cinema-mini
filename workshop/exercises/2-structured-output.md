# Exercise 2 · Structured output

**API:** Prompt API (`LanguageModel`) · **Time:** 7 minutes

| | |
| --- | --- |
| Page | <http://localhost:4200/lab/2> |
| File | `apps/cinema/src/app/lab/2-structured-output/exercise.ts` |
| Check | `npm run lab:check 2` |
| Stuck? | `npm run lab:solve 2` |

## Goal

**Recommend (with schema)** shows a **Validated** card whose button opens a
real film page. Anything else is rejected in the log.

## Background

`responseConstraint` takes a JSON Schema and constrains decoding: the model
can only produce tokens that keep the answer valid, so `JSON.parse` never
fails. An `enum` restricts a value to a fixed list.

A schema guarantees the shape, not the truth. Valid JSON can still be a bad
recommendation, so your code checks the meaning.

The page opens the session for you (`lab/shared/concierge-session.ts`), so
this exercise does not depend on your Exercise 1 code.

## Step 1 · Describe the answer: `recommendationSchema()`

Return a JSON Schema for an object with two required strings:

- `movieId`, restricted with `enum` to the catalogue ids:
  `movies.map((movie) => movie.id)`
- `reason`

Forbid other keys with `additionalProperties: false`.

<details>
<summary>Hint</summary>

```ts
return {
  type: 'object',
  properties: {
    movieId: { type: 'string', enum: movies.map((movie) => movie.id) },
    reason: { type: 'string' },
  },
  required: ['movieId', 'reason'],
  additionalProperties: false,
};
```

</details>

## Step 2 · Check the meaning: `validateRecommendation()`

Turn an unknown value into a trusted `Recommendation`, or throw an `Error`
when:

- the value is not an object,
- `movieId` is not the id of a film (`findMovie(movieId)` finds nothing),
- `reason` is not a non-empty string.

<details>
<summary>Hint</summary>

```ts
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
```

</details>

## Step 3 · Ask, parse, validate: `recommend()`

1. `const text = await session.prompt(request, { responseConstraint: recommendationSchema(), signal });`
2. Return `validateRecommendation(JSON.parse(text))`.

## Try it

1. **A playful comedy with no dialogue**: a Validated card for Big Buck Bunny.
   **Open film** opens its page.
2. **Something good**: still a valid film. Is it a good pick?
3. **Show me Titanic**: the answer is a catalogue film anyway.

## Done when

"Show me Titanic" still returns valid JSON, and you can say why that answer is
wrong. `npm run lab:check 2` shows 11 green checks.

## Notice

The schema forced a catalogue id, so for Titanic the model could only answer
wrong. Parsing told you nothing about that. Shape is the decoder's job,
meaning is yours.

## Stretch

Give the model an honest way out:

1. Add `'none'` to the `enum`.
2. Let `validateRecommendation()` accept `movieId: 'none'`.
3. Ask for Titanic again. The page shows a **No match** card for `none`.
