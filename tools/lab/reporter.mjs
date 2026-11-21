/**
 * A compact Vitest reporter for the lab checks: one line per check, and the
 * first line of the reason when a check fails.
 */

const color = (code) => (text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const green = color(32);
const red = color(31);
const yellow = color(33);
const dim = color(2);
const bold = color(1);

function firstLine(error) {
  const message = String(error?.message ?? error ?? 'failed');
  return message.split('\n')[0];
}

function printSuite(suite, indent) {
  console.log(`${indent}${bold(suite.name)}`);
  for (const child of suite.children) {
    if (child.type === 'suite') {
      printSuite(child, `${indent}  `);
      continue;
    }
    const result = child.result();
    if (result.state === 'passed') {
      console.log(`${indent}  ${green('✓')} ${child.name}`);
    } else if (result.state === 'skipped') {
      console.log(`${indent}  ${dim(`– ${child.name} (not attempted)`)}`);
    } else {
      console.log(`${indent}  ${red('✗')} ${child.name}`);
      for (const error of result.errors ?? []) {
        const isTodo = error?.name === 'LabTodo';
        const paint = isTodo ? yellow : red;
        console.log(`${indent}      ${paint(firstLine(error))}`);
      }
    }
  }
}

export default class LabReporter {
  onTestRunEnd(testModules, unhandledErrors) {
    let passed = 0;
    let failed = 0;
    console.log('');
    for (const testModule of testModules) {
      // A module that could not even load has no checks, only errors.
      for (const error of testModule.errors()) {
        console.log(`  ${red('✗')} ${testModule.moduleId}`);
        console.log(`      ${red(firstLine(error))}`);
        failed++;
      }
      for (const child of testModule.children) {
        if (child.type === 'suite') printSuite(child, '  ');
      }
      for (const test of testModule.children.allTests()) {
        const state = test.result().state;
        if (state === 'passed') passed++;
        else if (state === 'failed') failed++;
      }
      console.log('');
    }
    for (const error of unhandledErrors) {
      console.log(`  ${red('Unhandled error:')} ${firstLine(error)}`);
      failed++;
    }

    const total = passed + failed;
    if (failed === 0) {
      console.log(`  ${green(`All ${total} checks pass.`)}\n`);
    } else {
      console.log(`  ${bold(`${passed} of ${total} checks pass.`)} ${dim('Stuck? npm run lab:solve <number>')}\n`);
    }
  }
}
