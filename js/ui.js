// ============================================================
// ui.js - Menu screens, HUD, and end-game UI
// ============================================================

import { getHighScores } from './storage.js';

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

    showGameOver(scoreData, grade) {
        this.gameoverScreen.classList.remove('hidden');
        this.hud.style.display = 'none';

        // Grade
        const gradeEl = document.getElementById('grade-display');
        gradeEl.textContent = grade.grade;
        gradeEl.style.color = grade.color;

        // Final score
        document.getElementById('final-score').textContent = '$' + scoreData.total.toLocaleString();

        // Breakdown
        const breakdown = document.getElementById('score-breakdown');
        breakdown.innerHTML = `
            Money remaining: <span class="value">$${scoreData.remaining.toLocaleString()}</span><br>
            Survivor bonus: <span class="value">+$${scoreData.survivorBonus.toLocaleString()}</span><br>
            Investor bonus: <span class="value">+$${scoreData.investorBonus.toLocaleString()}</span><br>
            Ash collected: <span class="value">+$${scoreData.ashBonus.toLocaleString()}</span><br>
            ${scoreData.noCollapseBonus > 0 ? `No collapse bonus: <span class="value">+$${scoreData.noCollapseBonus.toLocaleString()}</span><br>` : ''}
        `;
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
            html += `<li>${s.grade} - $${s.score.toLocaleString()}</li>`;
        }
        container.innerHTML = html;
    }
}
