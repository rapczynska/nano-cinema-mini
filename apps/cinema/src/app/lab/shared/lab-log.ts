import { signal } from '@angular/core';
import { isAbortError } from '@nano-cinema/browser-ai';
import { LabTodo } from './todo';

export interface LogEntry {
  readonly kind: 'info' | 'ok' | 'todo' | 'error';
  readonly text: string;
  readonly time: string;
}

/** The event log every lab page shows under its playground. */
export class LabLog {
  readonly entries = signal<LogEntry[]>([]);

  info(text: string): void {
    this.#add('info', text);
  }

  ok(text: string): void {
    this.#add('ok', text);
  }

  /** Logs an error; says "cancelled" for an abort and "TODO" for an open step. */
  fail(where: string, error: unknown): void {
    if (error instanceof LabTodo) {
      this.#add('todo', `${where}: ${error.message}`);
    } else if (isAbortError(error)) {
      this.#add('info', `${where}: cancelled`);
    } else {
      const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      this.#add('error', `${where}: ${text}`);
    }
  }

  clear(): void {
    this.entries.set([]);
  }

  #add(kind: LogEntry['kind'], text: string): void {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    this.entries.update((entries) => [{ kind, text, time }, ...entries].slice(0, 30));
  }
}
