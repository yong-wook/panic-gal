import { canvas, COLS, ROWS } from './context.js';
import { GRID_SIZE, TRAPPED_AREA_THRESHOLD, TRAP_ENEMY_SCORE, XP_SIMPLE_ENEMY, XP_NORMAL_ENEMY, XP_BOSS_ENEMY } from './config.js';
import { ENEMY_TYPE } from './enemy.js';
import { createBoss } from './enemy.js';
import { showInvincibleMessage, showEnemyDefeatedMessage, showBossMessage } from './ui.js';

let claimedSet = new Set();

// Calculate initial border size once
const initialBorderAreaSize = 2 * COLS + 2 * (ROWS - 2);

export function isAreaClaimed(x, y) {
    // Always consider the canvas border as claimed
    if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
        return true;
    }
    return claimedSet.has(`${x},${y}`);
}

function floodFill(startX, startY, enemies) {
    const filled = [];
    const stack = [{ x: startX, y: startY }];
    const visited = new Set();
    visited.add(`${startX},${startY}`);
    let containsEnemy = false;

    const enemyGridPositions = enemies.map(enemy => ({
        x: Math.floor(enemy.x / GRID_SIZE),
        y: Math.floor(enemy.y / GRID_SIZE)
    }));

    while (stack.length > 0) {
        const { x, y } = stack.pop();

        // If out of bounds or already claimed, skip this cell
        if (isAreaClaimed(x, y)) {
            continue;
        }

        filled.push({ x, y });

        // Check if this cell contains an enemy
        if (enemyGridPositions.some(pos => pos.x === x && pos.y === y)) {
            containsEnemy = true;
        }

        const neighbors = [
            { x: x + 1, y: y },
            { x: x - 1, y: y },
            { x: x, y: y + 1 },
            { x: x, y: y - 1 },
        ];

        for (const n of neighbors) {
            const key = `${n.x},${n.y}`;
            // Only add to stack if within bounds, not visited, and not claimed
            if (n.x >= 0 && n.x < COLS && n.y >= 0 && n.y < ROWS && !visited.has(key) && !isAreaClaimed(n.x, n.y)) {
                visited.add(key);
                stack.push(n);
            }
        }
    }
    return { area: filled, containsEnemy: containsEnemy };
}

function fillEnclosedAreas(gameState) {
    const potentialSeeds = new Set();
    gameState.player.trail.forEach(point => {
        const neighbors = [
            { x: point.x + 1, y: point.y }, { x: point.x - 1, y: point.y },
            { x: point.x, y: point.y + 1 }, { x: point.x, y: point.y - 1 },
        ];
        neighbors.forEach(n => {
            if (!isAreaClaimed(n.x, n.y)) {
                potentialSeeds.add(`${n.x},${n.y}`);
            }
        });
    });

    const foundRegions = [];
    const visitedSeeds = new Set();

    potentialSeeds.forEach(seedKey => {
        if (visitedSeeds.has(seedKey)) return;

        const [x, y] = seedKey.split(',').map(Number);
        
        // If the seed itself is already claimed, skip it.
        if (isAreaClaimed(x, y)) {
            visitedSeeds.add(seedKey); 
            return;
        }

        const result = floodFill(x, y, gameState.enemies); // Pass enemies to floodFill
        const region = result.area;
        const containsEnemy = result.containsEnemy;

        if (region.length > 0) {
            // Mark all cells in this region as visited to avoid re-processing
            region.forEach(p => visitedSeeds.add(`${p.x},${p.y}`));

            if (!containsEnemy) { // Only consider regions that do not contain enemies
                foundRegions.push(region);
            }
        }
    });

    if (foundRegions.length > 0) {
        foundRegions.sort((a, b) => a.length - b.length);
        // Claim the smallest region that does not contain enemies
        gameState.claimedArea.push(...foundRegions[0]);
        updateClaimedSet(gameState.claimedArea);
    }
    
    return foundRegions; 
}

export function updateClaimedSet(claimedArea) {
    claimedSet.clear();
    claimedArea.forEach(area => claimedSet.add(`${area.x},${area.y}`));
}

export function claimArea(gameState) {
    if (gameState.player.trail.length === 0) return;

    gameState.player.trail.forEach(point => {
        if (!isAreaClaimed(point.x, point.y)) {
            gameState.claimedArea.push(point);
        }
    });

    updateClaimedSet(gameState.claimedArea); 

    // 새로 점령된 트레일 위에 있는 적들을 제거
    removeEnemiesOnTrail(gameState, gameState.player.trail);

    const foundRegions = fillEnclosedAreas(gameState); 

    gameState.player.trail = [];
    gameState.score += 100 * (foundRegions.length > 0 ? foundRegions[0].length : 0);
    checkTrappedEnemies(gameState);
    checkAndRemoveStuckEnemies(gameState);
}

function checkTrappedEnemies(gameState) {
    const enemiesToRemove = [];
    const areasToClaim = [];
    // 이미 확인한 영역은 건너뛰기 위한 Set
    const checkedAreas = new Set();

    gameState.enemies.forEach((enemy, index) => {
        const startX = Math.floor(enemy.x / GRID_SIZE);
        const startY = Math.floor(enemy.y / GRID_SIZE);
        const startKey = `${startX},${startY}`;

        if (isAreaClaimed(startX, startY) || checkedAreas.has(startKey)) {
            return;
        }

        const { area, enclosedEnemies } = findPocketDetails(startX, startY, gameState.enemies);
        
        // 이 포켓에 있는 모든 적들은 동일한 운명이므로, 한 번만 계산합니다.
        enclosedEnemies.forEach(e => {
            const key = `${Math.floor(e.x / GRID_SIZE)},${Math.floor(e.y / GRID_SIZE)}`;
            checkedAreas.add(key);
        });

        if (area.length < TRAPPED_AREA_THRESHOLD) {
            areasToClaim.push(...area);
            enclosedEnemies.forEach(e => {
                // 중복 추가를 방지합니다.
                if (!enemiesToRemove.includes(e)) {
                    enemiesToRemove.push(e);
                }
            });
        }
    });

    if (enemiesToRemove.length > 0) {
        gameState.claimedArea.push(...areasToClaim);
        updateClaimedSet(gameState.claimedArea);
        
        // 제거될 적들 중에 보스가 있는지 확인
        const hasBoss = enemiesToRemove.some(enemy => enemy.type === ENEMY_TYPE.BOSS);
        
        if (hasBoss) {
            // 보스가 제거될 때 무적 상태 설정
            gameState.isInvincible = true;
            gameState.invincibleStartTime = Date.now();
            gameState.invincibleDuration = 10000; // 10초
            showInvincibleMessage();
        }

        gameState.enemies = gameState.enemies.filter(e => !enemiesToRemove.includes(e));
        gameState.score += TRAP_ENEMY_SCORE * enemiesToRemove.length;
        
        // 적 타입별 경험치 부여
        enemiesToRemove.forEach(enemy => {
            let xpGained = 0;
            switch (enemy.type) {
                case ENEMY_TYPE.SIMPLE:
                    xpGained = XP_SIMPLE_ENEMY;
                    break;
                case ENEMY_TYPE.NORMAL:
                    xpGained = XP_NORMAL_ENEMY;
                    break;
                case ENEMY_TYPE.BOSS:
                    xpGained = XP_BOSS_ENEMY;
                    break;
            }
            gameState.player.experience += xpGained;
        });

        gameState.enemiesDefeatedCount += enemiesToRemove.length; // 처치한 적 수 증가

        // 보스 등장 조건 확인
        if (!gameState.bossSpawned && gameState.enemiesDefeatedCount >= gameState.bossSpawnThreshold) {
            const boss = createBoss();
            if (boss) {
                gameState.enemies.push(boss);
                showBossMessage();
                gameState.bossSpawned = true;
                gameState.enemiesDefeatedCount = 0; // 보스 등장 후 카운트 초기화
                gameState.bossSpawnThreshold += 5; // 다음 보스 등장 임계값 증가 (예시)
            }
        }
        showEnemyDefeatedMessage(); // 적 처치 메시지 표시
    }
}

/**
 * 특정 지점에서 시작하여 연결된 비점령 영역(포켓)의 크기와
 * 해당 영역에 포함된 적들의 목록을 찾습니다.
 * @param {number} startX - 시작 그리드 X 좌표
 * @param {number} startY - 시작 그리드 Y 좌표
 * @param {Array} allEnemies - 게임 내 모든 적의 배열
 * @returns {{area: Array, enclosedEnemies: Array}} - 포켓 영역과 그 안의 적 목록
 */
function findPocketDetails(startX, startY, allEnemies) {
    const pocketArea = [];
    const enclosedEnemies = [];
    const stack = [{ x: startX, y: startY }];
    const visited = new Set([`${startX},${startY}`]);

    // 전체 적들의 위치를 빠르게 조회하기 위해 Set으로 만듭니다.
    const enemyPositions = new Map();
    allEnemies.forEach(enemy => {
        const key = `${Math.floor(enemy.x / GRID_SIZE)},${Math.floor(enemy.y / GRID_SIZE)}`;
        if (!enemyPositions.has(key)) {
            enemyPositions.set(key, []);
        }
        enemyPositions.get(key).push(enemy);
    });

    while (stack.length > 0) {
        const { x, y } = stack.pop();
        const key = `${x},${y}`;
        
        if (isAreaClaimed(x, y)) continue;

        pocketArea.push({ x, y });

        // 현재 위치에 적이 있는지 확인하고, 있다면 결과 목록에 추가합니다.
        if (enemyPositions.has(key)) {
            enemyPositions.get(key).forEach(enemy => {
                if (!enclosedEnemies.includes(enemy)) {
                    enclosedEnemies.push(enemy);
                }
            });
        }

        const neighbors = [
            { x: x + 1, y: y }, { x: x - 1, y: y },
            { x: x, y: y + 1 }, { x: x, y: y - 1 },
        ];

        for (const n of neighbors) {
            const neighborKey = `${n.x},${n.y}`;
            if (n.x >= 0 && n.x < COLS && n.y >= 0 && n.y < ROWS && !visited.has(neighborKey)) {
                visited.add(neighborKey);
                stack.push(n);
            }
        }
    }

    return { area: pocketArea, enclosedEnemies };
}

export function calculatePercentage(claimedArea) {
    const totalCells = COLS * ROWS;
    // Subtract the initial border area from the claimed cells for percentage calculation
    const playerClaimedCells = Math.max(0, claimedArea.length - initialBorderAreaSize);
    const availableCells = totalCells - initialBorderAreaSize;

    if (availableCells <= 0) return 100; // Avoid division by zero or negative available cells

    return Math.round((playerClaimedCells / availableCells) * 100);
}

// 새로 점령된 트레일 위에 있는 적들을 제거하는 함수
function removeEnemiesOnTrail(gameState, trailPoints) {
    const enemiesToKeep = [];
    const trailSet = new Set(trailPoints.map(p => `${p.x},${p.y}`));
    let enemiesRemoved = false; // 적 제거 여부를 추적하는 플래그

    gameState.enemies.forEach(enemy => {
        const enemyGridX = Math.floor(enemy.x / GRID_SIZE);
        const enemyGridY = Math.floor(enemy.y / GRID_SIZE);
        const enemyKey = `${enemyGridX},${enemyGridY}`;

        if (trailSet.has(enemyKey)) {
            // 적이 트레일 위에 있으므로 제거
            console.log(`Enemy of type ${enemy.type} removed from newly claimed trail.`);
            // TODO: 점수 추가, 효과음 재생 등
            let xpGained = 0;
            switch (enemy.type) {
                case ENEMY_TYPE.SIMPLE:
                    xpGained = XP_SIMPLE_ENEMY;
                    break;
                case ENEMY_TYPE.NORMAL:
                    xpGained = XP_NORMAL_ENEMY;
                    break;
                case ENEMY_TYPE.BOSS:
                    xpGained = XP_BOSS_ENEMY;
                    break;
            }
            gameState.player.experience += xpGained;
            gameState.score += TRAP_ENEMY_SCORE; // 트레일 위 적 제거 시 점수 추가
            gameState.enemiesDefeatedCount++; // 처치한 적 수 증가
            enemiesRemoved = true; // 적이 제거되었음을 표시
        } else {
            enemiesToKeep.push(enemy);
        }
    });
    gameState.enemies = enemiesToKeep;

    // 보스 등장 조건 확인 (트레일 위 적 제거 후)
    if (!gameState.bossSpawned && gameState.enemiesDefeatedCount >= gameState.bossSpawnThreshold) {
        const boss = createBoss();
        if (boss) {
            gameState.enemies.push(boss);
            showBossMessage();
            gameState.bossSpawned = true;
            gameState.enemiesDefeatedCount = 0; // 보스 등장 후 카운트 초기화
            gameState.bossSpawnThreshold += 5; // 다음 보스 등장 임계값 증가 (예시)
        }
    }
    if (enemiesRemoved) { // 적이 제거되었다면 메시지 표시
        showEnemyDefeatedMessage();
    }
}

function checkAndRemoveStuckEnemies(gameState) {
    const enemiesToRemove = [];
    const areasToClaim = [];
    const checkedAreas = new Set();

    gameState.enemies.forEach(enemy => {
        const startX = Math.floor(enemy.x / GRID_SIZE);
        const startY = Math.floor(enemy.y / GRID_SIZE);
        const startKey = `${startX},${startY}`;

        if (isAreaClaimed(startX, startY) || checkedAreas.has(startKey)) {
            return;
        }

        const { area, enclosedEnemies } = findPocketDetails(startX, startY, gameState.enemies);

        enclosedEnemies.forEach(e => {
            const key = `${Math.floor(e.x / GRID_SIZE)},${Math.floor(e.y / GRID_SIZE)}`;
            checkedAreas.add(key);
        });

        // 갇힌 영역의 크기가 매우 작거나, 해당 영역에 플레이어가 접근할 수 없는 경우
        if (area.length < 10) { // 임계값 10은 예시이며, 필요에 따라 조정 가능
            areasToClaim.push(...area);
            enclosedEnemies.forEach(e => {
                if (!enemiesToRemove.includes(e)) {
                    enemiesToRemove.push(e);
                }
            });
        }
    });

    if (enemiesToRemove.length > 0) {
        gameState.claimedArea.push(...areasToClaim);
        updateClaimedSet(gameState.claimedArea);

        gameState.enemies = gameState.enemies.filter(e => !enemiesToRemove.includes(e));
        gameState.score += TRAP_ENEMY_SCORE * enemiesToRemove.length;
        showEnemyDefeatedMessage(); // 적 처치 메시지 표시
    }
}