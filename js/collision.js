import { GRID_SIZE } from './config.js';

function handleCollision(gameState) {
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

    gameState.enemies.forEach(enemy => {
        const dx = enemy.x - gameState.player.x;
        const dy = enemy.y - gameState.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < enemy.size + 4) {
            if (gameState.player.trail.length > 0) {
                handleCollision(gameState);
            }
        }

        gameState.player.trail.forEach(point => {
            const trailX = point.x * GRID_SIZE + GRID_SIZE / 2;
            const trailY = point.y * GRID_SIZE + GRID_SIZE / 2;
            const trailDx = enemy.x - trailX;
            const trailDy = enemy.y - trailY;
            const trailDistance = Math.sqrt(trailDx * trailDx + trailDy * trailDy);

            if (trailDistance < enemy.size + GRID_SIZE / 2) {
                handleCollision(gameState);
            }
        });
    });
}