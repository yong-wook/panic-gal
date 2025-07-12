import { canvas, COLS, ROWS } from './context.js';
import { isAreaClaimed } from './area.js';
import { GRID_SIZE, VIRTUAL_WORLD_WIDTH, VIRTUAL_WORLD_HEIGHT } from './config.js';
import { difficulty } from './difficulty.js';

// 적 타입 상수 정의
export const ENEMY_TYPE = {
    SIMPLE: 'SIMPLE',   // 단순 직선 이동
    NORMAL: 'NORMAL',   // 기존처럼 랜덤하게 방향 전환
    BOSS: 'BOSS'       // 보스 (플레이어 추적)
};

// 적 타입별 색상 정의
const ENEMY_COLORS = {
    [ENEMY_TYPE.SIMPLE]: '#FF6B6B',  // 빨간색 계열
    [ENEMY_TYPE.NORMAL]: '#4ECDC4',  // 청록색 계열
    [ENEMY_TYPE.BOSS]: '#FFD93D'     // 노란색 계열
};

// 적 타입별 크기 정의
const ENEMY_SIZES = {
    [ENEMY_TYPE.SIMPLE]: 16,
    [ENEMY_TYPE.NORMAL]: 20,
    [ENEMY_TYPE.BOSS]: 30
};

function getRandomEnemyType() {
    const rand = Math.random();
    const normalRatio = difficulty.ENEMY_TYPES.NORMAL / (difficulty.ENEMY_TYPES.SIMPLE + difficulty.ENEMY_TYPES.NORMAL);
    
    return rand < normalRatio ? ENEMY_TYPE.NORMAL : ENEMY_TYPE.SIMPLE;
}

export function createEnemy() {
    const x = Math.random() * (VIRTUAL_WORLD_WIDTH - 40) + 20;
    const y = Math.random() * (VIRTUAL_WORLD_HEIGHT - 40) + 20;
    const angle = Math.random() * Math.PI * 2;
    const type = getRandomEnemyType();
    
    const baseSpeed = Math.random() * (difficulty.ENEMY_SPEED_MAX - difficulty.ENEMY_SPEED_MIN) + difficulty.ENEMY_SPEED_MIN;
    
    return {
        x, y,
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
        size: ENEMY_SIZES[type],
        color: ENEMY_COLORS[type],
        type,
        baseSpeed,
        lastDirectionChange: 0
    };
}

export function createBoss() {
    if (difficulty.ENEMY_TYPES.BOSS_COUNT === 0) return null;

    let x, y, gridX, gridY;
    const maxTries = 100; // 무한 루프 방지를 위한 최대 시도 횟수

    for (let i = 0; i < maxTries; i++) {
        x = Math.random() * (VIRTUAL_WORLD_WIDTH - 40) + 20;
        y = Math.random() * (VIRTUAL_WORLD_HEIGHT - 40) + 20;
        gridX = Math.floor(x / GRID_SIZE);
        gridY = Math.floor(y / GRID_SIZE);

        if (!isAreaClaimed(gridX, gridY)) {
            break; // 유효한 위치를 찾았으므로 루프 종료
        }

        if (i === maxTries - 1) {
            console.warn("보스를 생성할 안전한 위치를 찾지 못했습니다.");
            return null; // 안전한 위치를 찾지 못하면 보스를 생성하지 않음
        }
    }

    const angle = Math.random() * Math.PI * 2;
    const type = ENEMY_TYPE.BOSS;
    const baseSpeed = difficulty.ENEMY_SPEED_MAX;
    
    return {
        x, y,
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
        size: ENEMY_SIZES[type],
        color: ENEMY_COLORS[type],
        type,
        baseSpeed,
        lastDirectionChange: 0
    };
}

function moveSimpleEnemy(enemy) {
    // 단순히 현재 방향으로 계속 이동
    return {
        nextX: enemy.x + enemy.vx,
        nextY: enemy.y + enemy.vy
    };
}

function moveNormalEnemy(enemy) {
    // 5% 확률로 적의 이동 각도를 약간 변경
    if (Math.random() < 0.05) {
        const angle = Math.atan2(enemy.vy, enemy.vx);
        const speed = enemy.baseSpeed;
        const angleOffset = (Math.random() - 0.5) * Math.PI / 4;
        enemy.vx = Math.cos(angle + angleOffset) * speed;
        enemy.vy = Math.sin(angle + angleOffset) * speed;
    }
    
    return {
        nextX: enemy.x + enemy.vx,
        nextY: enemy.y + enemy.vy
    };
}

function moveBossEnemy(enemy, gameState) {
    const now = Date.now();
    // 0.5초마다 방향 재계산 (보스는 더 자주 방향을 바꿈)
    if (now - enemy.lastDirectionChange > 500) {
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        
        // 플레이어 방향으로 이동하되, 약간의 랜덤성 추가
        const randomOffset = (Math.random() - 0.5) * Math.PI / 6; // ±30도
        enemy.vx = Math.cos(angle + randomOffset) * enemy.baseSpeed;
        enemy.vy = Math.sin(angle + randomOffset) * enemy.baseSpeed;
        
        enemy.lastDirectionChange = now;
    }
    
    return {
        nextX: enemy.x + enemy.vx,
        nextY: enemy.y + enemy.vy
    };
}

export function moveEnemies(enemies, gameState) {
    enemies.forEach(enemy => {
        let nextPosition;
        
        // 적 타입에 따른 이동 로직 적용
        switch (enemy.type) {
            case ENEMY_TYPE.SIMPLE:
                nextPosition = moveSimpleEnemy(enemy);
                break;
            case ENEMY_TYPE.NORMAL:
                nextPosition = moveNormalEnemy(enemy);
                break;
            case ENEMY_TYPE.BOSS:
                nextPosition = moveBossEnemy(enemy, gameState);
                break;
        }

        let { nextX, nextY } = nextPosition;

        // 벽 충돌 감지
        if (nextX <= enemy.size || nextX >= VIRTUAL_WORLD_WIDTH - enemy.size) {
            enemy.vx = -enemy.vx;
            nextX = enemy.x + enemy.vx;
        }
        if (nextY <= enemy.size || nextY >= VIRTUAL_WORLD_HEIGHT - enemy.size) {
            enemy.vy = -enemy.vy;
            nextY = enemy.y + enemy.vy;
        }

        // 점령된 영역과의 충돌 감지
        const nextGridX = Math.floor(nextX / GRID_SIZE);
        const nextGridY = Math.floor(nextY / GRID_SIZE);

        if (isAreaClaimed(nextGridX, nextGridY)) {
            const currentGridX = Math.floor(enemy.x / GRID_SIZE);
            const currentGridY = Math.floor(enemy.y / GRID_SIZE);

            const movedHorizontally = nextGridX !== currentGridX;
            const movedVertically = nextGridY !== currentGridY;

            let bounced = false;
            if (movedHorizontally && isAreaClaimed(nextGridX, currentGridY)) {
                enemy.vx = -enemy.vx;
                bounced = true;
            }
            if (movedVertically && isAreaClaimed(currentGridX, nextGridY)) {
                enemy.vy = -enemy.vy;
                bounced = true;
            }

            if (!bounced) {
                enemy.vx = -enemy.vx;
                enemy.vy = -enemy.vy;
            }
            
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
        } else {
            enemy.x = nextX;
            enemy.y = nextY;
        }

        // 경계선 내 위치 조정
        enemy.x = Math.max(enemy.size, Math.min(VIRTUAL_WORLD_WIDTH - enemy.size, enemy.x));
        enemy.y = Math.max(enemy.size, Math.min(VIRTUAL_WORLD_HEIGHT - enemy.size, enemy.y));
    });
}

// 새 스테이지 시작 시 보스 생성 상태 초기화
export function resetBossState() {
    // 이 함수는 더 이상 필요하지 않지만, main.js에서 호출하고 있으므로 남겨둡니다.
}