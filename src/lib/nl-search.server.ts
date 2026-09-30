import 'server-only';
import { z } from 'zod';
import { GENRES } from '@/lib/tmdb/genres';
import { LANGUAGES } from '@/lib/tmdb/languages';
import { ASK_SORTS, interpretRules, type Interpretation } from '@/lib/nl-search';

const MODEL = 'claude-opus-5-5';
const GENRE_SLUGS = GENRES.filter((g) => g.slug !== 'tv-movie').map((g) => g.slug) as [
  string,
  ...string[],
];
const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [string, ...string[]];

const AskSchema = z.object({
  genres: z.array(z.enum(GENRE_SLUGS)).max(3),
  exclude_genres: z.array(z.enum(GENRE_SLUGS)).max(3),
  languages: z.array(z.enum(LANGUAGE_CODES)).max(4),
  year_from: z.number().int().nullable(),
  year_to: z.number().int().nullable(),
  runtime_min_minutes: z.number().int().nullable(),
  runtime_max_minutes: z.number().int().nullable(),
  min_rating_out_of_10: z.number().nullable(),
  sort: z.enum(ASK_SORTS),
});

const SYSTEM = `You turn a viewer's description of what they want to watch into movie search filters for a film-discovery site (TMDB data).
Map moods and styles onto the closest genres (e.g. "slow-burn" → thriller, "feel-good" → comedy/family, "mind-bending" → sci-fi/mystery). Use at most three genres; when the viewer names two, both must apply.
Only set a language when the viewer names one, a film industry (Bollywood → hi, Tollywood → te, Kollywood → ta, Mollywood → ml), or a country's cinema. Only set years, runtime or a minimum rating when the description implies them ("recent" → the last three years, "classic" → before 1990, "short" → under 100 minutes, "acclaimed"/"best" → 7.5 and sort "top").
Put genres the viewer rules out ("nothing scary") in exclude_genres. If the text isn't about films at all, return empty lists and nulls with sort "popular".`;

let client: import('@anthropic-ai/sdk').default | null = null;
const cache = new Map<string, Interpretation>();
const CACHE_MAX = 500;

/** A key is configured for server-side Claude calls. */
export function aiSearchEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

async function interpretWithClaude(q: string): Promise<Interpretation | null> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const { betaZodOutputFormat } = await import('@anthropic-ai/sdk/helpers/beta/zod');
  client ??= new Anthropic({ timeout: 15_000, maxRetries: 1 });
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 2048,
    // Small extraction task: low effort keeps it fast and cheap. Refusal fallbacks route a
    // policy decline to Anthropic's recommended model instead of failing the search.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(AskSchema) },
    system: SYSTEM,
    messages: [{ role: 'user', content: q }],
  });
  if (response.stop_reason === 'refusal') return null;
  const out = response.parsed_output;
  if (!out) return null;
  const id = (slug: string) => GENRES.find((g) => g.slug === slug)?.id;
  const year = (y: number | null) =>
    y === null ? null : Math.min(new Date().getFullYear() + 2, Math.max(1900, y));
  const minutes = (m: number | null) => (m === null ? null : Math.min(400, Math.max(20, m)));
  return {
    genres: out.genres.map(id).filter((x): x is number => x !== undefined),
    excludeGenres: out.exclude_genres.map(id).filter((x): x is number => x !== undefined),
    languages: out.languages,
    yearFrom: year(out.year_from),
    yearTo: year(out.year_to),
    runtimeMin: minutes(out.runtime_min_minutes),
    runtimeMax: minutes(out.runtime_max_minutes),
    ratingMin:
      out.min_rating_out_of_10 === null ? null : Math.min(9, Math.max(1, out.min_rating_out_of_10)),
    sort: out.sort,
  };
}

/**
 * Interprets a description with Claude when ANTHROPIC_API_KEY is set, otherwise (or on any
 * failure) with the keyword parser. Results are memoised per server instance.
 */
export async function interpret(
  raw: string,
): Promise<{ interpretation: Interpretation; source: 'ai' | 'rules' }> {
  const q = raw.replace(/\s+/g, ' ').trim().slice(0, 200);
  if (aiSearchEnabled()) {
    const key = q.toLowerCase();
    const hit = cache.get(key);
    if (hit) return { interpretation: hit, source: 'ai' };
    try {
      const ai = await interpretWithClaude(q);
      if (ai) {
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
        cache.set(key, ai);
        return { interpretation: ai, source: 'ai' };
      }
    } catch (err) {
      console.error('[ask] Claude interpretation failed; using rules', err);
    }
  }
  return { interpretation: interpretRules(q), source: 'rules' };
}
