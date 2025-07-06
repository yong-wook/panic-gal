import { setupInput, setEnterKeyCallback } from './input.js';
import { movePlayer } from './player.js';
import { createEnemy, moveEnemies } from './enemy.js';
import { checkCollisions } from './collision.js';
import { render, gameOver } from './ui.js';
import { updateClaimedSet, calculatePercentage } from './area.js';
import { canvas, ctx, COLS, ROWS } from './context.js';
import { difficulty } from './difficulty.js';

const stageSelectDiv = document.getElementById('stage-select');
const gameContainerDiv = document.querySelector('.game-container');
const showtimeGuideDiv = document.getElementById('showtime-guide');
const countdownDiv = document.getElementById('countdown');
const restartButton = document.getElementById('restartButton');

let gameState = {
    player: { x: 0, y: 0, trail: [] },
    enemies: [],
    claimedArea: [],
    lives: 3,
    score: 0,
    gameRunning: true,
    showtime: false,
    transitioningToShowtime: false,
    transitionStartTime: 0,
    showtimeIntervalId: null,
    showtimeCountdown: 10,
    keys: {},
    backgroundImage: null,
    currentImageSrc: null,
};

function initGame() {
    gameState.player = { x: 0, y: 0, trail: [] };
    gameState.enemies = [];
    gameState.claimedArea = [];
    gameState.lives = difficulty.PLAYER_LIVES;
    gameState.score = 0;
    gameState.gameRunning = true;
    gameState.showtime = false;
    gameState.transitioningToShowtime = false;
    if (gameState.showtimeIntervalId) {
        clearInterval(gameState.showtimeIntervalId);
        gameState.showtimeIntervalId = null;
    }
    gameState.keys = {};

    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
                gameState.claimedArea.push({ x, y });
            }
        }
    }
    
    updateClaimedSet(gameState.claimedArea);

    for (let i = 0; i < difficulty.ENEMY_COUNT; i++) {
        gameState.enemies.push(createEnemy());
    }
}

function gameLoop() {
    if (!gameState.gameRunning && !gameState.showtime && !gameState.transitioningToShowtime) {
        return;
    }

    if (gameState.transitioningToShowtime) {
        const elapsed = Date.now() - gameState.transitionStartTime;
        if (elapsed >= 5000) {
            gameState.transitioningToShowtime = false;
            gameState.showtime = true;
            gameState.player.x = gameState.backgroundImage.width / 2;
            gameState.player.y = gameState.backgroundImage.height / 2;
            
            showtimeGuideDiv.style.display = 'block';
            countdownDiv.style.display = 'block';
            gameState.showtimeCountdown = 10;
            
            gameState.showtimeIntervalId = setInterval(() => {
                gameState.showtimeCountdown--;
                if (gameState.showtimeCountdown < 0) {
                    returnToStageSelect();
                }
            }, 1000);
        }
    } else if (gameState.showtime) {
        movePlayer(gameState);
    } else if (gameState.gameRunning) {
        movePlayer(gameState);
        moveEnemies(gameState.enemies, gameState);
        checkCollisions(gameState);

        if (calculatePercentage(gameState.claimedArea) >= difficulty.WIN_PERCENTAGE) {
            gameState.gameRunning = false;
            gameState.transitioningToShowtime = true;
            gameState.transitionStartTime = Date.now();
            gameState.enemies = [];
            gameState.player.trail = [];
        }
    }
    
    render(gameState);
    requestAnimationFrame(gameLoop);
}

function getCacheBustedUrl(url) {
    return `${url}?t=${new Date().getTime()}`;
}

async function populateStageSelection() {
    const container = document.querySelector('.stage-options');
    container.innerHTML = ''; // 기존 옵션 초기화
    let stageIndex = 1;
    let searching = true;
    const extensions = ['png', 'jpg', 'jpeg', 'gif'];

    while (searching) {
        let foundPath = null;
        for (const ext of extensions) {
            const path = `stages/${stageIndex}.${ext}`;
            try {
                const response = await fetch(getCacheBustedUrl(path), { method: 'HEAD' });
                if (response.ok) {
                    foundPath = path;
                    break;
                }
            } catch (error) { /* 무시 */ }
        }

        if (foundPath) {
            const path = foundPath;
            const option = document.createElement('div');
            option.className = 'stage-option';
            option.setAttribute('data-image', path);

            const img = document.createElement('img');
            img.src = getCacheBustedUrl(path);
            img.alt = `Stage ${stageIndex}`;

            const span = document.createElement('span');
            span.textContent = `스테이지 ${stageIndex}`;
            
            option.append(img, span);
            option.addEventListener('click', () => startGame(path));
            container.appendChild(option);

            stageIndex++;
        } else {
            searching = false;
        }
    }
}

function startGame(imageSrc) {
    stageSelectDiv.style.display = 'none';
    gameContainerDiv.style.display = 'block';

    gameState.currentImageSrc = imageSrc;
    const bgImage = new Image();
    bgImage.src = getCacheBustedUrl(imageSrc);
    bgImage.onload = () => {
        gameState.backgroundImage = bgImage;
        initGame();
        gameLoop();
    };
    bgImage.onerror = () => {
        console.error("이미지를 로드할 수 없습니다:", imageSrc);
        returnToStageSelect();
    };
}

function returnToStageSelect() {
    gameContainerDiv.style.display = 'none';
    showtimeGuideDiv.style.display = 'none';
    countdownDiv.style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    stageSelectDiv.style.display = 'block';
    
    gameState.gameRunning = false;
    gameState.showtime = false;
    gameState.transitioningToShowtime = false;
    if (gameState.showtimeIntervalId) {
        clearInterval(gameState.showtimeIntervalId);
        gameState.showtimeIntervalId = null;
    }
}

// 스테이지 선택 이벤트 리스너 (이제 populateStageSelection에서 동적으로 생성)

// 다시 시작 버튼 이벤트 리스너 (게임 오버 시)
restartButton.addEventListener('click', () => {
    document.getElementById('gameOver').style.display = 'none';
    startGame(gameState.currentImageSrc); 
});

// 쇼타임에서 Enter 키 콜백 설정
setEnterKeyCallback(returnToStageSelect);

setupInput(gameState);
populateStageSelection(); // 페이지 로드 시 스테이지 목록 생성