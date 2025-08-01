// 난이도 설정
const difficulties = {
    'Easy': {
        ENEMY_COUNT: 10,
        ENEMY_SPEED_MIN: 1,
        ENEMY_SPEED_MAX: 2,
        PLAYER_LIVES: 3,
        WIN_PERCENTAGE: 75,
        ENEMY_TYPES: {
            SIMPLE: 0.7,    // 70%가 단순한 적
            NORMAL: 0.3,    // 30%가 일반 적
            BOSS_COUNT: 1   // 보스는 1마리 고정
        }
    },
    'Normal': {
        ENEMY_COUNT: 15,
        ENEMY_SPEED_MIN: 1.5,
        ENEMY_SPEED_MAX: 3,
        PLAYER_LIVES: 3,
        WIN_PERCENTAGE: 80,
        ENEMY_TYPES: {
            SIMPLE: 0.6,    // 60%가 단순한 적
            NORMAL: 0.4,    // 40%가 일반 적
            BOSS_COUNT: 1   // 보스는 1마리 고정
        }
    },
    'Hard': {
        ENEMY_COUNT: 10,
        ENEMY_SPEED_MIN: 1.5,
        ENEMY_SPEED_MAX: 1.5,
        PLAYER_LIVES: 2,
        WIN_PERCENTAGE: 100,
        ENEMY_TYPES: {
            SIMPLE: 0.5,    // 50%가 단순한 적
            NORMAL: 0.5,    // 50%가 일반 적
            BOSS_COUNT: 1   // 보스는 1마리 고정
        }
    }
};

// ==================================================
// 현재 난이도 선택 (EASY, NORMAL, HARD 중 하나를 선택)
// 테스트 시에는 'EASY'로, 배포 시에는 'NORMAL' 이나 'HARD'로 변경하세요.
let currentDifficulty = 'Hard';
export let difficulty = { ...difficulties[currentDifficulty] };
export const ENEMY_INCREMENT = 2; // 다음 스테이지로 넘어갈 때 증가할 적의 수
// ==================================================

export function setDifficulty(level) {
    if (difficulties[level]) {
        currentDifficulty = level;
        difficulty = { ...difficulties[currentDifficulty] };
        document.getElementById('difficulty').textContent = level;
    }
}

export function resetDifficultyStats() {
    difficulty = { ...difficulties[currentDifficulty] };
} 
