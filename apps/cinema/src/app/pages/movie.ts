import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { findMovie } from '@nano-cinema/catalogue';

@Component({
  selector: 'nc-movie',
  imports: [RouterLink],
  template: `
    <div class="page stack">
      <a routerLink="/">← Back to programme</a>
      @if (movie(); as movie) {
        <p class="kicker">{{ movie.project }} · {{ movie.licence }}</p>
        <h1>{{ movie.title }}</h1>
        <p class="muted">
          {{ movie.year }} · directed by {{ movie.director }} · {{ movie.minutes }} min · {{ movie.genre }} ·
          {{ movie.dialogue ? 'spoken English dialogue' : 'no dialogue' }}
        </p>
        <div class="card stack notes">
          <h2>Programme notes</h2>
          @for (paragraph of paragraphs(); track $index) {
            <p>{{ paragraph }}</p>
          }
        </div>
      } @else {
        <h1>No such film</h1>
        <p class="muted">"{{ id() }}" is not in tonight's programme.</p>
      }
    </div>
  `,
  styles: `
    .notes {
      max-width: 72ch;
    }
  `,
})
export class MoviePage {
  /** Bound from the route parameter. */
  readonly id = input.required<string>();

  protected readonly movie = computed(() => findMovie(this.id()));
  protected readonly paragraphs = computed(() => this.movie()?.notes.split('\n\n') ?? []);
}
