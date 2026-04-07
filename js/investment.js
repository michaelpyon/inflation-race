// ============================================================
// investment.js - Investment window system
// ============================================================

import { INVESTMENT } from './constants.js';

export class Investment {
    constructor(pileIndex, isPlatinum = false) {
        this.pileIndex = pileIndex;
        this.isPlatinum = isPlatinum;
        this.timeRemaining = INVESTMENT.DURATION;
        this.totalTime = INVESTMENT.DURATION;
        this.investedAmount = 0;
        this.resolved = false;
        this.result = null; // 'bull', 'flat', 'bear'
        this.returnAmount = 0;

        // Forecast
        this.forecastShown = false;
        this.forecastType = null; // 'sun', 'cloud', 'storm'
        this.forecastTimer = 0;

        // Generate forecast (determines actual probabilities)
        this.generateForecast();

        // Visual
        this.sparkleTimer = 0;
        this.bounceTimer = 0;
    }

    generateForecast() {
        // Randomly pick a forecast that hints at the outcome
        const roll = Math.random();
        if (roll < 0.4) {
            this.forecastType = 'sun';
        } else if (roll < 0.75) {
            this.forecastType = 'cloud';
        } else {
            this.forecastType = 'storm';
        }
    }

    update(dt) {
        if (this.resolved) return;

        this.timeRemaining -= dt;
        this.sparkleTimer += dt;
        this.bounceTimer += dt;

        // Show forecast at the right time
        const timeLeft = this.timeRemaining;
        if (timeLeft <= INVESTMENT.FORECAST_TIME && timeLeft > (INVESTMENT.FORECAST_TIME - INVESTMENT.FORECAST_DURATION)) {
            this.forecastShown = true;
            this.forecastTimer = timeLeft - (INVESTMENT.FORECAST_TIME - INVESTMENT.FORECAST_DURATION);
        } else {
            this.forecastShown = false;
        }

        // Resolve when time runs out
        if (this.timeRemaining <= 0) {
            this.resolve();
        }
    }

    addInvestment(amount) {
        if (this.resolved) return 0;
        this.investedAmount += amount;
        return amount;
    }

    resolve() {
        this.resolved = true;

        if (this.investedAmount <= 0) {
            this.result = 'flat';
            this.returnAmount = 0;
            return;
        }

        // Calculate probabilities based on forecast
        let probs;
        if (this.isPlatinum) {
            probs = [...INVESTMENT.PLATINUM_PROBABILITIES];
        } else {
            probs = [...INVESTMENT.BASE_PROBABILITIES];
        }

        // Shift probabilities based on forecast
        if (this.forecastType === 'sun') {
            probs[0] += INVESTMENT.FORECAST_SHIFT;
            probs[2] -= INVESTMENT.FORECAST_SHIFT * 0.5;
            probs[1] -= INVESTMENT.FORECAST_SHIFT * 0.5;
        } else if (this.forecastType === 'storm') {
            probs[2] += INVESTMENT.FORECAST_SHIFT;
            probs[0] -= INVESTMENT.FORECAST_SHIFT * 0.5;
            probs[1] -= INVESTMENT.FORECAST_SHIFT * 0.5;
        }
        // Cloud doesn't shift

        // Normalize
        const total = probs[0] + probs[1] + probs[2];
        probs[0] /= total;
        probs[1] /= total;
        probs[2] /= total;

        // Roll
        const roll = Math.random();
        if (roll < probs[0]) {
            this.result = 'bull';
            const mult = this.isPlatinum ? INVESTMENT.PLATINUM_BULL_MULT : INVESTMENT.BULL_MULTIPLIER;
            this.returnAmount = this.investedAmount * mult;
        } else if (roll < probs[0] + probs[1]) {
            this.result = 'flat';
            this.returnAmount = this.investedAmount * INVESTMENT.FLAT_MULTIPLIER;
        } else {
            this.result = 'bear';
            const mult = this.isPlatinum ? INVESTMENT.PLATINUM_BEAR_MULT : INVESTMENT.BEAR_MULTIPLIER;
            this.returnAmount = this.investedAmount * mult;
        }
    }

    getProgress() {
        return 1 - (this.timeRemaining / this.totalTime);
    }
}

export class InvestmentManager {
    constructor() {
        this.activeInvestment = null;
        this.nextSpawnTimer = this.randomSpawnTime();
        this.resolvedInvestments = [];
        this.totalBullResults = 0;
    }

    randomSpawnTime() {
        return INVESTMENT.SPAWN_MIN + Math.random() * (INVESTMENT.SPAWN_MAX - INVESTMENT.SPAWN_MIN);
    }

    update(dt, piles, waveIndex) {
        // Update active investment
        if (this.activeInvestment) {
            this.activeInvestment.update(dt);

            if (this.activeInvestment.resolved) {
                // Return money to pile
                const inv = this.activeInvestment;
                const pile = piles[inv.pileIndex];
                if (pile && !pile.collapsed && inv.returnAmount > 0) {
                    pile.addMoney(inv.returnAmount);
                }
                if (inv.result === 'bull') this.totalBullResults++;
                this.resolvedInvestments.push(inv);

                // Clear from pile
                if (pile) pile.activeInvestment = null;
                this.activeInvestment = null;
                this.nextSpawnTimer = this.randomSpawnTime();
            }
        }

        // Spawn new investment
        if (!this.activeInvestment) {
            this.nextSpawnTimer -= dt;
            if (this.nextSpawnTimer <= 0) {
                this.spawn(piles, waveIndex);
            }
        }
    }

    spawn(piles, waveIndex) {
        // Find a valid pile (not collapsed, not firebroken)
        const validPiles = piles.filter(p => !p.collapsed && !p.firebroken && p.amount > INVESTMENT.INVEST_AMOUNT);
        if (validPiles.length === 0) {
            this.nextSpawnTimer = 5; // retry in 5 seconds
            return;
        }

        const pile = validPiles[Math.floor(Math.random() * validPiles.length)];
        const isPlatinum = waveIndex >= 3 && Math.random() < 0.3;

        this.activeInvestment = new Investment(pile.index, isPlatinum);
        pile.activeInvestment = this.activeInvestment;
    }

    investInPile(pileIndex, piles) {
        if (!this.activeInvestment || this.activeInvestment.pileIndex !== pileIndex) return null;
        if (this.activeInvestment.resolved) return null;

        const pile = piles[pileIndex];
        if (!pile || pile.collapsed) return null;

        const amount = Math.min(INVESTMENT.INVEST_AMOUNT, pile.amount);
        if (amount <= 0) return null;

        pile.removeMoney(amount);
        this.activeInvestment.addInvestment(amount);
        return amount;
    }

    getLastResolved() {
        if (this.resolvedInvestments.length === 0) return null;
        return this.resolvedInvestments[this.resolvedInvestments.length - 1];
    }
}
