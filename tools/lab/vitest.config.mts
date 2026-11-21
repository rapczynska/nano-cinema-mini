import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = resolve(import.meta.dirname, '../..');

// "npm run lab:verify" checks the solutions instead of your exercise files.
const exercises = process.env['LAB_SOLUTIONS']
  ? resolve(root, 'workshop/solutions')
  : resolve(root, 'apps/cinema/src/app/lab');

export default defineConfig({
  root,
  resolve: {
    alias: {
      '@nano-cinema/catalogue': resolve(root, 'libs/catalogue/src/index.ts'),
      '@nano-cinema/browser-ai': resolve(root, 'libs/browser-ai/src/index.ts'),
      '@exercise': exercises,
    },
  },
  test: {
    environment: 'node',
    include: ['tools/lab/checks/*.check.ts'],
    reporters: ['./tools/lab/reporter.mjs'],
    watch: false,
  },
});
