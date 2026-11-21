import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { announcementCues, type Cue, formatCueTime, polishRequest } from '@nano-cinema/catalogue';
import { AiMode } from '../../core/ai-mode';
import { LabFrame } from '../shared/lab-frame';
import { LabLog } from '../shared/lab-log';
import { type DetectedLanguage, detectLanguage, translateCues } from './exercise';

/**
 * The page of Exercise 4. You do not need to change it: it calls the two
 * functions you write in ./exercise.ts.
 */
@Component({
  selector: 'nc-lab-4',
  imports: [LabFrame],
  template: `
    <nc-lab-frame
      [number]="4"
      api="Language Detector + Translator"
      title="Detect and translate"
      goal="Detect language recognises a Polish request, and Translate captions shows the cinema's announcements in Polish with every cue keeping its start and end time."
      [steps]="steps"
      folder="4-translation"
      [minutes]="7"
      doneWhen="the request is detected as pl, and the cue times are identical before and after translation."
      [log]="log"
    >
      <div class="card stack">
        <h3>Polish in</h3>
        <label>
          A viewer writes
          <textarea [value]="request()" (input)="request.set($any($event.target).value)"></textarea>
        </label>
        <div class="row">
          <button class="btn primary" type="button" (click)="detect()" [disabled]="busy()">Detect language</button>
          @if (detected(); as detected) {
            <span class="badge ok">{{ detected.language }}</span>
            <span class="muted">confidence {{ percent(detected.confidence) }}</span>
          }
        </div>
      </div>

      <div class="card stack">
        <h3>Polish out</h3>
        <div class="row end">
          <label>
            Translate the captions to
            <select [value]="target()" (change)="target.set($any($event.target).value)">
              <option value="pl">Polish (pl)</option>
              <option value="de">German (de)</option>
              <option value="ja">Japanese (ja)</option>
            </select>
          </label>
          <button class="btn primary" type="button" (click)="translate()" [disabled]="busy()">Translate captions</button>
          @if (translated()) {
            <span class="badge kept" [class]="timingKept() ? 'ok' : 'bad'">
              {{ timingKept() ? 'timing unchanged' : 'timing changed!' }}
            </span>
          }
        </div>
        @if (ai.simulated() && target() !== 'pl') {
          <p class="muted">The simulation only knows English → Polish. Any other pair answers “unavailable”.</p>
        }

        <table>
          <thead>
            <tr>
              <th>Start</th>
              <th>End</th>
              <th>English</th>
              <th>Translation</th>
            </tr>
          </thead>
          <tbody>
            @for (cue of cues; track cue.start; let i = $index) {
              <tr>
                <td class="time">{{ time(cue.start) }}</td>
                <td class="time">{{ time(cue.end) }}</td>
                <td>{{ cue.text }}</td>
                <td>
                  @if (translated()?.[i]; as line) {
                    {{ line.text }}
                    @if (line.start !== cue.start || line.end !== cue.end) {
                      <span class="badge bad">{{ time(line.start) }} – {{ time(line.end) }}</span>
                    }
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </nc-lab-frame>
  `,
  styles: `
    .kept {
      margin-bottom: 10px;
    }
  `,
})
export class Lab4Page {
  protected readonly ai = inject(AiMode);
  protected readonly log = new LabLog();
  protected readonly cues = announcementCues;
  protected readonly request = signal(polishRequest);
  protected readonly target = signal('pl');
  protected readonly busy = signal(false);
  protected readonly detected = signal<DetectedLanguage | null>(null);
  protected readonly translated = signal<Cue[] | null>(null);

  protected readonly timingKept = computed(() => {
    const translated = this.translated();
    return (
      !!translated &&
      translated.length === this.cues.length &&
      translated.every((cue, i) => cue.start === this.cues[i].start && cue.end === this.cues[i].end)
    );
  });

  protected readonly steps = [
    'Detect the language: create(), detect(), take the best candidate, destroy()',
    'Translate the cues: check the pair, one translator, keep start and end',
  ];

  #controller = new AbortController();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#controller.abort());
  }

  protected time(seconds: number): string {
    return formatCueTime(seconds);
  }

  protected percent(value: number): string {
    return `${Math.round(value * 100)} %`;
  }

  protected async detect(): Promise<void> {
    this.busy.set(true);
    this.detected.set(null);
    try {
      const detected = await detectLanguage(this.request(), this.#controller.signal);
      this.detected.set(detected);
      this.log.ok(`detectLanguage(): ${detected.language}, confidence ${this.percent(detected.confidence)}`);
    } catch (error) {
      this.log.fail('detectLanguage()', error);
    } finally {
      this.busy.set(false);
    }
  }

  protected async translate(): Promise<void> {
    this.busy.set(true);
    this.translated.set(null);
    try {
      const translated = await translateCues(this.cues, 'en', this.target(), this.#controller.signal);
      this.translated.set(translated);
      this.log.ok(`translateCues(): ${translated.length} cues, en → ${this.target()}`);
    } catch (error) {
      this.log.fail('translateCues()', error);
    } finally {
      this.busy.set(false);
    }
  }
}
