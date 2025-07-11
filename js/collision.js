import { GRID_SIZE, ITEM_SIZE } from './config.js';
import { ENEMY_TYPE } from './enemy.js';
import { isAreaClaimed } from './area.js';
import { applySpeedUpEffect } from './main.js';

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

function handleCollision(gameState) {
    if (gameState.isInvincible) return; // 무적 상태면 충돌 무시
    
    gameState.lives--;
    if (gameState.lives <= 0) {
        gameState.isGameOver = true;
    } else {
        // Reset player trail and position after a collision
        gameState.player.trail = [];
        // Optionally, reset player to a safe position, e.g., top-left corner
        gameState.player.x = 0;
        gameState.player.y = 0;
    }
}

export function checkCollisions(gameState) {
    if (gameState.isGameOver) return;

    // 무적 상태 체크
    if (gameState.isInvincible && Date.now() - gameState.invincibleStartTime >= gameState.invincibleDuration) {
        console.log('무적 상태 종료');
        gameState.isInvincible = false;
        gameState.invincibleStartTime = null;
        showInvincibilityEndMessage();
    }

    // 보스와의 충돌 체크를 위한 배열 복사
    const enemies = [...gameState.enemies];
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dx = enemy.x - gameState.player.x;
        const dy = enemy.y - gameState.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 플레이어와의 직접 충돌 체크
        if (distance < enemy.size + 4) {
            if (gameState.player.trail.length > 0) {
                handleCollision(gameState);
            }
        }

        // 이동 경로와의 충돌 체크
        gameState.player.trail.forEach(point => {
            const trailX = point.x * GRID_SIZE + GRID_SIZE / 2;
            const trailY = point.y * GRID_SIZE + GRID_SIZE / 2;
            const trailDx = enemy.x - trailX;
            const trailDy = enemy.y - trailY;
            const trailDistance = Math.sqrt(trailDx * trailDx + trailDy * trailDy);

            if (trailDistance < enemy.size + GRID_SIZE / 2) {
                if (!gameState.isInvincible) {
                    handleCollision(gameState);
                }
            }
        });
    }

    // 아이템과의 충돌 체크
    checkItemCollision(gameState);
}

function checkItemCollision(gameState) {
    if (!gameState.speedUpItem) return; // 아이템이 없으면 체크하지 않음

    const item = gameState.speedUpItem;
    const player = gameState.player;

    // 플레이어와 아이템의 충돌 범위 계산
    const playerLeft = player.x;
    const playerRight = player.x + 8; // 플레이어 크기 8x8
    const playerTop = player.y;
    const playerBottom = player.y + 8;

    const itemLeft = item.x - item.size / 2;
    const itemRight = item.x + item.size / 2;
    const itemTop = item.y - item.size / 2;
    const itemBottom = item.y + item.size / 2;

    // 충돌 감지 (AABB 충돌)
    if (playerRight > itemLeft && playerLeft < itemRight &&
        playerBottom > itemTop && playerTop < itemBottom) {
        
        // 아이템 획득
        gameState.speedUpItem = null; // 아이템 제거
        applySpeedUpEffect(gameState); // 효과 적용
    }
}