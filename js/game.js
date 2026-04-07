// ============================================================
// game.js - Core game state manager
// ============================================================

import { GAME, EMBER, COLLAPSE, FIREBREAK, PILES, MARKET_CRASH, SCORING } from './constants.js';
import { Pile, createPiles } from './pile.js';
import { Player } from './player.js';
import { InvestmentManager } from './investment.js';
import { EventManager } from './events.js';
import { ParticleSystem } from './particles.js';
import * as Audio from './audio.js';

export class Game {
    constructor(renderer) {
        this.renderer = renderer;
        this.reset();
    }

    reset() {
        this.piles = createPiles();
        this.player = new Player(this.piles.length);
        this.player.x = this.player.getPileX(this.player.pileIndex, this.piles);
        this.investmentManager = new InvestmentManager();
        this.events = new EventManager();
        this.particles = new ParticleSystem();

        this.gameTime = 0;
        this.running = false;
        this.paused = false;
        this.gameOver = false;

        // Stats
        this.stats = {
            startingTotal: this.piles.reduce((s, p) => s + p.amount, 0),
            totalBurned: 0,
            totalSpillage: 0,
            totalInvested: 0,
            totalReturned: 0,
            ashCollected: 0,
            pilesCollapsed: 0,
            bullResults: 0,
        };

        // Ember spread timer (don't compute every frame)
        this.emberTimer = 0;

        // Forecast ticker timer
        this.forecastTimer = 0;
    }

    start() {
        this.running = true;
        this.paused = false;
        Audio.resumeAudio();
        Audio.startFireAmbience();
    }

    pause() {
        this.paused = !this.paused;
    }

    update(dt) {
        if (!this.running || this.paused || this.gameOver) return;

        this.gameTime += dt;

        // Update events (timer, waves, crash)
        this.events.update(dt, this.piles, {
            onGameOver: () => this.onGameOver(),
            onWaveChange: (wave) => this.onWaveChange(wave),
            onCrashWarning: (safeIdx) => this.onCrashWarning(safeIdx),
            onCrashStart: (safeIdx) => this.onCrashStart(safeIdx),
            onCrashEnd: () => this.onCrashEnd(),
        });

        if (this.gameOver) return;

        // Update piles (burn)
        const prevAmounts = this.piles.map(p => p.amount);
        const activePileAmounts = this.piles.filter(p => !p.collapsed);
        const averageAmount = activePileAmounts.length > 0
            ? activePileAmounts.reduce((s, p) => s + p.amount, 0) / activePileAmounts.length
            : 0;

        for (const pile of this.piles) {
            // Apply crash multiplier
            if (this.events.crashActive && !this.events.isSafeHaven(pile.index)) {
                // Temporarily boost burn rate during crash
                const savedBase = pile.baseBurnRate;
                pile.baseBurnRate *= MARKET_CRASH.BURN_MULTIPLIER;
                pile.update(dt, this.events.waveIndex, this.gameTime, averageAmount);
                pile.baseBurnRate = savedBase;
            } else if (this.events.isSafeHaven(pile.index)) {
                // Safe haven doesn't burn
                pile.update(dt, this.events.waveIndex, this.gameTime, averageAmount);
                pile.amount = prevAmounts[pile.index]; // restore - no burn
            } else {
                pile.update(dt, this.events.waveIndex, this.gameTime, averageAmount);
            }

            // Track burn
            const burned = prevAmounts[pile.index] - pile.amount;
            if (burned > 0) this.stats.totalBurned += burned;

            // Check for collapse
            if (pile.collapsed && prevAmounts[pile.index] > 0) {
                this.onPileCollapse(pile);
            }
        }

        // Ember spread (every 0.1 seconds for performance)
        this.emberTimer += dt;
        if (this.emberTimer >= 0.1) {
            this.emberTimer = 0;
            this.computeEmberSpread();
        }

        // Fire particles
        for (const pile of this.piles) {
            if (!pile.collapsed && pile.amount > 0) {
                this.particles.spawnFire(pile.x, PILES.PILE_Y - pile.visualHeight, PILES.PILE_WIDTH, pile.effectiveBurnRate);
            }
        }

        // Update player
        const shovelMult = this.events.getShovelMultiplier();
        if (shovelMult > 1) {
            this.player.shovelAmount = 150 * shovelMult; // during crash
        }

        this.player.update(dt, this.piles, this.gameTime, {
            onShovel: (from, to, amount, delivered, spillage) => {
                this.onShovel(from, to, amount, delivered, spillage);
            },
            onCombo: (count) => {
                this.renderer.addFloatingText('COMBO x' + count, this.player.x, PILES.PILE_Y - 30, '#FFEC27');
            },
            onInvest: (pileIndex) => {
                this.onInvest(pileIndex);
            },
            onFirebreak: (pileIndex) => {
                this.onFirebreak(pileIndex);
            },
            onAshCollect: (pileIndex, amount) => {
                this.onAshCollect(pileIndex, amount);
            },
        });

        // Update investments
        const prevInvestment = this.investmentManager.activeInvestment;
        this.investmentManager.update(dt, this.piles, this.events.waveIndex);

        // Check if investment just resolved
        if (prevInvestment && prevInvestment.resolved && !prevInvestment._notified) {
            prevInvestment._notified = true;
            this.onInvestmentResolved(prevInvestment);
        }

        // Update particles
        this.particles.update(dt);

        // Update renderer effects
        this.renderer.updateEffects(dt);

        // Update fire ambience volume
        const totalBurn = this.piles.reduce((s, p) => s + (p.collapsed ? 0 : p.effectiveBurnRate), 0);
        Audio.updateFireAmbience(totalBurn);

        // Forecast ticker updates
        this.forecastTimer += dt;
        if (this.forecastTimer >= 3) {
            this.forecastTimer = 0;
            this.generateForecastMessages();
        }
    }

    computeEmberSpread() {
        // Reset ember bonuses
        for (const pile of this.piles) {
            pile.emberBonus = 0;
        }

        for (const pile of this.piles) {
            if (!pile.isEmberSource()) continue;

            const excess = pile.getEmberExcess();
            const spread = excess * EMBER.SPREAD_FACTOR;

            // Spread to neighbors
            if (pile.index > 0 && !this.piles[pile.index - 1].collapsed && !this.piles[pile.index - 1].firebroken) {
                this.piles[pile.index - 1].emberBonus += spread;
                // Visual ember particles (less frequent)
                if (Math.random() < 0.1) {
                    this.particles.spawnEmber(pile.x, PILES.PILE_Y - pile.visualHeight / 2, this.piles[pile.index - 1].x);
                }
            }
            if (pile.index < this.piles.length - 1 && !this.piles[pile.index + 1].collapsed && !this.piles[pile.index + 1].firebroken) {
                this.piles[pile.index + 1].emberBonus += spread;
                if (Math.random() < 0.1) {
                    this.particles.spawnEmber(pile.x, PILES.PILE_Y - pile.visualHeight / 2, this.piles[pile.index + 1].x);
                }
            }
        }
    }

    generateForecastMessages() {
        // Pick a random pile and forecast its burn trend
        const activePiles = this.piles.filter(p => !p.collapsed);
        if (activePiles.length === 0) return;

        const pile = activePiles[Math.floor(Math.random() * activePiles.length)];
        const trend = pile.getBurnTrend(this.gameTime);
        if (trend === 'up') {
            this.events.addForecastMessage(pile.name, 'rate_up');
        } else if (trend === 'down') {
            this.events.addForecastMessage(pile.name, 'rate_down');
        }
    }

    onShovel(fromIndex, toIndex, amount, delivered, spillage) {
        Audio.playShovel();
        setTimeout(() => Audio.playMoneyLand(), 100);

        this.stats.totalSpillage += spillage;

        // Particles
        const fromPile = this.piles[fromIndex];
        const toPile = this.piles[toIndex];
        this.particles.spawnShovelTransfer(
            fromPile.x, PILES.PILE_Y - fromPile.visualHeight / 2,
            toPile.x, PILES.PILE_Y - toPile.visualHeight / 2
        );

        // Floating text
        this.renderer.addFloatingText('+$' + Math.floor(delivered), toPile.x, PILES.PILE_Y - toPile.visualHeight - 10, '#00E436');
        if (spillage > 1) {
            this.renderer.addFloatingText('-$' + Math.floor(spillage), (fromPile.x + toPile.x) / 2, PILES.PILE_Y - 20, '#FF004D', 0.5);
        }
    }

    onInvest(pileIndex) {
        const invested = this.investmentManager.investInPile(pileIndex, this.piles);
        if (invested) {
            this.stats.totalInvested += invested;
            Audio.playMoneyLand();
            this.renderer.addFloatingText('-$' + Math.floor(invested), this.piles[pileIndex].x, PILES.PILE_Y - 25, '#FFCCAA');
        }
    }

    onInvestmentResolved(investment) {
        const pile = this.piles[investment.pileIndex];

        if (investment.result === 'bull') {
            Audio.playBullResult();
            // Big dramatic result
            this.renderer.addFloatingText(
                'BULL! +$' + Math.floor(investment.returnAmount),
                pile.x, PILES.PILE_Y - pile.visualHeight - 25, '#00E436', 1.5
            );
            this.renderer.flash('#00E436', 0.08);
            this.stats.bullResults++;
            this.stats.totalReturned += investment.returnAmount;
            this.particles.spawnInvestmentSparkle(pile.x, PILES.PILE_Y - pile.visualHeight - 10);
        } else if (investment.result === 'bear') {
            Audio.playBearResult();
            const lost = investment.investedAmount - investment.returnAmount;
            this.renderer.addFloatingText(
                'BEAR! -$' + Math.floor(lost),
                pile.x, PILES.PILE_Y - pile.visualHeight - 25, '#FF004D', 1.5
            );
            this.renderer.shake(2, 0.3);
            this.stats.totalReturned += investment.returnAmount;
        } else {
            Audio.playFlatResult();
            this.renderer.addFloatingText(
                'FLAT $' + Math.floor(investment.returnAmount) + ' back',
                pile.x, PILES.PILE_Y - pile.visualHeight - 25, '#C2C3C7', 1.2
            );
            this.stats.totalReturned += investment.returnAmount;
        }
    }

    onFirebreak(pileIndex) {
        const pile = this.piles[pileIndex];
        pile.applyFirebreak(FIREBREAK.DURATION);
        Audio.playFirebreak();
        this.particles.spawnFirebreak(pile.x, PILES.PILE_Y, PILES.PILE_WIDTH);
        this.renderer.addFloatingText('FIREBREAK', pile.x, PILES.PILE_Y - pile.visualHeight - 10, '#29ADFF');
    }

    onAshCollect(pileIndex, amount) {
        Audio.playAshCollect();
        this.stats.ashCollected++;
        // Add ash to nearest non-collapsed neighbor
        const neighbors = [pileIndex - 1, pileIndex + 1].filter(
            i => i >= 0 && i < this.piles.length && !this.piles[i].collapsed
        );
        if (neighbors.length > 0) {
            this.piles[neighbors[0]].addMoney(amount);
            this.renderer.addFloatingText('+$' + amount, this.piles[neighbors[0]].x, PILES.PILE_Y - 15, '#C2C3C7');
        }
    }

    onPileCollapse(pile) {
        this.stats.pilesCollapsed++;
        Audio.playCollapse();
        this.renderer.shake(3, 0.5);
        this.renderer.flash('#FF004D', 0.1);
        this.particles.spawnCollapse(pile.x, PILES.PILE_Y);

        this.events.addTickerMessage(`${pile.name} COLLAPSED!`, '#FF004D');

        // Apply spike to neighbors
        if (pile.index > 0 && !this.piles[pile.index - 1].collapsed) {
            this.piles[pile.index - 1].applyCollapseSpike();
        }
        if (pile.index < this.piles.length - 1 && !this.piles[pile.index + 1].collapsed) {
            this.piles[pile.index + 1].applyCollapseSpike();
        }
    }

    onWaveChange(wave) {
        Audio.playWaveTransition();
        this.player.addFirebreakToken();
    }

    onCrashWarning(safeIdx) {
        Audio.playCrashWarning();
    }

    onCrashStart(safeIdx) {
        this.renderer.shake(4, 0.8);
        this.renderer.flash('#FFF', 0.08);
    }

    onCrashEnd() {
        // Reset shovel amount if it was boosted
        if (!this.player.activeUpgrade || this.player.activeUpgrade !== 'BIG_SHOVEL') {
            this.player.shovelAmount = 150;
        }
    }

    onGameOver() {
        this.gameOver = true;
        this.running = false;
        Audio.stopFireAmbience();
        Audio.playGameOver();
    }

    getScore() {
        const remaining = this.piles.reduce((s, p) => s + p.amount, 0);
        const survivorBonus = this.piles.filter(p => !p.collapsed).length * SCORING.SURVIVOR_BONUS;
        const investorBonus = this.stats.bullResults * SCORING.INVESTOR_BONUS;
        const ashBonus = this.stats.ashCollected * SCORING.ASH_COLLECTOR;
        const noCollapseBonus = this.stats.pilesCollapsed === 0 ? SCORING.NO_COLLAPSE_BONUS : 0;

        return {
            remaining: Math.floor(remaining),
            survivorBonus,
            investorBonus,
            ashBonus,
            noCollapseBonus,
            total: Math.floor(remaining + survivorBonus + investorBonus + ashBonus + noCollapseBonus),
        };
    }

    getGrade() {
        const score = this.getScore();
        const ratio = score.remaining / this.stats.startingTotal;
        for (const g of SCORING.GRADES) {
            if (ratio >= g.threshold) return g;
        }
        return SCORING.GRADES[SCORING.GRADES.length - 1];
    }

    getState() {
        return {
            piles: this.piles,
            player: this.player,
            particles: this.particles,
            events: this.events,
            investmentManager: this.investmentManager,
            gameTime: this.gameTime,
        };
    }
}
