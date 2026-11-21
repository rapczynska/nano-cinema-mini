import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AiMode } from './core/ai-mode';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'nc-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly ai = inject(AiMode);

  protected readonly labs = [
    { path: '/lab/1', label: '1 · Session' },
    { path: '/lab/2', label: '2 · JSON' },
    { path: '/lab/3', label: '3 · Summarizer' },
    { path: '/lab/4', label: '4 · Translate' },
  ];

  protected onModeChange(event: Event): void {
    this.ai.use((event.target as HTMLInputElement).checked);
  }
}
