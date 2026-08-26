export type ItemType = 'bubbleShield' | 'coralMissile' | 'pufferMode' | 'whaleShark' | 'coralBarrier';

export const ITEM_RADIUS = 16;
export const ITEM_MAX_CONCURRENT = 3;
export const ITEM_SPAWN_INTERVAL_MIN_MS = 3000;
export const ITEM_SPAWN_INTERVAL_MAX_MS = 6000;

export const JELLY_KILL_BONUS_SCORE = 20;

// 거품 실드 (Lv1)
export const SHIELD_DURATION_MS = 3000;

// 가시복 모드 (Lv3) — 실드와 동일한 무적 메커니즘, 지속시간만 다름
export const PUFFER_DURATION_MS = 5000;

// 산호가시 유도탄 (Lv2)
export const MISSILE_COUNT = 4;
export const MISSILE_SPEED = 320;
export const MISSILE_RADIUS = 6;
export const MISSILE_MAX_LIFETIME_MS = 4000;

// 고래상어 라이드 (Lv4)
export const WHALE_SHARK_SPEED = 70;
export const WHALE_SHARK_RADIUS = 55;

// 산호 배리어 (Lv5)
export const CORAL_BARRIER_ORB_COUNT = 4;
export const CORAL_BARRIER_ORBIT_RADIUS = 40;
export const CORAL_BARRIER_HOLD_MS = 1200;
export const CORAL_BARRIER_FIRE_SPEED = 260;
export const CORAL_BARRIER_ORB_RADIUS = 10;
