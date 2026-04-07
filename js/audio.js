// ============================================================
// audio.js - Procedural sound generation via Web Audio API
// ============================================================

let ctx = null;
let masterGain = null;
let enabled = true;
let fireNoiseNode = null;
let fireGain = null;

export function initAudio() {
    try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(ctx.destination);
    } catch {
        enabled = false;
    }
}

export function resumeAudio() {
    if (ctx && ctx.state === 'suspended') {
        ctx.resume();
    }
}

export function setVolume(v) {
    if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
}

export function toggleAudio() {
    enabled = !enabled;
    if (masterGain) masterGain.gain.value = enabled ? 0.3 : 0;
    return enabled;
}

function playTone(freq, duration, type = 'square', volume = 0.3) {
    if (!ctx || !enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.15) {
    if (!ctx || !enabled) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start(ctx.currentTime);
}

export function playShovel() {
    playNoise(0.05, 0.2);
    playTone(200, 0.05, 'triangle', 0.1);
}

export function playMoneyLand() {
    playTone(800, 0.08, 'triangle', 0.15);
}

export function playInvestmentAppear() {
    if (!ctx || !enabled) return;
    [600, 800, 1000].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.12, 'square', 0.15), i * 80);
    });
}

export function playBullResult() {
    if (!ctx || !enabled) return;
    [523, 659, 784].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, 'square', 0.2), i * 50);
    });
}

export function playBearResult() {
    if (!ctx || !enabled) return;
    [400, 350, 300].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, 'square', 0.2), i * 80);
    });
}

export function playFlatResult() {
    playTone(440, 0.15, 'triangle', 0.15);
}

export function playWaveTransition() {
    playNoise(0.3, 0.1);
    playTone(300, 0.3, 'square', 0.15);
}

export function playCollapse() {
    if (!ctx || !enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 60;
    gain.gain.value = 0.4;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    playNoise(0.2, 0.25);
}

export function playCrashWarning() {
    if (!ctx || !enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 400;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);

    // Alternate between 400 and 600 Hz
    for (let i = 0; i < 8; i++) {
        osc.frequency.setValueAtTime(i % 2 === 0 ? 400 : 600, ctx.currentTime + i * 0.15);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.stop(ctx.currentTime + 1.2);
}

export function playFirebreak() {
    if (!ctx || !enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 2000;
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    gain.gain.value = 0.2;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
}

export function playAshCollect() {
    playTone(1000, 0.05, 'square', 0.2);
}

export function playGameOver() {
    if (!ctx || !enabled) return;
    [523, 466, 415, 392].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.3, 'square', 0.2), i * 200);
    });
}

export function playMenuSelect() {
    playTone(600, 0.06, 'square', 0.15);
}

// Ambient fire crackle - adjust volume based on total burn rate
export function startFireAmbience() {
    if (!ctx || !enabled) return;
    if (fireNoiseNode) return;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    fireNoiseNode = ctx.createBufferSource();
    fireNoiseNode.buffer = buffer;
    fireNoiseNode.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    fireGain = ctx.createGain();
    fireGain.gain.value = 0.02;

    fireNoiseNode.connect(filter);
    filter.connect(fireGain);
    fireGain.connect(masterGain);
    fireNoiseNode.start();
}

export function updateFireAmbience(totalBurnRate) {
    if (fireGain) {
        const vol = Math.min(0.08, (totalBurnRate / 100) * 0.06);
        fireGain.gain.value = vol;
    }
}

export function stopFireAmbience() {
    if (fireNoiseNode) {
        fireNoiseNode.stop();
        fireNoiseNode = null;
        fireGain = null;
    }
}
