import type { ItemType } from './items';

export const SCORE_PER_LEVEL = 300;
export const MAX_LEVEL = 5;

// 원작의 "1만점/3만점 방향 추가" 2단계 구조를 축소된 5레벨 점수 스케일에 맞게 재조정
export const LEFT_SPAWN_UNLOCK_LEVEL = 3;
export const RIGHT_SPAWN_UNLOCK_LEVEL = 5;

export const ITEM_UNLOCK_ORDER: ItemType[] = [
  'whirlpool',
  'coralMissile',
  'bubbleShield',
  'whaleShark',
  'shockwave',
];

export function getLevelForScore(score: number): number {
  return Math.min(MAX_LEVEL, Math.floor(score / SCORE_PER_LEVEL) + 1);
}

export function getUnlockedItemTypes(level: number): ItemType[] {
  return ITEM_UNLOCK_ORDER.slice(0, level);
}

export function getUnlockedSpawnEdges(level: number): Array<'top' | 'left' | 'right'> {
  const edges: Array<'top' | 'left' | 'right'> = ['top'];
  if (level >= LEFT_SPAWN_UNLOCK_LEVEL) edges.push('left');
  if (level >= RIGHT_SPAWN_UNLOCK_LEVEL) edges.push('right');
  return edges;
}
