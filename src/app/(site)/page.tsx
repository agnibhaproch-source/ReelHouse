import { getRequestPrefs } from '@/lib/prefs.server';
import { getHeroSlides } from '@/lib/hero';
import { getNowPlaying, getTrending } from '@/lib/tmdb/endpoints';
import { withMeta } from '@/lib/tmdb/meta';
import { safe } from '@/lib/tmdb/safe';
import { usingFixtures } from '@/lib/tmdb/client';
import { homeRows } from '@/lib/rows';
import { Hero } from '@/components/movie/Hero';
import { Row } from '@/components/movie/Row';
import { NowShowingScene } from '@/components/movie/NowShowingScene';
import { GenreWall } from '@/components/movie/GenreWall';
import { LanguageMarquee } from '@/components/movie/LanguageMarquee';
import { RecommendationRows } from '@/components/movie/RecommendationRows';
import { ContinueExploringRow } from '@/components/movie/ContinueExploringRow';
import { StatusBanner } from '@/components/layout/StatusBanner';
import { EmptyState } from '@/components/layout/EmptyState';

export default async function HomePage() {
  const prefs = await getRequestPrefs();
  const [hero, trending, top10, nowPlaying] = await Promise.all([
    safe(getHeroSlides(prefs)),
    safe(getTrending('week', 1, prefs).then(async (p) => ({ ...p, results: await withMeta(p.results) }))),
    safe(getTrending('day', 1, prefs).then(async (p) => ({ ...p, results: await withMeta(p.results, 10) }))),
    safe(getNowPlaying(1, prefs).then((p) => withMeta(p.results, 5))),
  ]);
  const down = [hero, trending, top10].every((r) => r.error);
  const rows = homeRows();
  const [trendingRow, top10Row, ...rest] = rows;
  const early = rest.slice(0, 3); // popular in India, new, top rated
  const later = rest.slice(3);
  const langRows = later.filter((r) => r.key.startsWith('lang-'));
  const genreRows = later.filter((r) => r.key.startsWith('genre-'));

  return (
    <>
      {usingFixtures() && <StatusBanner kind="fixtures" />}
      {down && !usingFixtures() && <StatusBanner kind="down" />}
      {hero.data && hero.data.length > 0 ? (
        <Hero slides={hero.data} />
      ) : (
        <div className="px-gutter pt-40 pb-10">
          <h1 className="font-display text-hero">Reelhouse</h1>
          <p className="mt-4 max-w-xl text-dim">The projection room is warming up.</p>
        </div>
      )}

      <div className="relative z-[1] -mt-[12vh] max-md:-mt-4">
        {trendingRow && <Row rowKey={trendingRow.key} title={trendingRow.title} source={trendingRow.source} initial={trending.data ?? undefined} priorityCount={6} sprockets />}
        <ContinueExploringRow />
        {top10Row && <Row rowKey={top10Row.key} title={top10Row.title} source={top10Row.source} initial={top10.data ?? undefined} ranked />}
        {early.map((r) => (
          <Row key={r.key} rowKey={r.key} title={r.title} href={r.href} source={r.source} className="cv-auto" />
        ))}
      </div>

      {nowPlaying.data && <NowShowingScene movies={nowPlaying.data} />}

      <RecommendationRows />
      {langRows.map((r) => (
        <Row key={r.key} rowKey={r.key} title={r.title} href={r.href} source={r.source} className="cv-auto" sprockets={r.key === 'lang-hi'} />
      ))}
      <GenreWall />
      {genreRows.map((r) => (
        <Row key={r.key} rowKey={r.key} title={r.title} href={r.href} source={r.source} className="cv-auto" />
      ))}
      <LanguageMarquee />

      {down && !trending.data && (
        <EmptyState title="Live data is unavailable right now." body="Try again in a minute — or browse by language and genre below." action={{ href: '/browse', label: 'Browse genres' }} />
      )}
    </>
  );
}
