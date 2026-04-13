// ============================================================
// eras.js - Economic era definitions with modifiers and events
// ============================================================

import { COLORS } from './constants.js';

export const ERAS = {
    GREAT_DEPRESSION: {
        id: 'great_depression',
        name: 'The Great Depression',
        year: '1929-1939',
        tagline: 'Deflation eats everything.',
        flavorText: 'Bread costs a nickel. Too bad nobody has a nickel.',
        modifiers: {
            inflationRate: -0.02,
            startCash: 500,
            burnMultiplier: 0.5,
            gameDuration: 150,
            incomeDecay: 0.5,           // income decays over time
        },
        events: [
            {
                id: 'bank_run',
                name: 'BANK RUN',
                text: 'Everyone wants their cash!',
                flavor: 'Everybody wants their money. Nobody can have it.',
                duration: 0,
                effect: 'pileShrink',
                value: 0.2,
                weight: 3,
            },
            {
                id: 'dust_bowl',
                name: 'DUST BOWL',
                text: 'Crops failed. Food prices spike.',
                flavor: 'The earth itself is bankrupt.',
                duration: 5000,
                effect: 'burnSpike',
                value: 2.0,
                weight: 3,
            },
            {
                id: 'new_deal',
                name: 'NEW DEAL',
                text: 'Government jobs program!',
                flavor: 'Uncle Sam is shoveling money. For once, in your direction.',
                duration: 10000,
                effect: 'incomeBoost',
                value: 2.0,
                weight: 2,
            },
            {
                id: 'gold_standard',
                name: 'GOLD STANDARD',
                text: 'Cash backed by gold. Pile immune!',
                flavor: 'Gold never lies. For a few seconds, neither does your balance.',
                duration: 8000,
                effect: 'immunity',
                value: 1,
                weight: 1,
            },
        ],
        colors: COLORS.ERA_1920S,
        tickerMessages: [
            'BANK HOLIDAY DECLARED',
            'BREAD LINES STRETCH FOR BLOCKS',
            'UNEMPLOYMENT HITS 25%',
            'HOOVERVILLE POPULATION RISING',
            'STOCKS STILL FALLING',
            'FARM PRICES HIT RECORD LOW',
            'ANOTHER BANK FAILS',
            'GOLD RESERVES DWINDLING',
        ],
    },

    STAGFLATION: {
        id: 'stagflation',
        name: 'Stagflation',
        year: '1973-1982',
        tagline: 'Prices rise. Wages don\'t.',
        flavorText: 'Your rent doubled. Your raise didn\'t.',
        modifiers: {
            inflationRate: 0.08,
            startCash: 200,
            burnMultiplier: 1.5,
            gameDuration: 150,
            speedDecay: 0.01,           // movement speed decays over time
        },
        events: [
            {
                id: 'oil_shock',
                name: 'OIL SHOCK',
                text: 'OPEC cut production!',
                flavor: 'OPEC sends its regards.',
                duration: 10000,
                effect: 'speedHalf',
                value: 0.5,
                weight: 3,
            },
            {
                id: 'disco_fever',
                name: 'DISCO FEVER',
                text: 'Everyone\'s spending!',
                flavor: 'Burn, baby, burn. Your savings, that is.',
                duration: 10000,
                effect: 'burnSpike',
                value: 2.0,
                weight: 2,
            },
            {
                id: 'nixon_shock',
                name: 'NIXON SHOCK',
                text: 'Money printer go brrr!',
                flavor: 'The gold window is closed. The cash window is open.',
                duration: 5000,
                effect: 'cashRain',
                value: 100,
                weight: 2,
            },
            {
                id: 'wage_price_spiral',
                name: 'WAGE-PRICE SPIRAL',
                text: 'It never ends.',
                flavor: 'Prices go up because wages go up because prices go up.',
                duration: 0,
                effect: 'permanentBurn',
                value: 0.1,
                weight: 2,
            },
        ],
        colors: COLORS.ERA_1970S,
        tickerMessages: [
            'GAS LINES AROUND THE BLOCK',
            'INTEREST RATES HIT 20%',
            'MISERY INDEX AT ALL TIME HIGH',
            'WHIP INFLATION NOW',
            'VOLCKER RAISES RATES AGAIN',
            'OIL PRICES TRIPLE OVERNIGHT',
            'STAGFLATION GRIPS NATION',
            'WAGE CONTROLS FAIL',
        ],
    },

    HELICOPTER_MONEY: {
        id: 'helicopter_money',
        name: 'Helicopter Money',
        year: '2020-2024',
        tagline: 'Free money. Expensive everything.',
        flavorText: 'Your stimulus arrived. Your landlord raised rent by exactly that amount.',
        modifiers: {
            inflationRate: 0.15,
            startCash: 100,
            burnMultiplier: 2.0,
            gameDuration: 150,
            stimulusRate: 0.5,          // stimulus drops from sky periodically
        },
        events: [
            {
                id: 'stimulus_drop',
                name: 'STIMULUS DROP',
                text: 'Money printer go BRRR! +$500!',
                flavor: 'The printer goes brrr. So do your prices.',
                duration: 0,
                effect: 'stimulus',
                value: 500,
                weight: 3,
            },
            {
                id: 'supply_chain',
                name: 'SUPPLY CHAIN',
                text: 'Your couch is stuck on a cargo ship.',
                flavor: 'Your package is somewhere in the Pacific. So is your economy.',
                duration: 15000,
                effect: 'lockItems',
                value: 1,
                weight: 2,
            },
            {
                id: 'crypto_crash',
                name: 'CRYPTO CRASH',
                text: 'To the moon! Or not.',
                flavor: 'Number no longer go up.',
                duration: 0,
                effect: 'investmentHalf',
                value: 0.5,
                weight: 2,
            },
            {
                id: 'remote_work',
                name: 'REMOTE WORK',
                text: 'WFH approved!',
                flavor: 'Commute time: 0. Productivity: debatable.',
                duration: 10000,
                effect: 'speedBoost',
                value: 2,
                weight: 2,
            },
            {
                id: 'meme_stock',
                name: 'MEME STOCK',
                text: 'Diamond hands!',
                flavor: 'Diamond hands or paper hands? You have 3 seconds to decide.',
                duration: 0,
                effect: 'memeStock',
                value: 10,
                weight: 1,
            },
        ],
        colors: COLORS.ERA_2020S,
        tickerMessages: [
            'MONEY PRINTER GOES BRRR',
            'SUPPLY CHAIN DISRUPTED AGAIN',
            'INFLATION IS TRANSITORY (THEY SAY)',
            'CRYPTO DOWN 40% TODAY',
            'HOUSING PRICES HIT RECORD',
            'ANOTHER STIMULUS PACKAGE',
            'RENT UP 30% YEAR OVER YEAR',
            'AVOCADO TOAST NOW $47',
        ],
    },
};

export const ERA_LIST = [ERAS.GREAT_DEPRESSION, ERAS.STAGFLATION, ERAS.HELICOPTER_MONEY];

export function getEraById(id) {
    return ERA_LIST.find(e => e.id === id) || null;
}

export function getRandomEra() {
    return ERA_LIST[Math.floor(Math.random() * ERA_LIST.length)];
}
