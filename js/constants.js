// ============================================================
// constants.js - All game balance and tuning values
// ============================================================

export const CANVAS = {
    WIDTH: 384,
    HEIGHT: 216,
    SCALE: 4,
};

export const COLORS = {
    BG: '#1D2B53',
    PILE_BASE: '#5F574F',
    MONEY_GREEN: '#00E436',
    MONEY_DARK: '#008751',
    FIRE_LOW: '#FFEC27',
    FIRE_MED: '#FFA300',
    FIRE_HIGH: '#FF004D',
    FIRE_EXTREME: '#7E2553',
    CHARACTER: '#FF77A8',
    CHARACTER_HAT: '#FFEC27',
    CHARACTER_SHOVEL: '#AB5236',
    UI_TEXT: '#FFF1E8',
    UI_BG: '#000000',
    UI_BAR_BG: '#1D2B53',
    INVESTMENT_GOLD: '#FFCCAA',
    INVESTMENT_GLOW: '#FFEC27',
    FIREBREAK_BLUE: '#29ADFF',
    SAFE_HAVEN: '#00E436',
    BURN_GREEN: '#00E436',
    BURN_YELLOW: '#FFEC27',
    BURN_ORANGE: '#FFA300',
    BURN_RED: '#FF004D',
    ASH_GRAY: '#C2C3C7',
    TICKER_BG: '#000000',
    TICKER_TEXT: '#FFEC27',
    WAVE_BANNER: '#FF004D',
    COMBO_TEXT: '#FFEC27',
    PLATINUM: '#E0E0FF',
    UI_DIM: '#333333',
    FLASH_WHITE: '#FFFFFF',

    // Era-specific color palettes (additive — used for era theming)
    ERA_1920S: { BG: '#2B1B0E', ACCENT: '#D4A55C', TEXT: '#E8D5B7', DUST: '#8B7355' },
    ERA_1970S: { BG: '#3D2B1F', ACCENT: '#DAA520', TEXT: '#F5DEB3', OLIVE: '#6B8E23', ORANGE: '#FF8C00' },
    ERA_2020S: { BG: '#0D1117', ACCENT: '#00E436', TEXT: '#E6EDF3', DIGITAL: '#58A6FF', STIMULUS: '#3FB950' },
};

export const GAME = {
    DURATION: 150,          // seconds
    WAVE_COUNT: 5,
    WAVE_DURATION: 30,      // seconds per wave
    STARTING_TOTAL: 14000,
    PILE_COUNT: 7,
    TICK_RATE: 60,          // updates per second
};

export const PILES = {
    NAMES: ['Savings', '401k', 'Crypto', 'Real Estate', 'Stocks', 'Bonds', 'Cash'],
    // Base burn rates in $/sec [min, max] for random initialization
    BURN_RATES: [
        [2, 4],     // Savings
        [3, 6],     // 401k
        [8, 15],    // Crypto
        [4, 8],     // Real Estate
        [5, 10],    // Stocks
        [1, 3],     // Bonds
        [6, 12],    // Cash
    ],
    // Starting amounts [min, max]
    STARTING_AMOUNTS: [
        [1500, 2500],
        [1500, 2500],
        [1000, 2000],
        [2000, 3000],
        [1500, 2500],
        [1500, 2500],
        [1000, 2000],
    ],
    CONCENTRATION_FACTOR: 0.5,      // extra burn per 1x above average (2x avg = 1.5x burn)
    FLUCTUATION_AMPLITUDE: 0.2,     // +/- 20%
    FLUCTUATION_PERIOD_MIN: 3,      // seconds
    FLUCTUATION_PERIOD_MAX: 8,
    MAX_VISUAL_HEIGHT: 70,          // pixels at max amount
    MIN_VISUAL_HEIGHT: 8,           // pixels when nearly empty
    PILE_WIDTH: 28,
    PILE_SPACING: 50,               // center-to-center distance
    PILE_Y: 145,                    // base y position
    DANGER_THRESHOLD: 200,          // $ - starts pulsing
    CRITICAL_THRESHOLD: 50,         // $ - pulses faster
};

export const WAVE_MULTIPLIERS = [1.0, 1.4, 1.8, 2.5, 3.5];

export const PLAYER = {
    MOVE_SPEED: 3,              // piles per second (time to move one pile = 1/3 sec)
    SHOVEL_AMOUNT: 150,         // $ per shovel
    SHOVEL_COOLDOWN: 0.25,      // seconds between shovels
    SPILLAGE_RATE: 0.05,        // 5% lost per transfer
    SKIP_SPILLAGE: 0.08,        // extra 8% spillage per collapsed pile skipped
    SPRITE_SIZE: 16,
    Y_OFFSET: -8,               // above pile base
};

export const FIREBREAK = {
    MAX_TOKENS: 2,
    DURATION: 12,               // seconds
    BURN_REDUCTION: 0.25,       // burns at 25% of normal
    TOKENS_PER_WAVE: 1,
};

export const EMBER = {
    THRESHOLD: 10,              // $/sec - above this, pile spreads embers
    SPREAD_FACTOR: 0.15,        // 15% of excess spread to neighbors
};

export const COLLAPSE = {
    NEIGHBOR_SPIKE: 0.5,        // +50% burn rate on neighbors
    SPIKE_DURATION: 5,          // seconds
    ASH_AMOUNT: 200,
    ASH_DURATION: 4,            // seconds to collect
};

export const INVESTMENT = {
    SPAWN_MIN: 15,              // seconds between spawns
    SPAWN_MAX: 25,
    DURATION: 6,                // seconds countdown
    INVEST_AMOUNT: 200,         // $ per press
    FORECAST_TIME: 4,           // seconds remaining when forecast shows
    FORECAST_DURATION: 1.5,     // seconds forecast is visible
    // Probabilities: [bull, flat, bear]
    BASE_PROBABILITIES: [0.40, 0.35, 0.25],
    // Forecast shifts probability
    FORECAST_SHIFT: 0.30,       // forecast icon shifts outcome by 30%
    BULL_MULTIPLIER: 2.0,
    FLAT_MULTIPLIER: 1.0,
    BEAR_MULTIPLIER: 0.5,
    // Platinum investment (waves 4-5)
    PLATINUM_BULL_MULT: 5.0,
    PLATINUM_BEAR_MULT: 0.0,
    PLATINUM_PROBABILITIES: [0.30, 0.20, 0.50],
};

export const UPGRADES = {
    BIG_SHOVEL: { amount: 300, duration: 15 },
    FIREPROOF: { spillage: 0, duration: 10 },
    SPEED: { cooldown: 0.12, duration: 10 },
};

export const MARKET_CRASH = {
    BURN_MULTIPLIER: 3.0,
    SHOVEL_MULTIPLIER: 2.0,
    WARNING_DURATION: 5,        // seconds warning before crash
    CRASH_DURATION: 8,          // seconds the crash lasts
};

export const PARTICLES = {
    FIRE_SPAWN_RATE_BASE: 2,    // particles per frame at burn rate 1
    FIRE_LIFETIME_MIN: 0.3,
    FIRE_LIFETIME_MAX: 0.6,
    FIRE_SPEED_MIN: 15,
    FIRE_SPEED_MAX: 40,
    FIRE_SIZE: 2,
    SHOVEL_COUNT: 8,            // particles per shovel transfer
    SHOVEL_LIFETIME: 0.4,
    SHOVEL_SPEED: 80,
    EMBER_COUNT: 3,
    EMBER_LIFETIME: 0.8,
    EMBER_SPEED: 30,
    ASH_COUNT: 12,
    ASH_LIFETIME: 1.5,
    COLLAPSE_COUNT: 20,
};

export const SCORING = {
    SURVIVOR_BONUS: 500,        // per pile still alive
    INVESTOR_BONUS: 200,        // per successful bull investment
    ASH_COLLECTOR: 100,         // per ash collected
    NO_COLLAPSE_BONUS: 1000,
    GRADES: [
        { grade: 'S', threshold: 0.80, color: COLORS.FIRE_LOW },
        { grade: 'A', threshold: 0.60, color: COLORS.MONEY_GREEN },
        { grade: 'B', threshold: 0.40, color: COLORS.FIREBREAK_BLUE },
        { grade: 'C', threshold: 0.20, color: COLORS.FIRE_MED },
        { grade: 'F', threshold: 0.00, color: COLORS.FIRE_HIGH },
    ],
};

export const TICKER = {
    SPEED: 40,                  // pixels per second scroll speed
    FORECAST_AHEAD: 8,          // seconds ahead for forecast messages
    Y: 4,
    HEIGHT: 10,
};

export const SCREEN_SHAKE = {
    COLLAPSE_INTENSITY: 3,
    COLLAPSE_DURATION: 0.5,
    CRASH_INTENSITY: 4,
    CRASH_DURATION: 0.8,
};

export const COMBO = {
    WINDOW: 2,                  // seconds
    THRESHOLD: 4,               // shovels needed for combo
};
