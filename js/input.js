// ============================================================
// input.js - Keyboard input handler
// ============================================================
// Controls:
//   A / D         = Move left / right between piles
//   Arrow Left / J = Shovel money LEFT to adjacent pile
//   Arrow Right / K = Shovel money RIGHT to adjacent pile
//   Arrow Up / W  = Invest in current pile's investment window
//   Arrow Down / S = Place firebreak / collect ash
//   Space         = Shovel in the direction you're facing
//   Escape        = Pause

const keys = {};
const justPressed = {};
let pendingJustPressed = {};

export function initInput() {
    window.addEventListener('keydown', (e) => {
        if (!keys[e.code]) {
            pendingJustPressed[e.code] = true;
        }
        keys[e.code] = true;

        // Prevent default for game keys
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
             'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS',
             'KeyJ', 'KeyK', 'Escape'].includes(e.code)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Clear keys on blur to prevent stuck keys
    window.addEventListener('blur', () => {
        Object.keys(keys).forEach(k => keys[k] = false);
    });
}

// Call at start of each frame to update justPressed state
export function updateInput() {
    Object.keys(justPressed).forEach(k => justPressed[k] = false);
    Object.keys(pendingJustPressed).forEach(k => {
        justPressed[k] = pendingJustPressed[k];
    });
    pendingJustPressed = {};
}

export function isDown(code) {
    return !!keys[code];
}

export function wasPressed(code) {
    return !!justPressed[code];
}

// Movement: A / D only
export function moveLeft() {
    return isDown('KeyA');
}

export function moveRight() {
    return isDown('KeyD');
}

// Shoveling: Arrow keys / J / K
export function shovelLeft() {
    return wasPressed('ArrowLeft') || wasPressed('KeyJ');
}

export function shovelRight() {
    return wasPressed('ArrowRight') || wasPressed('KeyK');
}

export function shovelAction() {
    return wasPressed('Space');
}

export function investAction() {
    return wasPressed('ArrowUp') || wasPressed('KeyW');
}

export function firebreakAction() {
    return wasPressed('ArrowDown') || wasPressed('KeyS');
}

export function pauseAction() {
    return wasPressed('Escape');
}

export function confirmAction() {
    return wasPressed('Space') || wasPressed('Enter');
}
