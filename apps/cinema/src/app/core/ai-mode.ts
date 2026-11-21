import { Injectable, signal } from '@angular/core';
import {
  type AiAvailability,
  installSimulatedAi,
  nativeAiSupport,
} from '@nano-cinema/browser-ai';
import { cinemaSimulation } from '@nano-cinema/catalogue';

const STORAGE_KEY = 'nano-cinema.simulated-ai';

/** What the Prompt API says on this device, with the options the labs use. */
export type PromptState = AiAvailability | 'missing';

const promptOptions: LanguageModelCreateCoreOptions = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

/**
 * Native or simulated browser AI.
 *
 * "Simulated" replaces the four built-in AI globals with the simulation from
 * libs/browser-ai, so every lab runs on a laptop without Gemini Nano. It is
 * the default when this device cannot run the Prompt API. The checkbox in
 * the header overrides the default, and the choice is remembered.
 */
@Injectable({ providedIn: 'root' })
export class AiMode {
  /** Which built-in AI globals this browser really has. */
  readonly native = nativeAiSupport();

  /** The answer of the real Prompt API on this device. */
  readonly promptState = signal<PromptState>('missing');

  readonly simulated = signal(false);

  /** True when the mode comes from the checkbox, not from the default. */
  readonly chosen = signal(false);

  /** Runs once before the first page: decides the mode. */
  async init(): Promise<void> {
    const state = await this.#askPromptApi();
    const usable = state !== 'missing' && state !== 'unavailable';
    const stored = this.#stored();

    this.promptState.set(state);
    this.chosen.set(stored !== null);
    this.simulated.set(stored ?? !usable);
    if (this.simulated()) installSimulatedAi(cinemaSimulation());
  }

  /** Switches the mode and reloads, so no session of the old kind survives. */
  use(simulated: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY, String(simulated));
    } catch {
      // Storage can be blocked; the switch then lasts until the next reload.
    }
    location.reload();
  }

  async #askPromptApi(): Promise<PromptState> {
    if (typeof LanguageModel === 'undefined') return 'missing';
    try {
      // Never let a slow answer block the app from starting.
      const slow = new Promise<PromptState>((resolve) => setTimeout(() => resolve('available'), 2000));
      return await Promise.race([LanguageModel.availability(promptOptions), slow]);
    } catch {
      return 'unavailable';
    }
  }

  #stored(): boolean | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? null : stored === 'true';
    } catch {
      return null;
    }
  }
}
