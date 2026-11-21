/**
 * A simulation of Chrome's built-in AI APIs.
 *
 * It has the same shape as the real APIs (availability → create → use →
 * destroy, streams, abort signals, context accounting), so the lab code runs
 * unchanged on a laptop without built-in AI and in the lab checks.
 *
 * It shows the application contract, never model quality: the "model" is a
 * function you pass in, and the summaries are extracted sentences.
 */

import type {
  AiAvailability,
  AiCreateMonitor,
  AiCreateMonitorCallback,
} from './browser-ai';
import { abortableDelay } from './streams';

export type SimulatedApi =
  'LanguageModel' | 'Summarizer' | 'LanguageDetector' | 'Translator';

const API_NAMES: readonly SimulatedApi[] = [
  'LanguageModel',
  'Summarizer',
  'LanguageDetector',
  'Translator',
];

export interface SimulatedPrompt {
  /** The initial prompts the session was created with. */
  readonly initialPrompts: readonly LanguageModelMessage[];
  /** The conversation so far: prompts and answers, oldest first. */
  readonly turns: readonly LanguageModelMessage[];
  /** The new input as plain text. */
  readonly input: string;
  /** The JSON Schema passed as responseConstraint, if any. */
  readonly schema?: Record<string, unknown>;
}

export interface SimulationConfig {
  /** Plays the language model: returns the answer to one prompt. */
  answer(prompt: SimulatedPrompt): string;
  /** Known translations: phrasebook['en>pl'][sourceText]. */
  phrasebook?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** Artificial delay per step, in milliseconds. Use 0 in tests. */
  latencyMs?: number;
  /** Token budget of a LanguageModel session. */
  contextWindow?: number;
  /** Token budget of one task-API input. */
  inputQuota?: number;
  /** Force an availability state, for demos and tests. */
  availability?: Partial<Record<SimulatedApi, AiAvailability>>;
}

export interface SimulationCall {
  readonly api: SimulatedApi;
  readonly method: string;
  readonly args: readonly unknown[];
}

export interface SimulatedAi {
  readonly LanguageModel: typeof LanguageModel;
  readonly Summarizer: typeof Summarizer;
  readonly LanguageDetector: typeof LanguageDetector;
  readonly Translator: typeof Translator;
  /** The live configuration: change it between calls in tests. */
  readonly config: SimulationConfig;
  /** Every API call, in order. */
  readonly calls: SimulationCall[];
  /** How many sessions, summarizers, detectors and translators are alive. */
  liveObjects(api?: SimulatedApi): number;
}

/** A rough token estimate: about four characters per token. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function textOf(input: LanguageModelPrompt | LanguageModelMessage['content']): string {
  if (typeof input === 'string') return input;
  return input
    .map((part) => {
      if ('role' in part) return textOf(part.content);
      return part.type === 'text' ? String(part.value) : `[${part.type}]`;
    })
    .join('\n');
}

function domError(name: string, message: string): DOMException {
  return new DOMException(message, name);
}

/** A stream that emits the chunks one by one, with a delay between them. */
function textStream(
  chunks: readonly string[],
  delayMs: number,
  signal: AbortSignal | undefined,
  onDone?: () => void,
): ReadableStream<string> {
  let index = 0;
  let cancelled = false;
  return new ReadableStream<string>({
    async pull(controller) {
      try {
        await abortableDelay(delayMs, signal);
      } catch (reason) {
        controller.error(reason);
        return;
      }
      if (cancelled) return;
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      if (index >= chunks.length) {
        onDone?.();
        controller.close();
      }
    },
    cancel() {
      cancelled = true;
    },
  });
}

function erroredStream(reason: unknown): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.error(reason);
    },
  });
}

/** Splits text into word-sized chunks that join back to the same text. */
function toChunks(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

// ── Summaries by sentence extraction ────────────────────────────────────

function sentencesOf(text: string): string[] {
  return (text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+/g) ?? [text])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function pickEvenly<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items];
  if (count === 1) return [items[0]];
  const step = (items.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => items[Math.round(i * step)]);
}

const DANGLING = new Set([
  'a', 'an', 'the', 'of', 'in', 'by', 'and', 'to', 'with', 'for', 'at', 'on',
  'is', 'was', 'released', 'under', 'its', 'from',
]);

export function simulateSummary(
  text: string,
  options: SummarizerCreateCoreOptions = {},
): string {
  const type = options.type ?? 'key-points';
  const length = options.length ?? 'short';
  const format = options.format ?? 'markdown';
  const sentences = sentencesOf(text);
  const size = { short: 0, medium: 1, long: 2 }[length];

  switch (type) {
    case 'headline': {
      const words = sentences[0].replace(/[.!?]+$/, '').split(' ');
      const kept = words.slice(0, [8, 12, 16][size]);
      while (kept.length > 3 && DANGLING.has(kept[kept.length - 1].toLowerCase())) {
        kept.pop();
      }
      return kept.join(' ');
    }
    case 'tldr':
      return sentences.slice(0, [1, 3, 5][size]).join(' ');
    case 'teaser': {
      // Skip the factual opening sentence and lead with the story.
      const story = sentences.length > 2 ? sentences.slice(2) : sentences;
      return story.slice(0, [1, 2, 3][size]).join(' ');
    }
    case 'key-points': {
      const points = pickEvenly(sentences, [3, 5, 7][size]);
      return points
        .map((point) => (format === 'markdown' ? `- ${point}` : point))
        .join('\n');
    }
  }
}

// ── Language detection by word lists ────────────────────────────────────

const POLISH_WORDS = new Set([
  'szukam', 'filmu', 'film', 'na', 'wieczór', 'jest', 'nie', 'się', 'dla',
  'czy', 'proszę', 'dzień', 'dobry', 'coś', 'zabawnego', 'chcę', 'krótki',
  'bardzo', 'tak', 'dziękuję', 'dzisiaj', 'kino', 'i', 'w', 'z', 'do',
]);
const ENGLISH_WORDS = new Set([
  'the', 'is', 'and', 'for', 'film', 'a', 'to', 'of', 'in', 'something',
  'funny', 'please', 'i', 'am', 'looking', 'movie', 'with', 'what', 'it',
  'we', 'are', 'welcome', 'your', 'show', 'tonight', 'this', 'that',
]);

export function simulateDetection(text: string): LanguageDetectionResult[] {
  const lower = text.toLowerCase();
  const words = lower.match(/\p{L}+/gu) ?? [];
  if (words.length === 0) return [{ detectedLanguage: 'und', confidence: 1 }];
  const diacritics = (lower.match(/[ąćęłńóśźż]/g) ?? []).length;
  const polish =
    diacritics * 2 + words.filter((word) => POLISH_WORDS.has(word)).length;
  const english = words.filter((word) => ENGLISH_WORDS.has(word)).length;
  const unknown = 0.3;
  const total = polish + english + unknown;
  const round = (value: number) => Math.round((value / total) * 1000) / 1000;
  return [
    { detectedLanguage: 'pl', confidence: round(polish) },
    { detectedLanguage: 'en', confidence: round(english) },
    { detectedLanguage: 'und', confidence: round(unknown) },
  ].sort((a, b) => b.confidence - a.confidence);
}

// ── The simulated APIs ──────────────────────────────────────────────────

export function createSimulatedAi(config: SimulationConfig): SimulatedAi {
  const calls: SimulationCall[] = [];
  const live: Record<SimulatedApi, number> = {
    LanguageModel: 0,
    Summarizer: 0,
    LanguageDetector: 0,
    Translator: 0,
  };
  const record = (api: SimulatedApi, method: string, ...args: unknown[]) => {
    calls.push({ api, method, args });
  };
  const latency = () => config.latencyMs ?? 0;
  const quota = () => config.inputQuota ?? 6000;
  const forced = (api: SimulatedApi) => config.availability?.[api];

  async function prepare(
    api: SimulatedApi,
    availability: AiAvailability,
    options: { signal?: AbortSignal; monitor?: AiCreateMonitorCallback },
  ): Promise<void> {
    options.signal?.throwIfAborted();
    if (availability === 'unavailable') {
      throw domError(
        'NotSupportedError',
        `${api} is unavailable for these options on this device.`,
      );
    }
    if (!options.monitor) return;
    const monitor = new EventTarget();
    options.monitor(monitor as AiCreateMonitor);
    // The simulated "download": three progress events.
    for (const loaded of [0, 0.5, 1]) {
      const event = new Event('downloadprogress');
      Object.defineProperty(event, 'loaded', { value: loaded });
      monitor.dispatchEvent(event);
      await abortableDelay(latency(), options.signal);
    }
  }

  function checkQuota(input: string): void {
    if (estimateTokens(input) > quota()) {
      throw domError(
        'QuotaExceededError',
        'The input is larger than the input quota.',
      );
    }
  }

  // Prompt API ───────────────────────────────────────────────────────────

  class SimLanguageModel extends EventTarget implements LanguageModel {
    static async availability(
      options?: LanguageModelCreateCoreOptions,
    ): Promise<AiAvailability> {
      record('LanguageModel', 'availability', options);
      return forced('LanguageModel') ?? 'available';
    }

    static async create(
      options: LanguageModelCreateOptions = {},
    ): Promise<LanguageModel> {
      record('LanguageModel', 'create', options);
      await prepare('LanguageModel', forced('LanguageModel') ?? 'available', options);
      return new SimLanguageModel(options.initialPrompts ?? []);
    }

    readonly #initial: readonly LanguageModelMessage[];
    #turns: LanguageModelMessage[] = [];
    #destroyed = false;

    private constructor(
      initial: readonly LanguageModelMessage[],
      turns: readonly LanguageModelMessage[] = [],
    ) {
      super();
      this.#initial = [...initial];
      this.#turns = [...turns];
      live.LanguageModel++;
    }

    get contextWindow(): number {
      return config.contextWindow ?? 4096;
    }

    get contextUsage(): number {
      return [...this.#initial, ...this.#turns].reduce(
        (sum, message) => sum + estimateTokens(textOf(message.content)),
        0,
      );
    }

    async measureContextUsage(input: LanguageModelPrompt): Promise<number> {
      record('LanguageModel', 'measureContextUsage', input);
      return estimateTokens(textOf(input));
    }

    /** Checks the call, makes room in the context and asks the "model". */
    #answer(input: LanguageModelPrompt, options: LanguageModelPromptOptions): string {
      if (this.#destroyed) {
        throw domError('InvalidStateError', 'The session has been destroyed.');
      }
      options.signal?.throwIfAborted();
      const text = textOf(input);
      const needed = estimateTokens(text);
      const initial = this.#initial.reduce(
        (sum, message) => sum + estimateTokens(textOf(message.content)),
        0,
      );
      if (initial + needed > this.contextWindow) {
        throw domError(
          'QuotaExceededError',
          'The prompt alone does not fit into the context window.',
        );
      }
      let dropped = false;
      while (this.contextUsage + needed > this.contextWindow && this.#turns.length) {
        this.#turns.splice(0, 2); // The oldest prompt and its answer.
        dropped = true;
      }
      if (dropped) this.dispatchEvent(new Event('contextoverflow'));
      const schema =
        options.responseConstraint && !(options.responseConstraint instanceof RegExp)
          ? (options.responseConstraint as Record<string, unknown>)
          : undefined;
      return config.answer({
        initialPrompts: [...this.#initial],
        turns: [...this.#turns],
        input: text,
        schema,
      });
    }

    #remember(input: LanguageModelPrompt, answer: string): void {
      this.#turns.push(
        { role: 'user', content: textOf(input) },
        { role: 'assistant', content: answer },
      );
    }

    async prompt(
      input: LanguageModelPrompt,
      options: LanguageModelPromptOptions = {},
    ): Promise<string> {
      record('LanguageModel', 'prompt', input, options);
      const answer = this.#answer(input, options);
      // One-shot: the caller waits for the whole "decode".
      await abortableDelay(latency() * toChunks(answer).length, options.signal);
      this.#remember(input, answer);
      return answer;
    }

    promptStreaming(
      input: LanguageModelPrompt,
      options: LanguageModelPromptOptions = {},
    ): ReadableStream<string> {
      record('LanguageModel', 'promptStreaming', input, options);
      let answer: string;
      try {
        answer = this.#answer(input, options);
      } catch (error) {
        return erroredStream(error);
      }
      return textStream(toChunks(answer), latency(), options.signal, () =>
        this.#remember(input, answer),
      );
    }

    async append(input: LanguageModelPrompt): Promise<void> {
      record('LanguageModel', 'append', input);
      this.#turns.push({ role: 'user', content: textOf(input) });
    }

    async clone(options: { signal?: AbortSignal } = {}): Promise<LanguageModel> {
      record('LanguageModel', 'clone', options);
      options.signal?.throwIfAborted();
      return new SimLanguageModel(this.#initial, this.#turns);
    }

    destroy(): void {
      record('LanguageModel', 'destroy');
      if (this.#destroyed) return;
      this.#destroyed = true;
      live.LanguageModel--;
    }
  }

  // Summarizer API ───────────────────────────────────────────────────────

  class SimSummarizer implements Summarizer {
    static async availability(
      options?: SummarizerCreateCoreOptions,
    ): Promise<AiAvailability> {
      record('Summarizer', 'availability', options);
      return forced('Summarizer') ?? 'available';
    }

    static async create(options: SummarizerCreateOptions = {}): Promise<Summarizer> {
      record('Summarizer', 'create', options);
      await prepare('Summarizer', forced('Summarizer') ?? 'available', options);
      return new SimSummarizer(options);
    }

    #destroyed = false;

    private constructor(private readonly options: SummarizerCreateOptions) {
      live.Summarizer++;
    }

    get inputQuota(): number {
      return quota();
    }

    async measureInputUsage(input: string): Promise<number> {
      record('Summarizer', 'measureInputUsage', input);
      return estimateTokens(input);
    }

    #summary(input: string, options: SummarizerSummarizeOptions): string {
      if (this.#destroyed) {
        throw domError('InvalidStateError', 'The summarizer has been destroyed.');
      }
      options.signal?.throwIfAborted();
      checkQuota(input);
      return simulateSummary(input, this.options);
    }

    async summarize(
      input: string,
      options: SummarizerSummarizeOptions = {},
    ): Promise<string> {
      record('Summarizer', 'summarize', input, options);
      const summary = this.#summary(input, options);
      await abortableDelay(latency() * toChunks(summary).length, options.signal);
      return summary;
    }

    summarizeStreaming(
      input: string,
      options: SummarizerSummarizeOptions = {},
    ): ReadableStream<string> {
      record('Summarizer', 'summarizeStreaming', input, options);
      try {
        const summary = this.#summary(input, options);
        return textStream(toChunks(summary), latency(), options.signal);
      } catch (error) {
        return erroredStream(error);
      }
    }

    destroy(): void {
      record('Summarizer', 'destroy');
      if (this.#destroyed) return;
      this.#destroyed = true;
      live.Summarizer--;
    }
  }

  // Language Detector API ────────────────────────────────────────────────

  class SimLanguageDetector implements LanguageDetector {
    static async availability(
      options?: LanguageDetectorCreateCoreOptions,
    ): Promise<AiAvailability> {
      record('LanguageDetector', 'availability', options);
      return forced('LanguageDetector') ?? 'available';
    }

    static async create(
      options: LanguageDetectorCreateOptions = {},
    ): Promise<LanguageDetector> {
      record('LanguageDetector', 'create', options);
      await prepare(
        'LanguageDetector',
        forced('LanguageDetector') ?? 'available',
        options,
      );
      return new SimLanguageDetector();
    }

    #destroyed = false;

    private constructor() {
      live.LanguageDetector++;
    }

    get inputQuota(): number {
      return quota();
    }

    async detect(
      input: string,
      options: { signal?: AbortSignal } = {},
    ): Promise<LanguageDetectionResult[]> {
      record('LanguageDetector', 'detect', input, options);
      if (this.#destroyed) {
        throw domError('InvalidStateError', 'The detector has been destroyed.');
      }
      await abortableDelay(latency(), options.signal);
      return simulateDetection(input);
    }

    destroy(): void {
      record('LanguageDetector', 'destroy');
      if (this.#destroyed) return;
      this.#destroyed = true;
      live.LanguageDetector--;
    }
  }

  // Translator API ───────────────────────────────────────────────────────

  const pairAvailability = (options: TranslatorCreateCoreOptions): AiAvailability => {
    const pair = `${options.sourceLanguage}>${options.targetLanguage}`;
    return forced('Translator') ?? (config.phrasebook?.[pair] ? 'available' : 'unavailable');
  };

  class SimTranslator implements Translator {
    static async availability(
      options: TranslatorCreateCoreOptions,
    ): Promise<AiAvailability> {
      record('Translator', 'availability', options);
      return pairAvailability(options);
    }

    static async create(options: TranslatorCreateOptions): Promise<Translator> {
      record('Translator', 'create', options);
      await prepare('Translator', pairAvailability(options), options);
      return new SimTranslator(options.sourceLanguage, options.targetLanguage);
    }

    #destroyed = false;

    private constructor(
      readonly sourceLanguage: string,
      readonly targetLanguage: string,
    ) {
      live.Translator++;
    }

    get inputQuota(): number {
      return quota();
    }

    #translation(input: string, signal?: AbortSignal): string {
      if (this.#destroyed) {
        throw domError('InvalidStateError', 'The translator has been destroyed.');
      }
      signal?.throwIfAborted();
      const pair = `${this.sourceLanguage}>${this.targetLanguage}`;
      const known = config.phrasebook?.[pair]?.[input.trim()];
      // Unknown text is marked, so nobody mistakes it for a real translation.
      return known ?? `[simulated ${this.targetLanguage}] ${input}`;
    }

    async translate(
      input: string,
      options: { signal?: AbortSignal } = {},
    ): Promise<string> {
      record('Translator', 'translate', input, options);
      const translation = this.#translation(input, options.signal);
      await abortableDelay(latency() * 3, options.signal);
      return translation;
    }

    translateStreaming(
      input: string,
      options: { signal?: AbortSignal } = {},
    ): ReadableStream<string> {
      record('Translator', 'translateStreaming', input, options);
      try {
        const translation = this.#translation(input, options.signal);
        return textStream(toChunks(translation), latency(), options.signal);
      } catch (error) {
        return erroredStream(error);
      }
    }

    destroy(): void {
      record('Translator', 'destroy');
      if (this.#destroyed) return;
      this.#destroyed = true;
      live.Translator--;
    }
  }

  return {
    LanguageModel: SimLanguageModel as unknown as typeof LanguageModel,
    Summarizer: SimSummarizer as unknown as typeof Summarizer,
    LanguageDetector: SimLanguageDetector as unknown as typeof LanguageDetector,
    Translator: SimTranslator as unknown as typeof Translator,
    config,
    calls,
    liveObjects: (api) =>
      api ? live[api] : API_NAMES.reduce((sum, name) => sum + live[name], 0),
  };
}

// ── Installing the simulation as the browser globals ────────────────────

type Globals = Record<string, unknown>;

let natives: Globals | undefined;

/** Which built-in AI globals does this browser really have? */
export function nativeAiSupport(): Record<SimulatedApi, boolean> {
  const source = natives ?? (globalThis as Globals);
  return Object.fromEntries(
    API_NAMES.map((name) => [name, typeof source[name] !== 'undefined']),
  ) as Record<SimulatedApi, boolean>;
}

/** Replaces the four globals with the simulation. Remembers the real ones. */
export function installSimulatedAi(config: SimulationConfig): SimulatedAi {
  const simulation = createSimulatedAi(config);
  const globals = globalThis as Globals;
  natives ??= Object.fromEntries(API_NAMES.map((name) => [name, globals[name]]));
  for (const name of API_NAMES) globals[name] = simulation[name];
  return simulation;
}

/** Puts the real globals back. */
export function uninstallSimulatedAi(): void {
  if (!natives) return;
  const globals = globalThis as Globals;
  for (const name of API_NAMES) {
    if (natives[name] === undefined) delete globals[name];
    else globals[name] = natives[name];
  }
  natives = undefined;
}

export function isSimulatedAiInstalled(): boolean {
  return natives !== undefined;
}
