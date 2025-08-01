import { PLAYER_SPEED, GRID_SIZE, SPEED_UP_MULTIPLIER, PLAYER_SIZE, VIRTUAL_WORLD_WIDTH, VIRTUAL_WORLD_HEIGHT } from './config.js';
import { claimArea, isAreaClaimed } from './area.js';
import { canvas, COLS, ROWS } from './context.js';

/**
 * 플레이어의 네 꼭짓점이 안전 영역(이미 점유된 영역 또는 캔버스 테두리)에 있는지 확인합니다.
 * @param {object} player 플레이어 객체 (x, y 좌표 포함).
 * @returns {boolean} 플레이어가 안전 영역에 있으면 true.
 */
function isPlayerInSafeArea(player) {
    // 플레이어의 네 꼭짓점 좌표
    const corners = [
        { x: player.x, y: player.y }, // Top-left
        { x: player.x + PLAYER_SIZE - 1, y: player.y }, // Top-right
        { x: player.x, y: player.y + PLAYER_SIZE - 1 }, // Bottom-left
        { x: player.x + PLAYER_SIZE - 1, y: player.y + PLAYER_SIZE - 1 } // Bottom-right
    ];

    for (const corner of corners) {
        const gridX = Math.floor(corner.x / GRID_SIZE);
        const gridY = Math.floor(corner.y / GRID_SIZE);
        if (isAreaClaimed(gridX, gridY)) {
            return true;
        }
    }
    return false;
}

export function movePlayer(gameState) {
    const { player, keys } = gameState;
    let dx = 0;
    let dy = 0;

    const currentPlayerSpeed = gameState.isPlayerSpeedBoosted ? PLAYER_SPEED * SPEED_UP_MULTIPLIER : PLAYER_SPEED;

    if (gameState.showtime) {
        // 쇼타임 모드: 플레이어는 배경 이미지를 패닝합니다.
        if (gameState.keys['ArrowLeft']) gameState.player.x -= currentPlayerSpeed * 8;
        if (gameState.keys['ArrowRight']) gameState.player.x += currentPlayerSpeed * 8;
        if (gameState.keys['ArrowUp']) gameState.player.y -= currentPlayerSpeed * 8;
        if (gameState.keys['ArrowDown']) gameState.player.y += currentPlayerSpeed * 8;

        // 플레이어 위치를 이미지 경계 내로 제한합니다.
        const halfCanvasWidth = canvas.width / 2;
        const halfCanvasHeight = canvas.height / 2;

        gameState.player.x = Math.max(halfCanvasWidth, Math.min(gameState.currentWorldWidth - halfCanvasWidth, gameState.player.x));
        gameState.player.y = Math.max(halfCanvasHeight, Math.min(gameState.currentWorldHeight - halfCanvasHeight, gameState.player.y));
        return;
    }

    const oldX = gameState.player.x;
    const oldY = gameState.player.y;

    // 이전 프레임에서의 안전 영역 여부
    const wasInSafeArea = isPlayerInSafeArea({ x: oldX, y: oldY });

    if (gameState.keys['ArrowLeft']) gameState.player.x -= currentPlayerSpeed;
    if (gameState.keys['ArrowRight']) gameState.player.x += currentPlayerSpeed;
    if (gameState.keys['ArrowUp']) gameState.player.y -= currentPlayerSpeed;
    if (gameState.keys['ArrowDown']) gameState.player.y += currentPlayerSpeed;

    // 가상 세계 경계 내에 플레이어 위치 유지
    gameState.player.x = Math.max(0, Math.min(VIRTUAL_WORLD_WIDTH - PLAYER_SIZE, gameState.player.x));
    gameState.player.y = Math.max(0, Math.min(VIRTUAL_WORLD_HEIGHT - PLAYER_SIZE, gameState.player.y));

    // 플레이어가 이동했을 때만 트레일 추가 또는 영역 점유 시도
    if (oldX !== gameState.player.x || oldY !== gameState.player.y) {
        const isInSafeArea = isPlayerInSafeArea(gameState.player);
        
        if (!isInSafeArea) {
            // 안전 영역 밖에 있을 때만 트레일 추가
            // 플레이어의 중심점을 기준으로 그리드 좌표 계산
            let gridX = Math.floor((gameState.player.x + PLAYER_SIZE / 2) / GRID_SIZE);
            let gridY = Math.floor((gameState.player.y + PLAYER_SIZE / 2) / GRID_SIZE);

            // Adjust gridX/gridY if player is at the very edge of the virtual world
            if (gameState.player.x + PLAYER_SIZE >= VIRTUAL_WORLD_WIDTH) { 
                gridX = COLS - 1;
            }
            if (gameState.player.y + PLAYER_SIZE >= VIRTUAL_WORLD_HEIGHT) { 
                gridY = ROWS - 1;
            }

            // 플레이어가 안전 영역에서 벗어나는 첫 지점이라면, 이전 안전 영역의 그리드 셀을 트레일에 추가
            if (wasInSafeArea && !gameState.player.trail.length) {
                const oldGridX = Math.floor((oldX + PLAYER_SIZE / 2) / GRID_SIZE);
                const oldGridY = Math.floor((oldY + PLAYER_SIZE / 2) / GRID_SIZE);
                gameState.player.trail.push({ x: oldGridX, y: oldGridY });
            }

            if (!gameState.player.trail.find(t => t.x === gridX && t.y === gridY)) {
                gameState.player.trail.push({ x: gridX, y: gridY });
            }
        } else if (gameState.player.trail.length > 0) {
            // 안전 영역으로 돌아왔고 트레일이 있을 경우, 현재 위치를 트레일에 추가하여 연결 완성
            const currentGridX = Math.floor((gameState.player.x + PLAYER_SIZE / 2) / GRID_SIZE);
            const currentGridY = Math.floor((gameState.player.y + PLAYER_SIZE / 2) / GRID_SIZE);
            if (!gameState.player.trail.find(t => t.x === currentGridX && t.y === currentGridY)) {
                gameState.player.trail.push({ x: currentGridX, y: currentGridY });
            }
            claimArea(gameState);
        }
    }
}
