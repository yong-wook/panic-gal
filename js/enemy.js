import { canvas, COLS, ROWS } from './context.js';
import { isAreaClaimed } from './area.js';
import { GRID_SIZE } from './config.js';
import { difficulty } from './difficulty.js';

export function createEnemy() {
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height - 40) + 20;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * (difficulty.ENEMY_SPEED_MAX - difficulty.ENEMY_SPEED_MIN) + difficulty.ENEMY_SPEED_MIN;
    return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 8
    };
}

export function moveEnemies(enemies, gameState) {
    enemies.forEach(enemy => {
        // 5% 확률로 적의 이동 각도를 약간 변경하여 예측 불가능성을 추가합니다.
        if (Math.random() < 0.05) {
            const angle = Math.atan2(enemy.vy, enemy.vx);
            const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
            // 최대 ±22.5도 범위 내에서 각도를 무작위로 변경합니다.
            const angleOffset = (Math.random() - 0.5) * Math.PI / 4;
            enemy.vx = Math.cos(angle + angleOffset) * speed;
            enemy.vy = Math.sin(angle + angleOffset) * speed;
        }

        let nextX = enemy.x + enemy.vx;
        let nextY = enemy.y + enemy.vy;

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

            // 수평 또는 수직으로 이동했는지 확인
            const movedHorizontally = nextGridX !== currentGridX;
            const movedVertically = nextGridY !== currentGridY;

            let bounced = false;
            // 점령된 영역의 수직 벽에 부딪혔는지 확인
            if (movedHorizontally && isAreaClaimed(nextGridX, currentGridY)) {
                enemy.vx = -enemy.vx;
                bounced = true;
            }
            // 점령된 영역의 수평 벽에 부딪혔는지 확인
            if (movedVertically && isAreaClaimed(currentGridX, nextGridY)) {
                enemy.vy = -enemy.vy;
                bounced = true;
            }

            // 모서리에 부딪혔거나, 반사 로직이 적용되지 않은 경우 단순 반사 처리
            if (!bounced) {
                enemy.vx = -enemy.vx;
                enemy.vy = -enemy.vy;
            }
            
            // 충돌 후 위치 업데이트
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;

        } else {
            // 충돌이 없으면 정상적으로 이동
            enemy.x = nextX;
            enemy.y = nextY;
        }

        // 안전을 위해 적이 경계선 내에 있도록 위치를 조정합니다.
        enemy.x = Math.max(enemy.size, Math.min(canvas.width - enemy.size, enemy.x));
        enemy.y = Math.max(enemy.size, Math.min(canvas.height - enemy.size, enemy.y));
    });
}