'use client';

import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { Bookmark, Home, Search, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/tokens';
import { useUiStore } from '@/stores/ui';
import { TransitionLink } from './TransitionLink';

const HIDDEN_ON = /^\/(login|signup|forgot-password|profiles)(\/|$)/;

/** Mobile bottom tab bar with a sliding active pill and safe-area inset (spec 62). */
export function BottomTabBar() {
  const pathname = usePathname();
  const set = useUiStore((s) => s.set);
  const searchOpen = useUiStore((s) => s.searchOpen);
  if (HIDDEN_ON.test(pathname)) return null;

  const tabs = [
    { key: 'home', label: 'Home', href: '/', icon: Home, active: pathname === '/' },
    {
      key: 'search',
      label: 'Search',
      icon: Search,
      active: searchOpen || pathname.startsWith('/search'),
    },
    {
      key: 'list',
      label: 'My list',
      href: '/my-list',
      icon: Bookmark,
      active: pathname.startsWith('/my-list'),
    },
    {
      key: 'profile',
      label: 'Profile',
      href: '/account',
      icon: UserRound,
      active: pathname.startsWith('/account') || pathname.startsWith('/profiles'),
    },
  ];

  return (
    <nav
      aria-label="Tabs"
      className="border-line bg-void/85 fixed inset-x-0 bottom-0 z-(--z-nav) border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          const inner = (
            <>
              {t.active && (
                <motion.span
                  layoutId="tab-pill"
                  transition={SPRING}
                  className="rounded-pill bg-violet/20 absolute inset-x-3 inset-y-1.5 -z-10"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={cn('size-5', t.active ? 'text-violet' : 'text-dim')}
                aria-hidden="true"
              />
              <span
                className={cn('text-[0.7rem] font-semibold', t.active ? 'text-reel' : 'text-dim')}
              >
                {t.label}
              </span>
            </>
          );
          const cls =
            'relative isolate flex min-h-14 flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform duration-instant';
          return (
            <li key={t.key}>
              {t.href ? (
                <TransitionLink
                  href={t.href}
                  className={cls}
                  aria-current={t.active ? 'page' : undefined}
                >
                  {inner}
                </TransitionLink>
              ) : (
                <button
                  type="button"
                  className={cn(cls, 'w-full')}
                  onClick={() => set('searchOpen', true)}
                  aria-label="Open search"
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
