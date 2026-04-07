// ============================================================
// events.js - Wave system, market events, and ticker
// ============================================================

import { GAME, MARKET_CRASH, TICKER, WAVE_MULTIPLIERS } from './constants.js';

export class EventManager {
    constructor() {
        this.waveIndex = 0;
        this.waveTimer = GAME.WAVE_DURATION;
        this.gameTimer = GAME.DURATION;
        this.gameOver = false;

        // Market crash
        this.crashTriggered = false;
        this.crashActive = false;
        this.crashWarning = false;
        this.crashTimer = 0;
        this.crashWarningTimer = 0;
        this.safeHavenIndex = -1;
        this.crashScheduledWave = 2 + Math.floor(Math.random() * 2); // wave 3 or 4 (index 2 or 3)
        this.crashScheduledTime = 5 + Math.random() * 15; // seconds into that wave

        // Ticker
        this.tickerMessages = [];
        this.tickerX = 384; // start off screen right
        this.scheduledEvents = [];

        // Wave transition
        this.waveTransitionTimer = 0;
        this.showingWaveBanner = false;
    }

    update(dt, piles, callbacks) {
        if (this.gameOver) return;

        // Game timer
        this.gameTimer -= dt;
        if (this.gameTimer <= 0) {
            this.gameTimer = 0;
            this.gameOver = true;
            if (callbacks.onGameOver) callbacks.onGameOver();
            return;
        }

        // Wave transition banner
        if (this.showingWaveBanner) {
            this.waveTransitionTimer -= dt;
            if (this.waveTransitionTimer <= 0) {
                this.showingWaveBanner = false;
            }
        }

        // Wave timer
        this.waveTimer -= dt;
        if (this.waveTimer <= 0 && this.waveIndex < GAME.WAVE_COUNT - 1) {
            this.waveIndex++;
            this.waveTimer = GAME.WAVE_DURATION;
            this.showingWaveBanner = true;
            this.waveTransitionTimer = 1.0;

            // Schedule upcoming burn rate changes for ticker
            this.scheduleWaveEvents(piles);

            if (callbacks.onWaveChange) callbacks.onWaveChange(this.waveIndex);
        }

        // Market crash logic
        this.updateCrash(dt, piles, callbacks);

        // Ticker scroll
        this.updateTicker(dt);

        // Process scheduled events
        this.processScheduledEvents(dt, piles);
    }

    updateCrash(dt, piles, callbacks) {
        if (this.crashTriggered && !this.crashActive && !this.crashWarning) return;

        // Check if it's time to start crash warning
        if (!this.crashTriggered && this.waveIndex === this.crashScheduledWave) {
            this.crashScheduledTime -= dt;
            if (this.crashScheduledTime <= 0) {
                this.startCrashWarning(piles, callbacks);
            }
        }

        // Crash warning countdown
        if (this.crashWarning) {
            this.crashWarningTimer -= dt;
            if (this.crashWarningTimer <= 0) {
                this.startCrash(piles, callbacks);
            }
        }

        // Crash active
        if (this.crashActive) {
            this.crashTimer -= dt;
            if (this.crashTimer <= 0) {
                this.endCrash(piles, callbacks);
            }
        }
    }

    startCrashWarning(piles, callbacks) {
        this.crashWarning = true;
        this.crashWarningTimer = MARKET_CRASH.WARNING_DURATION;

        // Choose safe haven
        const validPiles = piles.filter(p => !p.collapsed);
        if (validPiles.length > 0) {
            this.safeHavenIndex = validPiles[Math.floor(Math.random() * validPiles.length)].index;
        }

        this.addTickerMessage('!!! MARKET CRASH INCOMING !!!', '#FF004D');

        if (callbacks.onCrashWarning) callbacks.onCrashWarning(this.safeHavenIndex);
    }

    startCrash(piles, callbacks) {
        this.crashWarning = false;
        this.crashActive = true;
        this.crashTriggered = true;
        this.crashTimer = MARKET_CRASH.CRASH_DURATION;

        this.addTickerMessage('MARKET CRASH! BURN RATES TRIPLED!', '#FF004D');

        if (callbacks.onCrashStart) callbacks.onCrashStart(this.safeHavenIndex);
    }

    endCrash(piles, callbacks) {
        this.crashActive = false;
        this.safeHavenIndex = -1;

        this.addTickerMessage('Market crash subsiding...', '#FFEC27');

        if (callbacks.onCrashEnd) callbacks.onCrashEnd();
    }

    scheduleWaveEvents(piles) {
        const waveMult = WAVE_MULTIPLIERS[this.waveIndex];
        const prevMult = WAVE_MULTIPLIERS[Math.max(0, this.waveIndex - 1)];
        const increase = Math.round((waveMult / prevMult - 1) * 100);

        this.addTickerMessage(`WAVE ${this.waveIndex + 1} - ALL RATES +${increase}%`, '#FFA300');

        // Add specific pile warnings
        for (const pile of piles) {
            if (pile.collapsed) continue;
            const newRate = pile.baseBurnRate * waveMult;
            if (newRate > 15) {
                this.addTickerMessage(`${pile.name.toUpperCase()} burning hot!`, '#FF004D');
            }
        }
    }

    addTickerMessage(text, color = '#FFEC27') {
        this.tickerMessages.push({
            text,
            color,
            x: 384, // start off right side
            width: text.length * 5, // approximate pixel width at small font
        });
    }

    // Add forecast message for upcoming change
    addForecastMessage(pileName, changeType) {
        const messages = {
            'rate_up': `${pileName} BURN RATE RISING`,
            'rate_down': `${pileName} cooling down`,
            'spike': `${pileName} BURN RATE DOUBLING`,
            'cool': `${pileName} entering cool period`,
        };
        this.addTickerMessage(messages[changeType] || `${pileName} changing`, '#FFEC27');
    }

    updateTicker(dt) {
        // Scroll all messages left
        for (let i = this.tickerMessages.length - 1; i >= 0; i--) {
            const msg = this.tickerMessages[i];
            msg.x -= TICKER.SPEED * dt;
            // Remove if scrolled completely off screen left
            if (msg.x + msg.width < -10) {
                this.tickerMessages.splice(i, 1);
            }
        }
    }

    processScheduledEvents(dt, piles) {
        for (let i = this.scheduledEvents.length - 1; i >= 0; i--) {
            this.scheduledEvents[i].timer -= dt;
            if (this.scheduledEvents[i].timer <= 0) {
                const event = this.scheduledEvents.splice(i, 1)[0];
                if (event.callback) event.callback();
            }
        }
    }

    scheduleEvent(delay, callback) {
        this.scheduledEvents.push({ timer: delay, callback });
    }

    getTimeFormatted() {
        const mins = Math.floor(this.gameTimer / 60);
        const secs = Math.floor(this.gameTimer % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getCrashMultiplier() {
        if (this.crashActive) return MARKET_CRASH.BURN_MULTIPLIER;
        return 1;
    }

    getShovelMultiplier() {
        if (this.crashActive) return MARKET_CRASH.SHOVEL_MULTIPLIER;
        return 1;
    }

    isSafeHaven(pileIndex) {
        return this.crashActive && pileIndex === this.safeHavenIndex;
    }

    getWaveProgress() {
        return 1 - (this.waveTimer / GAME.WAVE_DURATION);
    }
}
