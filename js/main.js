// ============================================================
// main.js - Entry point, game loop, screen state machine
// ============================================================

import { Renderer } from './renderer.js';
import { Game } from './game.js';
import { UI } from './ui.js';
import { initInput, updateInput } from './input.js';
import * as Input from './input.js';
import { initAudio, resumeAudio } from './audio.js';
import { addHighScore, incrementGamesPlayed } from './storage.js';

// Screen states
const STATES = {
    TITLE: 'title',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover',
};

let state = STATES.TITLE;
let renderer, game, ui;
let lastTime = 0;
let accumulator = 0;
const FIXED_DT = 1 / 60; // 60 fps fixed timestep

function init() {
    const canvas = document.getElementById('game-canvas');
    renderer = new Renderer(canvas);
    ui = new UI();
    initInput();
    initAudio();

    ui.showTitle();

    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if (lastTime === 0) {
        lastTime = timestamp;
        return;
    }

    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Clamp dt to avoid spiral of death
    if (dt > 0.1) dt = 0.1;

    updateInput();

    switch (state) {
        case STATES.TITLE:
            updateTitle();
            renderer.render(null);
            break;

        case STATES.PLAYING:
            accumulator += dt;
            while (accumulator >= FIXED_DT) {
                game.update(FIXED_DT);
                accumulator -= FIXED_DT;

                if (game.gameOver) {
                    transitionToGameOver();
                    break;
                }
            }
            if (state === STATES.PLAYING) {
                // Check pause
                if (Input.pauseAction()) {
                    transitionToPause();
                } else {
                    renderer.render(game.getState());
                }
            }
            break;

        case STATES.PAUSED:
            updatePause();
            renderer.render(game.getState());
            break;

        case STATES.GAMEOVER:
            updateGameOver();
            renderer.render(game.getState());
            break;
    }
}

function updateTitle() {
    if (Input.confirmAction()) {
        startGame();
    }
}

function startGame() {
    resumeAudio();
    game = new Game(renderer);
    game.start();
    state = STATES.PLAYING;
    ui.showGame();
    accumulator = 0;
}

function transitionToPause() {
    state = STATES.PAUSED;
    game.pause();
    ui.showPause();
}

function updatePause() {
    if (Input.pauseAction()) {
        state = STATES.PLAYING;
        game.pause(); // toggles back
        ui.hidePause();
    }
}

function transitionToGameOver() {
    state = STATES.GAMEOVER;
    const scoreData = game.getScore();
    const grade = game.getGrade();
    addHighScore(scoreData.total, grade.grade);
    incrementGamesPlayed();
    ui.showGameOver(scoreData, grade);
}

function updateGameOver() {
    if (Input.confirmAction()) {
        state = STATES.TITLE;
        ui.showTitle();
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
