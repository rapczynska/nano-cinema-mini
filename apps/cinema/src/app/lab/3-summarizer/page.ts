import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { findMovie, movies } from '@nano-cinema/catalogue';
import { LabFrame } from '../shared/lab-frame';
import { LabLog } from '../shared/lab-log';
import { summarize, summarizeStreaming, summaryOptions } from './exercise';

/**
 * The page of Exercise 3. You do not need to change it: it calls the
 * functions you write in ./exercise.ts.
 */
@Component({
  selector: 'nc-lab-3',
  imports: [LabFrame],
  template: `
    <nc-lab-frame
      [number]="3"
      api="Summarizer API"
      title="Summarizer"
      goal="Summarize turns a film's programme notes into a summary whose shape follows the drop-downs: a paragraph for tldr, a list for key-points, one line for headline."
      [steps]="steps"
      folder="3-summarizer"
      [minutes]="7"
      doneWhen="switching the type visibly changes the shape of the result, and the log shows destroy() after every run."
      [log]="log"
    >
      <div class="card stack">
        <div class="controls">
          <label>
            Programme notes of
            <select [value]="movieId()" (change)="movieId.set($any($event.target).value)">
              @for (movie of movies; track movie.id) {
                <option [value]="movie.id">{{ movie.title }}</option>
              }
            </select>
          </label>
          <label>
            type
            <select [value]="type()" (change)="type.set($any($event.target).value)">
              @for (option of types; track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
          </label>
          <label>
            length
            <select [value]="length()" (change)="length.set($any($event.target).value)">
              @for (option of lengths; track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
          </label>
          <label>
            format
            <select [value]="format()" (change)="format.set($any($event.target).value)">
              @for (option of formats; track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
          </label>
        </div>

        <div class="row">
          <button class="btn primary" type="button" (click)="run(false)" [disabled]="busy()">Summarize</button>
          <button class="btn" type="button" (click)="run(true)" [disabled]="busy()">Summarize (streaming) · stretch</button>
          <button class="btn" type="button" (click)="stop()" [disabled]="!busy()">Stop</button>
        </div>
        @if (download() !== null) {
          <label>
            Preparing the model
            <progress [value]="download()" max="1"></progress>
          </label>
        }

        <p class="output" data-placeholder="The summary appears here.">{{ summary() }}</p>
        @if (timing(); as timing) {
          <p class="muted">{{ timing }}</p>
        }

        <details>
          <summary>Source: the programme notes ({{ words() }} words)</summary>
          <p class="notes muted">{{ notes() }}</p>
        </details>
      </div>
    </nc-lab-frame>
  `,
  styles: `
    .controls {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
    .notes {
      margin-top: 10px;
      white-space: pre-wrap;
    }
  `,
})
export class Lab3Page {
  protected readonly log = new LabLog();
  protected readonly movies = movies;
  protected readonly types: readonly SummarizerType[] = ['key-points', 'tldr', 'teaser', 'headline'];
  protected readonly lengths: readonly SummarizerLength[] = ['short', 'medium', 'long'];
  protected readonly formats: readonly SummarizerFormat[] = ['markdown', 'plain-text'];

  protected readonly movieId = signal<string>('sintel');
  protected readonly type = signal<SummarizerType>('key-points');
  protected readonly length = signal<SummarizerLength>('short');
  protected readonly format = signal<SummarizerFormat>('markdown');

  protected readonly busy = signal(false);
  protected readonly download = signal<number | null>(null);
  protected readonly summary = signal('');
  protected readonly timing = signal('');

  protected readonly notes = computed(() => findMovie(this.movieId())?.notes ?? '');
  protected readonly words = computed(() => this.notes().split(/\s+/).length);

  protected readonly steps = [
    'Describe the summary: type, length, format and languages',
    'Summarize: availability() → create() with a monitor → summarize() → destroy()',
    'Stretch: stream the summary with summarizeStreaming()',
  ];

  #controller: AbortController | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#controller?.abort());
  }

  protected async run(streaming: boolean): Promise<void> {
    if (this.busy()) return;
    const where = streaming ? 'summarizeStreaming()' : 'summarize()';
    this.#controller = new AbortController();
    this.busy.set(true);
    this.summary.set('');
    this.timing.set('');
    const hooks = {
      signal: this.#controller.signal,
      onDownloadProgress: (loaded: number) => this.download.set(loaded),
    };
    const started = performance.now();
    let first: number | null = null;
    try {
      const options = summaryOptions(this.type(), this.length(), this.format());
      const text = streaming
        ? await summarizeStreaming(
            this.notes(),
            options,
            (textSoFar) => {
              first ??= Math.round(performance.now() - started);
              this.summary.set(textSoFar);
            },
            hooks,
          )
        : await summarize(this.notes(), options, hooks);
      this.summary.set(text);
      const total = Math.round(performance.now() - started);
      this.timing.set(
        first === null ? `Whole summary after ${total} ms` : `First text after ${first} ms · whole summary after ${total} ms`,
      );
      this.log.ok(`${where}: ${options.type}, ${options.length}, ${options.format} in ${total} ms`);
    } catch (error) {
      this.log.fail(where, error);
    } finally {
      this.busy.set(false);
      this.download.set(null);
    }
  }

  protected stop(): void {
    this.#controller?.abort();
  }
}
