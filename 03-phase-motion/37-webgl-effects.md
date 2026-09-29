# 37 — WebGL Effects (the Lusion layer)

Build after everything else in Phase 03 works without WebGL. Every effect needs a CSS fallback.

## Shared setup
- One persistent `<Canvas>` fixed behind/over content (R3F), `dpr={[1, 1.75]}`, `frameloop="demand"` when idle.
- DOM-to-WebGL sync: planes positioned to match DOM image rects each frame (track with ResizeObserver + scroll offset).
- Textures loaded via drei `useTexture` from TMDB URLs (CORS OK).
- Detect low-end (hardwareConcurrency ≤ 4, `deviceMemory` ≤ 4, or failed WebGL2) → disable.

## Effects
1. **Hero displacement transition** — shader mixes current/next backdrop with a noise-based displacement + chromatic aberration (RGB split) during slide change. Uniforms: `uProgress`, `uTex1`, `uTex2`, `uDisp`.
2. **Scroll distortion on images** — planes bend (vertex shader sine wave) proportional to scroll velocity; RGB shift on edges.
3. **Card hover ripple** — liquid ripple from pointer position over the poster plane (optional on detail page gallery only if perf tight).
4. **Film burn transition** — fragment shader: noise threshold eats the screen with glowing amber edges; used for auth routes.
5. **Film grain + gate weave** — full-screen shader: animated noise, subtle vertical jitter (0.3px), light leak blobs drifting (violet/amber) at 6% opacity. Replaces CSS grain when WebGL on.
6. **Ambient particles on detail hero** — dust in projector light: 300 points drifting in a light cone, react slightly to cursor.

## Shader files
`src/shaders/{displacement,scrollWave,ripple,filmBurn,grain,dust}.{vert,frag}.glsl` loaded via `raw-loader` / `?raw` import.

## Acceptance
- [ ] Toggling WebGL off (settings) leaves a fully working site
- [ ] GPU frame time < 8ms on MacBook Air (Chrome performance panel)
- [ ] Canvas pauses when tab hidden
- [ ] No texture memory leak after 20 navigations (renderer.info.memory)
