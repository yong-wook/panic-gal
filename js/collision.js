import { GRID_SIZE, ITEM_SIZE, PLAYER_SIZE } from './config.js';
import { ENEMY_TYPE } from './enemy.js';
import { isAreaClaimed } from './area.js';
import { applySpeedUpEffect } from './main.js';
import { showInvincibleMessage, showInvincibilityEndMessage } from './ui.js';

export function checkCollisions(gameState) {
    if (gameState.isGameOver) return;

    // 플레이어의 무적 상태는 main.js에서 관리하므로 여기서는 별도로 체크하지 않음

    // 보스와의 충돌 체크를 위한 배열 복사
    const enemies = [...gameState.enemies];
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dx = enemy.x - gameState.player.x;
        const dy = enemy.y - gameState.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 플레이어와의 직접 충돌 체크
        if (distance < enemy.size + 4) {
            // 플레이어가 선을 긋는 중이거나, 이미 점령된 영역이 아닌 곳에 있을 때만 피해를 입음
            if (gameState.player.trail.length > 0 || !isAreaClaimed(Math.floor(gameState.player.x / GRID_SIZE), Math.floor(gameState.player.y / GRID_SIZE))) {
                if (!gameState.player.invincible) {
                    if (enemy.type === ENEMY_TYPE.BOSS) {
                        gameState.player.health -= Math.ceil(gameState.player.maxHealth / 2); // 최대 체력의 절반 감소
                    } else {
                        gameState.player.health -= enemy.damage; // 일반 적은 적의 damage 값만큼 감소
                    }
                    gameState.player.invincible = true; // 무적 상태로 전환
                    gameState.player.invincibleTimer = gameState.player.invincibleDuration; // 무적 타이머 시작
                    gameState.player.trail = []; // 플레이어가 적과 직접 충돌 시 트레일 초기화

                    if (gameState.player.health <= 0) {
                        // TODO: 게임 오버 또는 목숨 감소 로직 호출
                        // 현재는 임시로 콘솔 로그만 남김. 실제 게임 오버 로직은 main.js에서 처리
                        console.log("Player defeated!"); 
                        gameState.isGameOver = true; // 게임 오버 상태로 전환
                    }
                    console.log(`Player hit! Health: ${gameState.player.health}`); // 디버그용 로그
                }
            }
        }

        // 이동 경로와의 충돌 체크 (선을 긋는 도중 적이 선에 닿는 경우)
        gameState.player.trail.forEach(point => {
            const trailX = point.x * GRID_SIZE + GRID_SIZE / 2;
            const trailY = point.y * GRID_SIZE + GRID_SIZE / 2;
            const trailDx = enemy.x - trailX;
            const trailDy = enemy.y - trailY;
            const trailDistance = Math.sqrt(trailDx * trailDx + trailDy * trailDy);

            if (trailDistance < enemy.size + GRID_SIZE / 2) {
                if (!gameState.player.invincible) {
                    if (enemy.type === ENEMY_TYPE.BOSS) {
                        gameState.player.health -= Math.ceil(gameState.player.maxHealth / 2); // 최대 체력의 절반 감소
                    } else {
                        gameState.player.health -= enemy.damage; // 일반 적은 적의 damage 값만큼 감소
                    }
                    gameState.player.invincible = true; // 무적 상태로 전환
                    gameState.player.invincibleTimer = gameState.player.invincibleDuration; // 무적 타이머 시작

                    if (gameState.player.health <= 0) {
                        console.log("Player defeated by trail collision!");
                        gameState.isGameOver = true; // 게임 오버 상태로 전환
                    }
                    console.log(`Player hit on trail! Health: ${gameState.player.health}`); // 디버그용 로그
                    gameState.player.trail = []; // 선을 긋는 도중 충돌 시 선 초기화
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
    const playerRight = player.x + PLAYER_SIZE;
    const playerTop = player.y;
    const playerBottom = player.y + PLAYER_SIZE;

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