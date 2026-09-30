/** TanStack Query key factory. */
export const qk = {
  movie: (id: number) => ['movie', id] as const,
  personCredits: (id: number) => ['person-credits', id] as const,
  search: (q: string) => ['search', q] as const,
  searchPage: (q: string, filters: Record<string, string>) => ['search-page', q, filters] as const,
  discover: (params: Record<string, unknown>) => ['discover', params] as const,
  row: (key: string) => ['row', key] as const,
  watchlist: (profileId: string) => ['watchlist', profileId] as const,
  history: (profileId: string) => ['history', profileId] as const,
  ratings: (profileId: string) => ['ratings', profileId] as const,
  rating: (profileId: string, movieId: number) => ['rating', profileId, movieId] as const,
  siteReviews: (movieId: number) => ['site-reviews', movieId] as const,
  siteAverage: (movieId: number) => ['site-average', movieId] as const,
  profiles: (userId: string) => ['profiles', userId] as const,
  recommendations: (profileId: string) => ['recommendations', profileId] as const,
};
