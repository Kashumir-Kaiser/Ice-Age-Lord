# Frozen citadel landing page

## Direction and external references

Original Ice Age Lord menu inspired by Warcraft III: The Frozen Throne, NOT a recreation or asset transfer. Classic TFT had a dramatic icy monument, strong logo at the top left, a vertical carved-metal panel at the right, gold/blue highlights, and a single-player hierarchy with Campaign and Load Saved Game. Reforged later used a web UI and video loops, updated menu structure, and added a Frozen Throne theme.

Reference links:
- https://www.myabandonware.com/game/warcraft-iii-the-frozen-throne-g5a
- https://gamefaqs.gamespot.com/pc/589475-warcraft-iii-the-frozen-throne/faqs/44609
- https://eu.forums.blizzard.com/en/warcraft3/t/warcraft-iii-reforged-patch-notes-version-20/1090
- https://news.blizzard.com/en-gb/article/23896791/warcraft-iii-reforged-patch-1-35-0-now-live
- https://us.forums.blizzard.com/en/warcraft3/t/classic-main-menu-background-idea/22228

None of Blizzard's images, logos, video, sound, textures or character assets are bundled. The project-authored menu-ice-citadel.svg depicts a frozen ruined fortress, shattered icy battlefield and chained bridge. UI metal frames, snow layers, lighting, typography, effects and responsive rules are original CSS.

## Integration map

Base branch codex/map-25d-overhaul, commit 5746c452611d3ed650f01fba5d8ed33879a624b6.

Inspected the recursive repository tree (2,852 entries), AGENTS.md and README, both frontend startup and live/demo clients, the save/authentication flow, HTTP client, contracts, save-scope gate, prior Playwright tests, Vite build, rendering/map and art conventions. The many large reference content and extracted event datasets are not involved in this frontend-only change.

- Root slash: main menu by default; bypassing requires an explicit query.
- New Game: mode=live&intent=new; existing local SQLite API health check, owner session, explicit slot name, idempotent POST saves, select then getView. The old last-save auto-restore MUST NOT run for this path.
- Load Save: mode=live&intent=load; owner session, list saves, explicit selection, select then getView and events. Does not create a save or automatically load remembered save.
- Legacy mode=live retains original behaviour and old E2E compatibility.
- Demo: mode=demo; separate lazy-loaded App and DemoGameClient; never calls HttpGameClient, never writes to SQLite, no access to production session keys. A menu return button is available.
- Returning from active game is blocked while an unresolved command or write is in flight; switching back from unselected owner/save screens has no persistence side effects.
- Browser history popstate updates root routing without forcing a reload. Both save entry tabs can be switched without server mutation.

## Shipping and testing

Production demo is opt-in via VITE_ENABLE_DEMO=true. In development it remains visible for frontend QA. For standard shipping builds leave it false or unset; the menu action and runtime entry are hidden, and Vite can eliminate unreachable demo imports. The frontend-demo GitHub workflow explicitly enables it for historic preview tests. Inspect final production bundle output to confirm the demo chunk is absent.

Tests after checkout:
1. cd frontend && npm ci && npm run build
2. npm test
3. npm run test:e2e -- landing.spec.ts (Chromium desktop and 390-pixel mobile)
4. Run the existing live.spec.ts, live-api.spec.ts, map.spec.ts and territory/map-rendering suites
5. Rebuild with VITE_ENABLE_DEMO=false and verify: only two buttons, a direct mode=demo URL shows the main menu, no demo bundle/module, no fallback from API disconnection
6. Validate API save listing, clean initialization, separate in-flight mutations, remembered save bypass, empty save list, browser back navigation and both keyboard/mouse input methods
7. Visually inspect 1440x900, 390x844, 320x568, focus indicators, overflows, scenic placement, hover, text contrast, and prefers-reduced-motion. The landing e2e test captures an artifact PNG.

Performance design: one original SVG background, CSS transform parallax and snow, no menu WebGL context and no map worker boot until real gameplay. Do not claim actual FPS/transfer gains without benchmarking on target devices.

Keep changes isolated to codex/frozen-throne-landing until review. No merges or deployments are authorized by this work.
