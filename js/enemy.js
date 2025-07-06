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
        const nextX = enemy.x + enemy.vx;
        const nextY = enemy.y + enemy.vy;

        // Check if the next position is within a claimed area
        const nextGridX = Math.floor(nextX / GRID_SIZE);
        const nextGridY = Math.floor(nextY / GRID_SIZE);

        if (isAreaClaimed(nextGridX, nextGridY)) {
            // If next position is claimed, reverse direction
            enemy.vx = -enemy.vx;
            enemy.vy = -enemy.vy;
        } else {
            // Otherwise, move normally
            enemy.x = nextX;
            enemy.y = nextY;
        }

        // Wall collision (existing logic)
        if (enemy.x <= enemy.size || enemy.x >= canvas.width - enemy.size) {
            enemy.vx = -enemy.vx;
        }
        if (enemy.y <= enemy.size || enemy.y >= canvas.height - enemy.size) {
            enemy.vy = -enemy.vy;
        }

        // Keep enemy within bounds (existing logic)
        enemy.x = Math.max(enemy.size, Math.min(canvas.width - enemy.size, enemy.x));
        enemy.y = Math.max(enemy.size, Math.min(canvas.height - enemy.size, enemy.y));
    });
}