import { Component, DestroyRef, inject, signal } from '@angular/core';
import { LabFrame } from '../shared/lab-frame';
import { LabLog } from '../shared/lab-log';
import { createConcierge, streamAnswer } from './exercise';

/**
 * The page of Exercise 1. You do not need to change it: it calls the two
 * functions you write in ./exercise.ts.
 */
@Component({
  selector: 'nc-lab-1',
  imports: [LabFrame],
  template: `
    <nc-lab-frame
      [number]="1"
      api="Prompt API"
      title="Session and streaming"
      goal="Start session opens a concierge that streams its answer, remembers its earlier pick in a follow-up, and stops when you press Stop."
      [steps]="steps"
      folder="1-session-streaming"
      [minutes]="8"
      doneWhen="the follow-up “Is it suitable for young kids?” is about the film picked one question earlier, and no text appears after Stop."
      [log]="log"
    >
      <div class="card stack">
        <div class="row">
          <button class="btn primary" type="button" (click)="start()" [disabled]="!!session() || starting()">
            Start session
          </button>
          <button class="btn" type="button" (click)="end()" [disabled]="!session() || busy()">End session</button>
          <span class="badge" [class]="session() ? 'ok' : 'idle'">
            {{ session() ? 'session open' : 'no session' }}
          </span>
          @if (usage(); as usage) {
            <span class="muted meter">Context: {{ usage.used }} / {{ usage.total }} tokens</span>
          }
        </div>

        <form class="stack" (submit)="ask($event)">
          <label>
            Ask the concierge
            <input type="text" [value]="question()" (input)="question.set($any($event.target).value)" />
          </label>
          <div class="row">
            @for (chip of chips; track chip) {
              <button class="chip" type="button" (click)="question.set(chip)" [disabled]="busy()">{{ chip }}</button>
            }
          </div>
          <div class="row">
            <button class="btn primary" type="submit" [disabled]="!session() || busy()">Ask (streaming)</button>
            <button class="btn" type="button" (click)="stop()" [disabled]="!busy()">Stop</button>
            @if (busy()) {
              <span class="muted">Local AI task running…</span>
            }
          </div>
        </form>

        <p class="output" data-placeholder="The answer streams in here.">{{ answer() }}</p>
        @if (timing(); as timing) {
          <p class="muted">First text after {{ timing.first }} ms · whole answer after {{ timing.total }} ms</p>
        }
      </div>
    </nc-lab-frame>
  `,
  styles: `
    .meter {
      font-family: var(--mono);
      font-size: 0.85rem;
    }
  `,
})
export class Lab1Page {
  protected readonly log = new LabLog();
  protected readonly session = signal<LanguageModel | null>(null);
  protected readonly starting = signal(false);
  protected readonly busy = signal(false);
  protected readonly question = signal('An atmospheric adventure');
  protected readonly answer = signal('');
  protected readonly usage = signal<{ used: number; total: number } | null>(null);
  protected readonly timing = signal<{ first: number; total: number } | null>(null);

  protected readonly steps = [
    'Create the session: detect, availability(), create() with initialPrompts',
    'Stream the answer: promptStreaming(), read chunk by chunk, honour Stop',
  ];

  protected readonly chips = [
    'An atmospheric adventure',
    'Something short and funny',
    'Is it suitable for young kids?',
    'Describe all three films in detail',
  ];

  #controller: AbortController | null = null;

  constructor() {
    // The session holds memory: it lives and dies with this component.
    inject(DestroyRef).onDestroy(() => {
      this.#controller?.abort();
      this.session()?.destroy();
    });
  }

  protected async start(): Promise<void> {
    this.starting.set(true);
    try {
      const session = await createConcierge();
      this.session.set(session);
      this.#readUsage();
      this.log.ok('createConcierge(): session open');
    } catch (error) {
      this.log.fail('createConcierge()', error);
    } finally {
      this.starting.set(false);
    }
  }

  protected end(): void {
    this.session()?.destroy();
    this.session.set(null);
    this.usage.set(null);
    this.answer.set('');
    this.timing.set(null);
    this.log.info('destroy(): the session is gone, the model stays on disk');
  }

  protected async ask(event: Event): Promise<void> {
    event.preventDefault();
    const session = this.session();
    const question = this.question().trim();
    if (!session || !question || this.busy()) return;

    this.#controller = new AbortController();
    this.busy.set(true);
    this.answer.set('');
    this.timing.set(null);
    const started = performance.now();
    let first: number | null = null;
    try {
      const text = await streamAnswer(
        session,
        question,
        (textSoFar) => {
          first ??= Math.round(performance.now() - started);
          this.answer.set(textSoFar);
        },
        this.#controller.signal,
      );
      this.answer.set(text);
      const total = Math.round(performance.now() - started);
      this.timing.set({ first: first ?? total, total });
      this.log.ok(`streamAnswer(): ${text.split(/\s+/).length} words in ${total} ms`);
    } catch (error) {
      this.log.fail('streamAnswer()', error);
    } finally {
      this.busy.set(false);
      this.#readUsage();
    }
  }

  protected stop(): void {
    this.#controller?.abort();
  }

  #readUsage(): void {
    const session = this.session();
    if (session) this.usage.set({ used: session.contextUsage, total: session.contextWindow });
  }
}
