let enterKeyCallback = () => {};

export function setEnterKeyCallback(callback) {
    enterKeyCallback = callback;
}

export function setupInput(gameState) {
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.code] = true;
        
        if (e.code === 'Enter' && gameState.showtime) {
            enterKeyCallback();
        }
    });

    window.addEventListener('keyup', (e) => {
        gameState.keys[e.code] = false;
    });
}