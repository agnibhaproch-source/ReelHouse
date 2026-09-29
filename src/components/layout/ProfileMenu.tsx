'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useId, useRef, useState } from 'react';
import { LogIn, LogOut, Settings, Users, Bookmark } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useSession } from '@/hooks/useSession';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { greetingFor } from '@/lib/utils';
import { SPRING, DUR } from '@/lib/tokens';
import { TransitionLink } from './TransitionLink';

/** Avatar dropdown with a spring scale from the top-right origin (spec 20) + time-aware greeting (spec 39). */
export function ProfileMenu() {
  const { profile, user, accountsEnabled, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useFocusTrap(panel, open, () => setOpen(false));

  const toggle = () => {
    if (!open) setGreeting(greetingFor());
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const name = profile?.name ?? (user ? 'Your account' : 'Guest');
  const close = () => setOpen(false);
  const item =
    'flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-small font-semibold text-reel/85 transition-colors duration-fast hover:bg-reel/10 hover:text-reel';

  return (
    <div className="relative">
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Profile menu for ${name}`}
        onClick={toggle}
        data-cursor="link"
        className="group/avatar grid size-11 place-items-center rounded-full"
      >
        <Avatar avatar={profile?.avatar ?? 'reel'} name={name} size={32} decorative />
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            ref={panel}
            id={id}
            role="dialog"
            aria-label="Profile menu"
            className="rounded-modal border-line bg-aisle/95 absolute top-full right-0 mt-2 w-64 origin-top-right border p-2 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: DUR.instant } }}
            transition={SPRING}
          >
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar avatar={profile?.avatar ?? 'reel'} name={name} size={40} decorative />
              <div className="min-w-0">
                <p className="truncate font-semibold">{name}</p>
                <p className="text-small text-amber">{greeting}</p>
              </div>
            </div>
            <div className="bg-line my-1 h-px" />
            <TransitionLink href="/my-list" className={item} onClick={close}>
              <Bookmark className="size-4" aria-hidden="true" /> My list
            </TransitionLink>
            <TransitionLink href="/profiles" className={item} onClick={close}>
              <Users className="size-4" aria-hidden="true" /> Switch profile
            </TransitionLink>
            <TransitionLink href="/account" className={item} onClick={close}>
              <Settings className="size-4" aria-hidden="true" /> Settings
            </TransitionLink>
            {accountsEnabled && (
              <>
                <div className="bg-line my-1 h-px" />
                {user ? (
                  <button type="button" className={item} onClick={() => void signOut()}>
                    <LogOut className="size-4" aria-hidden="true" /> Sign out
                  </button>
                ) : (
                  <TransitionLink href="/login" className={item} onClick={close}>
                    <LogIn className="size-4" aria-hidden="true" /> Sign in
                  </TransitionLink>
                )}
              </>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
