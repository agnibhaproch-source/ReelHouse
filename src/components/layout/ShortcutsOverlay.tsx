'use client';

import { useUiStore } from '@/stores/ui';
import { Modal } from '@/components/ui/Modal';

const SHORTCUTS: [string, string][] = [
  ['/', 'Search'],
  ['⌘ K  ·  Ctrl K', 'Search'],
  ['?', 'Show keyboard shortcuts'],
  ['← →', 'Change hero slide (when focused) · move between cards in a row'],
  ['Space', 'Open a card preview'],
  ['Enter', 'Open the focused title'],
  ['Esc', 'Close menus, previews, search and the player'],
  ['↑ ↑ ↓ ↓ ← → ← → B A', 'Director’s cut'],
];

/** Keyboard shortcuts overlay on `?` (spec 39). */
export function ShortcutsOverlay() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const set = useUiStore((s) => s.set);
  return (
    <Modal open={open} onClose={() => set('shortcutsOpen', false)} title="Keyboard shortcuts">
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
        {SHORTCUTS.map(([k, v]) => (
          <div key={k + v} className="contents">
            <dt>
              <kbd className="border-line bg-seat font-ui text-small rounded-md border px-2 py-1 whitespace-nowrap">
                {k}
              </kbd>
            </dt>
            <dd className="text-small text-dim">{v}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
