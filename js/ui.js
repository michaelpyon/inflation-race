// ============================================================
// ui.js - Menu screens, HUD, and end-game UI
// ============================================================

import { getHighScores, getEraHighScores } from './storage.js';

export class UI {
    constructor() {
        this.titleScreen = document.getElementById('title-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.hud = document.getElementById('hud');
    }

    showTitle() {
        this.titleScreen.classList.remove('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.hud.style.display = 'none';

        // Show high scores
        this.updateHighScores();
    }

    showGame() {
        this.titleScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.hud.style.display = 'block';
    }

    showPause() {
        this.pauseScreen.classList.remove('hidden');
    }

    hidePause() {
        this.pauseScreen.classList.add('hidden');
    }

    showGameOver(scoreData, grade, era) {
        this.gameoverScreen.classList.remove('hidden');
        this.hud.style.display = 'none';

        // Era name
        const eraNameEl = document.getElementById('gameover-era-name');
        if (era) {
            eraNameEl.textContent = era.name + ' (' + era.year + ')';
            eraNameEl.style.color = era.colors.ACCENT || '';
        } else {
            eraNameEl.textContent = '';
        }

        // Grade
        const gradeEl = document.getElementById('grade-display');
        gradeEl.textContent = grade.grade;
        gradeEl.style.color = grade.color;

        // Final score
        document.getElementById('final-score').textContent = '$' + scoreData.total.toLocaleString();

        // Purchasing power
        const ppEl = document.getElementById('purchasing-power');
        if (scoreData.purchasingPower !== undefined) {
            ppEl.textContent = 'Purchasing Power: $' + scoreData.purchasingPower.toLocaleString();
        } else {
            ppEl.textContent = '';
        }

        // Breakdown
        const breakdown = document.getElementById('score-breakdown');
        breakdown.innerHTML = `
            Money remaining: <span class="value">$${scoreData.remaining.toLocaleString()}</span><br>
            Survivor bonus: <span class="value">+$${scoreData.survivorBonus.toLocaleString()}</span><br>
            Investor bonus: <span class="value">+$${scoreData.investorBonus.toLocaleString()}</span><br>
            Ash collected: <span class="value">+$${scoreData.ashBonus.toLocaleString()}</span><br>
            ${scoreData.noCollapseBonus > 0 ? `No collapse bonus: <span class="value">+$${scoreData.noCollapseBonus.toLocaleString()}</span><br>` : ''}
        `;

        // Era-specific stats
        const eraStatsEl = document.getElementById('gameover-era-stats');
        if (scoreData.eventsEncountered && scoreData.eventsEncountered.length > 0) {
            const timeMins = Math.floor(scoreData.timeSurvived / 60);
            const timeSecs = Math.floor(scoreData.timeSurvived % 60);
            let html = `Time survived: ${timeMins}:${timeSecs.toString().padStart(2, '0')}<br>`;
            html += `Events encountered: ${scoreData.eventsEncountered.length}<br>`;
            const eventNames = [...new Set(scoreData.eventsEncountered.map(e => e.name))];
            html += eventNames.join(' / ');
            eraStatsEl.innerHTML = html;
        } else {
            eraStatsEl.innerHTML = '';
        }
    }

    updateHighScores() {
        const scores = getHighScores();
        const container = document.getElementById('high-scores-display');
        if (scores.length === 0) {
            container.innerHTML = '';
            return;
        }

        let html = '<h3>HIGH SCORES</h3>';
        for (const s of scores) {
            const eraLabel = s.eraId ? ` (${s.eraId})` : '';
            html += `<li>${s.grade} - $${s.score.toLocaleString()}${eraLabel}</li>`;
        }
        container.innerHTML = html;
    }
}
