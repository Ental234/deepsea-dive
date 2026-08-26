import {
  FISH_RADIUS,
  FISH_SPEED,
  JELLY_BASE_SPEED,
  JELLY_RADIUS,
  JELLY_SPAWN_INTERVAL_MIN_MS,
  JELLY_SPAWN_INTERVAL_START_MS,
  JELLY_SPAWN_RAMP_PER_SEC,
  JELLY_SPEED_RAMP_PER_SEC,
  SCORE_PER_SECOND,
} from './constants';
import type { GameOverResult, Jellyfish, Vec2 } from './types';

interface GameEngineCallbacks {
  onScoreUpdate: (score: number) => void;
  onGameOver: (result: GameOverResult) => void;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  private fish: Vec2 = { x: 0, y: 0 };
  private target: Vec2 | null = null;

  private jellies: Jellyfish[] = [];
  private nextJellyId = 0;
  private msUntilNextSpawn = JELLY_SPAWN_INTERVAL_START_MS;

  private elapsedSeconds = 0;
  private score = 0;
  private running = false;
  private rafId = 0;
  private lastFrameTime = 0;

  private canvas: HTMLCanvasElement;
  private callbacks: GameEngineCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context를 가져올 수 없습니다.');
    this.ctx = ctx;
    this.canvas = canvas;
    this.callbacks = callbacks;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.fish.x === 0 && this.fish.y === 0) {
      this.fish = { x: width / 2, y: height * 0.75 };
    } else {
      this.fish.x = Math.min(this.fish.x, width - FISH_RADIUS);
      this.fish.y = Math.min(this.fish.y, height - FISH_RADIUS);
    }
  }

  setTarget(x: number, y: number) {
    this.target = { x, y };
  }

  start() {
    this.running = true;
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private loop = (time: number) => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastFrameTime) / 1000, 1 / 30);
    this.lastFrameTime = time;

    this.update(dt);
    this.draw();

    if (this.running) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  private update(dt: number) {
    this.elapsedSeconds += dt;
    this.score += dt * SCORE_PER_SECOND;
    this.callbacks.onScoreUpdate(Math.floor(this.score));

    this.moveFish(dt);
    this.spawnJellies(dt);
    this.moveJellies(dt);

    if (this.checkCollision()) {
      this.stop();
      this.callbacks.onGameOver({
        score: Math.floor(this.score),
        survivedSeconds: Math.floor(this.elapsedSeconds),
      });
    }
  }

  private moveFish(dt: number) {
    if (!this.target) return;
    const dx = this.target.x - this.fish.x;
    const dy = this.target.y - this.fish.y;
    const distance = Math.hypot(dx, dy);
    const step = FISH_SPEED * dt;

    if (distance <= step) {
      this.fish = { ...this.target };
      this.target = null;
    } else {
      this.fish.x += (dx / distance) * step;
      this.fish.y += (dy / distance) * step;
    }
  }

  private spawnJellies(dt: number) {
    this.msUntilNextSpawn -= dt * 1000;
    if (this.msUntilNextSpawn > 0) return;

    const spawnInterval = Math.max(
      JELLY_SPAWN_INTERVAL_MIN_MS,
      JELLY_SPAWN_INTERVAL_START_MS - this.elapsedSeconds * JELLY_SPAWN_RAMP_PER_SEC,
    );
    this.msUntilNextSpawn = spawnInterval;

    const speed = JELLY_BASE_SPEED + this.elapsedSeconds * JELLY_SPEED_RAMP_PER_SEC;
    this.jellies.push({
      id: this.nextJellyId++,
      x: JELLY_RADIUS + Math.random() * (this.width - JELLY_RADIUS * 2),
      y: -JELLY_RADIUS,
      vx: 0,
      vy: speed,
      swayPhase: Math.random() * Math.PI * 2,
    });
  }

  private moveJellies(dt: number) {
    for (const jelly of this.jellies) {
      jelly.swayPhase += dt * 2;
      jelly.x += Math.sin(jelly.swayPhase) * 12 * dt;
      jelly.y += jelly.vy * dt;
    }
    this.jellies = this.jellies.filter((j) => j.y - JELLY_RADIUS < this.height);
  }

  private checkCollision(): boolean {
    return this.jellies.some((jelly) => {
      const distance = Math.hypot(jelly.x - this.fish.x, jelly.y - this.fish.y);
      return distance < FISH_RADIUS + JELLY_RADIUS;
    });
  }

  private draw() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#3f8fa8');
    bg.addColorStop(0.55, '#215d78');
    bg.addColorStop(1, '#12303f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    for (const jelly of this.jellies) this.drawJellyfish(jelly);
    this.drawFish(this.fish);
  }

  private drawFish(pos: Vec2) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(pos.x, pos.y);

    ctx.fillStyle = '#ff8a65';
    ctx.beginPath();
    ctx.ellipse(0, 0, FISH_RADIUS, FISH_RADIUS * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-FISH_RADIUS * 0.7, 0);
    ctx.lineTo(-FISH_RADIUS * 1.6, -FISH_RADIUS * 0.6);
    ctx.lineTo(-FISH_RADIUS * 1.6, FISH_RADIUS * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2b1a12';
    ctx.beginPath();
    ctx.arc(FISH_RADIUS * 0.45, -FISH_RADIUS * 0.15, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawJellyfish(jelly: Jellyfish) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(jelly.x, jelly.y);

    const bell = ctx.createLinearGradient(0, -JELLY_RADIUS, 0, JELLY_RADIUS * 0.3);
    bell.addColorStop(0, '#f4a6d8');
    bell.addColorStop(1, '#d1579f');
    ctx.fillStyle = bell;
    ctx.beginPath();
    ctx.ellipse(0, 0, JELLY_RADIUS, JELLY_RADIUS * 0.8, 0, Math.PI, 0);
    ctx.fill();

    ctx.strokeStyle = 'rgba(209, 87, 159, 0.7)';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * JELLY_RADIUS * 0.5, 0);
      ctx.quadraticCurveTo(
        i * JELLY_RADIUS * 0.5 + Math.sin(jelly.swayPhase + i) * 4,
        JELLY_RADIUS * 1.2,
        i * JELLY_RADIUS * 0.5,
        JELLY_RADIUS * 1.8,
      );
      ctx.stroke();
    }

    ctx.restore();
  }
}
