import { calculatePercentage } from './area.js';
import { GRID_SIZE } from './config.js';
import { ctx, canvas } from './context.js';

const percentageSpan = document.getElementById('percentage');
const livesSpan = document.getElementById('lives');
const scoreSpan = document.getElementById('score');
const timerSpan = document.getElementById('timer');

const gameOverDiv = document.getElementById('gameOver');
const finalScoreSpan = document.getElementById('finalScore');
const finalPercentageSpan = document.getElementById('finalPercentage');
const countdownDiv = document.getElementById('countdown');

export function updateUI(gameState) {
    percentageSpan.textContent = calculatePercentage(gameState.claimedArea) + '%';
    livesSpan.textContent = gameState.lives;
    scoreSpan.textContent = gameState.score;
    timerSpan.textContent = gameState.timeLeft >= 0 ? gameState.timeLeft : 0;
}

export function gameOver(gameState) {
    if (!gameState.gameRunning) return;
    gameState.gameRunning = false;
    gameOverDiv.style.display = 'block';
    finalScoreSpan.textContent = gameState.score;
    finalPercentageSpan.textContent = calculatePercentage(gameState.claimedArea) + '%';
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

    ctx.fillStyle = '#8bc34a';
    ctx.fillRect(gameState.player.x, gameState.player.y, 8, 8);

    ctx.fillStyle = '#f44336';
    gameState.enemies.forEach(enemy => {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
    });

    updateUI(gameState);
}

export function render(gameState) {
    if (!gameState.backgroundImage) return;

    if (gameState.transitioningToShowtime) {
        renderTransition(gameState);
    } else if (gameState.showtime) {
        renderShowtime(gameState);
    } else if (gameState.gameRunning) {
        renderGameplay(gameState);
    }
}