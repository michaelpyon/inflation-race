# BRAND.md - Inflation Race

## Positioning line (in Danny's language)

**"Your money is on fire. You have 150 seconds and a shovel."**

Secondary line for meta descriptions and the OG card: "An arcade game about outrunning inflation. Survive the Great Depression, Stagflation, or Helicopter Money. Get graded."

Never position it as educational, financial, or "raising awareness." It is an arcade joke with real mechanics. The satire is delivered by systems and flavor text, never by lecture.

## Palette direction

The game already runs on the **PICO-8 palette** (BG #1D2B53, money green #00E436, fire ramp #FFEC27 to #FFA300 to #FF004D to #7E2553, character pink #FF77A8, firebreak blue #29ADFF, paper white #FFF1E8 on black #000000). This is the brand. Do not "modernize" it into soft gradients.

- **Global chrome (title, HUD, share card): black + paper white + fire yellow #FFEC27.** Yellow is the signature accent; the $ favicon already uses it.
- **Danger always reads on the yellow-orange-red-purple fire ramp**; safety and money always read green #00E436; player actions read blue #29ADFF.
- **Era tints stay secondary**: sepia dust (#D4A55C on #2B1B0E) for the Depression, avocado-and-goldenrod 70s (#DAA520, #FF8C00 on #3D2B1F) for Stagflation, terminal green-on-GitHub-dark (#00E436, #58A6FF on #0D1117) for Helicopter Money. Era accent may tint headers, ticker, and the game-over screen, but the fire ramp and grade colors never change per era.
- High contrast is non-negotiable: every text color must pass on its background at pixel-font sizes.

## Type system

- **Display and UI: Press Start 2P** (already loaded). Used for headings, grades, HUD numbers, buttons, ticker. All-caps for headings and buttons.
- **Body copy exception**: at paragraph length Press Start 2P is hostile; any sentence over ~12 words (era flavor text, mobile gate body, tips) may drop to a monospace stack (ui-monospace, "SF Mono", Menlo, monospace) at 14 to 16px with 1.6 line height. 2 fonts maximum, both feel like a terminal.
- **Scale**: grade letter is the largest glyph in the product (clamp around 96 to 140px), title next, then score, then everything else small. Pixel fonts want few sizes: roughly 8, 10, 12, 16, 24px equivalents plus the 2 display sizes. Never use font weights to fake hierarchy (Press Start 2P has 1 weight); use size and color.

## Spacing and motion personality

- **Spacing**: chunky and quantized. 8px base grid; blocks of padding in 8/16/24/32. Hard edges, 0 to 2px border radius maximum. Borders are solid 2 to 4px, no drop shadows except hard offset "pixel shadows" (e.g. 4px 4px 0 #000).
- **Motion**: arcade snap, not web ease. Steps and snaps over smooth tweens: screen shake on collapse (already in engine), 1-frame white flash on impact, grade letter slams in with a 2 or 3 step scale (150 to 250ms), ticker scrolls linearly forever. UI transitions 100 to 200ms max, ease-out or steps(). Nothing floats, nothing fades slowly, no parallax.
- Idle states may pulse (danger piles already do); pulses are square-wave feeling, 2 states, not sine-smooth.

## Voice and tone rules

1. Deadpan economic gallows humor. The narrator has lost money too and finds it funny.
2. Jokes live in mechanics and flavor lines ("Your stimulus arrived. Your landlord raised rent by exactly that amount."), never in random-lol tone. No emoji anywhere in product copy.
3. Historically literate: real years, real references (Nixon Shock, OPEC, Volcker) used as punchlines, never as false data claims.
4. Instructions are terse arcade imperatives: "PICK ERA," "SHOVEL," "TIME'S UP." All caps for system voice, sentence case for flavor voice.
5. Share copy must be a ready-made joke that flatters the poster, front-loaded with the grade and number.
6. Never: motivational finance tone, crypto-bro hype, "learn about inflation!", or apologizing for being a game.

## 3 reference products to measure taste against

1. **Balatro**: feedback juice, chunky pixel confidence, score presentation as spectacle.
2. **neal.fun**: single-concept clarity, zero-friction load-to-play, screenshot-ready framing on every screen.
3. **Wordle's share grid**: the share artifact is compact, legible out of context, and provokes "I can beat that."

## 3 anti-references (never look like)

1. **Generic AI-template slop**: purple-blue gradient hero, glassmorphism cards, Inter font, rounded-2xl everything, floating blob shapes. If a screenshot could be a SaaS landing page, it has failed.
2. **Cool Math Games / ad-farm portal**: cluttered chrome, banner slots, "MORE GAMES" grids, unlicensed sprites. The page contains exactly 1 game and nothing else.
3. **Fintech dashboard earnestness** (Mint, NerdWallet, Robinhood-style clean): friendly rounded sans, pastel charts, advice tone. The moment it looks like it wants to sell Danny a HYSA, he closes the tab and never shares it.
