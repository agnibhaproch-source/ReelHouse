import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMovie, getTrending } from '@/lib/tmdb/endpoints';
import { getPosterMeta, withMeta } from '@/lib/tmdb/meta';
import { getBestLogo, tmdbImage } from '@/lib/tmdb/images';
import { pickVideos } from '@/lib/tmdb/videos';
import { safe } from '@/lib/tmdb/safe';
import { usingFixtures } from '@/lib/tmdb/client';
import { fallbackGlow, filmAccent } from '@/lib/tmdb/color';
import { truncate } from '@/lib/utils';
import { SITE_URL } from '@/lib/site';
import { DetailHero } from '@/components/movie/detail/DetailHero';
import { DetailOverview } from '@/components/movie/detail/DetailOverview';
import { CastStrip } from '@/components/movie/detail/CastStrip';
import { VideoGrid } from '@/components/movie/detail/VideoGrid';
import { DetailFacts } from '@/components/movie/detail/DetailFacts';
import { WatchProviders } from '@/components/movie/detail/WatchProviders';
import { ReviewsSection } from '@/components/movie/detail/ReviewsSection';
import { Gallery } from '@/components/movie/detail/Gallery';
import { DetailTracker } from '@/components/movie/detail/DetailTracker';
import { FilmLeader } from '@/components/motion/FilmLeader';
import { Row } from '@/components/movie/Row';
import { StatusBanner } from '@/components/layout/StatusBanner';

export const revalidate = 86400;

type Props = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 && String(id) === raw.split('-')[0] ? id : null;
}

/** Pre-render the top 100 trending titles; the rest render on demand (ISR 24h). */
export async function generateStaticParams() {
  if (usingFixtures()) return [];
  const pages = await Promise.all(
    [1, 2, 3, 4, 5].map((p) => getTrending('week', p).catch(() => null)),
  );
  return pages
    .flatMap((p) => p?.results ?? [])
    .slice(0, 100)
    .map((m) => ({ id: String(m.id) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  if (!id) return { title: 'Movie not found' };
  const { data: m } = await safe(getMovie(id));
  if (!m) return { title: 'Movie not found' };
  const year = m.release_date?.slice(0, 4);
  const title = year ? `${m.title} (${year})` : m.title;
  const description = truncate(m.overview || m.tagline || `${m.title} on Reelhouse.`, 160);
  const image = tmdbImage(m.backdrop_path, 'w1280');
  return {
    title,
    description,
    alternates: { canonical: `/movie/${id}` },
    openGraph: { type: 'video.movie', title, description, url: `/movie/${id}` },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function MoviePage({ params }: Props) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const { data: movie, error } = await safe(getMovie(id));
  if (!movie) {
    if (error?.kind === 'not_found') notFound();
    return (
      <div className="pt-24">
        <StatusBanner kind="down" />
      </div>
    );
  }

  const [meta, recs] = await Promise.all([
    getPosterMeta(movie.poster_path),
    withMeta(
      (movie.recommendations?.results.length
        ? movie.recommendations.results
        : (movie.similar?.results ?? [])
      ).slice(0, 20),
    ),
  ]);
  const color = movie.poster_path ? meta.color : fallbackGlow(movie.id);
  const logo = getBestLogo(movie.images);
  const videos = pickVideos(movie.videos.results);
  const director = movie.credits.crew.find((c) => c.job === 'Director');
  const cert =
    movie.release_dates?.results
      .find((r) => r.iso_3166_1 === 'IN' || r.iso_3166_1 === 'US')
      ?.release_dates.find((d) => d.certification)?.certification ?? null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    url: `${SITE_URL}/movie/${movie.id}`,
    image: tmdbImage(movie.poster_path, 'w500') ?? undefined,
    description: movie.overview || undefined,
    datePublished: movie.release_date ?? undefined,
    genre: movie.genres.map((g) => g.name),
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    director: director
      ? { '@type': 'Person', name: director.name, url: `${SITE_URL}/person/${director.id}` }
      : undefined,
    actor: movie.credits.cast
      .slice(0, 5)
      .map((c) => ({ '@type': 'Person', name: c.name, url: `${SITE_URL}/person/${c.id}` })),
    aggregateRating:
      movie.vote_count > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: movie.vote_average.toFixed(1),
            bestRating: '10',
            worstRating: '0',
            ratingCount: movie.vote_count,
          }
        : undefined,
  };

  return (
    <article
      data-film-accent
      style={{
        ['--ambient' as string]: color,
        ['--film-accent' as string]: filmAccent(color),
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <DetailTracker movie={movie} genreIds={movie.genres.map((g) => g.id)} />
      <FilmLeader />
      <DetailHero
        movie={movie}
        logo={logo}
        videos={videos}
        color={color}
        blur={meta.blur}
        certification={cert}
      />
      <DetailOverview overview={movie.overview} tagline={movie.tagline} />
      <CastStrip cast={movie.credits.cast.slice(0, 20)} movieId={movie.id} />
      <VideoGrid videos={videos} movie={movie} color={color} />
      <DetailFacts movie={movie} />
      <WatchProviders providers={movie['watch/providers']?.results ?? {}} title={movie.title} />
      <ReviewsSection
        movieId={movie.id}
        title={movie.title}
        tmdbReviews={movie.reviews?.results ?? []}
        tmdbAverage={movie.vote_average}
      />
      <Gallery backdrops={movie.images.backdrops.slice(0, 12)} title={movie.title} />
      {recs.length > 0 && <Row rowKey={`recs-${movie.id}`} title="More like this" items={recs} />}
    </article>
  );
}
