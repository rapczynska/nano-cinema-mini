import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    title: 'Programme · Nano Cinema',
    loadComponent: () => import('./pages/programme').then((m) => m.Programme),
  },
  {
    path: 'movies/:id',
    title: 'Film · Nano Cinema',
    loadComponent: () => import('./pages/movie').then((m) => m.MoviePage),
  },
  {
    path: 'preflight',
    title: 'Preflight · Nano Cinema',
    loadComponent: () => import('./pages/preflight').then((m) => m.Preflight),
  },
  {
    path: 'lab/1',
    title: 'Lab 1 · Session and streaming',
    loadComponent: () =>
      import('./lab/1-session-streaming/page').then((m) => m.Lab1Page),
  },
  {
    path: 'lab/2',
    title: 'Lab 2 · Structured output',
    loadComponent: () =>
      import('./lab/2-structured-output/page').then((m) => m.Lab2Page),
  },
  {
    path: 'lab/3',
    title: 'Lab 3 · Summarizer',
    loadComponent: () =>
      import('./lab/3-summarizer/page').then((m) => m.Lab3Page),
  },
  {
    path: 'lab/4',
    title: 'Lab 4 · Detect and translate',
    loadComponent: () =>
      import('./lab/4-translation/page').then((m) => m.Lab4Page),
  },
  { path: '**', redirectTo: '' },
];
