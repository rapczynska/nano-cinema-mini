# Nano Cinema mini · AI at Zero Token Cost

The lab repository of the 45-minute edition of the **AI at Zero Token Cost**
workshop. It covers two blocks of the full-day workshop: the **Prompt API**
and the **task APIs** (Summarizer, Language Detector, Translator), all built
into Chrome and running on the device.

It is an [Nx](https://nx.dev) monorepo with one Angular app, **Nano Cinema**,
a small cinema that shows three open films. You complete four exercises
inside it: a slide or two, then an exercise.

## Quick start

```bash
npm install
npm start
```

Open <http://localhost:4200/preflight> and press **Check this device**.

You need Node 22.22.3 or newer (or Node 24.15 or newer) and npm. There are no
video files or models to download before the workshop.

## Native or simulated browser AI

The labs call the real globals: `LanguageModel`, `Summarizer`,
`LanguageDetector` and `Translator`.

- **Native.** A current desktop Chrome with on-device AI switched on runs them
  on Gemini Nano. The first use of a model needs a download: Preflight has a
  **Prepare** button for it, because a download only starts after a user
  action.
- **Simulated.** Tick **Use simulated browser AI** in the header and the four
  globals are replaced with a stand-in that has the same API shape. This is
  the default when the device cannot run the Prompt API, so every lab works on
  any laptop and in any browser.

The simulation shows how your code calls the APIs. It never shows the quality
of a real model: its "model" matches keywords, and its summaries are
extracted sentences. The page says clearly when it is on.

## The exercises

| # | Exercise | API | Time | Page | Guide |
| --- | --- | --- | --- | --- | --- |
| 1 | Session and streaming | Prompt API | 8 min | `/lab/1` | [guide](workshop/exercises/1-session-streaming.md) |
| 2 | Structured output | Prompt API | 7 min | `/lab/2` | [guide](workshop/exercises/2-structured-output.md) |
| 3 | Summarizer | Summarizer API | 7 min | `/lab/3` | [guide](workshop/exercises/3-summarizer.md) |
| 4 | Detect and translate | Language Detector + Translator | 7 min | `/lab/4` | [guide](workshop/exercises/4-translation.md) |

Every exercise is one file, `apps/cinema/src/app/lab/<exercise>/exercise.ts`,
with numbered steps in its comments. The page next to it already calls your
functions, so you only write the AI code.

| Command | What it does |
| --- | --- |
| `npm run lab:check 1` | Runs the checks of exercise 1. Use `all` for every exercise. |
| `npm run lab:solve 1` | Copies the solution over your exercise file. |
| `npm run lab:reset 1` | Puts the starter back. |
| `npm run lab:status` | Shows which exercises are open, changed or solved. |

`lab:solve` and `lab:reset` first save your file to `tmp/lab-backup/`. The
checks run in Node against the simulation, so they need no browser and no
model.

The solutions are in [`workshop/solutions`](workshop/solutions), one
`exercise.ts` per exercise.

## Run of show: 45 minutes

| Time | Part | Slides | Hands-on |
| --- | --- | --- | --- |
| 0:00 | Opening, setup, Preflight | 4 min | |
| 0:04 | Prompt API: sessions and streaming | 3 min | Exercise 1 · 8 min |
| 0:15 | Prompt API: structured output | 3 min | Exercise 2 · 7 min |
| 0:25 | Task APIs: Summarizer | 3 min | Exercise 3 · 7 min |
| 0:35 | Task APIs: detect and translate | 2 min | Exercise 4 · 7 min |
| 0:44 | Wrap-up | 1 min | |

Each exercise has a stretch step for people who finish early.

## What is where

```text
apps/cinema/                 the Angular app
  src/app/core/              native or simulated AI
  src/app/pages/             programme, film page, preflight
  src/app/lab/
    1-session-streaming/     exercise.ts (yours) and page.ts (given)
    2-structured-output/
    3-summarizer/
    4-translation/
    shared/                  lab frame, log, todo()
libs/catalogue/              the three films, programme notes, caption cues
libs/browser-ai/             types for the built-in AI APIs, the simulation
workshop/exercises/          one guide per exercise
workshop/solutions/          one solution per exercise
tools/lab/                   lab:check, lab:solve, lab:reset and the checks
```

Imports between projects use the aliases `@nano-cinema/catalogue` and
`@nano-cinema/browser-ai` from `tsconfig.base.json`.

## For trainers

```bash
npm run lab:verify     # every check against the solutions
npm run typecheck      # app, solutions and checks
npm run build          # production build of the app
```

Before the session, run the labs once in native mode on the presenting
laptop and prepare the models from Preflight. Answers from a real model are
worded differently on every run: judge the outcome, not the text.

## Good to know

- The Prompt API reads and writes English, Spanish, Japanese, German and
  French. It does not handle Polish, which is why Exercise 4 uses the
  Translator.
- The Prompt API names its budget `contextWindow`, `contextUsage` and
  `measureContextUsage()`. The task APIs use `inputQuota` and
  `measureInputUsage()`. Older articles use other names.
- Model output is untrusted. The pages render it as text, never as HTML, and
  Exercise 2 validates it in code.

## Credits

Sintel, Elephants Dream and Big Buck Bunny are open movies © Blender
Foundation, published under Creative Commons Attribution licences. The app
shows no video: it uses the films' titles and facts, and its own programme
notes.

The caption cues in Exercise 4 are the cinema's house announcements, written
for this lab.
