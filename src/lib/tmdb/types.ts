import type { z } from 'zod';
import type {
  CastSchema,
  CollectionSchema,
  CrewSchema,
  GenreSchema,
  ImageSchema,
  MovieDetailSchema,
  MovieSchema,
  PersonCreditSchema,
  PersonResultSchema,
  PersonSchema,
  ProviderSchema,
  TmdbReviewSchema,
  VideoSchema,
  WatchRegionSchema,
} from './schemas';

export type Genre = z.output<typeof GenreSchema>;
export type Video = z.output<typeof VideoSchema>;
export type Cast = z.output<typeof CastSchema>;
export type Crew = z.output<typeof CrewSchema>;
export type Credit = Cast | Crew;
export type TmdbImage = z.output<typeof ImageSchema>;
export type Provider = z.output<typeof ProviderSchema>;
export type WatchRegion = z.output<typeof WatchRegionSchema>;
export type TmdbReview = z.output<typeof TmdbReviewSchema>;
export type PersonCredit = z.output<typeof PersonCreditSchema>;
export type PersonResult = z.output<typeof PersonResultSchema>;

/** Server-computed visual metadata attached to a movie (card glow + blur placeholder). */
export interface PosterMeta {
  color: string;
  blur: string | null;
}

export type Movie = z.output<typeof MovieSchema> & { meta?: PosterMeta };
export type MovieDetail = z.output<typeof MovieDetailSchema>;
export type Person = z.output<typeof PersonSchema>;
export type Collection = z.output<typeof CollectionSchema>;

export interface Paginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface MultiResults {
  page: number;
  total_pages: number;
  movies: Movie[];
  people: PersonResult[];
}

export type TrendingWindow = 'day' | 'week';

export type DiscoverSort =
  'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'title.asc';

export interface DiscoverParams {
  genre?: number | string;
  lang?: string;
  sort?: DiscoverSort;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  ratingMin?: number;
  runtimeMin?: number;
  runtimeMax?: number;
  region?: string;
  page?: number;
  kids?: boolean;
  /** Raw TMDB discover params applied on top (e.g. a mood's query). */
  raw?: Readonly<Record<string, string>>;
}
