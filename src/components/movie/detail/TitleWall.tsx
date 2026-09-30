/**
 * Backdrop for films without artwork: the title set huge in outline, three rows drifting in
 * opposite directions under the film's accent glow — a marquee wall instead of an empty frame.
 * Decorative; CSS-only (stills under reduced motion).
 */
export function TitleWall({ title, color }: { title: string; color: string }) {
  const run = Array.from({ length: 4 }, () => title).join('  ·  ');
  return (
    <div aria-hidden="true" className="title-wall absolute inset-0 overflow-hidden">
      <span
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 70% at 70% 35%, color-mix(in oklab, ${color} 30%, transparent), transparent 70%), radial-gradient(50% 60% at 10% 90%, color-mix(in oklab, ${color} 16%, transparent), transparent 70%)`,
        }}
      />
      <div className="absolute inset-x-0 top-[8%] flex -rotate-6 flex-col gap-[2vh]">
        {[0, 1, 2].map((row) => (
          <p
            key={row}
            className={`title-wall-row font-display text-[clamp(5rem,13vw,13rem)] leading-none font-semibold whitespace-nowrap ${row % 2 ? 'title-wall-rev' : ''}`}
          >
            <span>{run}</span>
            <span>{run}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
