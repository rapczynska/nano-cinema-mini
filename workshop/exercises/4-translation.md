# Exercise 4 · Detect and translate

**APIs:** Language Detector (`LanguageDetector`) and Translator (`Translator`) · **Time:** 7 minutes

| | |
| --- | --- |
| Page | <http://localhost:4200/lab/4> |
| File | `apps/cinema/src/app/lab/4-translation/exercise.ts` |
| Check | `npm run lab:check 4` |
| Stuck? | `npm run lab:solve 4` |

## Goal

**Detect language** recognises a Polish request, and **Translate captions**
shows the cinema's announcements in Polish with every cue keeping its start
and end time.

## Background

The Prompt API does not read or write Polish, but the Translator does. Detect
the language, translate the request to English, reason in English, translate
the answer back: four local calls, no cloud. This exercise builds the two
task-API halves of that chain.

Both APIs follow the lifecycle you already know. Two things are new:

- `detect()` returns candidates sorted by confidence, best first.
- Translator availability is per language pair. English → Polish and
  Polish → English are two separate checks.

The captions are the cinema's own house announcements, written for this lab.

## Step 1 · Detect the language: `detectLanguage()`

1. Feature-detect. Throw when `typeof LanguageDetector === 'undefined'`.
2. `const detector = await LanguageDetector.create({ signal });`
3. `const [best] = await detector.detect(text, { signal });`
4. Return `{ language: best.detectedLanguage, confidence: best.confidence }`.
5. Call `detector.destroy()` in `finally`.

## Step 2 · Translate the cues: `translateCues()`

1. Feature-detect. Throw when `typeof Translator === 'undefined'`.
2. `await Translator.availability({ sourceLanguage, targetLanguage })`. Throw
   when the pair is `'unavailable'`.
3. Create one translator for all cues:
   `await Translator.create({ sourceLanguage, targetLanguage, signal })`.
4. For each cue, `await translator.translate(cue.text, { signal })`. Return
   new cues, `{ ...cue, text }`. Never touch `start` and `end`.
5. Call `translator.destroy()` in `finally`.

<details>
<summary>Hint</summary>

```ts
const translator = await Translator.create({ sourceLanguage, targetLanguage, signal });
try {
  const translated: Cue[] = [];
  for (const cue of cues) {
    const text = await translator.translate(cue.text, { signal });
    translated.push({ ...cue, text });
  }
  return translated;
} finally {
  translator.destroy();
}
```

</details>

## Try it

1. **Detect language** on the Polish request: `pl` with its confidence.
2. Replace the text with an English sentence and detect again.
3. **Translate captions** to Polish. The badge says **timing unchanged**.
4. Pick another target language. With the simulation every pair except
   English → Polish is unavailable, which is the error path of step 2.

## Done when

The request is detected as `pl`, and the cue times are identical before and
after translation. `npm run lab:check 4` shows 12 green checks.

## Notice

- A very short text gives a low confidence. Decide what your app does below a
  threshold.
- Translating before reasoning can lose nuance.
- A language the Prompt API supports and a pair the Translator supports are
  different availability checks.

## Stretch

Write `translateRequest(text)`: detect the language, and when it is not
English translate the text to English with a second translator. That is the
"Polish in" half of the concierge chain.
