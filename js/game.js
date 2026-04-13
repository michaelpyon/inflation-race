// ============================================================
// game.js - Core game state manager
// ============================================================

import { GAME, EMBER, COLLAPSE, FIREBREAK, PILES, MARKET_CRASH, SCORING, COLORS, PLAYER } from './constants.js';
import { Pile, createPiles } from './pile.js';
import { Player } from './player.js';
import { InvestmentManager } from './investment.js';
import { EventManager } from './events.js';
import { ParticleSystem } from './particles.js';
import * as Audio from './audio.js';

export class Game {
    constructor(renderer, era) {
        this.renderer = renderer;
        this.era = era || null;
        this.reset();
    }

    reset() {
        this.piles = createPiles();
        this.player = new Player(this.piles.length);
        this.player.x = this.player.getPileX(this.player.pileIndex, this.piles);
        this.investmentManager = new InvestmentManager();
        this.events = new EventManager(this.era);
        this.particles = new ParticleSystem();

        this.gameTime = 0;
        this.running = false;
        this.paused = false;
        this.gameOver = false;

        // Era-specific state
        this.eraBurnMultiplier = 1.0;
        this.eraSpeedMultiplier = 1.0;
        this.eraShovelMultiplier = 1.0;
        this.eraImmunePileIndex = -1;
        this.eraImmunityTimer = 0;
        this.eraLockShovels = false;
        this.eraLockTimer = 0;
        this.eraPermanentBurnBonus = 0;
        this.eraStimulusTimer = 0;
        this.eraIncomeDecayFactor = 1.0;
        this.eraEventsEncountered = [];
        this.eraCumulativeInflation = 0;

        // Apply era modifiers
        if (this.era) {
            this.eraBurnMultiplier = this.era.modifiers.burnMultiplier || 1.0;
            // Apply burn multiplier to all pile base burn rates
            for (const pile of this.piles) {
                pile.baseBurnRate *= this.eraBurnMultiplier;
            }
        }

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
            onEraEvent: (event) => this.applyEraEvent(event),
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
            } else if (this.eraImmunePileIndex === pile.index && this.eraImmunityTimer > 0) {
                // Era immunity - pile doesn't burn
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

        // Era-specific per-frame mechanics
        this.updateEraMechanics(dt);

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

        // Apply era shovel multiplier (income boost events)
        if (this.eraShovelMultiplier !== 1.0 && shovelMult <= 1) {
            this.player.shovelAmount = PLAYER.SHOVEL_AMOUNT * this.eraShovelMultiplier * this.eraIncomeDecayFactor;
        } else if (shovelMult <= 1) {
            this.player.shovelAmount = PLAYER.SHOVEL_AMOUNT * this.eraIncomeDecayFactor;
        }

        // Era speed multiplier
        this.player.speedMultiplier = this.eraSpeedMultiplier;

        // Era shovel lock
        this.player.shovelsLocked = this.eraLockShovels;

        this.player.update(dt, this.piles, this.gameTime, {
            onShovel: (from, to, amount, delivered, spillage) => {
                this.onShovel(from, to, amount, delivered, spillage);
            },
            onCombo: (count) => {
                this.renderer.addFloatingText('COMBO x' + count, this.player.x, PILES.PILE_Y - 30, COLORS.COMBO_TEXT);
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

    updateEraMechanics(dt) {
        if (!this.era) return;

        // Track cumulative inflation
        this.eraCumulativeInflation += Math.abs(this.era.modifiers.inflationRate) * dt;

        // Update era effect timers
        if (this.eraImmunityTimer > 0) {
            this.eraImmunityTimer -= dt;
            if (this.eraImmunityTimer <= 0) {
                this.eraImmunePileIndex = -1;
            }
        }

        if (this.eraLockTimer > 0) {
            this.eraLockTimer -= dt;
            if (this.eraLockTimer <= 0) {
                this.eraLockShovels = false;
            }
        }

        // Depression: decay income (shovel effectiveness) over time
        if (this.era.id === 'great_depression') {
            const decayRate = this.era.modifiers.incomeDecay || 0.5;
            // Gradual decay: lose effectiveness over 2 minutes
            this.eraIncomeDecayFactor = Math.max(0.3, 1.0 - (this.gameTime / 120) * (1 - decayRate));
        }

        // Stagflation: decay movement speed over time
        if (this.era.id === 'stagflation') {
            const speedDecay = this.era.modifiers.speedDecay || 0.01;
            this.eraSpeedMultiplier = Math.max(0.4, 1.0 - this.gameTime * speedDecay);
        }

        // Helicopter Money: spawn stimulus drops periodically
        if (this.era.id === 'helicopter_money') {
            const stimRate = this.era.modifiers.stimulusRate || 0.5;
            this.eraStimulusTimer += dt;
            // Drop stimulus every ~8 seconds (stimulusRate controls frequency)
            if (this.eraStimulusTimer >= (8 / stimRate)) {
                this.eraStimulusTimer = 0;
                // Add small stimulus to a random active pile
                const activePiles = this.piles.filter(p => !p.collapsed && p.amount > 0);
                if (activePiles.length > 0) {
                    const target = activePiles[Math.floor(Math.random() * activePiles.length)];
                    const amount = 30 + Math.random() * 50;
                    target.addMoney(amount);
                    this.renderer.addFloatingText('+$' + Math.floor(amount), target.x, PILES.PILE_Y - target.visualHeight - 15, this.era.colors.ACCENT || COLORS.MONEY_GREEN);
                    this.events.addTickerMessage('STIMULUS CHECK DEPOSITED', this.era.colors.ACCENT || COLORS.MONEY_GREEN);
                }
            }
        }

        // Apply permanent burn bonus from era events
        if (this.eraPermanentBurnBonus > 0) {
            for (const pile of this.piles) {
                if (!pile.collapsed) {
                    pile.amount -= pile.baseBurnRate * this.eraPermanentBurnBonus * dt;
                    if (pile.amount <= 0 && !pile.collapsed) {
                        pile.amount = 0;
                    }
                }
            }
        }
    }

    // Apply an era event effect
    applyEraEvent(event) {
        this.eraEventsEncountered.push(event);
        this.events.addTickerMessage(event.name + ': ' + event.text, this.era ? this.era.colors.ACCENT : COLORS.TICKER_TEXT);

        switch (event.effect) {
            case 'pileShrink': {
                // Remove % from all piles
                for (const pile of this.piles) {
                    if (!pile.collapsed) {
                        const loss = pile.amount * event.value;
                        pile.amount -= loss;
                        this.stats.totalBurned += loss;
                    }
                }
                this.renderer.shake(3, 0.5);
                this.renderer.flash(COLORS.FIRE_HIGH, 0.1);
                break;
            }
            case 'burnSpike': {
                // Temporarily boost all burn rates
                const duration = event.duration / 1000;
                for (const pile of this.piles) {
                    if (!pile.collapsed) {
                        pile.baseBurnRate *= event.value;
                    }
                }
                // Schedule revert
                this.events.scheduleEvent(duration, () => {
                    for (const pile of this.piles) {
                        if (!pile.collapsed) {
                            pile.baseBurnRate /= event.value;
                        }
                    }
                });
                break;
            }
            case 'incomeBoost': {
                // Boost shovel amount temporarily
                const duration = event.duration / 1000;
                this.eraShovelMultiplier = event.value;
                this.events.scheduleEvent(duration, () => {
                    this.eraShovelMultiplier = 1.0;
                });
                break;
            }
            case 'immunity': {
                // Make current pile immune to burn
                const duration = event.duration / 1000;
                this.eraImmunePileIndex = this.player.pileIndex;
                this.eraImmunityTimer = duration;
                break;
            }
            case 'speedHalf': {
                // Halve movement speed temporarily
                const duration = event.duration / 1000;
                const savedSpeed = this.eraSpeedMultiplier;
                this.eraSpeedMultiplier *= event.value;
                this.events.scheduleEvent(duration, () => {
                    this.eraSpeedMultiplier = savedSpeed;
                });
                break;
            }
            case 'speedBoost': {
                // Double movement speed temporarily
                const duration = event.duration / 1000;
                const savedSpeed = this.eraSpeedMultiplier;
                this.eraSpeedMultiplier *= event.value;
                this.events.scheduleEvent(duration, () => {
                    this.eraSpeedMultiplier = savedSpeed;
                });
                break;
            }
            case 'cashRain': {
                // Add cash to all piles
                for (const pile of this.piles) {
                    if (!pile.collapsed) {
                        pile.addMoney(event.value);
                        this.renderer.addFloatingText('+$' + event.value, pile.x, PILES.PILE_Y - pile.visualHeight - 10, COLORS.MONEY_GREEN);
                    }
                }
                break;
            }
            case 'permanentBurn': {
                // Permanently increase burn rate
                this.eraPermanentBurnBonus += event.value;
                break;
            }
            case 'stimulus': {
                // Big one-time cash injection to all piles, but burn rates spike
                const perPile = event.value / Math.max(1, this.piles.filter(p => !p.collapsed).length);
                for (const pile of this.piles) {
                    if (!pile.collapsed) {
                        pile.addMoney(perPile);
                        this.renderer.addFloatingText('+$' + Math.floor(perPile), pile.x, PILES.PILE_Y - pile.visualHeight - 10, COLORS.MONEY_GREEN);
                    }
                }
                this.renderer.flash(COLORS.MONEY_GREEN, 0.08);
                break;
            }
            case 'lockItems': {
                // Prevent shoveling for duration
                const duration = event.duration / 1000;
                this.eraLockShovels = true;
                this.eraLockTimer = duration;
                break;
            }
            case 'investmentHalf': {
                // All piles lose value
                for (const pile of this.piles) {
                    if (!pile.collapsed) {
                        const loss = pile.amount * event.value;
                        pile.amount -= loss;
                        this.stats.totalBurned += loss;
                    }
                }
                this.renderer.shake(4, 0.6);
                this.renderer.flash(COLORS.FIRE_HIGH, 0.1);
                break;
            }
            case 'memeStock': {
                // Pick a random pile: 50% chance of 10x, 50% chance of losing it all
                const activePiles = this.piles.filter(p => !p.collapsed && p.amount > 100);
                if (activePiles.length > 0) {
                    const target = activePiles[Math.floor(Math.random() * activePiles.length)];
                    if (Math.random() < 0.5) {
                        // Moon
                        const gain = target.amount * (event.value - 1);
                        target.addMoney(gain);
                        this.renderer.addFloatingText('TO THE MOON!', target.x, PILES.PILE_Y - target.visualHeight - 20, COLORS.MONEY_GREEN, 1.5);
                        this.renderer.flash(COLORS.MONEY_GREEN, 0.08);
                    } else {
                        // Rug pull
                        const loss = target.amount * 0.8;
                        target.amount -= loss;
                        this.stats.totalBurned += loss;
                        this.renderer.addFloatingText('RUG PULLED!', target.x, PILES.PILE_Y - target.visualHeight - 20, COLORS.FIRE_HIGH, 1.5);
                        this.renderer.shake(3, 0.4);
                    }
                }
                break;
            }
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
        this.renderer.addFloatingText('+$' + Math.floor(delivered), toPile.x, PILES.PILE_Y - toPile.visualHeight - 10, COLORS.MONEY_GREEN);
        if (spillage > 1) {
            this.renderer.addFloatingText('-$' + Math.floor(spillage), (fromPile.x + toPile.x) / 2, PILES.PILE_Y - 20, COLORS.FIRE_HIGH, 0.5);
        }
    }

    onInvest(pileIndex) {
        const invested = this.investmentManager.investInPile(pileIndex, this.piles);
        if (invested) {
            this.stats.totalInvested += invested;
            Audio.playMoneyLand();
            this.renderer.addFloatingText('-$' + Math.floor(invested), this.piles[pileIndex].x, PILES.PILE_Y - 25, COLORS.INVESTMENT_GOLD);
        }
    }

    onInvestmentResolved(investment) {
        const pile = this.piles[investment.pileIndex];

        if (investment.result === 'bull') {
            Audio.playBullResult();
            // Big dramatic result
            this.renderer.addFloatingText(
                'BULL! +$' + Math.floor(investment.returnAmount),
                pile.x, PILES.PILE_Y - pile.visualHeight - 25, COLORS.MONEY_GREEN, 1.5
            );
            this.renderer.flash(COLORS.MONEY_GREEN, 0.08);
            this.stats.bullResults++;
            this.stats.totalReturned += investment.returnAmount;
            this.particles.spawnInvestmentSparkle(pile.x, PILES.PILE_Y - pile.visualHeight - 10);
        } else if (investment.result === 'bear') {
            Audio.playBearResult();
            const lost = investment.investedAmount - investment.returnAmount;
            this.renderer.addFloatingText(
                'BEAR! -$' + Math.floor(lost),
                pile.x, PILES.PILE_Y - pile.visualHeight - 25, COLORS.FIRE_HIGH, 1.5
            );
            this.renderer.shake(2, 0.3);
            this.stats.totalReturned += investment.returnAmount;
        } else {
            Audio.playFlatResult();
            this.renderer.addFloatingText(
                'FLAT $' + Math.floor(investment.returnAmount) + ' back',
                pile.x, PILES.PILE_Y - pile.visualHeight - 25, COLORS.ASH_GRAY, 1.2
            );
            this.stats.totalReturned += investment.returnAmount;
        }
    }

    onFirebreak(pileIndex) {
        const pile = this.piles[pileIndex];
        pile.applyFirebreak(FIREBREAK.DURATION);
        Audio.playFirebreak();
        this.particles.spawnFirebreak(pile.x, PILES.PILE_Y, PILES.PILE_WIDTH);
        this.renderer.addFloatingText('FIREBREAK', pile.x, PILES.PILE_Y - pile.visualHeight - 10, COLORS.FIREBREAK_BLUE);
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
            this.renderer.addFloatingText('+$' + amount, this.piles[neighbors[0]].x, PILES.PILE_Y - 15, COLORS.ASH_GRAY);
        }
    }

    onPileCollapse(pile) {
        this.stats.pilesCollapsed++;
        Audio.playCollapse();
        this.renderer.shake(3, 0.5);
        this.renderer.flash(COLORS.FIRE_HIGH, 0.1);
        this.particles.spawnCollapse(pile.x, PILES.PILE_Y);

        this.events.addTickerMessage(`${pile.name} COLLAPSED!`, COLORS.FIRE_HIGH);

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
        this.renderer.flash(COLORS.FLASH_WHITE, 0.08);
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

        // Purchasing power: cash remaining / (1 + cumulative inflation)
        const purchasingPower = remaining / (1 + this.eraCumulativeInflation);

        return {
            remaining: Math.floor(remaining),
            survivorBonus,
            investorBonus,
            ashBonus,
            noCollapseBonus,
            total: Math.floor(remaining + survivorBonus + investorBonus + ashBonus + noCollapseBonus),
            purchasingPower: Math.floor(purchasingPower),
            timeSurvived: this.gameTime,
            eventsEncountered: this.eraEventsEncountered,
            eraId: this.era ? this.era.id : null,
            eraName: this.era ? this.era.name : null,
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
            era: this.era,
            eraLockShovels: this.eraLockShovels,
            eraLockTimer: this.eraLockTimer,
            eraImmunePileIndex: this.eraImmunePileIndex,
            eraImmunityTimer: this.eraImmunityTimer,
        };
    }
}
