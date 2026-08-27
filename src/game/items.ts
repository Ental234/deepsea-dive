export type ItemType = 'bubbleShield' | 'coralMissile' | 'pufferMode' | 'whaleShark' | 'coralBarrier';

export const ITEM_RADIUS = 16;
export const ITEM_MAX_CONCURRENT = 3;
export const ITEM_SPAWN_INTERVAL_MIN_MS = 3000;
export const ITEM_SPAWN_INTERVAL_MAX_MS = 6000;

export const JELLY_KILL_BONUS_SCORE = 20;

// 거품 실드 (Lv1)
export const SHIELD_DURATION_MS = 3000;
// 남은 시간이 이 값 이하로 떨어지면 실드 링이 점멸 시작 (짧을수록 더 빠르게 점멸)
export const SHIELD_BLINK_START_MS = 1500;

// 가시복 모드 (Lv3) — 실드와 동일한 무적 메커니즘, 지속시간만 다름
export const PUFFER_DURATION_MS = 5000;

// 산호가시 유도탄 (Lv2) — 지속시간 동안 일정 간격으로 소량씩 연사
export const MISSILE_COUNT = 2; // volley(1회) 당 발사 개수
export const MISSILE_SPEED = 320;
export const MISSILE_RADIUS = 6;
export const MISSILE_MAX_LIFETIME_MS = 4000;
export const MISSILE_BARRAGE_DURATION_MS = 5000; // 연사가 지속되는 총 시간
export const MISSILE_VOLLEY_INTERVAL_MS = 1000; // volley 사이 간격

// 고래상어 라이드 (Lv4)
export const WHALE_SHARK_SPEED = 70;
export const WHALE_SHARK_RADIUS = 55;

// 산호 배리어 (Lv5)
export const CORAL_BARRIER_ORB_COUNT = 4;
export const CORAL_BARRIER_ORBIT_RADIUS = 40;
export const CORAL_BARRIER_HOLD_MS = 1200;
export const CORAL_BARRIER_FIRE_SPEED = 260;
export const CORAL_BARRIER_ORB_RADIUS = 10;
