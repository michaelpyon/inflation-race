# Inflation Race - Suggestions

## Shipped Wave 2

- Keyboard shortcuts 1/2/3 on title screen to instantly pick an era (js/main.js, index.html controls-help updated).
- Per-era personal best badge on each era card: shows "BEST: A $14,200" pulled from localStorage so players see their replay target instantly (js/ui.js updateEraPersonalBests, index.html pb- anchors, css/style.css new .era-key-hint and .era-personal-best rules).

## Evangelist Persona

The ideal evangelist is a 28-35 year old who posts in r/personalfinance, r/financialindependence, or r/antiwork. They are economically anxious, use Twitter/X habitually, and enjoy games that validate their frustrations. They currently scroll Twitter and share memes about rent prices and student debt. They screenshot the end screen when they get a high grade (A or S) because it is a brag they can frame as a joke ("I survived Stagflation with $11,200 [A] - me in real life rn"). They bounce in 5 seconds if the game does nothing on load (no instructions pop, no immediate feedback) or if they are on a phone and see a blank canvas. The "COPY SCORE" share flow with the grade letter in the text is the single share trigger. The mobile gate added in the prior pass prevents the worst silent-failure case for this audience.

## Ground-Truth Findings (HEAD vs Live)

### Repo HEAD (source of truth)

- Mobile gate: PRESENT. `index.html` shows the gate `div` and inline JS that checks `window.innerWidth <= 680 || pointer: coarse`. Any phone visitor gets a clear notice with a COPY LINK button. Fixed in commit `33d8434`.
- Share text: CORRECT in HEAD. `ui.js` `setupShare` builds `Inflation Race [B]: survived Stagflation with $12,450 https://inflation-race.vercel.app` including https:// and grade. Fixed in commit `b1f087f`.
- Data honesty: CLEAN. Era names (The Great Depression, Stagflation, Helicopter Money) with years and thematic mechanics. No claim of real-time data, no external API calls, no Census/SEC/OSM claims. All ticker messages and events are clearly game flavor text, not presented as live feeds.
- No fabricated specific claims about real people or companies beyond well-known historical shorthand (OPEC, Nixon Shock) used as game flavor text with no false data.
- Year inconsistency (minor): `eras.js` had `year: '2020-2024'` while `index.html` era card showed `2020-2025`. Fixed this pass.
- High score era label: `ui.js` was displaying raw ID string (`great_depression`) instead of the human name. Fixed this pass to show `The Great Depression`, `Stagflation`, `Helicopter Money`.

### Live Site (https://inflation-race.vercel.app)

DEPLOY MISMATCH. The live site serves the old pre-fix build:
- No mobile gate (the `mobile-gate` div and inline JS are absent from the live HTML).
- Share text still reads `I survived ${eraName} with $${netWorth} in Inflation Race - inflation-race.vercel.app` (no https://, no grade letter).
- `setupShare` still only takes `(scoreData, era)` not `(scoreData, grade, era)`.

All fixes are in repo HEAD; the next Vercel deploy will flush them live.

## Prioritized Plan

### Quick Wins (S = small, no rebuild needed)

1. **[DONE wave 1] Fix high score era labels** (js/ui.js). Shows raw IDs like `great_depression` to the player. Now resolves to `The Great Depression` etc. via `getEraById`. Effort S. No deploy needed to verify logic (no build).

2. **[DONE wave 1] Fix year inconsistency** (js/eras.js). `2020-2024` in eras.js but `2020-2025` on the title card. Aligned to `2020-2025`. Effort S.

3. **[NEEDED] Deploy.** All prior-pass fixes (mobile gate, https:// share, grade in share) are in HEAD but not live. The single highest-ROI action is flushing a Vercel deploy. Flag: deploy-mismatch.

4. **[DONE wave 2] Per-era personal best on title screen** (js/ui.js, index.html, css/style.css). Each era card now shows the player's personal best grade and score for that era (from localStorage `eraHighScores`). Gives the replay hook: "I got B on Stagflation, let me beat it." Also added key-hint badges (1/2/3) on each card.

5. **[DONE wave 2] Keyboard shortcut for era selection on title screen** (js/main.js, index.html). Player can press 1/2/3 to instantly pick an era. Added hint in controls-help and key-hint badges on era cards. Effort S.

6. **Post-run hint line** (js/ui.js). After game over, one context-sensitive line like "Tip: firebreak your lowest-burn pile first" based on what happened. Drives replay understanding. Effort M.

7. **Accessible era card focus indicator** (css/style.css). The `:focus-visible` box-shadow is already wired; the era-specific border-color overrides lose it on era-colored cards. Add era-tinted glow that is visible on each card's background. Effort S.

### Bigger Bets (M/L, need judgment call)

8. **Touch controls for mobile** (new js/touch.js). Full touch support: swipe left/right to move, tap left/right half to shovel that direction, tap up for invest, tap down for firebreak. Estimated 4-6 hours. Would remove the mobile gate and open to the huge mobile audience.

9. **Leaderboard via a simple KV store** (new api endpoint). Global high scores via a Vercel KV or Workers KV backend. Would turn the share flow from a flex into a competition. Effort L.

10. **Era-flavored end screen color palette** (js/ui.js, css/style.css). Game over screen currently uses the default dark palette. Tinting it with the era's accent color (already available as `era.colors.ACCENT`) adds polish and era identity. Effort S-M.
