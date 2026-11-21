/**
 * Caption cues for the translation lab.
 *
 * These are the cinema's own house announcements, written for this lab.
 * They are not the subtitle track of any of the films.
 */

export interface Cue {
  /** Seconds from the start. */
  readonly start: number;
  /** Seconds from the start. */
  readonly end: number;
  readonly text: string;
}

export const announcementCues: readonly Cue[] = [
  { start: 1.0, end: 3.5, text: 'Welcome to Nano Cinema.' },
  { start: 4.0, end: 7.0, text: 'Tonight we are showing three short films.' },
  { start: 7.5, end: 10.5, text: 'Please switch off your phone.' },
  { start: 11.0, end: 14.0, text: 'The first film starts in one minute.' },
  { start: 14.5, end: 16.5, text: 'Enjoy the show!' },
];

/** A viewer request in Polish, for the language-detection step. */
export const polishRequest = 'Szukam zabawnego filmu na wieczór';

/**
 * Reference translations of the lab texts.
 * Only the simulated Translator uses them, when the real one is missing.
 */
export const phrasebook: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  'en>pl': {
    'Welcome to Nano Cinema.': 'Witamy w Nano Cinema.',
    'Tonight we are showing three short films.':
      'Dziś wieczorem pokazujemy trzy krótkie filmy.',
    'Please switch off your phone.': 'Prosimy wyłączyć telefon.',
    'The first film starts in one minute.':
      'Pierwszy film zaczyna się za minutę.',
    'Enjoy the show!': 'Miłego seansu!',
  },
  'pl>en': {
    [polishRequest]: 'I am looking for a funny film for the evening',
  },
};

/** 83.5 → "1:23.5" */
export function formatCueTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds - minutes * 60).toFixed(1).padStart(4, '0');
  return `${minutes}:${rest}`;
}
