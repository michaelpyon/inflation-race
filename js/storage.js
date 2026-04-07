// ============================================================
// storage.js - localStorage wrapper for persistence
// ============================================================

const STORAGE_KEY = 'inflation_race';

function loadAll() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

function saveAll(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Storage full or unavailable
    }
}

export function getHighScores() {
    const data = loadAll();
    return data.highScores || [];
}

export function addHighScore(score, grade) {
    const data = loadAll();
    if (!data.highScores) data.highScores = [];
    data.highScores.push({ score, grade, date: Date.now() });
    data.highScores.sort((a, b) => b.score - a.score);
    data.highScores = data.highScores.slice(0, 5); // top 5
    saveAll(data);
    return data.highScores;
}

export function getUnlocks() {
    const data = loadAll();
    return data.unlocks || {};
}

export function setUnlock(key, value) {
    const data = loadAll();
    if (!data.unlocks) data.unlocks = {};
    data.unlocks[key] = value;
    saveAll(data);
}

export function getGamesPlayed() {
    const data = loadAll();
    return data.gamesPlayed || 0;
}

export function incrementGamesPlayed() {
    const data = loadAll();
    data.gamesPlayed = (data.gamesPlayed || 0) + 1;
    saveAll(data);
    return data.gamesPlayed;
}

export function getBestGrade() {
    const scores = getHighScores();
    if (scores.length === 0) return null;
    const gradeOrder = ['S', 'A', 'B', 'C', 'F'];
    let best = 'F';
    for (const s of scores) {
        if (gradeOrder.indexOf(s.grade) < gradeOrder.indexOf(best)) {
            best = s.grade;
        }
    }
    return best;
}
