import type { ItemType } from './items';

// 임시 스텁: 정식 난이도 곡선/해금 로직은 3단계(레벨업 & 난이도 곡선)에서 확정한다.
export const SCORE_PER_LEVEL = 300;
export const MAX_LEVEL = 5;

export const ITEM_UNLOCK_ORDER: ItemType[] = [
  'bubbleShield',
  'coralMissile',
  'pufferMode',
  'whaleShark',
  'coralBarrier',
];

export function getLevelForScore(score: number): number {
  return Math.min(MAX_LEVEL, Math.floor(score / SCORE_PER_LEVEL) + 1);
}

export function getUnlockedItemTypes(level: number): ItemType[] {
  return ITEM_UNLOCK_ORDER.slice(0, level);
}
