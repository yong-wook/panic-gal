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

    const dPadMap = {
        'd-pad-up': 'ArrowUp',
        'd-pad-down': 'ArrowDown',
        'd-pad-left': 'ArrowLeft',
        'd-pad-right': 'ArrowRight',
    };

    for (const [btnId, keyName] of Object.entries(dPadMap)) {
        const button = document.getElementById(btnId);
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            gameState.keys[keyName] = true;
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            gameState.keys[keyName] = false;
        });
    }
}