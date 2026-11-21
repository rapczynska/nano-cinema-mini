import { Component, inject, signal } from '@angular/core';
import type { AiAvailability, AiCreateMonitorCallback } from '@nano-cinema/browser-ai';
import { AiMode } from '../core/ai-mode';

type State = AiAvailability | 'missing' | 'error' | 'unchecked';

interface Row {
  readonly name: string;
  readonly options: string;
  readonly usedIn: string;
  /** Is the global there at all? */
  exists(): boolean;
  availability(): Promise<AiAvailability>;
  /** Creates the object once, which downloads the model if needed. */
  prepare(monitor: AiCreateMonitorCallback): Promise<{ destroy(): void }>;
}

const promptOptions: LanguageModelCreateCoreOptions = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

const summarizerOptions: SummarizerCreateCoreOptions = {
  type: 'key-points',
  length: 'short',
  format: 'markdown',
  expectedInputLanguages: ['en'],
  outputLanguage: 'en',
};

const pair: TranslatorCreateCoreOptions = { sourceLanguage: 'en', targetLanguage: 'pl' };

/**
 * Availability is a state of this device and these exact options, so every
 * row asks with the options its lab uses.
 */
const ROWS: readonly Row[] = [
  {
    name: 'Prompt API',
    options: 'text in, text out, English',
    usedIn: 'Labs 1 and 2',
    exists: () => typeof LanguageModel !== 'undefined',
    availability: () => LanguageModel.availability(promptOptions),
    prepare: (monitor) => LanguageModel.create({ ...promptOptions, monitor }),
  },
  {
    name: 'Summarizer',
    options: 'key-points, short, markdown, English',
    usedIn: 'Lab 3',
    exists: () => typeof Summarizer !== 'undefined',
    availability: () => Summarizer.availability(summarizerOptions),
    prepare: (monitor) => Summarizer.create({ ...summarizerOptions, monitor }),
  },
  {
    name: 'Language Detector',
    options: 'default options',
    usedIn: 'Lab 4',
    exists: () => typeof LanguageDetector !== 'undefined',
    availability: () => LanguageDetector.availability(),
    prepare: (monitor) => LanguageDetector.create({ monitor }),
  },
  {
    name: 'Translator',
    options: 'English → Polish',
    usedIn: 'Lab 4',
    exists: () => typeof Translator !== 'undefined',
    availability: () => Translator.availability(pair),
    prepare: (monitor) => Translator.create({ ...pair, monitor }),
  },
];

@Component({
  selector: 'nc-preflight',
  template: `
    <div class="page stack">
      <p class="kicker">Preflight</p>
      <h1>What can this device run?</h1>
      <p class="muted lead">
        Each row asks <code>availability()</code> with the options its lab uses. A model that is
        <code>downloadable</code> needs one click on Prepare: the download only starts after a user action.
      </p>

      <div class="row">
        <button class="btn primary" type="button" (click)="check()" [disabled]="checking()">Check this device</button>
        <span class="muted">Mode: {{ ai.simulated() ? 'simulated browser AI' : 'native browser AI' }}</span>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>API</th>
              <th>Asked with</th>
              <th>Used in</th>
              <th>State</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows; track row.name; let i = $index) {
              <tr>
                <td>
                  <strong>{{ row.name }}</strong>
                </td>
                <td class="muted">{{ row.options }}</td>
                <td class="muted">{{ row.usedIn }}</td>
                <td>
                  <span class="badge" [class]="tone(states()[i])">{{ states()[i] }}</span>
                  @if (progress()[i] !== null) {
                    <progress [value]="progress()[i]" max="1"></progress>
                  }
                </td>
                <td>
                  @if (states()[i] === 'downloadable' || states()[i] === 'downloading') {
                    <button class="btn small" type="button" (click)="prepare(i)" [disabled]="progress()[i] !== null">
                      Prepare
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (message()) {
        <p class="muted" role="status">{{ message() }}</p>
      }

      <div class="card stack help">
        <h2>If something is missing</h2>
        <ul>
          <li>Use a current desktop Chrome. The built-in AI APIs do not run on phones.</li>
          <li>Chrome needs about 22 GB of free disk space before it downloads the model.</li>
          <li>Check that on-device AI is switched on in Chrome's settings, under System.</li>
          <li>
            Or tick <strong>Use simulated browser AI</strong> at the top: every lab then runs against a stand-in with
            the same API shape.
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: `
    .lead {
      max-width: 68ch;
    }
    progress {
      display: block;
      margin-top: 6px;
      max-width: 160px;
    }
    .help ul {
      margin: 0;
      padding-left: 20px;
    }
    .help li + li {
      margin-top: 6px;
    }
  `,
})
export class Preflight {
  protected readonly ai = inject(AiMode);
  protected readonly rows = ROWS;
  protected readonly states = signal<State[]>(ROWS.map(() => 'unchecked'));
  protected readonly progress = signal<(number | null)[]>(ROWS.map(() => null));
  protected readonly checking = signal(false);
  protected readonly message = signal('');

  protected tone(state: State): string {
    if (state === 'available') return 'ok';
    if (state === 'downloadable' || state === 'downloading') return 'warn';
    if (state === 'unchecked') return 'idle';
    return 'bad';
  }

  protected async check(): Promise<void> {
    this.checking.set(true);
    this.message.set('');
    const states = await Promise.all(ROWS.map((row) => this.#stateOf(row)));
    this.states.set(states);
    this.checking.set(false);
    const ready = states.filter((state) => state === 'available').length;
    this.message.set(`${ready} of ${states.length} APIs are ready on this device.`);
  }

  protected async prepare(index: number): Promise<void> {
    const row = ROWS[index];
    this.#setProgress(index, 0);
    try {
      const created = await row.prepare((monitor) => {
        monitor.addEventListener('downloadprogress', (event) => this.#setProgress(index, event.loaded));
      });
      created.destroy();
      this.message.set(`${row.name} is prepared.`);
    } catch (error) {
      this.message.set(`${row.name} could not be prepared: ${describe(error)}`);
    } finally {
      this.#setProgress(index, null);
      const state = await this.#stateOf(row);
      this.states.update((states) => states.map((old, i) => (i === index ? state : old)));
    }
  }

  async #stateOf(row: Row): Promise<State> {
    if (!row.exists()) return 'missing';
    try {
      return await row.availability();
    } catch {
      return 'error';
    }
  }

  #setProgress(index: number, value: number | null): void {
    this.progress.update((all) => all.map((old, i) => (i === index ? value : old)));
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
