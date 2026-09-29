import 'server-only';
import { cookies } from 'next/headers';
import { PREFS_COOKIES } from './rows';
import type { RequestPrefs } from './tmdb/endpoints';

/** Per-request viewer prefs from cookies (language, kids profile, region). Makes the route dynamic. */
export async function getRequestPrefs(): Promise<RequestPrefs> {
  const jar = await cookies();
  const language = jar.get(PREFS_COOKIES.language)?.value;
  return {
    language: language && /^[a-z]{2}-[A-Z]{2}$/.test(language) ? language : 'en-US',
    kids: jar.get(PREFS_COOKIES.kids)?.value === '1',
    region: jar.get(PREFS_COOKIES.region)?.value ?? 'IN',
  };
}
