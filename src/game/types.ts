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
