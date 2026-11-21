/**
 * Small helpers for streams and cancellation, shared by the labs.
 */

/** Resolves after `ms`; rejects as soon as the signal aborts. */
export function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Reads a stream of text chunks to the end.
 *
 * Calls `onText` with the whole text so far after every chunk and returns
 * the final text. Each chunk is new text (a delta), so it is appended.
 * Stops, and throws the abort reason, as soon as the signal aborts.
 */
export async function readTextStream(
  stream: ReadableStream<string>,
  onText: (textSoFar: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const reader = stream.getReader();
  const cancel = () => {
    reader.cancel(signal?.reason).catch(() => undefined);
  };
  signal?.addEventListener('abort', cancel, { once: true });
  let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      signal?.throwIfAborted();
      if (done) break;
      text += value;
      onText(text);
    }
    return text;
  } finally {
    signal?.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

/** True for the error an aborted signal produces. */
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}
