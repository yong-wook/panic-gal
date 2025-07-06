// 난이도 설정
const difficulties = {
    EASY: {
        ENEMY_COUNT: 1,         // 적의 수
        PLAYER_LIVES: 10,       // 플레이어 생명
        ENEMY_SPEED_MIN: 0.5,   // 적 최소 속도
        ENEMY_SPEED_MAX: 1,     // 적 최대 속도
        WIN_PERCENTAGE: 10      // 승리 조건 (테스트를 위해 낮춤)
    },
    NORMAL: {
        ENEMY_COUNT: 3,
        PLAYER_LIVES: 3,
        ENEMY_SPEED_MIN: 1,
        ENEMY_SPEED_MAX: 2,
        WIN_PERCENTAGE: 90
    },
    HARD: {
        ENEMY_COUNT: 5,
        PLAYER_LIVES: 2,
        ENEMY_SPEED_MIN: 1.5,
        ENEMY_SPEED_MAX: 2.5,
        WIN_PERCENTAGE: 95
    }
};

// ==================================================
// 현재 난이도 선택 (EASY, NORMAL, HARD 중 하나를 선택)
// 테스트 시에는 'EASY'로, 배포 시에는 'NORMAL' 이나 'HARD'로 변경하세요.
const CURRENT_DIFFICULTY = 'HARD';
// ==================================================

export const difficulty = difficulties[CURRENT_DIFFICULTY]; 