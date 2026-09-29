# 11 — TMDB Data Layer (real movie images)

## Account
Create a free account at themoviedb.org → Settings → API → copy the **API Read Access Token** (v4 bearer). Store as `TMDB_READ_TOKEN` (server only, never `NEXT_PUBLIC_`).

## Attribution (required)
Footer shows TMDB logo + "This product uses the TMDB API but is not endorsed or certified by TMDB."

## `src/lib/tmdb/client.ts`
- `tmdbFetch<T>(path, params, { revalidate })` — server-only (`import 'server-only'`).
- Bearer auth header, `language` param from user setting (default `en-US`).
- `next: { revalidate }` — trending 1h, details 24h, genres 7d.
- Zod-validate every response; on failure log and throw typed `TmdbError`.
- Retry once on 429 with backoff.

## Endpoints (`endpoints.ts`)
| Function | TMDB path |
|---|---|
| `getTrending(window)` | `/trending/movie/{day|week}` |
| `getPopular`, `getTopRated`, `getUpcoming`, `getNowPlaying` | `/movie/...` |
| `getMovie(id)` | `/movie/{id}?append_to_response=videos,credits,images,similar,recommendations,release_dates,watch/providers,reviews` + `include_image_language=en,null` |
| `getGenres()` | `/genre/movie/list` |
| `discover({ genre, lang, sort, year, page })` | `/discover/movie` |
| `searchMulti(q, page)` | `/search/multi` |
| `getPerson(id)` | `/person/{id}?append_to_response=movie_credits,images` |

## Language rows ("universal")
Use `discover` with `with_original_language`: `hi, ta, te, ml, kn, bn, mr, ko, ja, es, fr, en`. Config in `src/lib/tmdb/languages.ts` with display names.

## Image helper (`images.ts`)
- Base `https://image.tmdb.org/t/p/`
- Sizes: poster `w342` (card), `w500` (detail), `w780` (retina); backdrop `w1280`, `original` (hero); logo `w500`; profile `w185`.
- Custom `next/image` loader mapping requested width → nearest TMDB size.
- `getBestLogo(images)` — prefer `iso_639_1 === 'en'`, highest vote, PNG.
- Blur placeholder: generate from `w92` poster on server (base64) — cache per id.

## Dominant color
`getDominantColor(posterPath)` server util via fast-average-color → returns hex; cached. Used for card glow + detail page ambient light.

## Client proxy
`/api/tmdb/[...path]` route handler for client-side calls (search, infinite scroll) so the token stays server-side. Whitelist allowed paths.

## Types
Full TS types for Movie, MovieDetail, Video, Credit, Person, Genre, Paginated<T>.

## Acceptance
- [ ] Token never appears in client bundle (search `.next/static`)
- [ ] All endpoints unit-tested with mocked fetch
- [ ] Invalid responses throw typed errors
- [ ] Posters render through `next/image` with correct size selected
