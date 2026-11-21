/**
 * The Nano Cinema catalogue: three open films from the Blender Foundation.
 *
 * Everything the labs know about the films lives here. The mini repo ships
 * no video files, so there is nothing to download before the workshop.
 */

export type MovieId = 'sintel' | 'dream' | 'bunny';

export interface Movie {
  readonly id: MovieId;
  readonly title: string;
  readonly year: number;
  readonly director: string;
  /** Working title of the Blender open-movie project. */
  readonly project: string;
  readonly minutes: number;
  readonly genre: string;
  readonly mood: readonly string[];
  /** Does the film have spoken dialogue? */
  readonly dialogue: boolean;
  /** Who we suggest it for. */
  readonly audience: string;
  readonly licence: string;
  /** Two sentences for cards. */
  readonly synopsis: string;
  /** Programme notes: the long text the Summarizer lab works on. */
  readonly notes: string;
  /** Two colours for the CSS poster. */
  readonly poster: readonly [string, string];
}

export const movies: readonly Movie[] = [
  {
    id: 'sintel',
    title: 'Sintel',
    year: 2010,
    director: 'Colin Levy',
    project: 'Project Durian',
    minutes: 15,
    genre: 'fantasy adventure',
    mood: ['atmospheric', 'epic', 'bittersweet'],
    dialogue: true,
    audience: 'Older children and adults: a few fight scenes and a sad ending.',
    licence: 'CC BY 3.0',
    synopsis:
      'A young woman travels alone through harsh landscapes in search of Scales, the baby dragon she once rescued. Her journey takes longer than she realises.',
    notes: [
      'Sintel is a 15-minute animated fantasy short released in 2010 by the Blender Foundation. It was directed by Colin Levy and produced at the Blender Institute in Amsterdam under the working title Project Durian.',
      'The story follows Sintel, a young woman travelling alone in search of Scales, a baby dragon she once rescued and raised. The film moves from a snowy mountain pass to a busy market town and on to a dragon’s cave. Its closing minutes are deliberately bittersweet: the journey has taken far longer than Sintel realises.',
      'Sintel was the foundation’s third open movie, after Elephants Dream in 2006 and Big Buck Bunny in 2008. An international team worked together on site for more than a year. They used Blender for modelling, animation and rendering, and they improved the software as they went, so every Blender user gained from the production.',
      'The film and its production files are published under a Creative Commons Attribution licence. Anyone may screen, remix or study it, which is why it appears so often in player demos, codec tests and workshops.',
      'Audience note: the film has spoken English dialogue, a few fight scenes and a sad ending. We suggest it for older children and adults.',
    ].join('\n\n'),
    poster: ['#3b2a6b', '#c2410c'],
  },
  {
    id: 'dream',
    title: 'Elephants Dream',
    year: 2006,
    director: 'Bassam Kurdali',
    project: 'Project Orange',
    minutes: 11,
    genre: 'surreal science fiction',
    mood: ['strange', 'dark', 'thought-provoking'],
    dialogue: true,
    audience: 'Teenagers and adults: a dark, surreal mood and a tense ending.',
    licence: 'CC BY 2.5',
    synopsis:
      'Proog guides the younger Emo through an enormous, shifting machine. They do not agree on what the machine is, or whether it is there at all.',
    notes: [
      'Elephants Dream is an 11-minute animated short released in 2006. It was directed by Bassam Kurdali and made in Amsterdam under the working title Project Orange. It was the first open movie produced by the Blender Foundation.',
      'Two characters travel through an enormous, shifting machine: the older Proog and the younger Emo. Proog is fascinated by the machine and wants to guide Emo through it. Emo is less convinced that the machine is what Proog says it is. The film never settles which of them is right, which makes it a good conversation starter after a screening.',
      'The project was set up to show that a complete film could be made with open-source tools, mainly Blender, and to improve those tools along the way. The finished film and all of its production files were released under a Creative Commons Attribution licence, so anyone can study how each shot was built.',
      'Audience note: the film has spoken English dialogue, a dark and surreal mood and a tense ending. We suggest it for teenagers and adults rather than for young children.',
    ].join('\n\n'),
    poster: ['#0f3d3e', '#7c3aed'],
  },
  {
    id: 'bunny',
    title: 'Big Buck Bunny',
    year: 2008,
    director: 'Sacha Goedegebure',
    project: 'Project Peach',
    minutes: 10,
    genre: 'comedy',
    mood: ['playful', 'funny', 'light'],
    dialogue: false,
    audience: 'All ages: slapstick comedy with no dialogue.',
    licence: 'CC BY 3.0',
    synopsis:
      'A large, gentle rabbit enjoys a sunny morning until three bullying rodents spoil it. He plans an elaborate, cartoon-style payback.',
    notes: [
      'Big Buck Bunny is a 10-minute animated comedy released in 2008. It was directed by Sacha Goedegebure and was the Blender Foundation’s second open movie, made under the working title Project Peach.',
      'A large, gentle rabbit enjoys a sunny morning in the forest until three bullying rodents spoil it. The rabbit then plans an elaborate, cartoon-style payback. The film has no spoken dialogue: the story is told through animation, sound effects and music, so it works for audiences in any language.',
      'After the darker Elephants Dream, the team aimed for something light and funny, with a lot of fur, grass and outdoor light. Those goals pushed new hair and rendering features into Blender.',
      'Like the other open movies, Big Buck Bunny is published under a Creative Commons Attribution licence, and it has become one of the most widely used test videos on the web.',
      'Audience note: slapstick comedy with no dialogue. We suggest it for all ages.',
    ].join('\n\n'),
    poster: ['#14532d', '#eab308'],
  },
];

export function findMovie(id: string): Movie | undefined {
  return movies.find((movie) => movie.id === id);
}

/**
 * A compact projection of the catalogue for prompts.
 * Keep prompt facts small: every character costs context.
 */
export function catalogueFacts(): Array<{
  id: MovieId;
  title: string;
  year: number;
  genre: string;
  mood: readonly string[];
  minutes: number;
  dialogue: boolean;
  audience: string;
}> {
  return movies.map(
    ({ id, title, year, genre, mood, minutes, dialogue, audience }) => ({
      id,
      title,
      year,
      genre,
      mood,
      minutes,
      dialogue,
      audience,
    }),
  );
}
