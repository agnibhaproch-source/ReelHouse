'use client';

import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import {
  requestTransition,
  shouldIntercept,
  transitionKindFor,
  type TransitionKind,
} from '@/lib/transition';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
  Omit<LinkProps, 'href'> & { href: string; children: ReactNode; transition?: TransitionKind };

/** next/link that routes through the TransitionLayer (shutter by default; burn into auth). */
export const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink(
  { href, onClick, transition, children, ...rest },
  ref,
) {
  const router = useRouter();
  return (
    <Link
      ref={ref}
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (!shouldIntercept(e, href)) return;
        e.preventDefault();
        requestTransition({
          href,
          kind: transition ?? transitionKindFor(href),
          push: (h) => router.push(h, { scroll: false }),
        });
      }}
    >
      {children}
    </Link>
  );
});
