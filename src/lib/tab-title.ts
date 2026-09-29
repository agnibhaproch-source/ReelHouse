'use client';

/**
 * Tab title + favicon micro-interactions (spec 39):
 * - "▶ Now playing: X" and a ▶ reel-frame favicon while a trailer plays
 * - "Intermission — come back" while the tab is hidden
 */
let nowPlaying: string | null = null;
let away = false;
let baseTitle = '';
let applying = false;

const PLAY_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='2' y='4' width='28' height='24' rx='4' fill='#8b5cff'/><path d='M13 10v12l10-6z' fill='#ede8df'/></svg>",
  );

function iconLink(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel="icon"]');
}

let originalIcon: string | null = null;

function apply() {
  applying = true;
  if (away) document.title = 'Intermission — come back';
  else if (nowPlaying) document.title = `▶ Now playing: ${nowPlaying}`;
  else if (baseTitle) document.title = baseTitle;
  const link = iconLink();
  if (link) {
    originalIcon ??= link.href;
    link.href = nowPlaying ? PLAY_ICON : originalIcon;
  }
  queueMicrotask(() => (applying = false));
}

/** Keep track of the real page title as Next updates it between routes. */
export function watchTitle(): () => void {
  baseTitle = document.title;
  const obs = new MutationObserver(() => {
    if (applying) return;
    baseTitle = document.title;
    if (away || nowPlaying) apply();
  });
  const titleEl = document.querySelector('title');
  if (titleEl) obs.observe(titleEl, { childList: true, characterData: true, subtree: true });
  obs.observe(document.head, { childList: true });
  const onVis = () => {
    away = document.hidden;
    apply();
  };
  document.addEventListener('visibilitychange', onVis);
  return () => {
    obs.disconnect();
    document.removeEventListener('visibilitychange', onVis);
  };
}

export function setNowPlaying(title: string | null): void {
  if (nowPlaying === title) return;
  nowPlaying = title;
  if (typeof document !== 'undefined') apply();
}
