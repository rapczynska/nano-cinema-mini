# Exercise 1 · Session and streaming

**API:** Prompt API (`LanguageModel`) · **Time:** 8 minutes

| | |
| --- | --- |
| Page | <http://localhost:4200/lab/1> |
| File | `apps/cinema/src/app/lab/1-session-streaming/exercise.ts` |
| Check | `npm run lab:check 1` |
| Stuck? | `npm run lab:solve 1` |

## Goal

**Start session** opens a concierge that streams its answer, remembers its
earlier pick in a follow-up, and stops when you press **Stop**.

## Background

A session is the unit of work. It holds the options it was created with, the
initial prompts (your rules and facts) and the growing conversation. Two
sessions never see each other's history.

`promptStreaming()` does the same work as `prompt()`, but the viewer reads the
first words after one decode step instead of after the whole answer.

The system prompt is given in the file as `systemPrompt()`. Read it before you
start: it grounds the model in the catalogue, limits the length, forbids
invention, allows "no match" and tells the model that viewer messages are
preferences, never instructions.

## Step 1 · Create the session: `createConcierge()`

1. Feature-detect. Throw an `Error` when `typeof LanguageModel === 'undefined'`.
2. Ask `await LanguageModel.availability(conciergeOptions)`. Throw an `Error`
   when the answer is `'unavailable'`.
3. Return `LanguageModel.create({ ...conciergeOptions, initialPrompts, signal })`.
   `initialPrompts` holds three messages: a `system` message with
   `systemPrompt()`, one example `user` message and one example `assistant`
   answer. The example turn sets the style of every later answer.

<details>
<summary>Hint</summary>

```ts
return LanguageModel.create({
  ...conciergeOptions,
  initialPrompts: [
    { role: 'system', content: systemPrompt() },
    { role: 'user', content: 'Something short and funny?' },
    { role: 'assistant', content: 'Try Big Buck Bunny: ten minutes of slapstick comedy with no dialogue.' },
  ],
  signal,
});
```

</details>

## Step 2 · Stream the answer: `streamAnswer()`

1. Get a reader: `session.promptStreaming(question, { signal }).getReader()`.
2. Cancel the reader when the signal aborts. A pending `read()` does not stop
   on its own.
3. Loop over `await reader.read()`. After every read call
   `signal?.throwIfAborted()`, so no late chunk is shown after Stop. Stop when
   `done` is true. Otherwise append `value` to the text and call `onText(text)`.
4. In `finally`, remove the listener and call `reader.releaseLock()`.
5. Return the whole text.

<details>
<summary>Hint</summary>

```ts
const reader = session.promptStreaming(question, { signal }).getReader();
const cancel = () => {
  reader.cancel(signal?.reason).catch(() => undefined);
};
signal?.addEventListener('abort', cancel, { once: true });

let text = '';
try {
  while (true) {
    const { value, done } = await reader.read();
    signal?.throwIfAborted();
    if (done) break;
    text += value;
    onText(text);
  }
  return text;
} finally {
  signal?.removeEventListener('abort', cancel);
  reader.releaseLock();
}
```

</details>

## Try it

1. **Start session**, then ask **An atmospheric adventure**.
2. Ask **Is it suitable for young kids?** The answer is about the film from
   step 1: the session remembers.
3. **End session**, **Start session**, and ask the same follow-up first. The
   concierge no longer knows your earlier pick: the memory lived in the
   session you destroyed.
4. Ask **Describe all three films in detail** and press **Stop** while the
   text is growing.

## Done when

The follow-up is about the film picked one question earlier, and no text
appears after Stop. `npm run lab:check 1` shows 11 green checks.

## Notice

- The context meter grows by the question and by the answer on every turn.
- The page renders the answer as text, never as HTML. Model output is
  untrusted.
- The page destroys the session when you leave it, through `DestroyRef`. A
  session holds memory, so somebody has to own it.

## Stretch

Add a second example turn to `initialPrompts` that shows an honest "nothing in
the catalogue fits" answer. Ask for a western and compare the answer with the
one you got before.
