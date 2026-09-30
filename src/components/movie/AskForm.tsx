'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';

/** The description box on /ask, with example prompts to start from. */
export function AskForm({ initial, examples }: { initial: string; examples: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(false);
  const go = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setPending(true);
    track('search_submit', { mode: 'ask' });
    router.push(`/ask?q=${encodeURIComponent(q)}`);
  };
  return (
    <>
      <form
        role="search"
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
      >
        <label htmlFor="ask-q" className="sr-only">
          Describe what you want to watch
        </label>
        <input
          id="ask-q"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setPending(false);
          }}
          maxLength={200}
          placeholder="A slow-burn Korean thriller under two hours…"
          className="rounded-pill border-line bg-seat text-body placeholder:text-dim focus-visible:border-violet h-14 flex-1 border px-6 outline-none"
        />
        <Button
          type="submit"
          size="lg"
          icon={<ArrowRight />}
          iconAnim="nudge-right"
          loading={pending}
        >
          Find films
        </Button>
      </form>
      {examples.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Examples">
          {examples.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                onClick={() => {
                  setValue(ex);
                  go(ex);
                }}
                className="rounded-pill border-line text-small text-dim hover:border-violet/60 hover:text-reel min-h-11 border px-4 transition-colors"
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
