# 30 — Custom Cinema Cursor

Replace the system cursor with a film-inspired cursor on `pointer: fine` devices only.

## Anatomy
1. **Dot** — 6px `--text-reel` dot, follows pointer exactly (quickTo 0.08s).
2. **Reel ring** — 40px ring with 8 sprocket-hole cutouts (SVG), follows with lag (quickTo 0.35s, `power3.out`), rotates slowly (L3 ambient, 12s/turn); rotation speed increases with pointer velocity.
3. **Label** — text inside the ring for contextual modes.
4. **Spotlight** — 500px radial gradient (violet 8% → transparent) behind content, following at 0.6s lag, `mix-blend-mode: screen`. Only over dark sections.
5. **Trail** (optional) — 6 fading afterimages of the dot, like motion blur on film.

## Velocity stretch
Ring scales along movement direction: `scaleX = 1 + min(v/1500, 0.4)`, rotated to angle of motion; springs back when still.

## Modes (set via `data-cursor="mode"` + `data-cursor-label` attributes, read with event delegation)
| Mode | Trigger | Look |
|---|---|---|
| `default` | anywhere | dot + ring |
| `link` | links/buttons | ring shrinks to 24px, fills violet at 20%, dot hides |
| `play` | cards, trailer thumbs | ring grows to 88px, filled `--text-reel`, black ▶ icon + label ("Preview"/"Play"), `mix-blend-mode: difference` off |
| `drag` | carousel tracks | ring 72px, label "Drag", left/right chevrons animate outward |
| `text` | inputs, paragraphs | ring collapses to 2px × 24px vertical caret, blinks |
| `hidden` | video player, iframes | fades out |
| `loading` | during route change | ring becomes countdown leader (sweeping arc) |
| `magnetic` | handled in 33 | ring snaps to element bounds |

Transitions between modes: 300ms `ease-reel`, via Motion variants.

## Press feedback
Mouse down → ring scale 0.8, dot scale 1.6; mouse up → spring back + tiny flash ring expanding outward (scale 1 → 2, opacity 0.4 → 0).

## Edge cases
- Hide when pointer leaves window; reappear with scale-in on enter.
- Hide system cursor with `cursor: none` on `html.has-custom-cursor` only after the custom cursor mounts (no invisible-cursor flash).
- Keep native cursor inside iframes (YouTube).
- Disabled for: touch devices, reduced motion, and when user toggles "Classic cursor" in settings.
- Render in a fixed portal at z-index top, `pointer-events: none`, `will-change: transform`, GPU layer.
- Use one rAF loop for all cursor parts.

## Acceptance
- [ ] Zero input lag on the dot (visually tested at 120Hz)
- [ ] Mode never gets stuck after navigation (reset on route change)
- [ ] Text inputs still show a usable caret
- [ ] Toggle in settings instantly restores native cursor
