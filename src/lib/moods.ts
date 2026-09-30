/**
 * Mood browse: hand-tuned TMDB discover queries with a name and a one-line pitch.
 * `query` uses raw TMDB param names (all on the proxy allowlist) so the server's first page and
 * the client's infinite scroll share one definition. In `with_genres` / `with_original_language`,
 * `|` means OR and `,` means AND.
 */
export type MoodAccent = 'violet' | 'cyan' | 'amber' | 'danger' | 'success';

export interface Mood {
  slug: string;
  name: string;
  blurb: string;
  accent: MoodAccent;
  query: Readonly<Record<string, string>>;
}

export const MOODS: readonly Mood[] = [
  {
    slug: 'rainy-sunday',
    name: 'Rainy Sunday',
    blurb: 'Long, warm, well-loved dramas and romances to sink into.',
    accent: 'cyan',
    query: {
      with_genres: '18|10749',
      'with_runtime.gte': '100',
      'vote_average.gte': '7',
      'vote_count.gte': '200',
    },
  },
  {
    slug: 'edge-of-your-seat',
    name: 'Edge of your seat',
    blurb: 'Thrillers and mysteries that don’t let go.',
    accent: 'danger',
    query: { with_genres: '53|9648', 'vote_average.gte': '6.8', 'vote_count.gte': '300' },
  },
  {
    slug: 'feel-good',
    name: 'Feel-good',
    blurb: 'Comedies and family favourites. No bad endings.',
    accent: 'amber',
    query: {
      with_genres: '35|10751',
      without_genres: '27,53,80,10752',
      'vote_average.gte': '6.5',
      'vote_count.gte': '200',
    },
  },
  {
    slug: 'bollywood-masala',
    name: 'Bollywood masala',
    blurb: 'Action, romance and a song for every feeling.',
    accent: 'amber',
    query: {
      with_original_language: 'hi',
      with_genres: '28|10749|10402',
      'vote_count.gte': '30',
    },
  },
  {
    slug: 'south-blockbusters',
    name: 'South blockbusters',
    blurb: 'Tamil, Telugu, Malayalam and Kannada crowd-pleasers.',
    accent: 'danger',
    query: { with_original_language: 'ta|te|ml|kn', 'vote_count.gte': '50' },
  },
  {
    slug: 'mind-benders',
    name: 'Mind-benders',
    blurb: 'Sci-fi and mysteries worth a second watch.',
    accent: 'violet',
    query: { with_genres: '878|9648', 'vote_average.gte': '7', 'vote_count.gte': '500' },
  },
  {
    slug: 'midnight-chills',
    name: 'Midnight chills',
    blurb: 'Horror that earns its scares. Lights off.',
    accent: 'success',
    query: { with_genres: '27', 'vote_average.gte': '6.5', 'vote_count.gte': '300' },
  },
  {
    slug: 'quick-watch',
    name: 'Under 95 minutes',
    blurb: 'Great films for a weeknight.',
    accent: 'cyan',
    query: { 'with_runtime.lte': '95', 'vote_average.gte': '7', 'vote_count.gte': '300' },
  },
  {
    slug: 'animated-wonders',
    name: 'Animated wonders',
    blurb: 'Hand-drawn, stop-motion and CG worlds for every age.',
    accent: 'success',
    query: { with_genres: '16', 'vote_average.gte': '7.2', 'vote_count.gte': '300' },
  },
  {
    slug: 'world-cinema-gems',
    name: 'World cinema gems',
    blurb: 'Korean, Japanese, French, Spanish and Italian favourites.',
    accent: 'violet',
    query: {
      with_original_language: 'ko|ja|fr|es|it',
      'vote_average.gte': '7.5',
      'vote_count.gte': '300',
    },
  },
];

export function moodBySlug(slug: string): Mood | undefined {
  return MOODS.find((m) => m.slug === slug);
}
