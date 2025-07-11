import { setupInput, setEnterKeyCallback } from './input.js';
import { movePlayer } from './player.js';
import { createEnemy, createBoss, moveEnemies, resetBossState } from './enemy.js';
import { checkCollisions } from './collision.js';
import { render, gameOver, showBossMessage } from './ui.js';
import { updateClaimedSet } from './area.js';
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
    nextBackgroundImage: null,  // 다음 스테이지를 위해 미리 로드된 이미지
    nextImageSrc: null,         // 다음 이미지의 경로
    animationFrameId: null,
    isGameOver: false,
    forceWin: false,
    isInvincible: false,
    invincibleStartTime: null,
    invincibleDuration: 10000,
    invincibleMessageTimer: null,
    bossMessageTimer: null,
    isGameOverAnimation: false,
    gameOverStartTime: null,
    stageCount: 0,              // 전체 스테이지 수를 저장
    bossSpawned: false,
    stageStartTime: 60
};

function initGame() {
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
    }

    gameState.player = { x: 0, y: 0, trail: [] };
    gameState.enemies = [];
    gameState.claimedArea = [];
    gameState.lives = difficulty.PLAYER_LIVES;
    gameState.score = 0;
    gameState.gameRunning = true;
    gameState.isGameOver = false;
    gameState.showtime = false;
    gameState.transitioningToShowtime = false;
    gameState.forceWin = false;
    gameState.isInvincible = false;
    gameState.invincibleStartTime = null;
    gameState.invincibleDuration = 10000;
    gameState.isGameOverAnimation = false;
    gameState.gameOverStartTime = null;
    gameState.bossSpawned = false;
    
    if (gameState.invincibleMessageTimer) {
        clearTimeout(gameState.invincibleMessageTimer);
        gameState.invincibleMessageTimer = null;
    }
    if (gameState.bossMessageTimer) {
        clearTimeout(gameState.bossMessageTimer);
        gameState.bossMessageTimer = null;
    }
    
    if (gameState.showtimeIntervalId) {
        clearInterval(gameState.showtimeIntervalId);
        gameState.showtimeIntervalId = null;
    }
    if (gameState.gameTimerId) {
        clearInterval(gameState.gameTimerId);
    }
    gameState.timeLeft = gameState.stageStartTime;
    gameState.gameTimerId = setInterval(() => {
        if (!gameState.gameRunning) return; // 게임이 실행 중이 아닐 경우 아무것도 하지 않음

        gameState.timeLeft--;
        if (gameState.timeLeft === 30 && !gameState.bossSpawned) {
            const boss = createBoss();
            if (boss) {
                gameState.enemies.push(boss);
                showBossMessage();
                gameState.bossSpawned = true;
            }
        }
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
    if (!gameState.gameRunning && !gameState.showtime && !gameState.transitioningToShowtime && !gameState.isGameOverAnimation) {
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

        if (gameState.isGameOver && !gameState.isGameOverAnimation) {
            gameOver(gameState);
        }

        if (gameState.timeLeft <= 0) {
            returnToStageSelect();
            return;
        }

        if (gameState.enemies.length === 0 || gameState.forceWin) {
            gameState.gameRunning = false;
            gameState.transitioningToShowtime = true;
            gameState.transitionStartTime = Date.now();
            gameState.player.trail = [];
        }
    }
    
    render(gameState);
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

// 이미지를 로드하는 유틸리티 함수
async function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = getCacheBustedUrl(src);
    });
}

// 랜덤 스테이지 번호를 얻는 함수
function getRandomStageNumber(exclude = null) {
    let randomStage;
    do {
        randomStage = Math.floor(Math.random() * gameState.stageCount) + 1;
    } while (exclude !== null && randomStage === exclude);
    return randomStage;
}

// 다음 스테이지 이미지를 미리 로드하는 함수
async function preloadNextStageImage() {
    if (!gameState.currentImageSrc) return;  // 현재 이미지가 없으면 중단
    
    const currentStageNumber = parseInt(gameState.currentImageSrc.match(/(\d+)\.jpg$/)[1]);
    const nextStageNumber = getRandomStageNumber(currentStageNumber);
    const nextImageSrc = `stages/${nextStageNumber}.jpg`;
    
    try {
        gameState.nextBackgroundImage = await loadImage(nextImageSrc);
        gameState.nextImageSrc = nextImageSrc;
        console.log('Next stage image preloaded:', nextImageSrc);
    } catch (error) {
        console.error('Failed to preload next stage image:', error);
    }
}

// 게임 초기화 시 호출
window.onload = async function() {
    await populateStageSelection();
    stageSelectDiv.style.display = 'block';  // 스테이지 선택 UI를 바로 표시
    gameContainerDiv.style.display = 'none';
};

async function populateStageSelection() {
    const container = document.querySelector('.stage-options');
    container.innerHTML = ''; // 기존 옵션 초기화
    let stageIndex = 1;
    gameState.stageCount = 0;

    // 사용 가능한 스테이지 수를 먼저 계산합니다.
    while (true) {
        const path = `stages/${stageIndex}.jpg`;
        try {
            const response = await fetch(path, { method: 'HEAD' });
            if (response.ok) {
                gameState.stageCount++;
                stageIndex++;
            } else {
                break;
            }
        } catch (error) {
            break;
        }
    }

    // 최초 게임 시작 시 랜덤 이미지 미리 로드
    if (gameState.stageCount > 0) {
        const randomStage = getRandomStageNumber();
        const path = `stages/${randomStage}.jpg`;
        try {
            gameState.nextBackgroundImage = await loadImage(path);
            gameState.nextImageSrc = path;
            console.log('Initial stage image preloaded:', path);
        } catch (error) {
            console.error('Failed to preload initial stage image:', error);
        }

        const option = document.createElement('div');
        option.className = 'stage-option';

        const questionMark = document.createElement('div');
        questionMark.className = 'random-stage-icon';
        questionMark.textContent = '?';

        const span = document.createElement('span');
        span.textContent = '랜덤 스테이지';
        
        option.append(questionMark, span);
        option.addEventListener('click', () => {
            startGame(gameState.nextImageSrc); // 미리 로드된 이미지 사용
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

    resetBossState();
    resetDifficultyStats();

    // 미리 로드된 이미지가 있으면 사용
    if (gameState.nextBackgroundImage && gameState.nextImageSrc === imageSrc) {
        gameState.backgroundImage = gameState.nextBackgroundImage;
        gameState.currentImageSrc = imageSrc;
    } else {
        // 미리 로드된 이미지가 없거나 다른 이미지인 경우 새로 로드
        const img = new Image();
        img.onload = () => {
            gameState.backgroundImage = img;
            gameState.currentImageSrc = imageSrc;
            initGame();
        };
        img.src = getCacheBustedUrl(imageSrc);
        return;
    }

    // 다음 스테이지를 위한 이미지 미리 로드
    preloadNextStageImage();
    
    initGame();
}

async function startNextStage() {
    if (gameState.showtimeIntervalId) {
        clearInterval(gameState.showtimeIntervalId);
        gameState.showtimeIntervalId = null;
    }
    
    showtimeGuideDiv.style.display = 'none';
    countdownDiv.style.display = 'none';

    // 미리 로드된 이미지를 현재 스테이지 이미지로 사용
    if (gameState.nextBackgroundImage) {
        gameState.backgroundImage = gameState.nextBackgroundImage;
        gameState.currentImageSrc = gameState.nextImageSrc;
        
        // 다음 스테이지를 위한 이미지 다시 미리 로드
        preloadNextStageImage();
        
        // 난이도 조절: 시간을 2초 줄이되, 32초 밑으로 내려가지 않음
        gameState.stageStartTime = Math.max(32, gameState.stageStartTime - 2);

        resetDifficultyStats();
        initGame();
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
    gameState.stageStartTime = 60; // 시간 초기화
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

function getCacheBustedUrl(url) {
    return `${url}?_=${Date.now()}`;
}
