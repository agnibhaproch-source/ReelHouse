'use client';

import * as m from 'motion/react-m';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/tokens';
import { GENRES } from '@/lib/tmdb/genres';
import { LANGUAGES } from '@/lib/tmdb/languages';
import { useScrollListener } from '@/hooks/useLenis';
import { useUiStore } from '@/stores/ui';
import { gsap } from '@/lib/gsap';
import { isReducedNow } from '@/hooks/useMotionPrefs';
import { RollText } from '@/components/motion/RollText';
import { TransitionLink } from './TransitionLink';
import { Wordmark } from './Wordmark';
import { MegaMenu, type MegaItem } from './MegaMenu';
import { SearchTrigger } from './SearchTrigger';
import { SoundToggle } from './SoundToggle';
import { MotionToggle } from './MotionToggle';
import { ProfileMenu } from './ProfileMenu';
import { MobileMenu } from './MobileMenu';

const genreItems: MegaItem[] = GENRES.filter((g) => g.slug !== 'tv-movie').map((g) => ({
  href: `/browse/${g.slug}`,
  label: g.name,
  params: { with_genres: g.id, sort_by: 'popularity.desc' },
}));

const languageItems: MegaItem[] = LANGUAGES.map((l) => ({
  href: `/language/${l.code}`,
  label: l.name,
  sub: l.native !== l.name ? l.native : undefined,
  params: { with_original_language: l.code, sort_by: 'popularity.desc' },
}));

const HIDDEN_ON = /^\/(login|signup|forgot-password|profiles)(\/|$)/;
const SOLID_AFTER = 80;

/** Top navigation (spec 20): transparent over hero → glass after 80px; hides on scroll down. */
export function Navbar() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [solid, setSolid] = useState(false);
  const hidden = useRef(false);
  const setUi = useUiStore((s) => s.set);

  useScrollListener((y, _v, dir) => {
    setSolid(y > SOLID_AFTER);
    const el = ref.current;
    if (!el) return;
    // Never hide near the top (no flicker), or while a menu is open.
    const shouldHide = y > SOLID_AFTER * 2 && dir === 1 && !el.contains(document.activeElement);
    const shouldShow = dir === -1 || y <= SOLID_AFTER;
    if (shouldHide && !hidden.current) {
      hidden.current = true;
      setUi('navHidden', true);
      gsap.to(el, {
        yPercent: -100,
        duration: isReducedNow() ? 0 : 0.3,
        ease: 'shutter',
        overwrite: true,
      });
    } else if (shouldShow && hidden.current) {
      hidden.current = false;
      setUi('navHidden', false);
      gsap.to(el, {
        yPercent: 0,
        duration: isReducedNow() ? 0 : 0.45,
        ease: 'reel',
        overwrite: true,
      });
    }
  });

  if (HIDDEN_ON.test(pathname)) return null;

  const links = [
    { href: '/', label: 'Home', match: (p: string) => p === '/' },
    { href: '/my-list', label: 'My list', match: (p: string) => p.startsWith('/my-list') },
  ];
  const activeKey =
    pathname === '/'
      ? '/'
      : pathname.startsWith('/browse')
        ? 'genres'
        : pathname.startsWith('/language')
          ? 'languages'
          : pathname.startsWith('/my-list')
            ? '/my-list'
            : null;

  return (
    <header
      ref={ref}
      onFocus={() => {
        if (hidden.current && ref.current) {
          hidden.current = false;
          gsap.to(ref.current, { yPercent: 0, duration: 0.3, ease: 'reel' });
        }
      }}
      className="fixed inset-x-0 top-0 z-(--z-nav) will-change-transform"
    >
      <div
        className={cn(
          'px-gutter duration-base ease-reel relative flex h-(--nav-height) items-center gap-4 transition-[background-color,backdrop-filter]',
          solid
            ? 'bg-void/70 backdrop-blur-[16px]'
            : 'from-void/70 bg-gradient-to-b to-transparent',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'bg-line duration-base absolute inset-x-0 bottom-0 h-px transition-opacity',
            solid ? 'opacity-100' : 'opacity-0',
          )}
        />
        <TransitionLink
          href="/"
          className="group/wm -ml-1 flex min-h-11 items-center rounded-md px-1"
          aria-label="Reelhouse home"
        >
          <Wordmark />
        </TransitionLink>

        <nav aria-label="Primary" className="ml-6 hidden items-center md:flex">
          <NavLink href={links[0]!.href} label={links[0]!.label} active={activeKey === '/'} />
          <div className="relative">
            <MegaMenu
              label="Movies by genre"
              items={genreItems}
              active={activeKey === 'genres'}
              seeAll={{ href: '/browse', label: 'All genres' }}
            />
            {activeKey === 'genres' && <Underline />}
          </div>
          <div className="relative">
            <MegaMenu label="Languages" items={languageItems} active={activeKey === 'languages'} />
            {activeKey === 'languages' && <Underline />}
          </div>
          <NavLink
            href={links[1]!.href}
            label={links[1]!.label}
            active={activeKey === '/my-list'}
          />
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <SearchTrigger />
          <SoundToggle className="max-md:hidden" />
          <MotionToggle className="max-md:hidden" />
          <div className="max-md:hidden">
            <ProfileMenu />
          </div>
          <MobileMenu genres={genreItems} languages={languageItems} />
        </div>
      </div>
    </header>
  );
}

function Underline() {
  return (
    <m.span
      layoutId="nav-underline"
      transition={SPRING}
      className="rounded-pill bg-cyan absolute inset-x-3 bottom-1 h-0.5"
      aria-hidden="true"
    />
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <TransitionLink
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'text-small duration-fast relative flex min-h-11 items-center px-3 font-semibold transition-colors',
        active ? 'text-reel' : 'text-reel/75 hover:text-reel',
      )}
    >
      <RollText>{label}</RollText>
      {active && <Underline />}
    </TransitionLink>
  );
}
