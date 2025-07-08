import { canvas, COLS, ROWS } from './context.js';
import { isAreaClaimed } from './area.js';
import { GRID_SIZE } from './config.js';
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
    [ENEMY_TYPE.SIMPLE]: 8,
    [ENEMY_TYPE.NORMAL]: 10,
    [ENEMY_TYPE.BOSS]: 15
};

let bossCreated = false; // 보스 생성 여부 추적

function getRandomEnemyType() {
    // 보스가 아직 생성되지 않았고, 보스를 생성해야 하는 경우
    if (!bossCreated && difficulty.ENEMY_TYPES.BOSS_COUNT > 0) {
        bossCreated = true;
        return ENEMY_TYPE.BOSS;
    }

    const rand = Math.random();
    const normalRatio = difficulty.ENEMY_TYPES.NORMAL / (difficulty.ENEMY_TYPES.SIMPLE + difficulty.ENEMY_TYPES.NORMAL);
    
    return rand < normalRatio ? ENEMY_TYPE.NORMAL : ENEMY_TYPE.SIMPLE;
}

export function createEnemy() {
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height - 40) + 20;
    const angle = Math.random() * Math.PI * 2;
    const type = getRandomEnemyType();
    
    // 보스는 더 빠르게 이동
    const baseSpeed = type === ENEMY_TYPE.BOSS 
        ? difficulty.ENEMY_SPEED_MAX 
        : Math.random() * (difficulty.ENEMY_SPEED_MAX - difficulty.ENEMY_SPEED_MIN) + difficulty.ENEMY_SPEED_MIN;
    
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
        if (nextX <= enemy.size || nextX >= canvas.width - enemy.size) {
            enemy.vx = -enemy.vx;
            nextX = enemy.x + enemy.vx;
        }
        if (nextY <= enemy.size || nextY >= canvas.height - enemy.size) {
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
        enemy.x = Math.max(enemy.size, Math.min(canvas.width - enemy.size, enemy.x));
        enemy.y = Math.max(enemy.size, Math.min(canvas.height - enemy.size, enemy.y));
    });
}

// 새 스테이지 시작 시 보스 생성 상태 초기화
export function resetBossState() {
    bossCreated = false;
}