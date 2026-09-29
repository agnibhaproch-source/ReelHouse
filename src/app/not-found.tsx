import type { Metadata } from 'next';
import { ScrambleText } from '@/components/motion/ScrambleText';
import { NotFoundSearch } from '@/components/layout/NotFoundSearch';
import { Row } from '@/components/movie/Row';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Reel missing', robots: { index: false } };

function TornStrip() {
  return (
    <svg viewBox="0 0 480 110" className="w-[min(90vw,560px)] text-line" aria-hidden="true">
      <defs>
        <clipPath id="left-half">
          <path d="M0 0h232l-8 18 12 16-10 20 14 18-9 20 7 18H0z" />
        </clipPath>
        <clipPath id="right-half">
          <path d="M248 0h232v110H250l-7-18 9-20-14-18 10-20-12-16z" />
        </clipPath>
      </defs>
      {(['left-half', 'right-half'] as const).map((id, k) => (
        <g key={id} clipPath={`url(#${id})`} transform={k ? 'translate(10 6) rotate(3 360 55)' : 'rotate(-2 120 55)'}>
          <rect x="0" y="0" width="480" height="110" rx="6" fill="var(--bg-seat)" stroke="currentColor" strokeWidth="2" />
          {Array.from({ length: 16 }, (_, i) => (
            <g key={i}>
              <rect x={10 + i * 30} y="8" width="14" height="10" rx="2" fill="var(--bg-void)" />
              <rect x={10 + i * 30} y="92" width="14" height="10" rx="2" fill="var(--bg-void)" />
            </g>
          ))}
          {[0, 1, 2, 3].map((f) => (
            <rect key={f} x={14 + f * 118} y="26" width="104" height="58" rx="3" fill="none" stroke={f === 1 || f === 2 ? 'var(--marquee-violet)' : 'currentColor'} strokeDasharray={f === 1 || f === 2 ? '5 4' : undefined} strokeWidth="2" />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** 404 (spec 64): "This reel is missing." */
export default function NotFound() {
  return (
    <div data-cursor="drag" data-cursor-label="Lost" data-cursor-wander className="flex flex-col items-center gap-8 px-gutter pt-36 pb-10 text-center">
      <TornStrip />
      <ScrambleText as="h1" text="This reel is missing." loop={3500} className="font-display text-h1" />
      <p className="max-w-lg text-dim">The page you’re looking for was cut from this print. Search for a title, or pick something trending.</p>
      <NotFoundSearch />
      <Button href="/" variant="secondary">
        Back to the lobby
      </Button>
      <div className="w-screen">
        <Row rowKey="trending" title="Trending now" source={{ path: 'trending/movie/week' }} />
      </div>
    </div>
  );
}
