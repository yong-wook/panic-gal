import { setupInput, setEnterKeyCallback } from './input.js';
import { movePlayer } from './player.js';
import { createEnemy, moveEnemies } from './enemy.js';
import { checkCollisions } from './collision.js';
import { render, gameOver } from './ui.js';
import { updateClaimedSet, calculatePercentage } from './area.js';
import { canvas, ctx, COLS, ROWS } from './context.js';
import { difficulty, ENEMY_INCREMENT, setDifficulty, resetDifficultyStats } from './difficulty.js';

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
    gameTimerId: null,
    timeLeft: 60,
    keys: {},
    backgroundImage: null,
    currentImageSrc: null,
    animationFrameId: null,
    isGameOver: false,
};

function initGame() {
    gameState.player = { x: 0, y: 0, trail: [] };
    gameState.enemies = [];
    gameState.claimedArea = [];
    gameState.lives = difficulty.PLAYER_LIVES;
    gameState.score = 0;
    gameState.gameRunning = true;
    gameState.isGameOver = false;
    gameState.showtime = false;
    gameState.transitioningToShowtime = false;
    
    if (gameState.showtimeIntervalId) {
        clearInterval(gameState.showtimeIntervalId);
        gameState.showtimeIntervalId = null;
    }
    if (gameState.gameTimerId) {
        clearInterval(gameState.gameTimerId);
    }
    gameState.timeLeft = 60;
    gameState.gameTimerId = setInterval(() => {
        gameState.timeLeft--;
    }, 1000);

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

    render(gameState);
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
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
            
            if (gameState.gameTimerId) clearInterval(gameState.gameTimerId);
            
            gameState.showtimeIntervalId = setInterval(() => {
                gameState.showtimeCountdown--;
                if (gameState.showtimeCountdown < 0) {
                    startNextStage();
                }
            }, 1000);
        }
    } else if (gameState.showtime) {
        movePlayer(gameState);
    } else if (gameState.gameRunning) {
        movePlayer(gameState);
        moveEnemies(gameState.enemies, gameState);
        checkCollisions(gameState);

        if (gameState.isGameOver) {
            returnToStageSelect();
            return; 
        }

        if (gameState.timeLeft <= 0) {
            returnToStageSelect();
        }

        if (calculatePercentage(gameState.claimedArea) >= difficulty.WIN_PERCENTAGE) {
            gameState.gameRunning = false;
            gameState.transitioningToShowtime = true;
            gameState.transitionStartTime = Date.now();
            gameState.enemies = [];
            gameState.player.trail = [];
        }
    }
    
    render(gameState);
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

async function populateStageSelection() {
    const container = document.querySelector('.stage-options');
    container.innerHTML = ''; // 기존 옵션 초기화
    let stageIndex = 1;
    let stageCount = 0;

    // 사용 가능한 스테이지 수를 먼저 계산합니다.
    while (true) {
        const path = `stages/${stageIndex}.jpg`;
        try {
            const response = await fetch(path, { method: 'HEAD' });
            if (response.ok) {
                stageCount++;
                stageIndex++;
            } else {
                break; // 다음 스테이지가 없으면 중단
            }
        } catch (error) {
            break; // 오류 발생 시 중단
        }
    }

    if (stageCount > 0) {
        const option = document.createElement('div');
        option.className = 'stage-option';

        const questionMark = document.createElement('div');
        questionMark.className = 'random-stage-icon';
        questionMark.textContent = '?';

        const span = document.createElement('span');
        span.textContent = '랜덤 스테이지';
        
        option.append(questionMark, span);
        option.addEventListener('click', () => {
            const randomStage = Math.floor(Math.random() * stageCount) + 1;
            const path = `stages/${randomStage}.jpg`;
            startGame(path);
        });
        container.appendChild(option);
    }
}

function startGame(imageSrc) {
    stageSelectDiv.style.display = 'none';
    gameContainerDiv.style.display = 'block';
    countdownDiv.style.display = 'none';

    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
    }

    gameState.currentImageSrc = imageSrc;
    const bgImage = new Image();
    bgImage.src = imageSrc;
    bgImage.onload = () => {
        gameState.backgroundImage = bgImage;
        initGame();
    };
    bgImage.onerror = () => {
        console.error("이미지를 로드할 수 없습니다:", imageSrc);
        returnToStageSelect();
    };
}

async function startNextStage() {
    // 1. 난이도 업데이트
    difficulty.ENEMY_COUNT += ENEMY_INCREMENT;

    // 2. 사용 가능한 스테이지 수 계산
    let stageCount = 0;
    let stageIndex = 1;
    while(true) {
        const path = `stages/${stageIndex}.jpg`;
        try {
            const response = await fetch(path, { method: 'HEAD' });
            if (response.ok) {
                stageCount++;
                stageIndex++;
            } else {
                break;
            }
        } catch (error) {
            break;
        }
    }

    // 3. 랜덤 스테이지 선택 및 게임 시작
    if (stageCount > 0) {
        const randomStage = Math.floor(Math.random() * stageCount) + 1;
        const path = `stages/${randomStage}.jpg`;
        startGame(path);
    } else {
        // 플레이할 스테이지가 없으면, 게임 오버 또는 스테이지 선택 화면으로
        gameOver(gameState); 
    }
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
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
        gameState.animationFrameId = null;
    }
    if (gameState.gameTimerId) {
        clearInterval(gameState.gameTimerId);
        gameState.gameTimerId = null;
    }
    resetDifficultyStats();
}

// 스테이지 선택 이벤트 리스너 (이제 populateStageSelection에서 동적으로 생성)

// 다시 시작 버튼 이벤트 리스너 (게임 오버 시)
restartButton.addEventListener('click', () => {
    document.getElementById('gameOver').style.display = 'none';
    startGame(gameState.currentImageSrc); 
});

// 쇼타임에서 Enter 키 콜백 설정
setEnterKeyCallback(startNextStage);

setupInput(gameState);
populateStageSelection(); // 페이지 로드 시 스테이지 목록 생성

function getCacheBustedUrl(url) {
    // ... existing code ...
}