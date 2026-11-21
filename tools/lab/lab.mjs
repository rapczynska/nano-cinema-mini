#!/usr/bin/env node
/**
 * The lab helper of the mini workshop.
 *
 *   npm run lab:check 1     run the checks of exercise 1 (or "all")
 *   npm run lab:solve 1     copy the solution over your exercise file
 *   npm run lab:reset 1     put the starter back
 *   npm run lab:status      which exercises are open, changed or solved
 *   npm run lab:verify      trainers: run every check against the solutions
 *
 * solve and reset keep a copy of your file in tmp/lab-backup/ first.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const EXERCISES = [
  { number: '1', folder: '1-session-streaming', title: 'Session and streaming' },
  { number: '2', folder: '2-structured-output', title: 'Structured output' },
  { number: '3', folder: '3-summarizer', title: 'Summarizer' },
  { number: '4', folder: '4-translation', title: 'Detect and translate' },
];

const paths = (exercise) => ({
  work: join(root, 'apps/cinema/src/app/lab', exercise.folder, 'exercise.ts'),
  starter: join(root, 'tools/lab/starters', exercise.folder, 'exercise.ts'),
  solution: join(root, 'workshop/solutions', exercise.folder, 'exercise.ts'),
  check: join('tools/lab/checks', `${exercise.folder}.check.ts`),
});

const show = (file) => relative(root, file).replaceAll('\\', '/');

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

/** "1", "1-session-streaming" or "all" → the exercises meant. */
function select(which) {
  if (!which) fail('Which exercise? Give a number from 1 to 4, or "all".');
  if (which === 'all') return EXERCISES;
  const found = EXERCISES.find((exercise) => exercise.number === which || exercise.folder === which);
  if (!found) fail(`There is no exercise "${which}". Use a number from 1 to 4, or "all".`);
  return [found];
}

function backup(exercise) {
  const { work } = paths(exercise);
  if (!existsSync(work)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = join(root, 'tmp/lab-backup', exercise.folder, `exercise-${stamp}.ts`);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(work, target);
  return target;
}

function replaceWith(kind, which) {
  for (const exercise of select(which)) {
    const { work } = paths(exercise);
    const source = paths(exercise)[kind];
    const same = existsSync(work) && readFileSync(work, 'utf8') === readFileSync(source, 'utf8');
    if (same) {
      console.log(`  Exercise ${exercise.number}: already the ${kind}.`);
      continue;
    }
    const saved = backup(exercise);
    mkdirSync(dirname(work), { recursive: true });
    copyFileSync(source, work);
    console.log(`  Exercise ${exercise.number}: ${show(work)} is now the ${kind}.`);
    if (saved) console.log(`               Your version is kept in ${show(saved)}`);
  }
}

function check(which, againstSolutions) {
  const files = select(which).map((exercise) => paths(exercise).check);
  const vitest = join(root, 'node_modules/vitest/vitest.mjs');
  if (!existsSync(vitest)) fail('Dependencies are missing. Run "npm install" first.');
  if (againstSolutions) console.log('\n  Checking the SOLUTIONS in workshop/solutions, not your exercise files.');
  const result = spawnSync(
    process.execPath,
    [vitest, 'run', '--config', 'tools/lab/vitest.config.mts', ...files],
    {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, LAB_SOLUTIONS: againstSolutions ? '1' : '' },
    },
  );
  process.exit(result.status ?? 1);
}

function status() {
  console.log('');
  for (const exercise of EXERCISES) {
    const { work, starter, solution } = paths(exercise);
    const text = existsSync(work) ? readFileSync(work, 'utf8') : null;
    let state = 'changed by you';
    if (text === null) state = 'missing: run "npm run lab:reset ' + exercise.number + '"';
    else if (text === readFileSync(starter, 'utf8')) state = 'open (starter)';
    else if (text === readFileSync(solution, 'utf8')) state = 'solved (the solution)';
    console.log(`  ${exercise.number} · ${exercise.title.padEnd(24)} ${state}`);
  }
  console.log('');
}

function help() {
  console.log(`
  npm run lab:check <1-4|all>   run the checks of an exercise
  npm run lab:solve <1-4|all>   copy the solution over your exercise file
  npm run lab:reset <1-4|all>   put the starter back
  npm run lab:status            which exercises are open, changed or solved
  npm run lab:verify            run every check against the solutions
`);
}

const [command, ...args] = process.argv.slice(2);
const which = args.find((arg) => !arg.startsWith('--'));

switch (command) {
  case 'check':
    check(which, args.includes('--solutions'));
    break;
  case 'solve':
    replaceWith('solution', which);
    break;
  case 'reset':
    replaceWith('starter', which);
    break;
  case 'status':
    status();
    break;
  default:
    help();
}
