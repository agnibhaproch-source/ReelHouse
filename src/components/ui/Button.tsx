'use client';

import Link from 'next/link';
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ButtonHTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { usePress } from '@/hooks/usePress';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useSpotlightBorder } from '@/hooks/useSpotlightBorder';
import { RollText } from '@/components/motion/RollText';
import { FilmReelSpinner } from './FilmReelSpinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
export type IconAnim =
  'heart' | 'plus' | 'share' | 'bookmark' | 'nudge-left' | 'nudge-right' | 'spin' | 'none';

type Common = {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  magnetic?: boolean;
  icon?: ReactNode;
  iconAnim?: IconAnim;
  /** Accessible label — required for icon-only buttons. */
  label?: string;
  children?: ReactNode;
  className?: string;
};

type AsButton = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { href?: undefined };
type AsLink = Common & {
  href: string;
  prefetch?: boolean;
  onClick?: () => void;
  target?: string;
  rel?: string;
  'aria-label'?: string;
};
export type ButtonProps = AsButton | AsLink;

const base =
  'group/btn relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-semibold transition-[background-color,color,box-shadow,opacity,backdrop-filter] duration-fast ease-reel disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40';

const variants: Record<ButtonVariant, string> = {
  primary: 'rounded-pill bg-violet text-void hover:text-void',
  secondary:
    'spotlight-border rounded-pill bg-reel/10 text-reel backdrop-blur-md hover:bg-reel/15 hover:backdrop-blur-xl',
  ghost: 'rounded-pill text-reel hover:bg-reel/10',
  icon: 'spotlight-border rounded-pill bg-reel/10 text-reel backdrop-blur-md hover:bg-reel/15',
};

const sizes = {
  sm: 'h-9 px-4 text-small',
  md: 'h-11 px-6 text-body',
  lg: 'h-13 px-8 text-body',
};
const iconSizes = { sm: 'size-9', md: 'size-11', lg: 'size-13' };

const iconAnimClass: Record<IconAnim, string> = {
  heart: 'group-hover/btn:animate-[heartbeat_0.8s_var(--ease-snap)_infinite]',
  plus: 'transition-transform duration-base ease-snap group-hover/btn:rotate-90 group-focus-visible/btn:rotate-90',
  share:
    'transition-transform duration-fast ease-reel group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5',
  bookmark: '',
  'nudge-left': 'transition-transform duration-fast ease-reel group-hover/btn:-translate-x-1',
  'nudge-right': 'transition-transform duration-fast ease-reel group-hover/btn:translate-x-1',
  spin: 'transition-transform duration-slow ease-reel group-hover/btn:rotate-180',
  none: '',
};

function entrySide(e: ReactPointerEvent<HTMLElement>): string {
  const r = e.currentTarget.getBoundingClientRect();
  const dx = (e.clientX - r.left) / r.width - 0.5;
  const dy = (e.clientY - r.top) / r.height - 0.5;
  return Math.abs(dx) > Math.abs(dy)
    ? dx < 0
      ? 'left center'
      : 'right center'
    : dy < 0
      ? 'center top'
      : 'center bottom';
}

/**
 * Button primitive: idle, hover, active, focus, disabled, loading (spec 14).
 * Primary: magnetic + fill wipes from the pointer's entry side + rolling label + glow (spec 33).
 * All variants: press scale + projector ripple (spec 34).
 */
export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(props, forwarded) {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    magnetic = variant === 'primary',
    icon,
    iconAnim = 'none',
    label,
    children,
    className,
    ...rest
  } = props;
  const press = usePress<HTMLElement>({
    accent: variant === 'primary' ? 'var(--text-reel)' : 'var(--marquee-violet)',
  });
  const localRef = useRef<HTMLElement | null>(null);
  useImperativeHandle(forwarded, () => localRef.current as HTMLElement);
  useMagnetic(localRef, magnetic ? 0.3 : 0);
  useSpotlightBorder(localRef);

  const isIcon = variant === 'icon';
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const onEnter = (e: ReactPointerEvent<HTMLElement>) => {
    if (fillRef.current) {
      fillRef.current.style.transformOrigin = entrySide(e);
      fillRef.current.dataset.on = 'true';
    }
  };
  const onLeave = (e: ReactPointerEvent<HTMLElement>) => {
    press.onPointerLeave(e);
    if (fillRef.current) {
      fillRef.current.style.transformOrigin = entrySide(e);
      fillRef.current.dataset.on = 'false';
    }
  };

  const content = (
    <>
      {variant === 'primary' && (
        <>
          <span
            aria-hidden="true"
            className="rounded-pill bg-violet duration-base ease-reel pointer-events-none absolute -inset-2 -z-20 opacity-0 blur-xl transition-opacity group-hover/btn:opacity-50 group-focus-visible/btn:opacity-50"
          />
          <span
            ref={fillRef}
            aria-hidden="true"
            data-on="false"
            className="bg-reel duration-base ease-reel pointer-events-none absolute inset-0 -z-10 scale-0 rounded-[inherit] transition-transform data-[on=true]:scale-100"
          />
        </>
      )}
      <span data-magnetic-inner className="relative inline-flex items-center gap-2">
        {loading ? (
          <FilmReelSpinner className="size-4" />
        ) : (
          icon && (
            <span
              className={cn(
                'inline-flex shrink-0 [&_svg]:size-[1.15em]',
                isIcon && '[&_svg]:size-5',
                iconAnimClass[iconAnim],
              )}
            >
              {icon}
            </span>
          )
        )}
        {!isIcon && children && (
          <span>{typeof children === 'string' ? <RollText>{children}</RollText> : children}</span>
        )}
      </span>
    </>
  );

  const classes = cn(base, variants[variant], isIcon ? iconSizes[size] : sizes[size], className);
  const handlers = {
    onPointerDown: press.onPointerDown,
    onPointerUp: press.onPointerUp,
    onPointerCancel: press.onPointerCancel,
    onPointerEnter: onEnter,
    onPointerLeave: onLeave,
  };

  if (rest.href !== undefined) {
    const { href, prefetch, onClick, target, rel } = rest as AsLink;
    return (
      <Link
        ref={(n) => {
          localRef.current = n;
        }}
        href={href}
        prefetch={prefetch}
        onClick={onClick}
        target={target}
        rel={rel}
        className={classes}
        aria-label={isIcon ? label : (rest as AsLink)['aria-label']}
        data-cursor={magnetic ? 'magnetic' : 'link'}
        data-pressable
        {...handlers}
      >
        {content}
      </Link>
    );
  }

  const {
    type = 'button',
    disabled,
    'aria-label': ariaLabel,
    onClick,
    ...buttonRest
  } = rest as AsButton;
  return (
    <button
      {...buttonRest}
      ref={(n) => {
        localRef.current = n;
      }}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-label={isIcon ? label : ariaLabel}
      data-cursor={magnetic ? 'magnetic' : 'link'}
      data-pressable
      className={classes}
      {...handlers}
      onClick={loading ? (e) => e.preventDefault() : onClick}
    >
      {content}
    </button>
  );
});
