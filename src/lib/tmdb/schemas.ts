import { z } from 'zod';

/** TMDB is inconsistent about null vs missing vs "" — normalise to `string | null`. */
const nstr = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null));

export const GenreSchema = z.object({ id: z.number(), name: z.string() });

export const MovieSchema = z.object({
  id: z.number(),
  title: z.string().default(''),
  original_title: z.string().optional(),
  overview: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  poster_path: nstr,
  backdrop_path: nstr,
  release_date: nstr,
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  popularity: z.number().default(0),
  genre_ids: z.array(z.number()).default([]),
  original_language: z.string().default('en'),
  adult: z.boolean().default(false),
  media_type: z.string().optional(),
});

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    page: z.number(),
    results: z.array(item),
    total_pages: z.number().default(1),
    total_results: z.number().default(0),
  });

export const MovieListSchema = paginated(MovieSchema);

export const VideoSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  site: z.string(),
  type: z.string(),
  official: z.boolean().default(false),
  published_at: z.string().default(''),
  iso_639_1: z.string().nullish(),
});

export const CastSchema = z.object({
  id: z.number(),
  name: z.string(),
  character: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  profile_path: nstr,
  order: z.number().default(999),
  credit_id: z.string().optional(),
});

export const CrewSchema = z.object({
  id: z.number(),
  name: z.string(),
  job: z.string(),
  department: z.string().default(''),
  profile_path: nstr,
  credit_id: z.string().optional(),
});

export const ImageSchema = z.object({
  file_path: z.string(),
  width: z.number(),
  height: z.number(),
  aspect_ratio: z.number().default(1),
  iso_639_1: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
});

export const ImagesSchema = z.object({
  backdrops: z.array(ImageSchema).default([]),
  posters: z.array(ImageSchema).default([]),
  logos: z.array(ImageSchema).default([]),
});

export const ProviderSchema = z.object({
  provider_id: z.number(),
  provider_name: z.string(),
  logo_path: nstr,
  display_priority: z.number().default(99),
});

export const WatchRegionSchema = z.object({
  link: z.string().optional(),
  flatrate: z.array(ProviderSchema).optional(),
  rent: z.array(ProviderSchema).optional(),
  buy: z.array(ProviderSchema).optional(),
  free: z.array(ProviderSchema).optional(),
  ads: z.array(ProviderSchema).optional(),
});

export const TmdbReviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  content: z.string(),
  created_at: z.string(),
  url: z.string().optional(),
  author_details: z
    .object({ rating: z.number().nullish(), avatar_path: nstr, username: z.string().optional() })
    .optional(),
});

export const ReleaseDatesSchema = z.object({
  results: z.array(
    z.object({
      iso_3166_1: z.string(),
      release_dates: z.array(
        z.object({
          certification: z.string().default(''),
          release_date: z.string(),
          type: z.number(),
        }),
      ),
    }),
  ),
});

export const MovieDetailSchema = MovieSchema.omit({ genre_ids: true }).extend({
  genre_ids: z.array(z.number()).optional(),
  genres: z.array(GenreSchema).default([]),
  runtime: z
    .number()
    .nullish()
    .transform((v) => v ?? null),
  tagline: nstr,
  status: z.string().default(''),
  budget: z.number().default(0),
  revenue: z.number().default(0),
  imdb_id: nstr,
  homepage: nstr,
  spoken_languages: z
    .array(z.object({ english_name: z.string(), iso_639_1: z.string(), name: z.string() }))
    .default([]),
  production_companies: z
    .array(z.object({ id: z.number(), name: z.string(), logo_path: nstr }))
    .default([]),
  videos: z.object({ results: z.array(VideoSchema) }).default({ results: [] }),
  credits: z
    .object({ cast: z.array(CastSchema).default([]), crew: z.array(CrewSchema).default([]) })
    .default({ cast: [], crew: [] }),
  images: ImagesSchema.default({ backdrops: [], posters: [], logos: [] }),
  similar: MovieListSchema.optional(),
  recommendations: MovieListSchema.optional(),
  release_dates: ReleaseDatesSchema.optional(),
  'watch/providers': z.object({ results: z.record(z.string(), WatchRegionSchema) }).optional(),
  reviews: paginated(TmdbReviewSchema).optional(),
});

export const PersonCreditSchema = MovieSchema.extend({
  character: z.string().optional(),
  job: z.string().optional(),
  credit_id: z.string().optional(),
});

export const PersonSchema = z.object({
  id: z.number(),
  name: z.string(),
  biography: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  birthday: nstr,
  deathday: nstr,
  place_of_birth: nstr,
  profile_path: nstr,
  known_for_department: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  popularity: z.number().default(0),
  imdb_id: nstr,
  movie_credits: z
    .object({
      cast: z.array(PersonCreditSchema).default([]),
      crew: z.array(PersonCreditSchema).default([]),
    })
    .default({ cast: [], crew: [] }),
  images: z.object({ profiles: z.array(ImageSchema).default([]) }).default({ profiles: [] }),
});

export const PersonResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  profile_path: nstr,
  known_for_department: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  popularity: z.number().default(0),
  media_type: z.literal('person'),
});

export const MultiListSchema = paginated(z.record(z.string(), z.unknown()));

export const GenreListSchema = z.object({ genres: z.array(GenreSchema) });
