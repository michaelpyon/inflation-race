// ============================================================
// player.js - Player character with movement and shovel
// ============================================================

import { PLAYER, FIREBREAK, UPGRADES, PILES } from './constants.js';
import * as Input from './input.js';

export class Player {
    constructor(pileCount) {
        this.pileIndex = Math.floor(pileCount / 2); // Start in the middle
        this.targetPileIndex = this.pileIndex;
        this.x = 0; // Actual x position (interpolated)
        this.pileCount = pileCount;
        this.facing = 1; // 1 = right, -1 = left

        // Shovel
        this.shovelCooldown = 0;
        this.shovelAmount = PLAYER.SHOVEL_AMOUNT;
        this.spillageRate = PLAYER.SPILLAGE_RATE;
        this.cooldownTime = PLAYER.SHOVEL_COOLDOWN;

        // Animation state
        this.state = 'idle'; // idle, walk, shovel_left, shovel_right
        this.animTimer = 0;
        this.shovelAnimTimer = 0;

        // Movement
        this.moveTimer = 0;
        this.moving = false;

        // Firebreak tokens
        this.firebreakTokens = 1; // Start with 1

        // Active upgrade
        this.activeUpgrade = null;
        this.upgradeTimer = 0;

        // Stats
        this.totalShoveled = 0;
        this.totalSpillage = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.lastShovelTime = 0;
    }

    update(dt, piles, gameTime, callbacks) {
        // Update cooldowns
        if (this.shovelCooldown > 0) this.shovelCooldown -= dt;

        // Update upgrade timer
        if (this.activeUpgrade) {
            this.upgradeTimer -= dt;
            if (this.upgradeTimer <= 0) {
                this.clearUpgrade();
            }
        }

        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }

        // Shovel animation timer
        if (this.shovelAnimTimer > 0) {
            this.shovelAnimTimer -= dt;
            if (this.shovelAnimTimer <= 0) {
                this.state = 'idle';
            }
        }

        // Handle movement
        this.handleMovement(dt);

        // Handle shovel input
        if (!this.moving) {
            this.handleShovel(piles, gameTime, callbacks);
            this.handleInvest(piles, callbacks);
            this.handleFirebreak(piles, callbacks);
        }

        // Update x position (interpolate toward target)
        const targetX = this.getPileX(this.pileIndex, piles);
        const moveSpeed = PILES.PILE_SPACING * PLAYER.MOVE_SPEED;
        const dx = targetX - this.x;
        if (Math.abs(dx) < moveSpeed * dt) {
            this.x = targetX;
            this.moving = false;
        } else {
            this.x += Math.sign(dx) * moveSpeed * dt;
        }

        // Animation
        this.animTimer += dt;
        if (this.moving) {
            this.state = 'walk';
        } else if (this.shovelAnimTimer <= 0 && this.state !== 'idle') {
            this.state = 'idle';
        }
    }

    handleMovement(dt) {
        if (this.moving) return;

        if (Input.moveLeft() && this.pileIndex > 0) {
            this.pileIndex--;
            this.moving = true;
            this.facing = -1;
        } else if (Input.moveRight() && this.pileIndex < this.pileCount - 1) {
            this.pileIndex++;
            this.moving = true;
            this.facing = 1;
        }
    }

    handleShovel(piles, gameTime, callbacks) {
        if (this.shovelCooldown > 0) return;

        const currentPile = piles[this.pileIndex];
        if (!currentPile || currentPile.collapsed) return;

        let shovelDir = 0;

        if (Input.shovelAction()) {
            // Space shovels in the direction player is facing
            shovelDir = this.facing;
        } else if (Input.shovelLeft()) {
            shovelDir = -1;
        } else if (Input.shovelRight()) {
            shovelDir = 1;
        }

        if (shovelDir === 0) return;

        // Find nearest non-collapsed pile in shovel direction (skip over collapsed)
        let targetIndex = this.pileIndex + shovelDir;
        let skipped = 0;
        while (targetIndex >= 0 && targetIndex < this.pileCount && piles[targetIndex].collapsed) {
            targetIndex += shovelDir;
            skipped++;
        }
        if (targetIndex < 0 || targetIndex >= this.pileCount) return;

        const targetPile = piles[targetIndex];

        // Check if either pile is firebroken
        if (currentPile.firebroken || targetPile.firebroken) return;

        // Perform shovel - extra spillage per collapsed pile skipped
        const amount = currentPile.removeMoney(this.shovelAmount);
        if (amount <= 0) return;

        const totalSpillageRate = this.spillageRate + skipped * PLAYER.SKIP_SPILLAGE;
        const spillage = amount * Math.min(totalSpillageRate, 0.5); // cap at 50%
        const delivered = amount - spillage;
        targetPile.addMoney(delivered);

        this.shovelCooldown = this.cooldownTime;
        this.totalShoveled += amount;
        this.totalSpillage += spillage;

        // Animation
        this.shovelAnimTimer = 0.2;
        this.state = shovelDir < 0 ? 'shovel_left' : 'shovel_right';
        this.facing = shovelDir;

        // Combo
        this.comboCount++;
        this.comboTimer = 2; // 2 second combo window

        // Callbacks
        if (callbacks.onShovel) {
            callbacks.onShovel(this.pileIndex, targetIndex, amount, delivered, spillage);
        }
        if (this.comboCount >= 4 && callbacks.onCombo) {
            callbacks.onCombo(this.comboCount);
        }
    }

    handleInvest(piles, callbacks) {
        if (!Input.investAction()) return;

        const currentPile = piles[this.pileIndex];
        if (!currentPile || currentPile.collapsed) return;
        if (!currentPile.activeInvestment) return;

        if (callbacks.onInvest) {
            callbacks.onInvest(this.pileIndex);
        }
    }

    handleFirebreak(piles, callbacks) {
        if (!Input.firebreakAction()) return;

        const currentPile = piles[this.pileIndex];
        if (!currentPile) return;

        // Collect ash from collapsed piles (no token needed)
        if (currentPile.collapsed && currentPile.hasAsh) {
            const ashAmount = currentPile.collectAsh();
            if (callbacks.onAshCollect) {
                callbacks.onAshCollect(this.pileIndex, ashAmount);
            }
            return;
        }

        // Firebreak requires token and a non-collapsed, non-firebroken pile
        if (this.firebreakTokens <= 0) return;
        if (currentPile.collapsed || currentPile.firebroken) return;

        this.firebreakTokens--;
        if (callbacks.onFirebreak) {
            callbacks.onFirebreak(this.pileIndex);
        }
    }

    applyUpgrade(type) {
        this.activeUpgrade = type;
        const config = UPGRADES[type];
        if (type === 'BIG_SHOVEL') {
            this.shovelAmount = config.amount;
            this.upgradeTimer = config.duration;
        } else if (type === 'FIREPROOF') {
            this.spillageRate = config.spillage;
            this.upgradeTimer = config.duration;
        } else if (type === 'SPEED') {
            this.cooldownTime = config.cooldown;
            this.upgradeTimer = config.duration;
        }
    }

    clearUpgrade() {
        this.activeUpgrade = null;
        this.shovelAmount = PLAYER.SHOVEL_AMOUNT;
        this.spillageRate = PLAYER.SPILLAGE_RATE;
        this.cooldownTime = PLAYER.SHOVEL_COOLDOWN;
    }

    addFirebreakToken() {
        this.firebreakTokens = Math.min(this.firebreakTokens + 1, FIREBREAK.MAX_TOKENS);
    }

    getPileX(index, piles) {
        if (piles[index]) return piles[index].x;
        const startX = (384 - (this.pileCount - 1) * PILES.PILE_SPACING) / 2;
        return startX + index * PILES.PILE_SPACING;
    }
}
