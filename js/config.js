export const GRID_SIZE = 20;
export const PLAYER_SPEED = 8;
export const PLAYER_SIZE = 16;
export const VIRTUAL_WORLD_WIDTH = 3200;
export const VIRTUAL_WORLD_HEIGHT = 2400;
export const TRAPPED_AREA_THRESHOLD = 50;
export const TRAP_ENEMY_SCORE = 500;
export const TIME_BONUS_PER_TRAP = 10;

// Item Configuration
export const ITEM_SIZE = 20;
export const ITEM_COLOR = '#00BFFF'; // Deep Sky Blue
export const ITEM_TEXT_COLOR = '#FFFFFF';
export const ITEM_FONT = 'bold 10px Arial';
export const SPEED_UP_MULTIPLIER = 2;
export const SPEED_UP_DURATION = 5000; // 5 seconds in milliseconds
export const ITEM_SPAWN_INTERVAL = 10000; // 10 seconds in milliseconds

// --- Player Health & Damage ---
export const INITIAL_PLAYER_HEALTH = 300; // 플레이어 초기 체력
export const PLAYER_INVINCIBILITY_DURATION = 1.5; // 피해 입은 후 무적 시간 (초)

// --- Level Up Stats (Example) ---
export const HEALTH_PER_LEVEL = 20; // 레벨업 당 증가하는 최대 체력

// --- Level Up & Experience ---
export const XP_SIMPLE_ENEMY = 5; // 단순 적 처치 시 얻는 경험치
export const XP_NORMAL_ENEMY = 15; // 일반 적 처치 시 얻는 경험치
export const XP_BOSS_ENEMY = 50; // 보스 적 처치 시 얻는 경험치
export const XP_NEEDED_BASE = 100; // 레벨업에 필요한 기본 경험치
export const XP_NEEDED_MULTIPLIER = 1.5; // 레벨업에 필요한 경험치 증가량 (다음 레벨 = 이전 레벨 * 1.5)
