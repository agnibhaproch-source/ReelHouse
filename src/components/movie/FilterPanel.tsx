'use client';

import { LANGUAGES } from '@/lib/tmdb/languages';
import { GENRES } from '@/lib/tmdb/genres';
import { DEFAULT_FILTERS, RUNTIME_MAX, YEAR_MAX, YEAR_MIN, type Filters } from '@/lib/filters';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';

interface FilterPanelProps {
  value: Filters;
  onChange: (f: Filters) => void;
  showLanguage?: boolean;
  showGenre?: boolean;
  onDone?: () => void;
}

/** Filter drawer contents (spec 26): year range, rating, language/genre, runtime. */
export function FilterPanel({ value, onChange, showLanguage, showGenre, onDone }: FilterPanelProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-8">
      <RangeSlider label="Release year" min={YEAR_MIN} max={YEAR_MAX} value={[value.from, value.to]} onChange={(v) => Array.isArray(v) && set({ from: v[0], to: v[1] })} />
      <RangeSlider label="Minimum rating" min={0} max={9} step={0.5} value={value.rating} onChange={(v) => typeof v === 'number' && set({ rating: v })} format={(v) => (v ? `${v}+` : 'Any')} />
      <RangeSlider
        label="Runtime"
        min={0}
        max={RUNTIME_MAX}
        step={10}
        value={[value.runtimeMin, value.runtimeMax]}
        onChange={(v) => Array.isArray(v) && set({ runtimeMin: v[0], runtimeMax: v[1] })}
        format={(v) => (v >= RUNTIME_MAX ? `${RUNTIME_MAX}+ min` : `${v} min`)}
      />
      {showLanguage && (
        <fieldset>
          <legend className="mb-3 text-small font-semibold">Language</legend>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <Pill key={l.code} size="sm" selected={value.lang === l.code} onToggle={(on) => set({ lang: on ? l.code : null })}>
                {l.name}
              </Pill>
            ))}
          </div>
        </fieldset>
      )}
      {showGenre && (
        <fieldset>
          <legend className="mb-3 text-small font-semibold">Genre</legend>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Pill key={g.id} size="sm" selected={value.genre === g.id} onToggle={(on) => set({ genre: on ? g.id : null })}>
                {g.name}
              </Pill>
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => onChange({ ...DEFAULT_FILTERS, sort: value.sort })}>
          Reset filters
        </Button>
        {onDone && <Button onClick={onDone}>Show results</Button>}
      </div>
    </div>
  );
}
