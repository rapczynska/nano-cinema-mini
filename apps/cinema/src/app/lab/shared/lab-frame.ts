import { Component, input } from '@angular/core';
import { LabLog } from './lab-log';

/**
 * The frame around every lab page: the brief on the right, the playground
 * (projected content) and the event log on the left.
 */
@Component({
  selector: 'nc-lab-frame',
  template: `
    <div class="page stack">
      <p class="kicker">Exercise {{ number() }} · {{ api() }}</p>
      <h1>{{ title() }}</h1>
      <p class="goal"><strong>Goal:</strong> {{ goal() }}</p>

      <div class="grid">
        <section class="stack" aria-label="Playground">
          <ng-content />

          <div class="card log" aria-live="polite">
            <div class="row head">
              <h3>Log</h3>
              <button class="btn small" type="button" (click)="log().clear()">Clear</button>
            </div>
            @for (entry of log().entries(); track $index) {
              <p class="entry" [class]="entry.kind">
                <span class="time">{{ entry.time }}</span> {{ entry.text }}
              </p>
            } @empty {
              <p class="muted">Nothing yet. Press a button above.</p>
            }
          </div>
        </section>

        <aside class="card strong stack brief">
          <span class="badge bad">{{ minutes() }} min</span>
          <ol>
            @for (step of steps(); track $index) {
              <li>{{ step }}</li>
            }
          </ol>
          <dl>
            <dt>File</dt>
            <dd>apps/cinema/src/app/lab/{{ folder() }}/exercise.ts</dd>
            <dt>Guide</dt>
            <dd>workshop/exercises/{{ folder() }}.md</dd>
            <dt>Check</dt>
            <dd>npm run lab:check {{ number() }}</dd>
            <dt>Stuck?</dt>
            <dd>npm run lab:solve {{ number() }}</dd>
          </dl>
          <p class="done"><strong>Done when:</strong> {{ doneWhen() }}</p>
        </aside>
      </div>
    </div>
  `,
  styles: `
    .goal {
      font-size: 1.08rem;
      max-width: 75ch;
    }
    .grid {
      align-items: start;
      display: grid;
      gap: 22px;
      grid-template-columns: minmax(0, 1.55fr) minmax(280px, 1fr);
      margin-top: 8px;
    }
    @media (max-width: 900px) {
      .grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .brief {
      border-color: var(--pink);
      position: sticky;
      top: 76px;
    }
    .brief .badge {
      align-self: flex-start;
    }
    ol {
      counter-reset: step;
      display: flex;
      flex-direction: column;
      gap: 10px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    ol li {
      counter-increment: step;
      font-weight: 600;
      padding-left: 38px;
      position: relative;
    }
    ol li::before {
      background: var(--violet);
      border-radius: 6px;
      content: counter(step);
      display: grid;
      font-size: 0.85rem;
      height: 26px;
      left: 0;
      place-items: center;
      position: absolute;
      top: -1px;
      width: 26px;
    }
    dl {
      display: grid;
      gap: 4px 12px;
      grid-template-columns: auto minmax(0, 1fr);
      margin: 0;
    }
    dt {
      font-weight: 700;
    }
    dd {
      color: var(--muted);
      font-family: var(--mono);
      font-size: 0.82rem;
      margin: 0;
      overflow-wrap: anywhere;
    }
    .done {
      background: var(--pink-soft);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .done strong {
      color: var(--pink);
    }
    .head {
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .entry {
      border-top: 1px solid var(--border);
      font-family: var(--mono);
      font-size: 0.82rem;
      overflow-wrap: anywhere;
      padding: 6px 0;
    }
    .entry .time {
      color: var(--muted);
    }
    .entry.ok {
      color: var(--green);
    }
    .entry.todo {
      color: var(--amber);
    }
    .entry.error {
      color: var(--pink);
    }
  `,
})
export class LabFrame {
  readonly number = input.required<number>();
  readonly api = input.required<string>();
  readonly title = input.required<string>();
  readonly goal = input.required<string>();
  readonly steps = input.required<readonly string[]>();
  readonly folder = input.required<string>();
  readonly minutes = input.required<number>();
  readonly doneWhen = input.required<string>();
  readonly log = input.required<LabLog>();
}
