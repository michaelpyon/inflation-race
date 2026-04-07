// ============================================================
// pile.js - Money pile class with burn mechanics
// ============================================================

import { PILES, EMBER, COLLAPSE, WAVE_MULTIPLIERS, COLORS } from './constants.js';

export class Pile {
    constructor(index, name, amount, baseBurnRate) {
        this.index = index;
        this.name = name;
        this.amount = amount;
        this.startingAmount = amount;
        this.baseBurnRate = baseBurnRate;
        this.currentBurnRate = baseBurnRate;
        this.effectiveBurnRate = baseBurnRate; // after all modifiers

        // Fluctuation
        this.fluctPhase = Math.random() * Math.PI * 2;
        this.fluctPeriod = PILES.FLUCTUATION_PERIOD_MIN +
            Math.random() * (PILES.FLUCTUATION_PERIOD_MAX - PILES.FLUCTUATION_PERIOD_MIN);

        // State
        this.collapsed = false;
        this.firebroken = false;
        this.firebreakTimer = 0;

        // Collapse effects on neighbors
        this.collapseSpike = 0;
        this.collapseSpikeTimer = 0;

        // Ash
        this.hasAsh = false;
        this.ashTimer = 0;
        this.ashAmount = 0;

        // Investment
        this.activeInvestment = null;

        // Ember spread bonus from neighbors
        this.emberBonus = 0;

        // Visual
        this.visualHeight = 0;
        this.targetHeight = 0;
        this.pulseTimer = 0;
        this.squash = 0; // for bounce effect
        this.x = 0; // set by game
    }

    update(dt, waveIndex, gameTime, averageAmount) {
        if (this.collapsed) {
            // Handle ash timer
            if (this.hasAsh) {
                this.ashTimer -= dt;
                if (this.ashTimer <= 0) {
                    this.hasAsh = false;
                    this.ashAmount = 0;
                }
            }
            return;
        }

        // Calculate effective burn rate
        const waveMult = WAVE_MULTIPLIERS[Math.min(waveIndex, WAVE_MULTIPLIERS.length - 1)];

        // Sinusoidal fluctuation
        const fluct = 1 + Math.sin(gameTime / this.fluctPeriod + this.fluctPhase) * PILES.FLUCTUATION_AMPLITUDE;

        // Base rate with wave multiplier and fluctuation
        this.currentBurnRate = this.baseBurnRate * waveMult * fluct;

        // Concentration burn: piles with more than average burn faster
        if (averageAmount > 0) {
            const ratio = this.amount / averageAmount;
            const concentrationMult = 1 + Math.max(0, ratio - 1) * PILES.CONCENTRATION_FACTOR;
            this.currentBurnRate *= concentrationMult;
        }

        // Add collapse spike from neighbor collapses
        if (this.collapseSpikeTimer > 0) {
            this.currentBurnRate *= (1 + this.collapseSpike);
            this.collapseSpikeTimer -= dt;
            if (this.collapseSpikeTimer <= 0) {
                this.collapseSpike = 0;
            }
        }

        // Add ember spread bonus
        this.currentBurnRate += this.emberBonus;

        // Apply firebreak
        if (this.firebroken) {
            this.effectiveBurnRate = this.currentBurnRate * 0.25;
            this.firebreakTimer -= dt;
            if (this.firebreakTimer <= 0) {
                this.firebroken = false;
            }
        } else {
            this.effectiveBurnRate = this.currentBurnRate;
        }

        // Burn money
        this.amount -= this.effectiveBurnRate * dt;

        // Check for collapse
        if (this.amount <= 0) {
            this.amount = 0;
            this.collapse();
        }

        // Update visual height
        this.targetHeight = this.getVisualHeight();
        this.visualHeight += (this.targetHeight - this.visualHeight) * 8 * dt;

        // Squash bounce recovery
        if (this.squash !== 0) {
            this.squash *= 0.9;
            if (Math.abs(this.squash) < 0.01) this.squash = 0;
        }

        // Pulse timer for danger indication
        this.pulseTimer += dt;

        // Reset ember bonus each frame (recalculated by game)
        this.emberBonus = 0;
    }

    collapse() {
        this.collapsed = true;
        this.amount = 0;
        this.hasAsh = true;
        this.ashTimer = COLLAPSE.ASH_DURATION;
        this.ashAmount = COLLAPSE.ASH_AMOUNT;
    }

    applyCollapseSpike() {
        this.collapseSpike = COLLAPSE.NEIGHBOR_SPIKE;
        this.collapseSpikeTimer = COLLAPSE.SPIKE_DURATION;
    }

    applyFirebreak(duration) {
        this.firebroken = true;
        this.firebreakTimer = duration;
    }

    collectAsh() {
        if (!this.hasAsh) return 0;
        const amount = this.ashAmount;
        this.hasAsh = false;
        this.ashAmount = 0;
        return amount;
    }

    addMoney(amount) {
        this.amount += amount;
        this.squash = -3; // compress effect
    }

    removeMoney(amount) {
        const actual = Math.min(this.amount, amount);
        this.amount -= actual;
        this.squash = 3; // stretch effect
        return actual;
    }

    getVisualHeight() {
        if (this.collapsed) return 0;
        if (this.amount <= 0) return 0;
        // Logarithmic scale so small piles are still visible
        const ratio = Math.log(1 + this.amount) / Math.log(1 + 5000);
        return PILES.MIN_VISUAL_HEIGHT + ratio * (PILES.MAX_VISUAL_HEIGHT - PILES.MIN_VISUAL_HEIGHT);
    }

    getBurnColor() {
        if (this.firebroken) return COLORS.FIREBREAK_BLUE;
        const rate = this.effectiveBurnRate;
        if (rate > 20) return COLORS.BURN_RED;
        if (rate > 10) return COLORS.BURN_ORANGE;
        if (rate > 5) return COLORS.BURN_YELLOW;
        return COLORS.BURN_GREEN;
    }

    isEmberSource() {
        return !this.collapsed && !this.firebroken && this.effectiveBurnRate > EMBER.THRESHOLD;
    }

    getEmberExcess() {
        return Math.max(0, this.effectiveBurnRate - EMBER.THRESHOLD);
    }

    isDanger() {
        return !this.collapsed && this.amount < PILES.DANGER_THRESHOLD && this.amount > 0;
    }

    isCritical() {
        return !this.collapsed && this.amount < PILES.CRITICAL_THRESHOLD && this.amount > 0;
    }

    getBurnTrend(gameTime) {
        // Returns whether burn rate is currently increasing or decreasing
        const futureTime = gameTime + 0.5;
        const currentFluct = Math.sin(gameTime / this.fluctPeriod + this.fluctPhase);
        const futureFluct = Math.sin(futureTime / this.fluctPeriod + this.fluctPhase);
        if (futureFluct > currentFluct) return 'up';
        if (futureFluct < currentFluct) return 'down';
        return 'stable';
    }
}

export function createPiles() {
    const piles = [];
    let totalAmount = 0;

    for (let i = 0; i < PILES.NAMES.length; i++) {
        const [minAmt, maxAmt] = PILES.STARTING_AMOUNTS[i];
        const amount = minAmt + Math.random() * (maxAmt - minAmt);
        const [minBurn, maxBurn] = PILES.BURN_RATES[i];
        const burnRate = minBurn + Math.random() * (maxBurn - minBurn);

        piles.push(new Pile(i, PILES.NAMES[i], amount, burnRate));
        totalAmount += amount;
    }

    // Normalize to target starting total
    const scale = 14000 / totalAmount;
    for (const pile of piles) {
        pile.amount *= scale;
        pile.startingAmount = pile.amount;
    }

    // Set x positions
    const startX = (384 - (piles.length - 1) * PILES.PILE_SPACING) / 2;
    for (let i = 0; i < piles.length; i++) {
        piles[i].x = startX + i * PILES.PILE_SPACING;
    }

    return piles;
}
