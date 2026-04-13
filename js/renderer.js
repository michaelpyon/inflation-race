// ============================================================
// renderer.js - Canvas rendering pipeline
// ============================================================

import { CANVAS, COLORS, PILES, PLAYER, TICKER, FIREBREAK, SCREEN_SHAKE, GAME } from './constants.js';

export class Renderer {
    constructor(canvas) {
        this.displayCanvas = canvas;
        this.displayCtx = canvas.getContext('2d');

        // Offscreen canvas at native resolution
        this.offscreen = document.createElement('canvas');
        this.offscreen.width = CANVAS.WIDTH;
        this.offscreen.height = CANVAS.HEIGHT;
        this.ctx = this.offscreen.getContext('2d');

        // Set display canvas size
        this.displayCanvas.width = CANVAS.WIDTH * CANVAS.SCALE;
        this.displayCanvas.height = CANVAS.HEIGHT * CANVAS.SCALE;
        this.displayCtx.imageSmoothingEnabled = false;

        // Screen shake
        this.shakeIntensity = 0;
        this.shakeTimer = 0;
        this.shakeX = 0;
        this.shakeY = 0;

        // Flash
        this.flashTimer = 0;
        this.flashColor = COLORS.FLASH_WHITE;

        // Floating texts
        this.floatingTexts = [];

        // Slow motion
        this.slowMo = false;
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    flash(color = COLORS.FLASH_WHITE, duration = 0.05) {
        this.flashColor = color;
        this.flashTimer = duration;
    }

    addFloatingText(text, x, y, color = COLORS.UI_TEXT, duration = 0.8) {
        this.floatingTexts.push({
            text, x, y, color, timer: duration, maxTimer: duration,
        });
    }

    updateEffects(dt) {
        // Screen shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        // Flash
        if (this.flashTimer > 0) this.flashTimer -= dt;

        // Floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.timer -= dt;
            ft.y -= 20 * dt; // float upward
            if (ft.timer <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    render(gameState) {
        const ctx = this.ctx;

        // Clear - use era BG color if available
        const bgColor = (gameState && gameState.era && gameState.era.colors)
            ? gameState.era.colors.BG
            : COLORS.BG;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

        if (!gameState) {
            this.present();
            return;
        }

        const { piles, player, particles, events, investmentManager } = gameState;

        // Draw ticker background
        this.drawTickerBg(ctx);

        // Draw HUD background bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, TICKER.HEIGHT + 2, CANVAS.WIDTH, 12);

        // Draw pile platforms
        this.drawPilePlatforms(ctx, piles, events);

        // Draw current pile highlight
        this.drawCurrentPileHighlight(ctx, player, piles);

        // Draw piles
        for (const pile of piles) {
            this.drawPile(ctx, pile, events, gameState.gameTime);
        }

        // Draw particles (behind character)
        if (particles) {
            particles.draw(ctx);
        }

        // Draw player character
        this.drawPlayer(ctx, player, piles);

        // Draw investment windows
        if (investmentManager && investmentManager.activeInvestment) {
            const isFirst = investmentManager.resolvedInvestments.length === 0;
            this.drawInvestment(ctx, investmentManager.activeInvestment, piles, isFirst);
        }

        // Draw burn rate indicators
        for (const pile of piles) {
            this.drawBurnIndicator(ctx, pile);
        }

        // Draw pile labels and amounts
        for (const pile of piles) {
            this.drawPileInfo(ctx, pile);
        }

        // Draw ticker messages
        this.drawTicker(ctx, events);

        // Draw HUD
        this.drawHUD(ctx, gameState);

        // Draw floating texts
        this.drawFloatingTexts(ctx);

        // Draw wave banner
        if (events.showingWaveBanner) {
            this.drawWaveBanner(ctx, events.waveIndex);
        }

        // Draw crash effects
        if (events.crashWarning) {
            this.drawCrashWarning(ctx, events);
        }
        if (events.crashActive) {
            this.drawCrashBorder(ctx);
        }

        // Draw era event banner
        if (events.activeEraEvent && events.eraEventBannerTimer > 0) {
            this.drawEraEventBanner(ctx, events.activeEraEvent, gameState.era, events.eraEventBannerTimer);
        }

        // Draw era-specific status indicators
        if (gameState.eraLockShovels && gameState.eraLockTimer > 0) {
            this.drawEraLockIndicator(ctx, gameState.eraLockTimer);
        }
        if (gameState.eraImmunePileIndex >= 0 && gameState.eraImmunityTimer > 0) {
            this.drawEraImmunityIndicator(ctx, piles, gameState.eraImmunePileIndex, gameState.eraImmunityTimer);
        }

        // Draw flash
        if (this.flashTimer > 0) {
            ctx.globalAlpha = this.flashTimer * 10;
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
            ctx.globalAlpha = 1;
        }

        this.present();
    }

    drawEraEventBanner(ctx, event, era, timer) {
        const alpha = Math.min(1, timer);
        ctx.globalAlpha = alpha;

        // Background bar
        const bannerY = CANVAS.HEIGHT / 2 - 12;
        const accentColor = era && era.colors ? era.colors.ACCENT : COLORS.WAVE_BANNER;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, bannerY - 2, CANVAS.WIDTH, 24);

        // Accent line top + bottom
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, bannerY - 2, CANVAS.WIDTH, 1);
        ctx.fillRect(0, bannerY + 22, CANVAS.WIDTH, 1);

        // Event name
        this.drawText(ctx, event.name, CANVAS.WIDTH / 2, bannerY + 2, accentColor, 'center', 2);

        // Event flavor text
        const flavorText = event.text || event.flavor || '';
        this.drawText(ctx, flavorText, CANVAS.WIDTH / 2, bannerY + 14, COLORS.UI_TEXT, 'center', 1);

        ctx.globalAlpha = 1;
    }

    drawEraLockIndicator(ctx, timer) {
        const flashOn = Math.floor(Date.now() / 300) % 2 === 0;
        if (flashOn) {
            this.drawText(ctx, 'SHOVELS LOCKED ' + Math.ceil(timer) + 's', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 20, COLORS.FIRE_HIGH, 'center', 1);
        }
    }

    drawEraImmunityIndicator(ctx, piles, pileIndex, timer) {
        const pile = piles[pileIndex];
        if (!pile || pile.collapsed) return;
        // Gold glow around immune pile
        ctx.fillStyle = COLORS.INVESTMENT_GOLD;
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 150) * 0.2;
        ctx.fillRect(pile.x - PILES.PILE_WIDTH / 2 - 3, PILES.PILE_Y - pile.visualHeight - 3, PILES.PILE_WIDTH + 6, pile.visualHeight + 6);
        ctx.globalAlpha = 1;
        this.drawText(ctx, 'IMMUNE ' + Math.ceil(timer) + 's', pile.x, PILES.PILE_Y - pile.visualHeight - 12, COLORS.INVESTMENT_GOLD, 'center', 1);
    }

    present() {
        this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
        this.displayCtx.drawImage(
            this.offscreen,
            Math.floor(this.shakeX) * CANVAS.SCALE,
            Math.floor(this.shakeY) * CANVAS.SCALE,
            this.displayCanvas.width,
            this.displayCanvas.height
        );
    }

    drawTickerBg(ctx) {
        ctx.fillStyle = COLORS.TICKER_BG;
        ctx.fillRect(0, 0, CANVAS.WIDTH, TICKER.HEIGHT + 1);
    }

    drawTicker(ctx, events) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, CANVAS.WIDTH, TICKER.HEIGHT + 1);
        ctx.clip();

        for (const msg of events.tickerMessages) {
            this.drawText(ctx, msg.text, Math.floor(msg.x), TICKER.Y, msg.color, 'left', 1);
        }

        ctx.restore();
    }

    drawCurrentPileHighlight(ctx, player, piles) {
        if (player.moving) return;
        const pile = piles[player.pileIndex];
        if (!pile) return;
        const x = pile.x;
        const w = PILES.PILE_WIDTH + 8;

        // Subtle glow behind current pile
        ctx.fillStyle = COLORS.UI_TEXT;
        ctx.globalAlpha = 0.06;
        ctx.fillRect(x - w / 2, PILES.PILE_Y - 90, w, 92);
        ctx.globalAlpha = 1;

        // Small arrow below platform
        const arrowY = PILES.PILE_Y + 18;
        ctx.fillStyle = COLORS.UI_TEXT;
        ctx.fillRect(x - 2, arrowY, 4, 2);
        ctx.fillRect(x - 1, arrowY - 1, 2, 1);
    }

    drawPilePlatforms(ctx, piles, events) {
        for (const pile of piles) {
            // Platform
            ctx.fillStyle = COLORS.PILE_BASE;
            ctx.fillRect(pile.x - PILES.PILE_WIDTH / 2 - 2, PILES.PILE_Y, PILES.PILE_WIDTH + 4, 3);

            // Safe haven glow
            if (events.isSafeHaven(pile.index)) {
                ctx.fillStyle = COLORS.SAFE_HAVEN;
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 150) * 0.2;
                ctx.fillRect(pile.x - PILES.PILE_WIDTH / 2 - 4, PILES.PILE_Y - 2, PILES.PILE_WIDTH + 8, 7);
                ctx.globalAlpha = 1;
            }
        }
    }

    drawPile(ctx, pile, events, gameTime) {
        if (pile.collapsed) {
            // Draw ash pile if present
            if (pile.hasAsh) {
                const pulse = Math.sin(gameTime * 8) * 0.3 + 0.7;
                ctx.globalAlpha = pulse;
                ctx.fillStyle = COLORS.ASH_GRAY;
                ctx.fillRect(pile.x - 6, PILES.PILE_Y - 4, 12, 4);
                ctx.globalAlpha = 1;

                // "ASH" label
                this.drawText(ctx, '$' + Math.floor(pile.ashAmount), pile.x, PILES.PILE_Y - 8, COLORS.ASH_GRAY, 'center', 1);
            }
            return;
        }

        const h = Math.max(2, Math.floor(pile.visualHeight));
        const w = PILES.PILE_WIDTH;
        const x = pile.x - w / 2;
        const y = PILES.PILE_Y - h;

        // Squash/stretch
        const squashScale = 1 + pile.squash * 0.02;
        const drawW = w * (1 / squashScale);
        const drawH = h * squashScale;
        const drawX = pile.x - drawW / 2;
        const drawY = PILES.PILE_Y - drawH;

        // Danger pulse
        if (pile.isCritical()) {
            const pulse = Math.sin(gameTime * 25) > 0;
            if (pulse) {
                ctx.fillStyle = COLORS.FIRE_HIGH;
                ctx.fillRect(drawX - 1, drawY - 1, drawW + 2, drawH + 2);
            }
        } else if (pile.isDanger()) {
            const pulse = Math.sin(gameTime * 12) > 0;
            if (pulse) {
                ctx.fillStyle = COLORS.FIRE_HIGH;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(drawX - 1, drawY - 1, drawW + 2, drawH + 2);
                ctx.globalAlpha = 1;
            }
        }

        // Firebreak visual - ice effect
        if (pile.firebroken) {
            // Solid blue border
            ctx.fillStyle = COLORS.FIREBREAK_BLUE;
            ctx.fillRect(drawX - 2, drawY - 2, drawW + 4, 2);        // top
            ctx.fillRect(drawX - 2, PILES.PILE_Y, drawW + 4, 2);     // bottom
            ctx.fillRect(drawX - 2, drawY, 2, drawH + 2);            // left
            ctx.fillRect(drawX + drawW, drawY, 2, drawH + 2);        // right

            // Ice tint overlay
            ctx.globalAlpha = 0.15;
            ctx.fillRect(drawX, drawY, drawW, drawH);
            ctx.globalAlpha = 1;

            // "FROZEN" label above pile
            const frozenTimer = Math.ceil(pile.firebreakTimer);
            this.drawText(ctx, 'FROZEN ' + frozenTimer + 's', pile.x, drawY - 6, COLORS.FIREBREAK_BLUE, 'center', 1);
        }

        // Burn rate colored border (left and right edges)
        if (!pile.firebroken) {
            const borderColor = pile.getBurnColor();
            ctx.fillStyle = borderColor;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(drawX - 1, drawY, 2, drawH);   // left edge
            ctx.fillRect(drawX + drawW - 1, drawY, 2, drawH); // right edge
            ctx.globalAlpha = 1;
        }

        // Money pile (stack of bills)
        const billCount = Math.max(1, Math.floor(drawH / 3));
        for (let i = 0; i < billCount; i++) {
            const billY = PILES.PILE_Y - (i + 1) * 3;
            const shade = i % 2 === 0 ? COLORS.MONEY_GREEN : COLORS.MONEY_DARK;
            ctx.fillStyle = pile.firebroken ? COLORS.FIREBREAK_BLUE : shade;
            ctx.fillRect(drawX + 1, billY, drawW - 2, 3);
        }
    }

    drawBurnIndicator(ctx, pile) {
        if (pile.collapsed) return;

        const barWidth = PILES.PILE_WIDTH + 4;
        const barHeight = 4;
        const x = pile.x - barWidth / 2;
        const y = PILES.PILE_Y + 25;
        const color = pile.getBurnColor();

        // Background
        ctx.fillStyle = COLORS.UI_BG;
        ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

        // Fill based on burn rate
        const fill = Math.min(1, pile.effectiveBurnRate / 30);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, Math.ceil(barWidth * fill), barHeight);

        // Numeric burn rate
        const rateStr = Math.floor(pile.effectiveBurnRate) + '$/s';
        this.drawText(ctx, rateStr, pile.x, y + barHeight + 2, color, 'center', 1);

        // Trend arrow (larger, more visible)
        const trend = pile.getBurnTrend(Date.now() / 1000);
        const arrowX = x + barWidth + 3;
        const arrowY = y;
        if (trend === 'up') {
            ctx.fillStyle = COLORS.FIRE_HIGH;
            // Up arrow
            ctx.fillRect(arrowX + 1, arrowY, 1, 1);
            ctx.fillRect(arrowX, arrowY + 1, 3, 1);
            ctx.fillRect(arrowX + 1, arrowY + 2, 1, 2);
        } else if (trend === 'down') {
            ctx.fillStyle = COLORS.BURN_GREEN;
            // Down arrow
            ctx.fillRect(arrowX + 1, arrowY, 1, 2);
            ctx.fillRect(arrowX, arrowY + 2, 3, 1);
            ctx.fillRect(arrowX + 1, arrowY + 3, 1, 1);
        }
    }

    drawPileInfo(ctx, pile) {
        if (pile.collapsed && !pile.hasAsh) {
            // Gravestone
            ctx.fillStyle = COLORS.ASH_GRAY;
            ctx.fillRect(pile.x - 3, PILES.PILE_Y - 10, 6, 10);
            ctx.fillRect(pile.x - 5, PILES.PILE_Y - 8, 10, 2);
            return;
        }
        if (pile.collapsed) return;

        // Name (below platform)
        this.drawText(ctx, pile.name, pile.x, PILES.PILE_Y + 11, COLORS.ASH_GRAY, 'center', 1);

        // Amount (below name)
        const amountStr = '$' + Math.floor(pile.amount).toLocaleString();
        this.drawText(ctx, amountStr, pile.x, PILES.PILE_Y + 18, COLORS.UI_TEXT, 'center', 1);
    }

    drawPlayer(ctx, player, piles) {
        const x = Math.floor(player.x);
        const y = PILES.PILE_Y - 2;
        const facing = player.facing;

        // Body
        ctx.fillStyle = COLORS.CHARACTER;
        ctx.fillRect(x - 3, y - 12, 6, 8);

        // Head
        ctx.fillRect(x - 2, y - 16, 4, 4);

        // Hard hat
        ctx.fillStyle = COLORS.CHARACTER_HAT;
        ctx.fillRect(x - 3, y - 17, 6, 2);

        // Legs
        ctx.fillStyle = COLORS.CHARACTER;
        const walkFrame = Math.floor(player.animTimer * 8) % 4;
        if (player.state === 'walk') {
            const legOffset = walkFrame < 2 ? 1 : -1;
            ctx.fillRect(x - 2, y - 4, 2, 4);
            ctx.fillRect(x + legOffset, y - 4, 2, 4);
        } else {
            ctx.fillRect(x - 2, y - 4, 2, 4);
            ctx.fillRect(x + 1, y - 4, 2, 4);
        }

        // Shovel
        ctx.fillStyle = COLORS.CHARACTER_SHOVEL;
        if (player.state === 'shovel_left') {
            ctx.fillRect(x - 8, y - 14, 6, 2);
            ctx.fillRect(x - 9, y - 13, 2, 4);
        } else if (player.state === 'shovel_right') {
            ctx.fillRect(x + 3, y - 14, 6, 2);
            ctx.fillRect(x + 8, y - 13, 2, 4);
        } else {
            // Held at side
            const sx = facing > 0 ? x + 4 : x - 6;
            ctx.fillRect(sx, y - 14, 2, 10);
            ctx.fillRect(sx - 1, y - 5, 4, 2);
        }

        // Firebreak token indicators
        for (let i = 0; i < player.firebreakTokens; i++) {
            ctx.fillStyle = COLORS.FIREBREAK_BLUE;
            ctx.fillRect(x - 4 + i * 4, y - 20, 3, 3);
        }

        // Active upgrade indicator
        if (player.activeUpgrade) {
            ctx.fillStyle = COLORS.INVESTMENT_GOLD;
            ctx.fillRect(x - 1, y - 21, 2, 2);
        }
    }

    drawInvestment(ctx, investment, piles, isFirstInvestment) {
        const pile = piles[investment.pileIndex];
        if (!pile) return;

        const x = pile.x;
        const baseY = PILES.PILE_Y - pile.visualHeight - 24;
        const bobY = baseY + Math.sin(investment.bounceTimer * 4) * 2;
        const color = investment.isPlatinum ? COLORS.PLATINUM : COLORS.INVESTMENT_GOLD;
        const secs = Math.ceil(investment.timeRemaining);

        // Background panel for readability
        const panelW = 44;
        const panelH = investment.investedAmount > 0 ? 32 : 38;
        const panelX = x - panelW / 2;
        const panelY = bobY - 22;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.fillStyle = color;
        ctx.fillRect(panelX, panelY, panelW, 1); // top border
        ctx.fillRect(panelX, panelY + panelH - 1, panelW, 1); // bottom border

        // Countdown bar across top
        const progress = investment.getProgress();
        ctx.fillStyle = COLORS.UI_DIM;
        ctx.fillRect(panelX + 1, panelY + 1, panelW - 2, 2);
        ctx.fillStyle = secs <= 2 ? COLORS.FIRE_HIGH : color;
        ctx.fillRect(panelX + 1, panelY + 1, Math.floor((panelW - 2) * (1 - progress)), 2);

        // Title + timer
        const label = investment.isPlatinum ? 'PLATINUM' : 'INVEST';
        this.drawText(ctx, label + ' ' + secs + 's', x, panelY + 6, color, 'center', 1);

        if (investment.investedAmount > 0) {
            // Show what's been invested and potential outcomes
            this.drawText(ctx, 'Bet: $' + Math.floor(investment.investedAmount), x, panelY + 13, COLORS.INVESTMENT_GOLD, 'center', 1);

            // Forecast icon inline
            if (investment.forecastShown) {
                let forecastLabel, forecastColor;
                if (investment.forecastType === 'sun') {
                    forecastLabel = 'SUNNY';
                    forecastColor = COLORS.FIRE_LOW;
                } else if (investment.forecastType === 'cloud') {
                    forecastLabel = 'CLOUDY';
                    forecastColor = COLORS.ASH_GRAY;
                } else {
                    forecastLabel = 'STORMY';
                    forecastColor = COLORS.FIRE_HIGH;
                }
                const flash = Math.sin(Date.now() / 150) > 0;
                if (flash) {
                    this.drawText(ctx, forecastLabel, x, panelY + 20, forecastColor, 'center', 1);
                }
            } else {
                // Show potential return
                const bullReturn = Math.floor(investment.investedAmount * (investment.isPlatinum ? 5 : 2));
                this.drawText(ctx, 'Win: $' + bullReturn, x, panelY + 20, COLORS.MONEY_GREEN, 'center', 1);
            }

            // Flash "Press W for more"
            const flash = Math.sin(Date.now() / 250) > 0;
            if (flash) {
                this.drawText(ctx, 'W = +$200', x, panelY + 27, color, 'center', 1);
            }
        } else {
            // Not yet invested - explain clearly
            if (investment.isPlatinum) {
                this.drawText(ctx, 'Risk $200', x, panelY + 13, COLORS.ASH_GRAY, 'center', 1);
                this.drawText(ctx, 'Win: 5x', x, panelY + 20, COLORS.MONEY_GREEN, 'center', 1);
                this.drawText(ctx, 'Lose: all', x, panelY + 26, COLORS.FIRE_HIGH, 'center', 1);
            } else {
                this.drawText(ctx, 'Risk $200', x, panelY + 13, COLORS.ASH_GRAY, 'center', 1);
                this.drawText(ctx, 'Win: 2x', x, panelY + 20, COLORS.MONEY_GREEN, 'center', 1);
                this.drawText(ctx, 'Lose: half', x, panelY + 26, COLORS.FIRE_HIGH, 'center', 1);
            }

            // Press W prompt
            const flash = Math.sin(Date.now() / 200) > 0;
            if (flash) {
                this.drawText(ctx, 'Press W', x, panelY + 33, COLORS.INVESTMENT_GLOW, 'center', 1);
            }
        }

        // First-time tutorial callout (centered on screen, above everything)
        if (isFirstInvestment && investment.investedAmount === 0) {
            const tutY = 30;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(CANVAS.WIDTH / 2 - 90, tutY - 2, 180, 18);
            ctx.fillStyle = COLORS.INVESTMENT_GLOW;
            ctx.fillRect(CANVAS.WIDTH / 2 - 90, tutY - 2, 180, 1);
            this.drawText(ctx, 'INVESTMENT appeared! Go to it', CANVAS.WIDTH / 2, tutY + 2, COLORS.INVESTMENT_GLOW, 'center', 1);
            this.drawText(ctx, 'and press W to gamble $200', CANVAS.WIDTH / 2, tutY + 9, COLORS.ASH_GRAY, 'center', 1);
        }
    }

    drawHUD(ctx, gameState) {
        const { events, player, piles } = gameState;
        const hudY = TICKER.HEIGHT + 3;

        // Wave
        this.drawText(ctx, `WAVE ${events.waveIndex + 1}/${GAME.WAVE_COUNT}`, 4, hudY, COLORS.UI_TEXT, 'left', 1);

        // Total money
        const total = piles.reduce((sum, p) => sum + p.amount, 0);
        const totalStr = '$' + Math.floor(total).toLocaleString();
        this.drawText(ctx, totalStr, CANVAS.WIDTH / 2, hudY, COLORS.MONEY_GREEN, 'center', 1);

        // Timer
        this.drawText(ctx, events.getTimeFormatted(), CANVAS.WIDTH - 40, hudY, COLORS.UI_TEXT, 'left', 1);

        // Firebreak tokens with label
        this.drawText(ctx, 'FB', CANVAS.WIDTH - 20, hudY, COLORS.FIREBREAK_BLUE, 'right', 1);
        const tokenX = CANVAS.WIDTH - 16;
        for (let i = 0; i < FIREBREAK.MAX_TOKENS; i++) {
            ctx.fillStyle = i < player.firebreakTokens ? COLORS.FIREBREAK_BLUE : COLORS.UI_DIM;
            ctx.fillRect(tokenX + i * 6, hudY, 4, 5);
        }

        // Active upgrade timer
        if (player.activeUpgrade) {
            const barWidth = 30;
            const upgradeY = hudY + 7;
            ctx.fillStyle = COLORS.UI_BG;
            ctx.fillRect(CANVAS.WIDTH / 2 - barWidth / 2, upgradeY, barWidth, 2);
            const fill = player.upgradeTimer / 15; // approximate
            ctx.fillStyle = COLORS.INVESTMENT_GOLD;
            ctx.fillRect(CANVAS.WIDTH / 2 - barWidth / 2, upgradeY, Math.floor(barWidth * fill), 2);
        }

        // Crash warning indicator
        if (events.crashWarning) {
            const flashOn = Math.floor(Date.now() / 200) % 2 === 0;
            if (flashOn) {
                this.drawText(ctx, 'CRASH WARNING', CANVAS.WIDTH / 2, hudY + 8, COLORS.FIRE_HIGH, 'center', 1);
            }
        }
    }

    drawWaveBanner(ctx, waveIndex) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, CANVAS.HEIGHT / 2 - 15, CANVAS.WIDTH, 30);

        ctx.fillStyle = COLORS.WAVE_BANNER;
        this.drawText(ctx, `WAVE ${waveIndex + 1}`, CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 - 6, COLORS.WAVE_BANNER, 'center', 2);

        const subtitles = ['INFLATION BEGINS', 'RATES RISING', 'EMBERS SPREAD', 'CRISIS MODE', 'FINAL STAND'];
        this.drawText(ctx, subtitles[waveIndex] || '', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 6, COLORS.UI_TEXT, 'center', 1);
    }

    drawCrashWarning(ctx, events) {
        // Flashing border
        const flashOn = Math.floor(Date.now() / 150) % 2 === 0;
        if (flashOn) {
            ctx.strokeStyle = COLORS.FIRE_HIGH;
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, CANVAS.WIDTH - 2, CANVAS.HEIGHT - 2);
        }

        // Countdown
        const secs = Math.ceil(events.crashWarningTimer);
        this.drawText(ctx, `CRASH IN ${secs}`, CANVAS.WIDTH / 2, 30, COLORS.FIRE_HIGH, 'center', 2);

        // Safe haven indicator
        if (events.safeHavenIndex >= 0) {
            this.drawText(ctx, 'SAFE HAVEN', CANVAS.WIDTH / 2, 42, COLORS.SAFE_HAVEN, 'center', 1);
        }
    }

    drawCrashBorder(ctx) {
        ctx.strokeStyle = COLORS.FIRE_HIGH;
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 100) * 0.3;
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, CANVAS.WIDTH - 2, CANVAS.HEIGHT - 2);
        ctx.globalAlpha = 1;
    }

    drawFloatingTexts(ctx) {
        for (const ft of this.floatingTexts) {
            const alpha = ft.timer / ft.maxTimer;
            ctx.globalAlpha = alpha;
            this.drawText(ctx, ft.text, Math.floor(ft.x), Math.floor(ft.y), ft.color, 'center', 1);
            ctx.globalAlpha = 1;
        }
    }

    // Simple pixel text renderer (uses canvas measureText for positioning)
    drawText(ctx, text, x, y, color = COLORS.UI_TEXT, align = 'left', scale = 1) {
        ctx.save();
        ctx.font = `${4 * scale}px "Press Start 2P", monospace`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';

        if (align === 'center') {
            ctx.textAlign = 'center';
        } else if (align === 'right') {
            ctx.textAlign = 'right';
        } else {
            ctx.textAlign = 'left';
        }

        ctx.fillText(text, x, y);
        ctx.restore();
    }
}

