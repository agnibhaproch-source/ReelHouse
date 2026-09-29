'use client';

import { useState, type ReactNode } from 'react';
import { Bookmark, Heart, Plus, Share2, ChevronRight, Search, Info } from 'lucide-react';
import { COLORS } from '@/lib/tokens';
import { toast } from '@/stores/toast';
import type { Movie } from '@/lib/tmdb/types';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { Input } from '@/components/ui/Input';
import { Modal, type ModalVariant } from '@/components/ui/Modal';
import { Tooltip } from '@/components/ui/Tooltip';
import { RatingRing } from '@/components/ui/RatingRing';
import { StarRating } from '@/components/ui/StarRating';
import { Avatar } from '@/components/ui/Avatar';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Tabs } from '@/components/ui/Tabs';
import { SubmitButton, type SubmitState } from '@/components/ui/SubmitButton';
import { CardSkeleton, HeroSkeleton, RowSkeleton, TextSkeleton } from '@/components/ui/Skeleton';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { AVATARS } from '@/lib/data/types';
import { MovieCard } from '@/components/movie/MovieCard';
import { Wordmark } from '@/components/layout/Wordmark';
import { RollText } from '@/components/motion/RollText';
import { Magnetic } from '@/components/motion/Magnetic';
import { Counter } from '@/components/motion/Counter';
import { ScrambleText } from '@/components/motion/ScrambleText';
import { VariableHover } from '@/components/motion/VariableHover';
import { Marquee } from '@/components/motion/Marquee';
import { EaseDemo } from './EaseDemo';

const TOKENS: { name: string; hex: string; use: string }[] = [
  { name: '--bg-void', hex: COLORS.void, use: 'Page background' },
  { name: '--bg-seat', hex: COLORS.seat, use: 'Raised surfaces' },
  { name: '--bg-aisle', hex: COLORS.aisle, use: 'Inputs, modals' },
  { name: '--line', hex: COLORS.line, use: 'Hairlines' },
  { name: '--text-reel', hex: COLORS.reel, use: 'Primary text' },
  { name: '--text-dim', hex: COLORS.dim, use: 'Secondary text' },
  { name: '--marquee-violet', hex: COLORS.violet, use: 'Primary accent, focus' },
  { name: '--marquee-cyan', hex: COLORS.cyan, use: 'Progress, links' },
  { name: '--projector-amber', hex: COLORS.amber, use: 'Ratings, “new”' },
  { name: '--danger', hex: COLORS.danger, use: 'Errors, remove' },
];

const TYPE = [
  { token: '--fs-hero', cls: 'font-display text-hero leading-[0.9]', sample: 'Hero' },
  { token: '--fs-h1', cls: 'font-display text-h1', sample: 'Heading one' },
  { token: '--fs-h2', cls: 'font-display text-h2', sample: 'Heading two' },
  { token: '--fs-h3', cls: 'font-display text-h3', sample: 'Heading three' },
  { token: '--fs-body', cls: 'text-body', sample: 'Body copy in Manrope keeps to seventy characters per line for comfortable reading.' },
  { token: '--fs-small', cls: 'text-small text-dim', sample: 'Small / meta text' },
];

const SPACES = [4, 8, 12, 16, 24, 32, 40, 48, 56, 64, 80, 96];

const DEMO_MOVIE: Movie = {
  id: 1001,
  title: 'The Last Projectionist',
  overview: 'A demo card.',
  poster_path: null,
  backdrop_path: null,
  release_date: new Date(Date.now() - 5 * 86_400_000).toISOString().slice(0, 10),
  vote_average: 8.2,
  vote_count: 1200,
  popularity: 100,
  genre_ids: [18],
  original_language: 'en',
  adult: false,
  meta: { color: COLORS.violet, blur: null },
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line py-14">
      <h2 id={id} className="mb-8 font-display text-h2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col items-start gap-2">
      {children}
      <figcaption className="text-[0.72rem] text-dim">{label}</figcaption>
    </figure>
  );
}

/** /styleguide — every token, type style, ease, component and state (specs 12, 14, 33). */
export function Styleguide() {
  const [modal, setModal] = useState<ModalVariant | null>(null);
  const [chip, setChip] = useState(true);
  const [sw, setSw] = useState(true);
  const [cb, setCb] = useState(true);
  const [range, setRange] = useState<number | [number, number]>([1990, 2020]);
  const [rating, setRating] = useState<number | null>(7);
  const [tab, setTab] = useState('one');
  const [submit, setSubmit] = useState<SubmitState>('idle');

  const cycleSubmit = () => {
    setSubmit('loading');
    setTimeout(() => setSubmit(Math.random() > 0.5 ? 'success' : 'error'), 1200);
    setTimeout(() => setSubmit('idle'), 2600);
  };

  return (
    <div className="mx-auto max-w-7xl px-gutter pt-32 pb-20">
      <h1 className="font-display text-hero leading-[0.9]">Styleguide</h1>
      <p className="mt-4 max-w-xl text-dim">The Projection Room — tokens, type, motion and every component state. Tab through it: every control has a visible focus ring.</p>

      <Section id="sg-color" title="Colour">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {TOKENS.map((t) => (
            <li key={t.name} className="overflow-hidden rounded-modal border border-line">
              <div className="h-24" style={{ background: `var(${t.name})` }} />
              <div className="p-3">
                <code className="block text-small">{t.name}</code>
                <span className="text-[0.75rem] text-dim">
                  {t.hex} · {t.use}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sg-type" title="Typography">
        <ul className="flex flex-col gap-6">
          {TYPE.map((t) => (
            <li key={t.token} className="grid gap-2 md:grid-cols-[160px_1fr] md:items-baseline">
              <code className="text-small text-dim">{t.token}</code>
              <p className={t.cls}>{t.sample}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-small text-dim">Wordmark (hover: SOFT 0→100, wght 600→800)</p>
            <span className="group/wm inline-block">
              <Wordmark className="text-h1" />
            </span>
          </div>
          <div>
            <p className="mb-2 text-small text-dim">VariableHover (move the pointer near the letters)</p>
            <VariableHover text="Projection" className="text-h1" />
          </div>
          <div>
            <p className="mb-2 text-small text-dim">ScrambleText</p>
            <ScrambleText text="Loading the reel" loop={2500} className="font-display text-h3" />
          </div>
          <div>
            <p className="mb-2 text-small text-dim">Counter (odometer)</p>
            <Counter value="$1,204,000" className="font-display text-h2" />
          </div>
        </div>
      </Section>

      <Section id="sg-space" title="Spacing & radius">
        <div className="flex flex-wrap items-end gap-3">
          {SPACES.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className="bg-violet/60" style={{ width: s, height: s }} />
              <code className="text-[0.7rem] text-dim">--space-{i + 1}</code>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-6">
          {[
            ['poster 6px', 'rounded-poster'],
            ['modal 16px', 'rounded-modal'],
            ['pill 999px', 'rounded-pill'],
            ['hero 0', 'rounded-none'],
          ].map(([label, cls]) => (
            <State key={label} label={label as string}>
              <div className={`h-20 w-28 border border-line bg-seat ${cls}`} />
            </State>
          ))}
        </div>
      </Section>

      <Section id="sg-motion" title="Easing & durations">
        <EaseDemo />
      </Section>

      <Section id="sg-buttons" title="Buttons">
        <div className="flex flex-wrap items-start gap-8">
          <State label="primary · magnetic, fill wipe from entry side, rolling label">
            <Button icon={<ChevronRight />} iconAnim="nudge-right">
              Play trailer
            </Button>
          </State>
          <State label="primary · loading">
            <Button loading>Saving</Button>
          </State>
          <State label="primary · disabled">
            <Button disabled>Add to my list</Button>
          </State>
          <State label="secondary · spotlight border, blur">
            <Button variant="secondary" icon={<Info />} iconAnim="spin">
              More info
            </Button>
          </State>
          <State label="ghost">
            <Button variant="ghost">Cancel</Button>
          </State>
          <State label="icon · heart beats">
            <Button variant="icon" label="Like" icon={<Heart />} iconAnim="heart" />
          </State>
          <State label="icon · plus rotates">
            <Button variant="icon" label="Add" icon={<Plus />} iconAnim="plus" />
          </State>
          <State label="icon · share nudges">
            <Button variant="icon" label="Share" icon={<Share2 />} iconAnim="share" />
          </State>
          <State label="icon · bookmark">
            <Button variant="icon" label="Bookmark" icon={<Bookmark />} />
          </State>
          <State label="submit morph (click)">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                cycleSubmit();
              }}
              className="w-56"
            >
              <SubmitButton state={submit}>Submit form</SubmitButton>
            </form>
          </State>
          <State label="magnetic wrapper">
            <Magnetic>
              <span data-magnetic-inner className="grid size-20 place-items-center rounded-full border border-line text-small">
                Magnet
              </span>
            </Magnetic>
          </State>
          <State label="roll text link">
            <a href="#sg-buttons" className="text-body font-semibold">
              <RollText>Rolling link</RollText>
            </a>
          </State>
        </div>
      </Section>

      <Section id="sg-chips" title="Pills & chips">
        <div className="flex flex-wrap gap-6">
          <State label="genre (link) · fill from centre">
            <Pill href="#sg-chips">Thriller</Pill>
          </State>
          <State label="filter · selected / unselected (click)">
            <Pill selected={chip} onToggle={setChip}>
              Top rated
            </Pill>
          </State>
          <State label="small">
            <Pill size="sm" selected={false} onToggle={() => {}}>
              Hindi
            </Pill>
          </State>
        </div>
      </Section>

      <Section id="sg-inputs" title="Inputs">
        <div className="grid max-w-3xl gap-8 md:grid-cols-2">
          <State label="text · empty">
            <Input label="Email" className="w-72" />
          </State>
          <State label="text · filled">
            <Input label="Name" defaultValue="Agni" className="w-72" />
          </State>
          <State label="text · error">
            <Input label="Password" type="password" defaultValue="abc" error="Use at least 8 characters." className="w-72" />
          </State>
          <State label="text · disabled">
            <Input label="Locked" disabled className="w-72" />
          </State>
          <State label="search">
            <Input variant="search" label="Search" icon={<Search />} className="w-72" />
          </State>
          <State label="checkbox · path draws">
            <Checkbox label="Remember me" checked={cb} onChange={setCb} />
          </State>
          <State label="switch · spring knob">
            <Switch label="Sound" checked={sw} onChange={setSw} />
          </State>
          <State label="range · thumb grows + value bubble">
            <div className="w-72">
              <RangeSlider label="Release year" min={1950} max={2026} value={range} onChange={setRange} />
            </div>
          </State>
        </div>
      </Section>

      <Section id="sg-rating" title="Rating">
        <div className="flex flex-wrap items-center gap-10">
          <State label="stars · hover preview, half steps">
            <StarRating value={rating} onChange={setRating} />
          </State>
          <State label="stars · read only">
            <StarRating value={7} readOnly size="sm" />
          </State>
          <State label="ring · draws on enter, thickens on hover">
            <RatingRing value={8.2} size={64} />
          </State>
          <State label="ring · violet">
            <RatingRing value={6.4} size={64} color="violet" />
          </State>
        </div>
      </Section>

      <Section id="sg-avatars" title="Avatars">
        <div className="flex flex-wrap gap-6">
          {AVATARS.map((a) => (
            <State key={a} label={`${a} · ring rotates on hover`}>
              <button type="button" className="group/avatar rounded-[22%]" aria-label={`${a} avatar`}>
                <Avatar avatar={a} name={a} size={72} blink decorative />
              </button>
            </State>
          ))}
        </div>
      </Section>

      <Section id="sg-overlays" title="Modal, tooltip, toast, tabs">
        <div className="flex flex-wrap gap-4">
          {(['center', 'sheet', 'fullscreen'] as ModalVariant[]).map((v) => (
            <Button key={v} variant="secondary" onClick={() => setModal(v)} magnetic={false}>
              Open {v} modal
            </Button>
          ))}
          <Tooltip content="Tooltips wait 400ms, leave instantly">
            <Button variant="ghost">Hover for tooltip</Button>
          </Tooltip>
          <Tooltip content="Below the trigger" side="bottom">
            <Button variant="ghost">Bottom tooltip</Button>
          </Tooltip>
          <Button variant="ghost" onClick={() => toast.success('Added to my list')}>
            Success toast
          </Button>
          <Button variant="ghost" onClick={() => toast.error('Couldn’t save. Try again.')}>
            Error toast
          </Button>
          <Button variant="ghost" onClick={() => toast.info('Removed “Dune”', { action: { label: 'Undo', onAction: () => toast.success('Restored') } })}>
            Info toast with undo
          </Button>
        </div>
        <div className="mt-10 max-w-lg">
          <Tabs label="Demo tabs" value={tab} onChange={setTab} items={[{ id: 'one', label: 'Overview' }, { id: 'two', label: 'Cast' }, { id: 'three', label: 'Reviews' }]} />
        </div>
        <Modal open={modal !== null} onClose={() => setModal(null)} title={`${modal ?? ''} modal`} variant={modal ?? 'center'} description="Focus is trapped; Esc closes and returns focus.">
          <div className="mt-6 flex gap-3">
            <Button onClick={() => setModal(null)} data-autofocus>
              Close
            </Button>
          </div>
        </Modal>
      </Section>

      <Section id="sg-card" title="Movie card">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-6">
          <State label="idle / hover (tilt, glow, glare) / focus">
            <div className="w-40">
              <MovieCard movie={DEMO_MOVIE} />
            </div>
          </State>
          <State label="ranked">
            <div className="w-48">
              <MovieCard movie={{ ...DEMO_MOVIE, id: 1002, title: 'The Silent Matinee' }} rank={1} />
            </div>
          </State>
          <State label="continue exploring (progress + remove)">
            <div className="w-40">
              <MovieCard movie={{ ...DEMO_MOVIE, id: 1003, title: 'Neon Harbor' }} progress={0.6} onRemove={() => toast.info('Removed from row')} />
            </div>
          </State>
          <State label="loading">
            <div className="w-40">
              <CardSkeleton />
            </div>
          </State>
          <State label="broken image → designed fallback">
            <div className="relative aspect-[2/3] w-40 overflow-hidden rounded-poster">
              <TmdbImage path="/does-not-exist.jpg" kind="poster" alt="Missing poster" sizes="160px" fallbackTitle="Missing Reel" />
            </div>
          </State>
        </div>
      </Section>

      <Section id="sg-skeletons" title="Skeletons">
        <div className="flex flex-col gap-6">
          <div className="h-64 overflow-hidden rounded-modal">
            <HeroSkeleton />
          </div>
          <RowSkeleton count={5} />
          <div className="max-w-lg">
            <TextSkeleton lines={3} />
          </div>
        </div>
      </Section>

      <Section id="sg-marquee" title="Marquee">
        <Marquee speed={40} label="Demo marquee">
          {['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Korean', 'Japanese'].map((l) => (
            <span key={l} className="px-6 font-display text-h1 text-reel/40">
              {l}
            </span>
          ))}
        </Marquee>
      </Section>
    </div>
  );
}
