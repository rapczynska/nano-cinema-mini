import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { findMovie } from '@nano-cinema/catalogue';
import { openConciergeSession } from '../shared/concierge-session';
import { LabFrame } from '../shared/lab-frame';
import { LabLog } from '../shared/lab-log';
import { LabTodo } from '../shared/todo';
import { recommend, type Recommendation, recommendationSchema } from './exercise';

/**
 * The page of Exercise 2. You do not need to change it: it calls the
 * functions you write in ./exercise.ts.
 */
@Component({
  selector: 'nc-lab-2',
  imports: [LabFrame, RouterLink],
  template: `
    <nc-lab-frame
      [number]="2"
      api="Prompt API"
      title="Structured output"
      goal="Recommend (with schema) shows a Validated card whose button opens a real film page. Anything else is rejected in the log."
      [steps]="steps"
      folder="2-structured-output"
      [minutes]="7"
      doneWhen="“Show me Titanic” still returns valid JSON, and you can say why that answer is wrong."
      [log]="log"
    >
      <div class="card stack">
        <form class="stack" (submit)="run($event)">
          <label>
            What would you like to watch?
            <input type="text" [value]="request()" (input)="request.set($any($event.target).value)" />
          </label>
          <div class="row">
            @for (chip of chips; track chip) {
              <button class="chip" type="button" (click)="request.set(chip)" [disabled]="busy()">{{ chip }}</button>
            }
          </div>
          <div class="row">
            <button class="btn primary" type="submit" [disabled]="busy()">Recommend (with schema)</button>
            @if (busy()) {
              <span class="muted">Local AI task running…</span>
            }
          </div>
        </form>

        @if (result(); as result) {
          <div class="result stack">
            @if (movie(); as movie) {
              <span class="badge ok">validated</span>
              <h2>{{ movie.title }}</h2>
              <p>{{ result.reason }}</p>
              <a class="btn" [routerLink]="['/movies', movie.id]">Open film</a>
            } @else {
              <span class="badge warn">no match</span>
              <p>{{ result.reason }}</p>
            }
          </div>
        }
        @if (rejected(); as rejected) {
          <div class="result stack">
            <span class="badge bad">rejected</span>
            <p>{{ rejected }}</p>
          </div>
        }
      </div>

      <div class="card stack">
        <h3>The schema your code sends as <code>responseConstraint</code></h3>
        <pre class="code">{{ schema() }}</pre>
      </div>
    </nc-lab-frame>
  `,
  styles: `
    .result {
      align-items: flex-start;
      border-top: 1px solid var(--border);
      padding-top: 14px;
    }
  `,
})
export class Lab2Page {
  protected readonly log = new LabLog();
  protected readonly request = signal('A playful comedy with no dialogue');
  protected readonly busy = signal(false);
  protected readonly result = signal<Recommendation | null>(null);
  protected readonly rejected = signal<string | null>(null);
  protected readonly movie = computed(() => findMovie(this.result()?.movieId ?? ''));

  protected readonly schema = signal(describeSchema());

  protected readonly steps = [
    'Describe the answer as a JSON Schema with an enum of catalogue ids',
    'Validate: turn unknown JSON into a trusted Recommendation',
    'Ask with responseConstraint, parse, validate',
  ];

  protected readonly chips = ['A playful comedy with no dialogue', 'Something good', 'Show me Titanic'];

  #session: LanguageModel | null = null;
  #controller = new AbortController();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.#controller.abort();
      this.#session?.destroy();
    });
  }

  protected async run(event: Event): Promise<void> {
    event.preventDefault();
    const request = this.request().trim();
    if (!request || this.busy()) return;

    this.busy.set(true);
    this.result.set(null);
    this.rejected.set(null);
    this.schema.set(describeSchema());
    try {
      this.#session ??= await openConciergeSession(this.#controller.signal);
      const recommendation = await recommend(this.#session, request, this.#controller.signal);
      this.result.set(recommendation);
      this.log.ok(`recommend(): ${JSON.stringify(recommendation)}`);
    } catch (error) {
      if (!(error instanceof LabTodo)) {
        this.rejected.set(error instanceof Error ? error.message : String(error));
      }
      this.log.fail('recommend()', error);
    } finally {
      this.busy.set(false);
    }
  }
}

function describeSchema(): string {
  try {
    return JSON.stringify(recommendationSchema(), null, 2);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
