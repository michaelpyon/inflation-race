# DESIGN.md - Inflation Race (source of truth)

Core concept and name are locked: **Inflation Race**, a 150-second keyboard arcade game where you shovel money between 7 burning asset piles across 3 historical economic eras, then get graded S/A/B/C/F. Do not re-architect the engine (vanilla JS ES modules + canvas, no build step, no backend). Honor PERSONA.md (Danny) and BRAND.md (PICO-8 arcade satire) in every decision.

## Layout / IA intent

Single-page app, 1 route, 4 states layered over 1 canvas:

1. **Title / era select** (the landing page IS the game menu; there is no marketing page and there must never be one)
2. **Gameplay** (canvas + HUD)
3. **Pause**
4. **Game over / share card**

Plus the **mobile gate** overlay for coarse-pointer or narrow viewports (until touch controls exist). IA rule: every screen must answer "what do I press next" without scrolling. Desktop-first; the game container centers on black with the 384x216 canvas scaled in integer-friendly steps.

## Hero / landing concept

The title screen is the hero. Concept: **"pick your economic nightmare" as an arcade cabinet attract mode.**

- INFLATION RACE in giant pixel type (yellow/white on black), subtitle "Choose Your Economic Nightmare."
- 3 era cards (Depression / Stagflation / Helicopter Money) with year, hook line, burn multiplier, start cash, 1/2/3 key hints, and per-era personal best badge (all already implemented; keep).
- Attract-mode motion: behind or beneath the title, a small ambient loop (embers drifting, ticker scrolling a rotating era headline) so the first 5 seconds are alive, never a dead black frame. This is the single most important anti-bounce investment.
- Controls block stays visible but compressed; the primary CTA is the era cards themselves. Target: first input within 10 seconds of load.

## Key screens list

1. **Title / era select** (hero, high scores list, controls help, RANDOM ERA)
2. **Gameplay HUD**: total net worth, countdown, wave banner, ticker, firebreak tokens, combo text
3. **Event interrupts**: named event banners (BANK RUN, OIL SHOCK, STIMULUS DROP) with flavor line
4. **Pause**
5. **Game over / share card**: era name, TIME'S UP, grade letter (largest element), final score, purchasing power, score breakdown, events encountered, COPY SCORE + TWEET, RETRY + TRY ANOTHER ERA. Era-accent tint on this screen is an approved carried-forward bet (S-M effort).
6. **Mobile gate**: branded, intentional, with COPY LINK (exists in HEAD; must be live)

## Empty / loading / error state intent

- **Loading**: static site, effectively instant; a font swap flash of unstyled text is the real risk. Use `font-display: swap` behavior consciously: system monospace fallback so text never invisibly blocks. No spinner ever.
- **Empty (first visit)**: no high scores yet; the high-score area shows nothing today. Intent: show a taunt placeholder instead ("NO SURVIVORS YET") so the region reads as designed, not broken. Era cards without a personal best show nothing (fine).
- **Error**: no network calls exist, so runtime errors are the only class. Clipboard API failure already falls back to window.prompt (keep). If the canvas or a module fails to boot, show a styled in-brand failure line ("THE ECONOMY CRASHED FOR REAL. REFRESH.") rather than a silent black screen.
- **Mobile gate is a first-class state, not an error**: it must look like a designed arcade marquee (it is the version 80% of Danny's retweet audience will see). Keep COPY LINK; consider adding the OG art or a looping GIF frame so gated visitors still see gameplay.

## Metadata / OG intent (X-readiness is mandatory)

- Full OG + twitter:card meta already present with a 1200x630 og.png (title, tagline, era list, michaelpyon.com credit). Keep summary_large_image.
- OG copy rule: description leads with the fantasy and the 3 eras, never with "educational."
- **Wording honesty fix**: meta description says "A roguelike." It is a score-attack arcade game, not a roguelike (no runs-with-progression, no procedural build). Change "roguelike" to "arcade game" or "arcade survival game" in meta description, og:description, and twitter:description. Danny's corner of X will absolutely dunk on a wrong genre claim.
- Upgrade path (carried-forward L bet, optional): dynamic OG image with grade + score via a serverless endpoint would make every shared link a scoreboard. Not required for relaunch; static og.png is X-ready today.
- Canonical URL stays https://inflation-race.vercel.app/ and must match the share-copy URL (it does).

## Data honesty

The product does **not** claim real data, and that is currently true: no fetch calls, no APIs, no env vars; all numbers are game balance from constants.js. Eras use real historical framing (1929-1939, 1973-1982, 2020-2025; Nixon Shock, OPEC, New Deal) strictly as satire flavor, which is fine and should stay. Required disclosures / rules:

1. Never add copy implying live or historical CPI accuracy ("real inflation data") unless a real data source is actually wired in.
2. "Purchasing power" on the game-over screen is a game-mechanical number; keep it unlabeled as real economics.
3. The 1 current dishonesty is the "roguelike" genre claim in metadata (see above); fix it.
4. High scores are localStorage-only; never phrase them as a global leaderboard unless the KV backend bet ships.

## The screenshot-worthy moment to engineer

**The game-over grade slam.** Engineer this screen as a self-contained poster: era name + years at top, giant grade letter in grade color with a 2-step slam animation and 1-frame flash, final net worth, purchasing power line (the joke payload), score breakdown, all on an era-tinted black card that crops cleanly to a phone screenshot. Composition rule: everything Danny wants in the screenshot (game name, era, grade, dollars) must sit inside 1 tight rectangle with the INFLATION RACE wordmark visible, so a cropped screenshot still advertises the game. COPY SCORE stays the primary button; its text ("Inflation Race [S]: survived Helicopter Money with $14,800 https://inflation-race.vercel.app") is already the correct share artifact in HEAD.

## Ship notes for execution agents

- HEAD contains fixes (mobile gate, grade-in-share-text, era label names, 1/2/3 hotkeys, per-era bests) that are NOT on the live deploy; the highest-ROI single action at execution time is flushing a deploy (Michael triggers deploys; do not deploy from a planning or build agent without approval).
- Carried-forward bets in priority order: era-tinted game-over palette (S-M), touch controls to remove the mobile gate (4-6h, unlocks mobile), dynamic OG (L), KV leaderboard (L, needs Michael to provision).
- No package.json; keep it that way. Test with any static server (python3 -m http.server).
