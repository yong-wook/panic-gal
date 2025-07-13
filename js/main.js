import { setupInput, setEnterKeyCallback } from './input.js';
import { movePlayer } from './player.js';
import { createEnemy, createBoss, moveEnemies, resetBossState } from './enemy.js';
import { checkCollisions } from './collision.js';
import { render, gameOver, showBossMessage, showInvincibleMessage, showInvincibilityEndMessage } from './ui.js';
import { updateClaimedSet, isAreaClaimed } from './area.js';
import { canvas, ctx, COLS, ROWS } from './context.js';
import { difficulty, ENEMY_INCREMENT, setDifficulty, resetDifficultyStats } from './difficulty.js';
import { ITEM_SPAWN_INTERVAL, ITEM_SIZE, GRID_SIZE, SPEED_UP_DURATION, VIRTUAL_WORLD_WIDTH, VIRTUAL_WORLD_HEIGHT, PLAYER_SIZE, INITIAL_PLAYER_HEALTH, PLAYER_INVINCIBILITY_DURATION, HEALTH_PER_LEVEL, XP_NEEDED_BASE, XP_NEEDED_MULTIPLIER } from './config.js';

const stageSelectDiv = document.getElementById('stage-select');
const gameContainerDiv = document.querySelector('.game-container');
const showtimeGuideDiv = document.getElementById('showtime-guide');
const countdownDiv = document.getElementById('countdown');
const restartButton = document.getElementById('restartButton');



let gameState = {
    player: { 
        x: 0, 
        y: 0, 
        trail: [],
        health: INITIAL_PLAYER_HEALTH,
        maxHealth: INITIAL_PLAYER_HEALTH,
        invincible: false,
        invincibleTimer: 0,
        invincibleDuration: PLAYER_INVINCIBILITY_DURATION,
        level: 1,
        experience: 0
    },
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
    originalBackgroundImage: null, // 원본 크기 배경 이미지
    currentImageSrc: null,
    nextBackgroundImage: null,  // 다음 스테이지를 위해 미리 로드된 이미지 (리사이즈된 버전)
    nextOriginalBackgroundImage: null, // 다음 스테이지를 위해 미리 로드된 원본 이미지
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
    enemiesDefeatedCount: 0,    // 처치한 적의 수
    bossSpawnThreshold: 5,      // 보스 등장에 필요한 적 처치 수 (예시)
    bossSpawned: false,
    speedUpItem: null,
    speedUpSpawnTimerId: null,
    speedUpEffectTimerId: null,
    isPlayerSpeedBoosted: false,
    cameraX: 0,
    cameraY: 0,
    cameraWidth: canvas.width,
    cameraHeight: canvas.height,
    currentWorldWidth: VIRTUAL_WORLD_WIDTH, // 현재 게임 세계의 너비
    currentWorldHeight: VIRTUAL_WORLD_HEIGHT // 현재 게임 세계의 높이
};

function initGame(initialLevel = 1, initialExperience = 0, initialHealth = INITIAL_PLAYER_HEALTH, initialMaxHealth = INITIAL_PLAYER_HEALTH) {
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
    }

    gameState.player = {
        x: 0,
        y: 0,
        trail: [],
        health: initialHealth,
        maxHealth: initialMaxHealth,
        invincible: false,
        invincibleTimer: 0,
        invincibleDuration: PLAYER_INVINCIBILITY_DURATION,
        level: initialLevel,
        experience: initialExperience
    };
    gameState.enemies = [];
    gameState.claimedArea = [];
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
    gameState.enemiesDefeatedCount = 0; // 초기화
    gameState.bossSpawnThreshold = 5; // 초기 보스 등장 임계값 (조절 가능)
    gameState.speedUpItem = null;
    gameState.isPlayerSpeedBoosted = false;
    gameState.cameraX = gameState.player.x - gameState.cameraWidth / 2;
    gameState.cameraY = gameState.player.y - gameState.cameraHeight / 2;
    gameState.cameraWidth = canvas.width; // 카메라 너비를 캔버스 너비로 초기화
    gameState.cameraHeight = canvas.height; // 카메라 높이를 캔버스 높이로 초기화
    gameState.currentWorldWidth = VIRTUAL_WORLD_WIDTH;
    gameState.currentWorldHeight = VIRTUAL_WORLD_HEIGHT;

    if (gameState.speedUpSpawnTimerId) {
        clearInterval(gameState.speedUpSpawnTimerId);
        gameState.speedUpSpawnTimerId = null;
    }
    if (gameState.speedUpEffectTimerId) {
        clearTimeout(gameState.speedUpEffectTimerId);
        gameState.speedUpEffectTimerId = null;
    }
    
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

    // 아이템 생성 타이머 시작
    gameState.speedUpSpawnTimerId = setInterval(() => {
        if (gameState.gameRunning && !gameState.speedUpItem) {
            spawnSpeedUpItem(gameState);
        }
    }, ITEM_SPAWN_INTERVAL);

    render(gameState);
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function updateCameraPosition(gameState) {
    const { player, cameraWidth, cameraHeight } = gameState;
    const cameraDeadZoneX = cameraWidth * 0.2; // 화면 너비의 20% 데드존
    const cameraDeadZoneY = cameraHeight * 0.2; // 화면 높이의 20% 데드존

    // 플레이어가 화면 중앙에서 벗어나면 카메라 이동
    const playerScreenX = player.x - gameState.cameraX;
    const playerScreenY = player.y - gameState.cameraY;

    if (playerScreenX < cameraDeadZoneX) {
        gameState.cameraX = player.x - cameraDeadZoneX;
    } else if (playerScreenX > cameraWidth - cameraDeadZoneX) {
        gameState.cameraX = player.x - (cameraWidth - cameraDeadZoneX);
    }

    if (playerScreenY < cameraDeadZoneY) {
        gameState.cameraY = player.y - cameraDeadZoneY;
    } else if (playerScreenY > cameraHeight - cameraDeadZoneY) {
        gameState.cameraY = player.y - (cameraHeight - cameraDeadZoneY);
    }

    // 카메라가 가상 세계 경계를 벗어나지 않도록 제한
    gameState.cameraX = Math.max(0, Math.min(gameState.currentWorldWidth - cameraWidth, gameState.cameraX));
    gameState.cameraY = Math.max(0, Math.min(gameState.currentWorldHeight - cameraHeight, gameState.cameraY));
}

function getXPForNextLevel(level) {
    return Math.floor(XP_NEEDED_BASE * (XP_NEEDED_MULTIPLIER ** (level - 1)));
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
            // 쇼타임 시 플레이어 위치를 원본 이미지 중앙으로 설정
            gameState.player.x = gameState.originalBackgroundImage.width / 2;
            gameState.player.y = gameState.originalBackgroundImage.height / 2;
            
            // 쇼타임 시 카메라 크기를 원본 이미지 크기로 설정
            gameState.cameraWidth = canvas.width;
            gameState.cameraHeight = canvas.height;
            gameState.currentWorldWidth = gameState.originalBackgroundImage.width;
            gameState.currentWorldHeight = gameState.originalBackgroundImage.height;
            gameState.cameraX = gameState.player.x - canvas.width / 2;
            gameState.cameraY = gameState.player.y - canvas.height / 2;
            
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
        updateCameraPosition(gameState); // 쇼타임 시 카메라 위치 업데이트
    } else if (gameState.gameRunning) {
        movePlayer(gameState);
        updateCameraPosition(gameState); // 카메라 위치 업데이트
        moveEnemies(gameState.enemies, gameState);

        // 플레이어가 무적 상태가 아닐 때만 충돌 검사
        if (!gameState.player.invincible) {
            checkCollisions(gameState);
        }

        // 무적 타이머 업데이트
        if (gameState.player.invincible) {
            gameState.player.invincibleTimer -= (1 / 60); // 60 FPS 기준, 초 단위로 감소
            if (gameState.player.invincibleTimer <= 0) {
                gameState.player.invincible = false; // 무적 상태 해제
                gameState.player.invincibleTimer = 0;
                console.log("Player invincibility ended."); // 디버그용 로그
            }
        }

        if (gameState.player.health <= 0 && !gameState.isGameOverAnimation) {
            gameOver(gameState);
        }

        // 레벨업 체크
        const xpNeeded = getXPForNextLevel(gameState.player.level);
        if (gameState.player.experience >= xpNeeded) {
            gameState.player.level++;
            gameState.player.experience -= xpNeeded; // 초과 경험치는 다음 레벨로 이월
            gameState.player.maxHealth += HEALTH_PER_LEVEL; // 최대 체력 증가
            gameState.player.health = gameState.player.maxHealth; // 체력 회복
            console.log(`Level Up! New Level: ${gameState.player.level}, Max Health: ${gameState.player.maxHealth}`);
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
        img.onload = () => {
            // 임시 캔버스를 생성하여 이미지 리사이즈
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = VIRTUAL_WORLD_WIDTH;
            tempCanvas.height = VIRTUAL_WORLD_HEIGHT;
            tempCtx.drawImage(img, 0, 0, VIRTUAL_WORLD_WIDTH, VIRTUAL_WORLD_HEIGHT);

            // 리사이즈된 이미지를 새로운 Image 객체로 변환
            const resizedImg = new Image();
            resizedImg.onload = () => {
                resolve(resizedImg);
            };
            resizedImg.onerror = reject;
            resizedImg.src = tempCanvas.toDataURL(); // 캔버스 내용을 Data URL로 변환
        };
        img.onerror = reject;
        img.src = getCacheBustedUrl(src);
    });
}

// 이미지를 리사이즈하지 않고 원본 크기 그대로 로드하는 유틸리티 함수
async function loadOriginalImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
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
        gameState.nextOriginalBackgroundImage = await loadOriginalImage(nextImageSrc); // 원본 이미지 로드
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
            gameState.nextOriginalBackgroundImage = await loadOriginalImage(path); // 원본 이미지 로드
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
        gameState.originalBackgroundImage = gameState.nextOriginalBackgroundImage; // 원본 이미지 할당
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
        
        const originalImg = new Image();
        originalImg.onload = () => {
            gameState.originalBackgroundImage = originalImg;
        };
        originalImg.src = getCacheBustedUrl(imageSrc);
        return;
    }

    // 다음 스테이지를 위한 이미지 미리 로드
    preloadNextStageImage();
    
    // 게임 시작 시 레벨과 경험치를 초기화 (새 게임 시작이므로)
    initGame(1, 0);
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
        gameState.originalBackgroundImage = gameState.nextOriginalBackgroundImage; // 원본 이미지 할당
        gameState.currentImageSrc = gameState.nextImageSrc;
        
        // 다음 스테이지를 위한 이미지 다시 미리 로드
        preloadNextStageImage();
        
        // 게임 세계 크기를 원래대로 되돌림
        gameState.currentWorldWidth = VIRTUAL_WORLD_WIDTH;
        gameState.currentWorldHeight = VIRTUAL_WORLD_HEIGHT;

        resetDifficultyStats();
        // 현재 플레이어의 레벨과 경험치를 다음 스테이지로 전달
        initGame(gameState.player.level, gameState.player.experience, gameState.player.health, gameState.player.maxHealth);
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

function spawnSpeedUpItem(gameState) {
    let x, y, gridX, gridY;
    const maxTries = 100; // 무한 루프 방지를 위한 최대 시도 횟수

    for (let i = 0; i < maxTries; i++) {
        x = Math.random() * (canvas.width - ITEM_SIZE) + ITEM_SIZE / 2;
        y = Math.random() * (canvas.height - ITEM_SIZE) + ITEM_SIZE / 2;
        gridX = Math.floor(x / GRID_SIZE);
        gridY = Math.floor(y / GRID_SIZE);

        // 점령되지 않은 영역에만 생성
        if (!isAreaClaimed(gridX, gridY)) {
            gameState.speedUpItem = {
                x: x,
                y: y,
                size: ITEM_SIZE,
                text: "Speed Up"
            };
            return;
        }
    }
    console.warn("아이템을 생성할 안전한 위치를 찾지 못했습니다.");
}

export function applySpeedUpEffect(gameState) {
    gameState.isPlayerSpeedBoosted = true;
    // 플레이어 속도 조절은 player.js에서 담당

    // 기존 타이머가 있다면 클리어
    if (gameState.speedUpEffectTimerId) {
        clearTimeout(gameState.speedUpEffectTimerId);
    }

    gameState.speedUpEffectTimerId = setTimeout(() => {
        resetSpeedUpEffect(gameState);
    }, SPEED_UP_DURATION);
}

function resetSpeedUpEffect(gameState) {
    gameState.isPlayerSpeedBoosted = false;
    gameState.speedUpEffectTimerId = null;
}
