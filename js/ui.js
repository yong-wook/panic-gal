import { calculatePercentage } from './area.js';
import { GRID_SIZE, ITEM_SIZE, ITEM_COLOR, ITEM_TEXT_COLOR, ITEM_FONT } from './config.js';
import { ctx, canvas } from './context.js';

const enemiesLeftSpan = document.getElementById('enemiesLeft');
const livesSpan = document.getElementById('lives');
const scoreSpan = document.getElementById('score');
const timerSpan = document.getElementById('timer');

const gameOverDiv = document.getElementById('gameOver');
const finalScoreSpan = document.getElementById('finalScore');
const finalPercentageSpan = document.getElementById('finalPercentage');
const countdownDiv = document.getElementById('countdown');
const stageSelectDiv = document.getElementById('stage-select');
const gameContainerDiv = document.querySelector('.game-container');

export function updateUI(gameState) {
    enemiesLeftSpan.textContent = gameState.enemies.length;
    livesSpan.textContent = gameState.lives;
    scoreSpan.textContent = gameState.score;
    timerSpan.textContent = gameState.timeLeft >= 0 ? gameState.timeLeft : 0;
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

    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height / 2;

    const sx = gameState.player.x - halfWidth;
    const sy = gameState.player.y - halfHeight;

    ctx.drawImage(gameState.backgroundImage, sx, sy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

    countdownDiv.textContent = gameState.showtimeCountdown >= 0 ? gameState.showtimeCountdown : '';
}

function renderTransition(gameState) {
    const elapsed = Date.now() - gameState.transitionStartTime;
    const progress = Math.min(elapsed / 5000, 1.0);

    const blurValue = 5 * (1 - progress);
    const scaleValue = 1 + 0.2 * progress;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scaleValue, scaleValue);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    ctx.filter = `blur(${blurValue}px)`;
    ctx.drawImage(gameState.backgroundImage, 0, 0, canvas.width, canvas.height);
    
    ctx.restore();
}

function renderGameplay(gameState) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'invert(1) grayscale(1) brightness(0.5) blur(2px)';
    ctx.drawImage(gameState.backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    ctx.save();
    ctx.beginPath();
    gameState.claimedArea.forEach(area => {
        ctx.rect(area.x * GRID_SIZE, area.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });
    ctx.clip();
    ctx.filter = 'blur(5px)';
    ctx.drawImage(gameState.backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.fillStyle = '#ffeb3b';
    gameState.player.trail.forEach(point => {
        ctx.fillRect(point.x * GRID_SIZE, point.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });

    const PLAYER_VISUAL_SIZE = 16;  // 시각적 크기
    const PLAYER_ACTUAL_SIZE = 8;   // 실제 충돌 크기
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
        gameState.player.x - PLAYER_OFFSET,
        gameState.player.y - PLAYER_OFFSET,
        PLAYER_VISUAL_SIZE,
        PLAYER_VISUAL_SIZE
    );
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    gameState.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
    });

    updateUI(gameState);

    // 아이템 렌더링
    if (gameState.speedUpItem) {
        ctx.fillStyle = ITEM_COLOR;
        ctx.fillRect(
            gameState.speedUpItem.x - gameState.speedUpItem.size / 2,
            gameState.speedUpItem.y - gameState.speedUpItem.size / 2,
            gameState.speedUpItem.size,
            gameState.speedUpItem.size
        );

        ctx.fillStyle = ITEM_TEXT_COLOR;
        ctx.font = ITEM_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            gameState.speedUpItem.text,
            gameState.speedUpItem.x,
            gameState.speedUpItem.y
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
    }
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

// 무적 상태 메시지 표시
export function showInvincibleMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'invincible-message';
    messageDiv.textContent = '10초간 무적!';
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000); // 3초 후 메시지 제거
}