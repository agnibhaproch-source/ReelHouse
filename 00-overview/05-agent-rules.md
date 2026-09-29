# 05 — Rules for the AI Coding Agent (paste at the start of every session)

1. Read `00-overview/` before touching code.
2. Implement only the given file. Put extra ideas under "Follow-ups", don't build them.
3. TypeScript strict. No `any`, no `@ts-ignore`.
4. Every animation respects `useMotionPrefs()`.
5. Every GSAP animation lives in `useGSAP()` with a scope ref (auto-cleanup).
6. Animate `transform`, `opacity`, `clip-path` only.
7. Images via `next/image` + TMDB loader, explicit `sizes`, blur placeholder.
8. No hardcoded colors, durations, or eases — tokens only.
9. Every interactive element: keyboard reachable, visible focus ring (2px `--marquee-violet`, 3px offset), correct ARIA.
10. Finish with `pnpm lint && pnpm typecheck && pnpm test`, then report the Acceptance Checklist pass/fail.
11. Never commit `.env*`.
