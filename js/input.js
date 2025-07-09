let enterKeyCallback = () => {};

export function setEnterKeyCallback(callback) {
    enterKeyCallback = callback;
}

export function setupInput(gameState) {
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.code] = true;
        
        if (e.code === 'Enter' && gameState.showtime) {
            if (enterKeyCallback) {
                enterKeyCallback();
            }
        }

        // 테스트용 치트: Numpad+ 키로 스테이지 클리어
        if (e.code === 'NumpadAdd') {
            gameState.forceWin = true;
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
            // 햅틱 피드백 추가
            if (navigator.vibrate) {
                navigator.vibrate(50); // 50ms 진동
            }
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            gameState.keys[keyName] = false;
        });
    }
}