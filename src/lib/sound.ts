'use client';

import type { Howl } from 'howler';
import { useUiStore } from '@/stores/ui';
import sprite from './sound-sprite.json';

export type SoundName = keyof typeof sprite;

const MASTER_VOLUME = 0.35;
const MAX_CONCURRENT = 3;
const TICK_THROTTLE_MS = 80;

let howl: Howl | null = null;
let loading: Promise<Howl> | null = null;
let lastTick = 0;
let projectorId: number | null = null;
const playing = new Set<number>();

/** Lazily loads Howler + the sprite — only ever after the user enables sound (a gesture). */
async function load(): Promise<Howl> {
  if (howl) return howl;
  loading ??= import('howler').then(({ Howl: H, Howler }) => {
    Howler.volume(MASTER_VOLUME);
    const spriteMap: Record<string, [number, number] | [number, number, boolean]> = {};
    for (const [name, [start = 0, dur = 0]] of Object.entries(sprite)) {
      spriteMap[name] = name === 'projector' ? [start, dur, true] : [start, dur];
    }
    howl = new H({ src: ['/sounds/ui.wav'], sprite: spriteMap, preload: true, html5: false });
    howl.on('end', (id: number) => playing.delete(id));
    return howl;
  });
  return loading;
}

const enabled = () => useUiStore.getState().soundOn && typeof document !== 'undefined' && !document.hidden;

export async function play(name: SoundName): Promise<void> {
  if (!enabled()) return;
  if (name === 'tick') {
    const now = performance.now();
    if (now - lastTick < TICK_THROTTLE_MS) return;
    lastTick = now;
  }
  if (playing.size >= MAX_CONCURRENT) return;
  const h = await load();
  if (name === 'projector') {
    startProjector();
    return;
  }
  const id = h.play(name);
  playing.add(id);
}

export async function startProjector(): Promise<void> {
  if (!enabled() || projectorId !== null) return;
  const h = await load();
  projectorId = h.play('projector');
  h.volume(0, projectorId);
  h.fade(0, 0.6, 600, projectorId);
}

export function stopProjector(): void {
  if (!howl || projectorId === null) return;
  const id = projectorId;
  projectorId = null;
  howl.fade(howl.volume(id) as number, 0, 500, id);
  setTimeout(() => howl?.stop(id), 520);
}

/** Warm the sprite after the user turns sound on. */
export function primeSound(): void {
  void load();
}

/** Mute everything when the tab is hidden or sound is turned off. */
export function setMuted(muted: boolean): void {
  void import('howler').then(({ Howler }) => Howler.mute(muted));
  if (muted) stopProjector();
}
