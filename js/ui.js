import { calculatePercentage } from './area.js';
import { GRID_SIZE, ITEM_SIZE, ITEM_COLOR, ITEM_TEXT_COLOR, ITEM_FONT, PLAYER_SIZE, VIRTUAL_WORLD_WIDTH, VIRTUAL_WORLD_HEIGHT, XP_NEEDED_BASE, XP_NEEDED_MULTIPLIER } from './config.js';
import { ctx, canvas } from './context.js';

const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');

const enemiesLeftSpan = document.getElementById('enemiesLeft');
const healthSpan = document.getElementById('health');
const scoreSpan = document.getElementById('score');

const gameOverDiv = document.getElementById('gameOver');
const finalScoreSpan = document.getElementById('finalScore');
const finalPercentageSpan = document.getElementById('finalPercentage');
const countdownDiv = document.getElementById('countdown');
const stageSelectDiv = document.getElementById('stage-select');
const gameContainerDiv = document.querySelector('.game-container');

const tauntMessages = [
    "고작 한 마리 가지고 우쭐대기는...",
    "그 속도로 잡다간 내일 클리어 하겠네",
    "너무 느리잖아? 거북이도 너보단 빠르겠다.",
    "에게, 겨우 한 마리?",
    "넌 가망이 없어보이네",
    "이봐, 잠 오는 속도잖아.",
    "그 실력으로 괜찮겠어?",
    "한 마리 잡고 좋아하는 거 아니지?",
    "이 정도는 튜토리얼 수준이라고.",
    "그러다 정신 못차리고 게임오버 된다."
];

const lifeLostMessages = [
    "역시 네가 그러면 그렇지.",
    "꼴 좋군.",
    "어때, 내 공격은 좀 아플걸?",
    "정신 똑바로 차리는 게 좋을 거야.",
    "이 정도에 당황하면 곤란한데.",
    "아직 시작도 안 했어.",
    "실망스러운 움직임이군.",
    "그렇게 해서 날 이길 수 있겠어?"
];

export function updateUI(gameState) {
    enemiesLeftSpan.textContent = gameState.enemies.length;
    scoreSpan.textContent = gameState.score;
}

function drawHealthBar(player, ctx) {
    const barWidth = 100;
    const barHeight = 10;
    const x = 10; // 체력 바 위치 (좌측 상단)
    const y = 10;

    // 배경 바 (최대 체력)
    ctx.fillStyle = 'gray';
    ctx.fillRect(x, y, barWidth, barHeight);

    // 현재 체력 바
    const currentHealthWidth = (player.health / player.maxHealth) * barWidth;
    ctx.fillStyle = 'red'; // 체력 색상
    ctx.fillRect(x, y, currentHealthWidth, barHeight);

    // 테두리
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y, barWidth, barHeight);

    // 텍스트 (선택 사항)
    ctx.fillStyle = 'white';
    ctx.font = '8px Arial';
    ctx.fillText(`${player.health}/${player.maxHealth}`, x + barWidth / 2 - 15, y + barHeight / 2 + 3);
}

function drawPlayerStats(player, ctx) {
    const x = 10; // UI 위치 (좌측 하단)
    const y = canvas.height - 30; // 캔버스 하단에서 30px 위

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    // XP_NEEDED_BASE와 XP_NEEDED_MULTIPLIER는 config.js에서 가져와야 합니다.
    // ui.js에서도 config를 import 해야 합니다.
    // 임시로 값을 사용하지 않고 config에서 가져오도록 수정합니다.
    const xpNeeded = Math.floor(100 * (1.5 ** (player.level - 1))); // 임시 값 대신 config에서 가져온 값 사용
    ctx.fillText(`Level: ${player.level}`, x, y);
    ctx.fillText(`XP: ${player.experience} / ${xpNeeded}`, x, y + 15);
}

export function gameOver(gameState) {
    if (!gameState.gameRunning) return;
    gameState.gameRunning = false;
    gameState.gameOverStartTime = Date.now();
    gameState.isGameOverAnimation = true;
    
    // 5초 후에 게임오버 UI를 표시하고 스테이지 선택으로 돌아가기
    setTimeout(() => {
        gameState.isGameOverAnimation = false;
        gameOverDiv.style.display = 'none';
        stageSelectDiv.style.display = 'block';
        gameContainerDiv.style.display = 'none';
        if (gameState.animationFrameId) {
            cancelAnimationFrame(gameState.animationFrameId);
            gameState.animationFrameId = null;
        }
    }, 5000);
}

function renderGameOver(gameState) {
    const elapsed = Date.now() - gameState.gameOverStartTime;
    const progress = Math.min(elapsed / 5000, 1.0); // 5초 동안 진행

    // 기존 게임 화면을 먼저 렌더링
    renderGameplay(gameState);

    // 화면을 점점 어둡게
    ctx.fillStyle = `rgba(0, 0, 0, ${progress * 0.95})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // GAME OVER 텍스트 표시
    const fontSize = Math.min(canvas.width / 10, 100); // 반응형 폰트 크기
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(progress * 2, 1)})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 텍스트에 그림자 효과 추가
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    
    // 그림자 효과 초기화
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function renderShowtime(gameState) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 원본 이미지를 사용하고 카메라 로직 적용
    if (gameState.originalBackgroundImage) {
        ctx.drawImage(
            gameState.originalBackgroundImage,
            gameState.cameraX,
            gameState.cameraY,
            gameState.cameraWidth,
            gameState.cameraHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    // 플레이어 렌더링 (쇼타임에서는 플레이어가 원본 이미지 위를 움직임)
    ctx.fillStyle = '#8bc34a';
    ctx.fillRect(
        gameState.player.x - gameState.cameraX,
        gameState.player.y - gameState.cameraY,
        PLAYER_SIZE,
        PLAYER_SIZE
    );

    countdownDiv.textContent = gameState.showtimeCountdown >= 0 ? gameState.showtimeCountdown : '';
}

function renderTransition(gameState) {
    const elapsed = Date.now() - gameState.transitionStartTime;
    const progress = Math.min(elapsed / 5000, 1.0); // 5초 동안 진행

    // 블러 값: 5px에서 0px으로 감소
    const blurValue = 5 * (1 - progress);
    // 스케일 값: 캔버스에 꽉 차는 크기에서 1.05배까지 확대
    const initialScale = Math.max(canvas.width / gameState.backgroundImage.width, canvas.height / gameState.backgroundImage.height);
    const targetScale = 1.05; // 최종적으로 약간 확대된 상태
    const scaleValue = initialScale + (targetScale - initialScale) * progress;

    // 밝기 및 대비: 0.5에서 1.0으로 증가 (흐림 -> 선명)
    const brightnessValue = 0.5 + 0.5 * progress;
    const contrastValue = 0.5 + 0.5 * progress;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // 이미지 중앙 정렬을 위한 translate
    const imgWidth = gameState.backgroundImage.width * scaleValue;
    const imgHeight = gameState.backgroundImage.height * scaleValue;
    const dx = (canvas.width - imgWidth) / 2;
    const dy = (canvas.height - imgHeight) / 2;

    ctx.filter = `blur(${blurValue}px) brightness(${brightnessValue}) contrast(${contrastValue})`;
    ctx.drawImage(gameState.backgroundImage, dx, dy, imgWidth, imgHeight);
    
    ctx.restore();
}

function renderGameplay(gameState) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'invert(1) grayscale(1) brightness(0.5) blur(2px)';
    ctx.drawImage(gameState.backgroundImage, gameState.cameraX, gameState.cameraY, gameState.cameraWidth, gameState.cameraHeight, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    ctx.save();
    ctx.beginPath();
    gameState.claimedArea.forEach(area => {
        ctx.rect(area.x * GRID_SIZE - gameState.cameraX, area.y * GRID_SIZE - gameState.cameraY, GRID_SIZE, GRID_SIZE);
    });
    ctx.clip();
    ctx.filter = 'blur(10px)'; // 흐린 정도를 두 배로 증가
    ctx.drawImage(gameState.backgroundImage, gameState.cameraX, gameState.cameraY, gameState.cameraWidth, gameState.cameraHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.fillStyle = '#ffeb3b';
    gameState.player.trail.forEach(point => {
        ctx.fillRect(point.x * GRID_SIZE - gameState.cameraX, point.y * GRID_SIZE - gameState.cameraY, GRID_SIZE, GRID_SIZE);
    });

    const PLAYER_VISUAL_SIZE = PLAYER_SIZE;  // 시각적 크기
    const PLAYER_ACTUAL_SIZE = PLAYER_SIZE;   // 실제 충돌 크기
    const PLAYER_OFFSET = (PLAYER_VISUAL_SIZE - PLAYER_ACTUAL_SIZE) / 2;  // 중앙 정렬을 위한 오프셋

    if (gameState.isInvincible) {
        const blinkRate = Date.now() % 500 < 250;
        if (blinkRate) {
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;  // 더 큰 발광 효과
        } else {
            ctx.fillStyle = '#8bc34a';
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }
    } else {
        ctx.fillStyle = '#8bc34a';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }
    
    ctx.fillRect(
        gameState.player.x - PLAYER_OFFSET - gameState.cameraX,
        gameState.player.y - PLAYER_OFFSET - gameState.cameraY,
        PLAYER_VISUAL_SIZE,
        PLAYER_VISUAL_SIZE
    );
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    gameState.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x - gameState.cameraX, enemy.y - gameState.cameraY, enemy.size, 0, Math.PI * 2);
        ctx.fill();
    });

    updateUI(gameState);
    drawHealthBar(gameState.player, ctx); // 체력 바 그리기
    drawPlayerStats(gameState.player, ctx); // 플레이어 스탯 그리기

    // 아이템 렌더링
    if (gameState.speedUpItem) {
        ctx.fillStyle = ITEM_COLOR;
        ctx.fillRect(
            gameState.speedUpItem.x - gameState.speedUpItem.size / 2 - gameState.cameraX,
            gameState.speedUpItem.y - gameState.speedUpItem.size / 2 - gameState.cameraY,
            gameState.speedUpItem.size,
            gameState.speedUpItem.size
        );

        ctx.fillStyle = ITEM_TEXT_COLOR;
        ctx.font = ITEM_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            gameState.speedUpItem.text,
            gameState.speedUpItem.x - gameState.cameraX,
            gameState.speedUpItem.y - gameState.cameraY
        );
    }
}

export function render(gameState) {
    if (!gameState.backgroundImage) return;

    if (gameState.isGameOverAnimation) {
        renderGameOver(gameState);
    } else if (gameState.transitioningToShowtime) {
        renderTransition(gameState);
    } else if (gameState.showtime) {
        renderShowtime(gameState);
    } else if (gameState.gameRunning) {
        renderGameplay(gameState);
        renderMinimap(gameState);
    }
}


function renderMinimap(gameState) {
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // 미니맵 배경 (전체 가상 세계)
    if (gameState.backgroundImage) {
        minimapCtx.filter = 'invert(1)'; // 네거티브 효과 적용
        minimapCtx.drawImage(gameState.backgroundImage, 0, 0, VIRTUAL_WORLD_WIDTH, VIRTUAL_WORLD_HEIGHT, 0, 0, minimapCanvas.width, minimapCanvas.height);
        minimapCtx.filter = 'none'; // 필터 초기화
    }

    // 미니맵에 점령된 영역 표시
    minimapCtx.fillStyle = 'rgba(255, 255, 0, 0.5)'; // 노란색 반투명
    gameState.claimedArea.forEach(area => {
        const miniX = (area.x * GRID_SIZE / VIRTUAL_WORLD_WIDTH) * minimapCanvas.width;
        const miniY = (area.y * GRID_SIZE / VIRTUAL_WORLD_HEIGHT) * minimapCanvas.height;
        const miniSizeX = (GRID_SIZE / VIRTUAL_WORLD_WIDTH) * minimapCanvas.width;
        const miniSizeY = (GRID_SIZE / VIRTUAL_WORLD_HEIGHT) * minimapCanvas.height;
        minimapCtx.fillRect(miniX, miniY, miniSizeX, miniSizeY);
    });

    // 미니맵에 플레이어 위치 표시
    minimapCtx.fillStyle = 'blue';
    const playerMiniX = (gameState.player.x / VIRTUAL_WORLD_WIDTH) * minimapCanvas.width;
    const playerMiniY = (gameState.player.y / VIRTUAL_WORLD_HEIGHT) * minimapCanvas.height;
    minimapCtx.fillRect(playerMiniX, playerMiniY, 5, 5); // 플레이어는 작은 사각형으로 표시

    // 미니맵에 적 위치 표시
    gameState.enemies.forEach(enemy => {
        minimapCtx.fillStyle = enemy.color;
        const enemyMiniX = (enemy.x / VIRTUAL_WORLD_WIDTH) * minimapCanvas.width;
        const enemyMiniY = (enemy.y / VIRTUAL_WORLD_HEIGHT) * minimapCanvas.height;
        minimapCtx.beginPath();
        minimapCtx.arc(enemyMiniX, enemyMiniY, 3, 0, Math.PI * 2); // 적은 작은 원으로 표시
        minimapCtx.fill();
    });

    // 현재 카메라 뷰포트 표시
    minimapCtx.strokeStyle = 'red';
    minimapCtx.lineWidth = 1;
    const viewX = (gameState.cameraX / VIRTUAL_WORLD_WIDTH) * minimapCanvas.width;
    const viewY = (gameState.cameraY / VIRTUAL_WORLD_HEIGHT) * minimapCanvas.height;
    const viewWidth = (gameState.cameraWidth / VIRTUAL_WORLD_WIDTH) * minimapCanvas.width;
    const viewHeight = (gameState.cameraHeight / VIRTUAL_WORLD_HEIGHT) * minimapCanvas.height;
    minimapCtx.strokeRect(viewX, viewY, viewWidth, viewHeight);
}

export function showInvincibleMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = '10초 무적!';
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '50%';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.fontSize = '24px';
    messageDiv.style.color = '#FFD700';
    messageDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.transition = 'opacity 0.5s';
    messageDiv.style.opacity = '1';
    
    document.body.appendChild(messageDiv);
    
    // 2초 후에 메시지 페이드 아웃
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 500);
    }, 2000);
}

export function showInvincibilityEndMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = '무적 종료!';
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '50%';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.fontSize = '24px';
    messageDiv.style.color = '#FFFFFF'; // 흰색으로 변경
    messageDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.transition = 'opacity 0.5s';
    messageDiv.style.opacity = '1';
    
    document.body.appendChild(messageDiv);
    
    // 2초 후에 메시지 페이드 아웃
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 500);
    }, 2000);
}

// 보스 등장 메시지 표시
export function showBossMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'boss-message';
    messageDiv.textContent = '보스 등장!';
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000); // 3초 후 메시지 제거
}

export function showEnemyDefeatedMessage() {
    const messageDiv = document.createElement('div');
    const randomMessage = tauntMessages[Math.floor(Math.random() * tauntMessages.length)];
    messageDiv.textContent = randomMessage;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '50%';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.fontSize = '36px';
    messageDiv.style.color = '#FF0000'; // 도발 멘트는 빨간색으로
    messageDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.opacity = '1';
    messageDiv.style.transition = 'opacity 0.5s, transform 0.5s';
    
    document.body.appendChild(messageDiv);
    
    // 1초 후에 메시지 페이드 아웃 및 위로 이동
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translate(-50%, -70%)';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 500); // transition 시간과 일치
    }, 1000);
}

export function showLifeLostMessage() {
    const messageDiv = document.createElement('div');
    const randomMessage = lifeLostMessages[Math.floor(Math.random() * lifeLostMessages.length)];
    messageDiv.textContent = randomMessage;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '60%'; // 적 처치 메시지와 겹치지 않도록 위치 조정
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.fontSize = '32px'; // 폰트 크기 약간 작게
    messageDiv.style.color = '#FFFF00'; // 생명력 감소 멘트는 노란색으로
    messageDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.opacity = '1';
    messageDiv.style.transition = 'opacity 0.5s, transform 0.5s';
    
    document.body.appendChild(messageDiv);
    
    // 1초 후에 메시지 페이드 아웃 및 위로 이동
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translate(-50%, -70%)';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 500); // transition 시간과 일치
    }, 1000);
}

