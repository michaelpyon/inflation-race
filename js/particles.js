// ============================================================
// particles.js - Particle system for visual effects
// ============================================================

import { PARTICLES, COLORS } from './constants.js';

class Particle {
    constructor(x, y, vx, vy, lifetime, color, size = 2) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.color = color;
        this.size = size;
        this.alive = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifetime -= dt;
        if (this.lifetime <= 0) this.alive = false;
    }

    getAlpha() {
        return Math.max(0, this.lifetime / this.maxLifetime);
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (!this.particles[i].alive) {
                this.particles.splice(i, 1);
            }
        }
    }

    clear() {
        this.particles = [];
    }

    // Fire particles rising from a pile
    spawnFire(x, y, width, burnRate) {
        const count = Math.ceil(burnRate * PARTICLES.FIRE_SPAWN_RATE_BASE * 0.1);
        for (let i = 0; i < count; i++) {
            const px = x + (Math.random() - 0.5) * width;
            const py = y - Math.random() * 4;
            const vx = (Math.random() - 0.5) * 8;
            const vy = -(PARTICLES.FIRE_SPEED_MIN + Math.random() * (PARTICLES.FIRE_SPEED_MAX - PARTICLES.FIRE_SPEED_MIN));
            const lifetime = PARTICLES.FIRE_LIFETIME_MIN + Math.random() * (PARTICLES.FIRE_LIFETIME_MAX - PARTICLES.FIRE_LIFETIME_MIN);

            // Color based on burn rate intensity
            let color;
            if (burnRate > 20) color = COLORS.FIRE_EXTREME;
            else if (burnRate > 12) color = COLORS.FIRE_HIGH;
            else if (burnRate > 6) color = COLORS.FIRE_MED;
            else color = COLORS.FIRE_LOW;

            // Randomize color slightly
            const colors = [COLORS.FIRE_LOW, COLORS.FIRE_MED, COLORS.FIRE_HIGH];
            if (Math.random() < 0.3) color = colors[Math.floor(Math.random() * colors.length)];

            this.particles.push(new Particle(px, py, vx, vy, lifetime, color, PARTICLES.FIRE_SIZE));
        }
    }

    // Dollar sign particles for shovel transfer
    spawnShovelTransfer(fromX, fromY, toX, toY) {
        for (let i = 0; i < PARTICLES.SHOVEL_COUNT; i++) {
            const t = Math.random();
            const px = fromX;
            const py = fromY;
            const angle = Math.atan2(toY - fromY, toX - fromX) + (Math.random() - 0.5) * 0.8;
            const speed = PARTICLES.SHOVEL_SPEED * (0.7 + Math.random() * 0.6);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 20; // arc upward
            this.particles.push(new Particle(px, py, vx, vy, PARTICLES.SHOVEL_LIFETIME, COLORS.MONEY_GREEN, 2));
        }
    }

    // Ember particles drifting between piles
    spawnEmber(fromX, fromY, toX) {
        for (let i = 0; i < PARTICLES.EMBER_COUNT; i++) {
            const vx = (toX - fromX) > 0 ? PARTICLES.EMBER_SPEED : -PARTICLES.EMBER_SPEED;
            const vy = (Math.random() - 0.5) * 10 - 5;
            this.particles.push(new Particle(
                fromX, fromY - Math.random() * 20,
                vx + (Math.random() - 0.5) * 10, vy,
                PARTICLES.EMBER_LIFETIME,
                COLORS.FIRE_MED, 1
            ));
        }
    }

    // Collapse explosion
    spawnCollapse(x, y) {
        for (let i = 0; i < PARTICLES.COLLAPSE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 60;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 20;
            const color = Math.random() < 0.5 ? COLORS.FIRE_HIGH : COLORS.FIRE_MED;
            this.particles.push(new Particle(x, y, vx, vy, 0.8, color, 2));
        }
    }

    // Ash floating up
    spawnAsh(x, y) {
        for (let i = 0; i < PARTICLES.ASH_COUNT; i++) {
            const vx = (Math.random() - 0.5) * 15;
            const vy = -(5 + Math.random() * 15);
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 20, y,
                vx, vy, PARTICLES.ASH_LIFETIME,
                COLORS.ASH_GRAY, 1
            ));
        }
    }

    // Firebreak ice sparkle
    spawnFirebreak(x, y, width) {
        for (let i = 0; i < 10; i++) {
            const px = x + (Math.random() - 0.5) * width;
            const py = y - Math.random() * 30;
            const vx = (Math.random() - 0.5) * 20;
            const vy = -(10 + Math.random() * 20);
            this.particles.push(new Particle(px, py, vx, vy, 0.6, COLORS.FIREBREAK_BLUE, 2));
        }
    }

    // Investment sparkle
    spawnInvestmentSparkle(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 15 + Math.random() * 25;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed, Math.sin(angle) * speed,
                0.5, COLORS.INVESTMENT_GOLD, 2
            ));
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            const alpha = p.getAlpha();
            if (alpha <= 0) continue;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }
}
