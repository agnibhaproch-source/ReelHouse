'use client';

import { track as vercelTrack } from '@vercel/analytics';

export type AnalyticsEvent = 'card_preview' | 'trailer_play' | 'list_add' | 'search_submit' | 'motion_toggle' | 'sound_toggle';

function dnt(): boolean {
  if (typeof navigator === 'undefined') return true;
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return n.doNotTrack === '1' || n.globalPrivacyControl === true;
}

/** Custom events — no personal data, and nothing at all under Do Not Track / GPC. */
export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  if (dnt()) return;
  try {
    vercelTrack(event, props);
  } catch {
    /* analytics must never break UX */
  }
}
