import type { ItemType } from './items';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Jellyfish {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  swayPhase: number;
}

export interface GameOverResult {
  score: number;
  survivedSeconds: number;
}

export interface Item {
  id: number;
  type: ItemType;
  x: number;
  y: number;
}

export interface Missile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetId: number | null;
  ageMs: number;
}

export interface WhaleShark {
  id: number;
  x: number;
  y: number;
}

export interface Whirlpool {
  x: number;
  y: number;
  msLeft: number;
  spinPhase: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
}
