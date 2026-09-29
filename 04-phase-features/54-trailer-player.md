# 54 — Cinematic Trailer Player

## Source
TMDB `videos` → prefer `type=Trailer`, `site=YouTube`, `official=true`, newest. Fallback: Teaser → Clip.

## Open sequence
1. Page dims to 90% black; letterbox bars slide in (top/bottom).
2. Player frame expands from the clicked button's rect (Flip) to 16:9 centered, max 90vw.
3. Projector sound (if on). Cursor → hidden over iframe.

## Player
- YouTube IFrame API with `modestbranding`, `rel=0`, privacy-enhanced domain `youtube-nocookie.com`.
- Custom overlay controls outside iframe: close, add to list, next trailer, mute.
- Ambient light: blurred backdrop behind player tinted with dominant color.
- List of other videos below (thumbnails) — switching crossfades.
- Esc / close → reverse sequence.

## Rules
- Load iframe only on open (no preloading YouTube scripts).
- Focus trap; captions available via YouTube.

## Acceptance
- [ ] Movies with no trailer show "No trailer available" and hide the button beforehand
- [ ] Closing stops playback and releases the iframe
