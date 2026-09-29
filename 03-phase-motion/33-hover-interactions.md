# 33 — Hover Interactions (every element)

## Global utilities
- `useMagnetic(ref, strength=0.35)` — element follows pointer within its bounds + 40px; inner label moves at 1.5× for depth; springs home on leave. Cursor ring snaps around the element.
- `useTilt(ref, max=8)` — 3D rotateX/Y with perspective 900px + glare var.
- `useSpotlightBorder(ref)` — border gradient that follows pointer (conic/radial via `--mx/--my`).
- `<RollText>` — rolling duplicate text for links.

## Inventory (implement all)
| Element | Hover | Leave |
|---|---|---|
| Primary button | magnetic; bg fill wipes from pointer entry side; label rolls; subtle glow | reverse from exit side |
| Secondary (glass) button | spotlight border; backdrop blur increases | reverse |
| Icon buttons | icon-specific: heart beats, plus rotates 90°, share arrow nudges, bookmark fills from bottom | reverse |
| Nav links | roll text + slide underline | |
| Movie card | see 22 | |
| Row arrows | magnetic + chevron nudge in direction | |
| Genre chip | fill from center, text color inverts | |
| Cast portrait | scale 1.08, grayscale → color, name slides up | |
| Trailer thumb | zoom 1.1, play icon pulse ring | |
| Footer links | roll text + arrow draw | |
| Wordmark | Fraunces axes animate | |
| Images (gallery) | slight zoom inside mask, cursor → "View" | |
| Rating ring | stroke thickens, number bumps | |
| Avatar | ring rotates around it | |

## Card glow color
Use server-computed dominant color passed as `style={{'--glow': hex}}`.

## Rules
- Hover effects only under `@media (hover: hover) and (pointer: fine)`.
- Every hover has a matching `:focus-visible` equivalent.
- Use `gsap.quickTo` for pointer-following values; never create a new tween per mousemove.

## Acceptance
- [ ] Every row of the inventory implemented and visible in `/styleguide`
- [ ] No hover animation causes layout shift
