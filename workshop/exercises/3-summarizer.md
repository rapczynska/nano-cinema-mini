# Exercise 3 · Summarizer

**API:** Summarizer API (`Summarizer`) · **Time:** 7 minutes

| | |
| --- | --- |
| Page | <http://localhost:4200/lab/3> |
| File | `apps/cinema/src/app/lab/3-summarizer/exercise.ts` |
| Check | `npm run lab:check 3` |
| Stuck? | `npm run lab:solve 3` |

## Goal

**Summarize** turns a film's programme notes into a summary whose shape
follows the drop-downs: a paragraph for `tldr`, a list for `key-points`, one
line for `headline`.

## Background

A task API exposes a job, not a model. You choose from a few typed options
instead of writing and maintaining a prompt:

| Option | Values |
| --- | --- |
| `type` | `tldr`, `key-points`, `teaser`, `headline` |
| `length` | `short`, `medium`, `long` |
| `format` | `markdown`, `plain-text` |

`sharedContext` says what every input of this summarizer is about. The file
gives you one.

The lifecycle is the one you know from the Prompt API:
`availability()` → `create()` → use → `destroy()`.

## Step 1 · Describe the summary: `summaryOptions()`

Return an object with `type`, `length` and `format`, plus the languages:
`expectedInputLanguages: ['en']` and `outputLanguage: 'en'`.

## Step 2 · Summarize and clean up: `summarize()`

1. Feature-detect. Throw when `typeof Summarizer === 'undefined'`.
2. `await Summarizer.availability(options)`. Throw when it is `'unavailable'`.
   The options decide availability, so ask with the ones you will use.
3. Create the summarizer with the options, `sharedContext`, the signal and a
   `monitor`. In the monitor, listen for `downloadprogress` and pass
   `event.loaded` to `hooks.onDownloadProgress?.()`.
4. Return `await summarizer.summarize(text, { signal: hooks.signal })`.
5. Call `summarizer.destroy()` in `finally`, so it also runs when
   `summarize()` throws.

<details>
<summary>Hint</summary>

```ts
const summarizer = await Summarizer.create({
  ...options,
  sharedContext,
  signal: hooks.signal,
  monitor(monitor) {
    monitor.addEventListener('downloadprogress', (event) => {
      hooks.onDownloadProgress?.(event.loaded);
    });
  },
});
try {
  return await summarizer.summarize(text, { signal: hooks.signal });
} finally {
  summarizer.destroy();
}
```

</details>

## Try it

1. Summarize the notes of Sintel as `key-points`.
2. Switch the type to `headline`, then `tldr`, then `teaser`. Keep the same
   film.
3. Change the length and the format.

Which output fits which surface: a card, a detail page, a push notification?

## Done when

Switching the type visibly changes the shape of the result.
`npm run lab:check 3` shows 10 green checks, and the stretch check as "not
attempted".

## Notice

- You wrote no prompt, so there is no prompt to inject into and none to
  maintain.
- The price is flexibility: you get the summary types Chrome offers, nothing
  else. When the task API fits the job, use it. When it does not, reach for
  the Prompt API.
- Check a summary against facts (director, year), not by how fluent it reads.

## Stretch · `summarizeStreaming()`

`summarizer.summarizeStreaming(text, { signal })` returns a `ReadableStream`,
like `promptStreaming()`. Read it with the given helper:

```ts
const stream = summarizer.summarizeStreaming(text, { signal: hooks.signal });
return await readTextStream(stream, onText, hooks.signal);
```

Then press **Summarize (streaming)** and compare the time to the first text
with the one-shot run.
