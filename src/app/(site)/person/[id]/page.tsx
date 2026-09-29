import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPerson } from '@/lib/tmdb/endpoints';
import { withMeta } from '@/lib/tmdb/meta';
import { tmdbImage, SIZES } from '@/lib/tmdb/images';
import { safe } from '@/lib/tmdb/safe';
import { truncate } from '@/lib/utils';
import { SITE_URL } from '@/lib/site';
import type { PersonCredit } from '@/lib/tmdb/types';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { Row } from '@/components/movie/Row';
import { Biography } from '@/components/movie/person/Biography';
import { Filmography } from '@/components/movie/person/Filmography';
import { PhotoMasonry } from '@/components/movie/person/PhotoMasonry';
import { StatusBanner } from '@/components/layout/StatusBanner';

export const revalidate = 86400;

/** Render on first request, then cache (ISR). */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

const parseId = (raw: string) => {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  if (!id) return { title: 'Person not found' };
  const { data: p } = await safe(getPerson(id));
  if (!p) return { title: 'Person not found' };
  const image = tmdbImage(p.profile_path, 'h632');
  return {
    title: p.name,
    description: truncate(p.biography || `${p.name} — ${p.known_for_department}. Filmography, photos and more on Reelhouse.`, 160),
    alternates: { canonical: `/person/${id}` },
    openGraph: { type: 'profile', title: p.name, images: image ? [image] : undefined },
  };
}

const dateFmt = (d: string | null) => (d ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(Date.parse(d)) : null);

export default async function PersonPage({ params }: Props) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const { data: person, error } = await safe(getPerson(id));
  if (!person) {
    if (error?.kind === 'not_found') notFound();
    return (
      <div className="pt-24">
        <StatusBanner kind="down" />
      </div>
    );
  }

  const credits: PersonCredit[] = [...person.movie_credits.cast, ...person.movie_credits.crew];
  const seen = new Set<number>();
  const unique = credits.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  const knownFor = await withMeta([...unique].sort((a, b) => b.popularity - a.popularity).slice(0, 16));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: `${SITE_URL}/person/${person.id}`,
    image: tmdbImage(person.profile_path, 'h632') ?? undefined,
    description: person.biography ? truncate(person.biography, 300) : undefined,
    birthDate: person.birthday ?? undefined,
    deathDate: person.deathday ?? undefined,
    birthPlace: person.place_of_birth ?? undefined,
    jobTitle: person.known_for_department || undefined,
    sameAs: person.imdb_id ? [`https://www.imdb.com/name/${person.imdb_id}/`] : undefined,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <header className="mx-auto grid max-w-7xl gap-10 px-gutter pt-32 pb-12 md:grid-cols-[minmax(220px,320px)_1fr] md:items-end">
        <div className="relative aspect-[2/3] w-[min(60vw,320px)] overflow-hidden rounded-modal bg-seat shadow-2xl max-md:mx-auto">
          <TmdbImage path={person.profile_path} kind="profile" alt={`${person.name} portrait`} sizes={SIZES.detailPoster} priority fallbackTitle={person.name} />
        </div>
        <div className="flex flex-col gap-4 max-md:text-center">
          {person.known_for_department && <p className="text-small font-semibold text-cyan">{person.known_for_department}</p>}
          <SplitHeading as="h1" by="chars" trigger="mount" className="font-display text-hero leading-[0.9]">
            {person.name}
          </SplitHeading>
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-small max-md:justify-center">
            {person.birthday && (
              <div>
                <dt className="text-dim">Born</dt>
                <dd>{dateFmt(person.birthday)}</dd>
              </div>
            )}
            {person.deathday && (
              <div>
                <dt className="text-dim">Died</dt>
                <dd>{dateFmt(person.deathday)}</dd>
              </div>
            )}
            {person.place_of_birth && (
              <div>
                <dt className="text-dim">Place of birth</dt>
                <dd>{person.place_of_birth}</dd>
              </div>
            )}
            <div>
              <dt className="text-dim">Credits</dt>
              <dd>{unique.length}</dd>
            </div>
          </dl>
        </div>
      </header>

      <Biography text={person.biography} name={person.name} />
      {knownFor.length > 0 && <Row rowKey={`known-${person.id}`} title="Known for" items={knownFor} />}
      <Filmography credits={unique} />
      <PhotoMasonry photos={person.images.profiles.slice(0, 18)} name={person.name} />
    </article>
  );
}
