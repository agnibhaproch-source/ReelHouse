/**
 * "Describe what you want to watch" → discover filters. The shape both interpreters produce
 * (Claude when a key is configured, the rule-based parser otherwise) and its mapping to TMDB
 * discover params. Pure — safe on the client and in tests.
 */
import { GENRES } from '@/lib/tmdb/genres';
import { LANGUAGES } from '@/lib/tmdb/languages';

export const ASK_SORTS = ['popular', 'top', 'new'] as const;
export type AskSort = (typeof ASK_SORTS)[number];

export interface Interpretation {
  genres: number[];
  excludeGenres: number[];
  languages: string[];
  yearFrom: number | null;
  yearTo: number | null;
  runtimeMin: number | null;
  runtimeMax: number | null;
  ratingMin: number | null;
  sort: AskSort;
}

export const EMPTY_INTERPRETATION: Interpretation = {
  genres: [],
  excludeGenres: [],
  languages: [],
  yearFrom: null,
  yearTo: null,
  runtimeMin: null,
  runtimeMax: null,
  ratingMin: null,
  sort: 'popular',
};

const GENRE_WORDS: [RegExp, number][] = [
  [/\b(action|fight|shoot[- ]?out|explosions?)\b/, 28],
  [/\b(adventures?|quest|journey)\b/, 12],
  [/\b(animat\w*|cartoons?|anime|pixar|ghibli)\b/, 16],
  [/\b(comed\w*|funny|hilarious|laugh\w*|rom-?com|feel[- ]good|uplifting|light[- ]?hearted)\b/, 35],
  [/\b(crime|heist|gangsters?|mafia|noir)\b/, 80],
  [/\b(documentar\w*|true story|real events?)\b/, 99],
  [/\b(drama\w*|emotional|tear-?jerker|moving)\b/, 18],
  [/\b(family|kids?|children)\b/, 10751],
  [/\b(fantasy|magic\w*|dragons?|fairy ?tales?)\b/, 14],
  [/\b(histor\w*|period|biopic)\b/, 36],
  [/\b(horror|scary|terrifying|creepy|slasher|ghosts?)\b/, 27],
  [/\b(music\w*|songs?|dance)\b/, 10402],
  [/\b(myster\w*|whodunn?it|detective)\b/, 9648],
  [/\b(romance|romantic|love stor\w*|rom-?com)\b/, 10749],
  [/\b(sci-?fi|science fiction|space|aliens?|robots?|time travel|dystopi\w*|cyberpunk)\b/, 878],
  [/\b(thriller|suspense\w*|tense|edge of (my|your) seat|slow[- ]burn|psychological)\b/, 53],
  [/\b(war|soldiers?|battle)\b/, 10752],
  [/\b(western|cowboys?)\b/, 37],
];

const LANGUAGE_WORDS: [RegExp, string][] = [
  [/\b(hindi|bollywood)\b/, 'hi'],
  [/\b(tamil|kollywood)\b/, 'ta'],
  [/\b(telugu|tollywood)\b/, 'te'],
  [/\b(malayalam|mollywood)\b/, 'ml'],
  [/\b(kannada|sandalwood)\b/, 'kn'],
  [/\b(bengali|bangla)\b/, 'bn'],
  [/\bmarathi\b/, 'mr'],
  [/\b(korean|k-?drama|k-?movie)\b/, 'ko'],
  [/\b(japanese|anime)\b/, 'ja'],
  [/\b(spanish|mexican|argentin\w*)\b/, 'es'],
  [/\bfrench\b/, 'fr'],
  [/\b(english|hollywood|american|british)\b/, 'en'],
];

const clampYear = (y: number) => Math.min(new Date().getFullYear() + 1, Math.max(1900, y));

/** Keyword interpreter: good enough for most phrasing, and the fallback when there's no key. */
export function interpretRules(raw: string): Interpretation {
  const q = ` ${raw.toLowerCase()} `;
  const out: Interpretation = {
    ...EMPTY_INTERPRETATION,
    genres: [],
    languages: [],
    excludeGenres: [],
  };

  for (const [re, id] of GENRE_WORDS)
    if (re.test(q) && !out.genres.includes(id)) out.genres.push(id);
  for (const [re, code] of LANGUAGE_WORDS)
    if (re.test(q) && !out.languages.includes(code)) out.languages.push(code);
  // "anime" is both a form and a language; "not scary" etc.
  const not = /\b(?:no|not|without|nothing)\s+(\w+)/g;
  for (const m of q.matchAll(not)) {
    const word = m[1] ?? '';
    for (const [re, id] of GENRE_WORDS)
      if (re.test(` ${word} `)) {
        out.genres = out.genres.filter((g) => g !== id);
        if (!out.excludeGenres.includes(id)) out.excludeGenres.push(id);
      }
  }

  // Runtime: "under 2 hours", "less than 90 min", "short", "long", "over 2h"
  const under =
    /\b(?:under|less than|shorter than|below|max(?:imum)?|within)\s+(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|min|mins|minutes?)\b/.exec(
      q,
    );
  if (under) out.runtimeMax = Math.round(Number(under[1]) * (under[2]?.startsWith('h') ? 60 : 1));
  const over =
    /\b(?:over|more than|longer than|at least)\s+(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|min|mins|minutes?)\b/.exec(
      q,
    );
  if (over) out.runtimeMin = Math.round(Number(over[1]) * (over[2]?.startsWith('h') ? 60 : 1));
  if (out.runtimeMax === null && /\b(short|quick|weeknight)\b/.test(q)) out.runtimeMax = 100;
  if (out.runtimeMin === null && /\b(long|epic|sprawling)\b/.test(q)) out.runtimeMin = 140;

  // Years: "90s", "1990s", "from the 80s", "after 2015", "before 2000", "recent", "classic"
  const decade = /\b(?:19|20)?(\d)0'?s\b/.exec(q);
  if (decade) {
    const full = /\b((?:19|20)\d0)'?s\b/.exec(q);
    const start = full
      ? Number(full[1])
      : Number(decade[1]) * 10 + (Number(decade[1]) >= 3 ? 1900 : 2000);
    out.yearFrom = start;
    out.yearTo = start + 9;
  }
  const after = /\b(?:after|since|newer than|from)\s+((?:19|20)\d\d)\b/.exec(q);
  if (after) out.yearFrom = clampYear(Number(after[1]));
  const before = /\b(?:before|older than|until|pre-?)\s*((?:19|20)\d\d)\b/.exec(q);
  if (before) out.yearTo = clampYear(Number(before[1]));
  if (out.yearFrom === null && /\b(recent|new|latest|this year|modern)\b/.test(q))
    out.yearFrom = new Date().getFullYear() - 3;
  if (out.yearTo === null && /\b(classic|old|vintage|golden age)\b/.test(q)) out.yearTo = 1990;

  // Quality + order
  if (/\b(best|acclaimed|masterpiece|top[- ]rated|highly rated|critically|award)\b/.test(q)) {
    out.ratingMin = 7.5;
    out.sort = 'top';
  } else if (/(?<!feel[- ])\b(good|great|well[- ]reviewed|solid)\b/.test(q)) out.ratingMin = 6.8;
  if (/\b(newest|latest|just released|new releases?)\b/.test(q)) out.sort = 'new';
  return out;
}

/** True when the interpreter found nothing it could filter on. */
export function isEmptyInterpretation(i: Interpretation): boolean {
  return (
    !i.genres.length &&
    !i.excludeGenres.length &&
    !i.languages.length &&
    i.yearFrom === null &&
    i.yearTo === null &&
    i.runtimeMin === null &&
    i.runtimeMax === null &&
    i.ratingMin === null
  );
}

/** Raw TMDB discover params (every key is on the proxy allowlist). */
export function interpretationToQuery(i: Interpretation): Record<string, string> {
  const q: Record<string, string> = {};
  // Two genres → both (AND reads as "a sci-fi thriller"); more → any of them.
  if (i.genres.length) q.with_genres = i.genres.join(i.genres.length <= 2 ? ',' : '|');
  if (i.excludeGenres.length) q.without_genres = i.excludeGenres.join(',');
  if (i.languages.length) q.with_original_language = i.languages.join('|');
  if (i.yearFrom) q['primary_release_date.gte'] = `${i.yearFrom}-01-01`;
  if (i.yearTo) q['primary_release_date.lte'] = `${i.yearTo}-12-31`;
  if (i.runtimeMin) q['with_runtime.gte'] = String(i.runtimeMin);
  if (i.runtimeMax) q['with_runtime.lte'] = String(i.runtimeMax);
  if (i.ratingMin) q['vote_average.gte'] = String(i.ratingMin);
  q['vote_count.gte'] = i.sort === 'top' || i.ratingMin ? '200' : '30';
  return q;
}

/** Human chips for what was understood ("Korean", "Thriller", "Under 2h", "2010s"). */
export function interpretationChips(i: Interpretation): string[] {
  const chips: string[] = [];
  const genre = (id: number) => GENRES.find((g) => g.id === id)?.name ?? String(id);
  for (const code of i.languages) chips.push(LANGUAGES.find((l) => l.code === code)?.name ?? code);
  for (const id of i.genres) chips.push(genre(id));
  for (const id of i.excludeGenres) chips.push(`No ${genre(id).toLowerCase()}`);
  if (i.yearFrom && i.yearTo && i.yearTo - i.yearFrom === 9) chips.push(`${i.yearFrom}s`);
  else {
    if (i.yearFrom) chips.push(`From ${i.yearFrom}`);
    if (i.yearTo) chips.push(`Until ${i.yearTo}`);
  }
  const hm = (m: number) => (m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`);
  if (i.runtimeMax) chips.push(`Under ${hm(i.runtimeMax)}`);
  if (i.runtimeMin) chips.push(`Over ${hm(i.runtimeMin)}`);
  if (i.ratingMin) chips.push(`Rated ${i.ratingMin}+`);
  if (i.sort === 'new') chips.push('Newest first');
  return chips;
}
