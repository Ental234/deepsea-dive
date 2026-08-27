export const FISH_RADIUS = 14;

// 꾹 누르고 있으면 포인터 방향으로 가속, 떼면 관성으로 미끄러지다 멈춤
export const FISH_ACCEL = 1700; // px/s^2, 홀드 중 포인터 쪽으로 당기는 힘
export const FISH_DRAG = 4.2; // 1/s, 속도 감쇠(관성) 계수 — 항상 적용
export const FISH_MAX_SPEED = 380; // px/s, 속도 상한
export const FISH_STOP_DISTANCE = 5; // px, 포인터에 이보다 가까우면 가속 중단(정착)

export const JELLY_RADIUS = 15;
export const JELLY_BASE_SPEED = 90; // px/s at game start
export const JELLY_SPEED_RAMP_PER_SEC = 1.2; // px/s added per second survived
export const JELLY_SPAWN_INTERVAL_START_MS = 900;
export const JELLY_SPAWN_INTERVAL_MIN_MS = 350;
export const JELLY_SPAWN_RAMP_PER_SEC = 6; // ms shaved off spawn interval per second survived

// 레벨업 시 시간 기반 램프 위에 추가로 얹히는 단계적 난이도 상승분 (레벨 5 이상은 더 붙지 않음, 시간 램프만 계속 증가)
export const JELLY_LEVEL_SPEED_BONUS = 12; // px/s per level above 1
export const JELLY_LEVEL_SPAWN_BONUS_MS = 60; // ms shaved off spawn interval per level above 1

export const SCORE_PER_SECOND = 10;

// --- 개발/테스트 ---
// true 면 게임 시작 직후 5종 아이템을 하나씩 화면에 배치하고,
// 이후 랜덤 스폰도 레벨 해금과 무관하게 전 종류에서 뽑는다.
// 배포 전에는 false 로 되돌릴 것.
export const TEST_SPAWN_ALL_ITEMS = true;
