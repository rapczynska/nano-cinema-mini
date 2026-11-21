/**
 * TypeScript declarations for Chrome's built-in AI APIs, as far as the labs
 * use them: the Prompt API (LanguageModel) and three task APIs (Summarizer,
 * LanguageDetector, Translator).
 *
 * They are global declarations, like the DOM types: in the browser the APIs
 * are globals. On a device or browser without built-in AI the globals are
 * missing at runtime, so always feature-detect:
 *
 *   if (typeof LanguageModel === 'undefined') { … }
 */

export type AiAvailability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

export interface AiDownloadProgressEvent extends Event {
  /** A fraction between 0 and 1. */
  readonly loaded: number;
}

export interface AiCreateMonitor extends EventTarget {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: AiDownloadProgressEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

export type AiCreateMonitorCallback = (monitor: AiCreateMonitor) => void;

declare global {
  // ── Prompt API ────────────────────────────────────────────────────────

  interface LanguageModelExpected {
    type: 'text' | 'image' | 'audio';
    languages?: string[];
  }

  interface LanguageModelMessageContent {
    type: 'text' | 'image' | 'audio';
    value: unknown;
  }

  interface LanguageModelMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | LanguageModelMessageContent[];
    prefix?: boolean;
  }

  type LanguageModelPrompt = string | LanguageModelMessage[];

  /** The options that decide availability. Pass the same ones to create(). */
  interface LanguageModelCreateCoreOptions {
    expectedInputs?: LanguageModelExpected[];
    expectedOutputs?: LanguageModelExpected[];
  }

  interface LanguageModelCreateOptions extends LanguageModelCreateCoreOptions {
    initialPrompts?: LanguageModelMessage[];
    signal?: AbortSignal;
    monitor?: AiCreateMonitorCallback;
  }

  interface LanguageModelPromptOptions {
    /** A JSON Schema object, or a RegExp. */
    responseConstraint?: object;
    omitResponseConstraintInput?: boolean;
    signal?: AbortSignal;
  }

  /** A session with the built-in language model. */
  interface LanguageModel extends EventTarget {
    prompt(
      input: LanguageModelPrompt,
      options?: LanguageModelPromptOptions,
    ): Promise<string>;
    promptStreaming(
      input: LanguageModelPrompt,
      options?: LanguageModelPromptOptions,
    ): ReadableStream<string>;
    append(
      input: LanguageModelPrompt,
      options?: { signal?: AbortSignal },
    ): Promise<void>;
    measureContextUsage(
      input: LanguageModelPrompt,
      options?: LanguageModelPromptOptions,
    ): Promise<number>;
    readonly contextUsage: number;
    readonly contextWindow: number;
    clone(options?: { signal?: AbortSignal }): Promise<LanguageModel>;
    destroy(): void;
  }

  var LanguageModel: {
    availability(
      options?: LanguageModelCreateCoreOptions,
    ): Promise<AiAvailability>;
    create(options?: LanguageModelCreateOptions): Promise<LanguageModel>;
  };

  // ── Summarizer API ────────────────────────────────────────────────────

  type SummarizerType = 'tldr' | 'key-points' | 'teaser' | 'headline';
  type SummarizerLength = 'short' | 'medium' | 'long';
  type SummarizerFormat = 'markdown' | 'plain-text';

  /** The options that decide availability. Pass the same ones to create(). */
  interface SummarizerCreateCoreOptions {
    type?: SummarizerType;
    length?: SummarizerLength;
    format?: SummarizerFormat;
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
  }

  interface SummarizerCreateOptions extends SummarizerCreateCoreOptions {
    /** What every input of this summarizer is about. */
    sharedContext?: string;
    signal?: AbortSignal;
    monitor?: AiCreateMonitorCallback;
  }

  interface SummarizerSummarizeOptions {
    /** Background for this one input. */
    context?: string;
    signal?: AbortSignal;
  }

  interface Summarizer {
    summarize(
      input: string,
      options?: SummarizerSummarizeOptions,
    ): Promise<string>;
    summarizeStreaming(
      input: string,
      options?: SummarizerSummarizeOptions,
    ): ReadableStream<string>;
    measureInputUsage(
      input: string,
      options?: SummarizerSummarizeOptions,
    ): Promise<number>;
    readonly inputQuota: number;
    destroy(): void;
  }

  var Summarizer: {
    availability(options?: SummarizerCreateCoreOptions): Promise<AiAvailability>;
    create(options?: SummarizerCreateOptions): Promise<Summarizer>;
  };

  // ── Language Detector API ─────────────────────────────────────────────

  interface LanguageDetectionResult {
    /** A BCP 47 language tag, or "und" when undetermined. */
    detectedLanguage: string;
    /** Between 0 and 1. */
    confidence: number;
  }

  interface LanguageDetectorCreateCoreOptions {
    expectedInputLanguages?: string[];
  }

  interface LanguageDetectorCreateOptions
    extends LanguageDetectorCreateCoreOptions {
    signal?: AbortSignal;
    monitor?: AiCreateMonitorCallback;
  }

  interface LanguageDetector {
    /** Candidates, sorted by confidence, best first. */
    detect(
      input: string,
      options?: { signal?: AbortSignal },
    ): Promise<LanguageDetectionResult[]>;
    readonly inputQuota: number;
    destroy(): void;
  }

  var LanguageDetector: {
    availability(
      options?: LanguageDetectorCreateCoreOptions,
    ): Promise<AiAvailability>;
    create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetector>;
  };

  // ── Translator API ────────────────────────────────────────────────────

  /** Availability is per language pair. */
  interface TranslatorCreateCoreOptions {
    sourceLanguage: string;
    targetLanguage: string;
  }

  interface TranslatorCreateOptions extends TranslatorCreateCoreOptions {
    signal?: AbortSignal;
    monitor?: AiCreateMonitorCallback;
  }

  interface Translator {
    translate(input: string, options?: { signal?: AbortSignal }): Promise<string>;
    translateStreaming(
      input: string,
      options?: { signal?: AbortSignal },
    ): ReadableStream<string>;
    readonly sourceLanguage: string;
    readonly targetLanguage: string;
    readonly inputQuota: number;
    destroy(): void;
  }

  var Translator: {
    availability(options: TranslatorCreateCoreOptions): Promise<AiAvailability>;
    create(options: TranslatorCreateOptions): Promise<Translator>;
  };
}
