# Inflation Race -- Design Tokens

## Aesthetic

PICO-8 pixel art. 384x216 canvas scaled 4x. Press Start 2P font. Hard pixel edges, no anti-aliasing. `image-rendering: pixelated` on the canvas element.

This is an arcade game, not a web app. Most color lives in Canvas JS rendering, not CSS. The CSS layer handles menus, overlays, and HUD chrome only.

## Core PICO-8 Palette (Canvas + CSS)

Used across all eras. These are the game's permanent visual identity.

| Token | Hex | Role |
|---|---|---|
| `--bg-dark` | `#000000` | UI backgrounds, body |
| `--text-primary` | `#FFF1E8` | Default text (PICO-8 off-white) |
| `--text-glow` | `#FFEC27` | Highlights, scores, selected items |
| `--accent` | `#FF004D` | PICO-8 red. Titles, danger, fire |
| `--surface` | `#1D2B53` | Dark blue. Canvas BG, bar backgrounds |
| `--accent-shadow` | `#7E2553` | Purple. Text shadow, extreme fire |
| `--text-warm` | `#FFA300` | Orange. Subtitles, labels |
| `--text-link` | `#29ADFF` | Blue. Prompts, firebreak |
| `--text-muted` | `#C2C3C7` | Light gray. Secondary text |
| `--text-dim` | `#5F574F` | Dark gray. Tertiary text |

### Full PICO-8 Colors in JS (`COLORS` object)

These are used by the Canvas renderer, not CSS.

| Key | Hex | Usage |
|---|---|---|
| `MONEY_GREEN` | `#00E436` | Money particles, safe haven |
| `MONEY_DARK` | `#008751` | Dark green accents |
| `FIRE_LOW` | `#FFEC27` | Low burn rate |
| `FIRE_MED` | `#FFA300` | Medium burn |
| `FIRE_HIGH` | `#FF004D` | High burn |
| `FIRE_EXTREME` | `#7E2553` | Extreme burn |
| `CHARACTER` | `#FF77A8` | Player sprite |
| `CHARACTER_HAT` | `#FFEC27` | Hat accent |
| `CHARACTER_SHOVEL` | `#AB5236` | Shovel tool |
| `INVESTMENT_GOLD` | `#FFCCAA` | Investment orbs |
| `ASH_GRAY` | `#C2C3C7` | Collapsed pile ash |

## Era Color System (Additive)

Era palettes layer on top of the core PICO-8 palette during specific game eras. They don't replace the base colors. They're used by the Canvas renderer for era-specific backgrounds, accents, and themed UI elements.

### 1920s -- Great Deflation

Sepia, dusty, depression-era warmth.

| Key | Hex | Feel |
|---|---|---|
| `BG` | `#2B1B0E` | Dark sepia ground |
| `ACCENT` | `#D4A55C` | Tarnished gold |
| `TEXT` | `#E8D5B7` | Parchment white |
| `DUST` | `#8B7355` | Dust clouds, decay |

### 1970s -- Stagflation

Burnt earth tones, disco gold, olive drab.

| Key | Hex | Feel |
|---|---|---|
| `BG` | `#3D2B1F` | Dark brown |
| `ACCENT` | `#DAA520` | Goldenrod |
| `TEXT` | `#F5DEB3` | Wheat |
| `OLIVE` | `#6B8E23` | Military surplus |
| `ORANGE` | `#FF8C00` | Inflation heat |

### 2020s -- Helicopter Money

Terminal green on dark. GitHub-dark vibes. Digital money printer.

| Key | Hex | Feel |
|---|---|---|
| `BG` | `#0D1117` | Near-black (GitHub dark) |
| `ACCENT` | `#00E436` | Money printer green |
| `TEXT` | `#E6EDF3` | Cool white |
| `DIGITAL` | `#58A6FF` | Link blue, digital UI |
| `STIMULUS` | `#3FB950` | Stimulus check green |

## Font

**Press Start 2P** (Google Fonts). Pixel bitmap aesthetic. No fallback needed for the vibe, but `monospace` as technical fallback.

## Rules

1. Canvas colors live in `js/constants.js` COLORS object. CSS colors live in `:root` custom properties.
2. Era palettes are additive. They sit alongside the core palette, never replace it.
3. No gradients, no shadows beyond PICO-8 style drop shadows (integer pixel offsets only).
4. All rendering uses `image-rendering: pixelated`. No smoothing.
5. Color transitions during era changes should be abrupt (step function), not animated. Pixel art doesn't fade.
