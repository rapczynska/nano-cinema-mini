import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { movies } from '@nano-cinema/catalogue';

@Component({
  selector: 'nc-programme',
  imports: [RouterLink],
  template: `
    <div class="page stack">
      <p class="kicker">Tonight's programme</p>
      <h1>Three open films, <span class="accent">zero tokens billed</span></h1>
      <p class="muted lead">
        Nano Cinema is the lab app of the AI at Zero Token Cost mini workshop. Every AI call in it runs in this
        browser, on the model that ships with Chrome.
      </p>

      <div class="films">
        @for (movie of movies; track movie.id) {
          <a class="card film" [routerLink]="['/movies', movie.id]">
            <div
              class="poster"
              aria-hidden="true"
              [style.background]="'linear-gradient(135deg, ' + movie.poster[0] + ', ' + movie.poster[1] + ')'"
            >
              {{ movie.title }}
            </div>
            <h2>{{ movie.title }}</h2>
            <p class="muted meta">{{ movie.year }} · {{ movie.minutes }} min · {{ movie.genre }}</p>
            <p>{{ movie.synopsis }}</p>
          </a>
        }
      </div>

      <h2 class="section">The lab</h2>
      <div class="labs">
        @for (lab of labs; track lab.path) {
          <a class="card lab" [routerLink]="lab.path">
            <span class="kicker">{{ lab.api }}</span>
            <h3>{{ lab.title }}</h3>
            <p class="muted">{{ lab.goal }}</p>
          </a>
        }
      </div>
      <p class="muted">
        First time here? Open <a routerLink="/preflight">Preflight</a> and check what this device can run.
      </p>
    </div>
  `,
  styles: `
    .lead {
      max-width: 62ch;
    }
    .films {
      display: grid;
      gap: 18px;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      margin-top: 8px;
    }
    .film,
    .lab {
      color: inherit;
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-decoration: none;
    }
    .film:hover,
    .lab:hover {
      border-color: var(--lavender);
    }
    .poster {
      align-items: flex-end;
      border-radius: 10px;
      display: flex;
      font-size: 1.5rem;
      font-weight: 800;
      height: 150px;
      letter-spacing: -0.02em;
      padding: 14px;
    }
    .meta {
      font-size: 0.88rem;
    }
    .section {
      margin-top: 20px;
    }
    .labs {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }
  `,
})
export class Programme {
  protected readonly movies = movies;

  protected readonly labs = [
    {
      path: '/lab/1',
      api: 'Prompt API',
      title: '1 · Session and streaming',
      goal: 'A concierge that remembers the conversation and streams its answer.',
    },
    {
      path: '/lab/2',
      api: 'Prompt API',
      title: '2 · Structured output',
      goal: 'A recommendation as JSON that your code can trust.',
    },
    {
      path: '/lab/3',
      api: 'Summarizer',
      title: '3 · Summarizer',
      goal: 'Programme notes as a headline, a teaser or key points.',
    },
    {
      path: '/lab/4',
      api: 'Language Detector + Translator',
      title: '4 · Detect and translate',
      goal: 'Polish in, Polish out, with caption timing intact.',
    },
  ];
}
