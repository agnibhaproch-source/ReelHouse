/** Paths the client proxy (/api/tmdb/[...path]) may reach. Everything else → 403. */
const ALLOWED: readonly RegExp[] = [
  /^search\/(multi|movie)$/,
  /^discover\/movie$/,
  /^trending\/movie\/(day|week)$/,
  /^movie\/(popular|top_rated|upcoming|now_playing)$/,
  /^movie\/\d+\/(recommendations|similar)$/,
  /^movie\/\d+$/,
  /^genre\/movie\/list$/,
];

/** Query params the proxy forwards. */
export const ALLOWED_PARAMS = new Set([
  'query',
  'page',
  'sort_by',
  'with_genres',
  'without_genres',
  'with_original_language',
  'primary_release_year',
  'primary_release_date.gte',
  'primary_release_date.lte',
  'vote_average.gte',
  'vote_count.gte',
  'with_runtime.gte',
  'with_runtime.lte',
  'region',
  'include_adult',
  'append_to_response',
]);

export function isAllowedPath(path: string): boolean {
  return ALLOWED.some((re) => re.test(path));
}
