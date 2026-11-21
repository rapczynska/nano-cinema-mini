import {
  installSimulatedAi,
  type SimulatedAi,
  type SimulatedApi,
  type SimulationCall,
  uninstallSimulatedAi,
} from '@nano-cinema/browser-ai';
import { cinemaSimulation } from '@nano-cinema/catalogue';
import { afterEach, beforeEach, type TestContext } from 'vitest';

/**
 * Runs every check against the simulated browser AI, with no delays.
 * Returns a getter for the simulation of the current check.
 */
export function useSimulatedAi(): () => SimulatedAi {
  let simulation: SimulatedAi;
  beforeEach(() => {
    simulation = installSimulatedAi(cinemaSimulation(0));
  });
  afterEach(() => {
    uninstallSimulatedAi();
  });
  return () => simulation;
}

/** The recorded calls to one method of one API. */
export function callsTo(simulation: SimulatedAi, api: SimulatedApi, method: string): SimulationCall[] {
  return simulation.calls.filter((call) => call.api === api && call.method === method);
}

/** Runs a stretch check; skips it while the stretch step is still open. */
export async function stretch(context: TestContext, body: () => Promise<void>): Promise<void> {
  try {
    await body();
  } catch (error) {
    if ((error as { name?: string }).name === 'LabTodo') context.skip();
    throw error;
  }
}

/** A promise that settles after the given time. */
export const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

const isOpenStep = (error: unknown) => (error as { name?: string } | null)?.name === 'LabTodo';

/**
 * Awaits a call that must reject and returns the reason.
 * A step that is still open fails the check with its TODO message.
 */
export async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    if (isOpenStep(error)) throw error;
    return error;
  }
  throw new Error('Expected the call to reject, but it resolved.');
}

/** The same for a synchronous call that must throw. */
export function errorOf(call: () => unknown): unknown {
  try {
    call();
  } catch (error) {
    if (isOpenStep(error)) throw error;
    return error;
  }
  throw new Error('Expected the call to throw, but it returned.');
}

/** A missing API must produce a clear Error, not a ReferenceError. */
export function expectClearError(error: unknown, api: string): void {
  if (!(error instanceof Error)) throw new Error(`Expected an Error when ${api} is missing.`);
  if (error instanceof ReferenceError || error instanceof TypeError) {
    throw new Error(`Feature-detect with "typeof ${api} === 'undefined'" before you touch ${api}. Got: ${error.message}`);
  }
}
