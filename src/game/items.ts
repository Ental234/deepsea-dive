export type ItemType = 'bubbleShield' | 'coralMissile' | 'whirlpool' | 'whaleShark' | 'shockwave';

export const ITEM_RADIUS = 16;
export const ITEM_MAX_CONCURRENT = 3;
export const ITEM_SPAWN_INTERVAL_MIN_MS = 3000;
export const ITEM_SPAWN_INTERVAL_MAX_MS = 6000;

export const JELLY_KILL_BONUS_SCORE = 20;

// 거품 실드 (Lv3) — 일정 시간 무적, 종료 직전 링 점멸
export const SHIELD_DURATION_MS = 3000;
// 남은 시간이 이 값 이하로 떨어지면 실드 링이 점멸 시작 (짧을수록 더 빠르게 점멸)
export const SHIELD_BLINK_START_MS = 1500;

// 회오리 (Lv1) — 픽업한 자리에 큰 회오리 생성, 지속시간 동안 닿는 해파리를 빨아들여 제거
export const WHIRLPOOL_DURATION_MS = 5000;
export const WHIRLPOOL_RADIUS = 72;

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

// 쇼크웨이브 (Lv5) — 픽업 지점에서 충격파 링이 화면 전체로 퍼지며 닿는 해파리를 전부 제거
export const SHOCKWAVE_DURATION_MS = 550; // 링이 최대 반경까지 퍼지는 시간
export const SHOCKWAVE_THICKNESS = 46; // 파면 링의 시각적 두께
