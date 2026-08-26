import {
  FISH_RADIUS,
  FISH_SPEED,
  JELLY_BASE_SPEED,
  JELLY_LEVEL_SPAWN_BONUS_MS,
  JELLY_LEVEL_SPEED_BONUS,
  JELLY_RADIUS,
  JELLY_SPAWN_INTERVAL_MIN_MS,
  JELLY_SPAWN_INTERVAL_START_MS,
  JELLY_SPAWN_RAMP_PER_SEC,
  JELLY_SPEED_RAMP_PER_SEC,
  SCORE_PER_SECOND,
} from './constants';
import {
  CORAL_BARRIER_FIRE_SPEED,
  CORAL_BARRIER_HOLD_MS,
  CORAL_BARRIER_ORBIT_RADIUS,
  CORAL_BARRIER_ORB_COUNT,
  CORAL_BARRIER_ORB_RADIUS,
  ITEM_MAX_CONCURRENT,
  ITEM_RADIUS,
  ITEM_SPAWN_INTERVAL_MAX_MS,
  ITEM_SPAWN_INTERVAL_MIN_MS,
  JELLY_KILL_BONUS_SCORE,
  MISSILE_COUNT,
  MISSILE_MAX_LIFETIME_MS,
  MISSILE_RADIUS,
  MISSILE_SPEED,
  PUFFER_DURATION_MS,
  SHIELD_DURATION_MS,
  WHALE_SHARK_RADIUS,
  WHALE_SHARK_SPEED,
  type ItemType,
} from './items';
import { getLevelForScore, getUnlockedItemTypes, getUnlockedSpawnEdges } from './leveling';
import type {
  CoralBarrierState,
  GameOverResult,
  Item,
  Jellyfish,
  Missile,
  Vec2,
  WhaleShark,
} from './types';

interface GameEngineCallbacks {
  onScoreUpdate: (score: number) => void;
  onGameOver: (result: GameOverResult) => void;
}

const ITEM_COLORS: Record<ItemType, string> = {
  bubbleShield: '#8ad9f0',
  coralMissile: '#ff7043',
  pufferMode: '#ffd166',
  whaleShark: '#8fb7d4',
  coralBarrier: '#4fb8af',
};

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  private fish: Vec2 = { x: 0, y: 0 };
  private target: Vec2 | null = null;

  private jellies: Jellyfish[] = [];
  private nextJellyId = 0;
  private msUntilNextSpawn = JELLY_SPAWN_INTERVAL_START_MS;

  private items: Item[] = [];
  private nextItemId = 0;
  private msUntilNextItemSpawn = ITEM_SPAWN_INTERVAL_MIN_MS;

  private missiles: Missile[] = [];
  private nextMissileId = 0;

  private whaleSharks: WhaleShark[] = [];
  private nextWhaleSharkId = 0;

  private coralBarrier: CoralBarrierState | null = null;

  private invincibleUntil = 0; // elapsedSeconds 기준 시각

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

    this.moveFish(dt);
    this.spawnJellies(dt);
    this.moveJellies(dt);

    this.spawnItems(dt);
    this.collectItems();

    this.updateMissiles(dt);
    this.updateWhaleSharks(dt);
    this.updateCoralBarrier(dt);

    const gameOver = this.resolveFishJellyCollisions();

    this.callbacks.onScoreUpdate(Math.floor(this.score));

    if (gameOver) {
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

    const level = getLevelForScore(this.score);
    const levelBonus = level - 1;

    const spawnInterval = Math.max(
      JELLY_SPAWN_INTERVAL_MIN_MS,
      JELLY_SPAWN_INTERVAL_START_MS -
        this.elapsedSeconds * JELLY_SPAWN_RAMP_PER_SEC -
        levelBonus * JELLY_LEVEL_SPAWN_BONUS_MS,
    );
    this.msUntilNextSpawn = spawnInterval;

    const speed =
      JELLY_BASE_SPEED + this.elapsedSeconds * JELLY_SPEED_RAMP_PER_SEC + levelBonus * JELLY_LEVEL_SPEED_BONUS;

    const edges = getUnlockedSpawnEdges(level);
    const edge = edges[Math.floor(Math.random() * edges.length)];

    let x: number;
    let y: number;
    let vx: number;
    let vy: number;

    switch (edge) {
      case 'left':
        x = -JELLY_RADIUS;
        y = 90 + Math.random() * (this.height * 0.6 - 90);
        vx = speed * 0.9;
        vy = speed * 0.5;
        break;
      case 'right':
        x = this.width + JELLY_RADIUS;
        y = 90 + Math.random() * (this.height * 0.6 - 90);
        vx = -speed * 0.9;
        vy = speed * 0.5;
        break;
      default:
        x = JELLY_RADIUS + Math.random() * (this.width - JELLY_RADIUS * 2);
        y = -JELLY_RADIUS;
        vx = 0;
        vy = speed;
    }

    this.jellies.push({
      id: this.nextJellyId++,
      x,
      y,
      vx,
      vy,
      swayPhase: Math.random() * Math.PI * 2,
    });
  }

  private moveJellies(dt: number) {
    for (const jelly of this.jellies) {
      jelly.swayPhase += dt * 2;
      jelly.x += (Math.sin(jelly.swayPhase) * 12 + jelly.vx) * dt;
      jelly.y += jelly.vy * dt;
    }
    this.jellies = this.jellies.filter(
      (j) =>
        j.y - JELLY_RADIUS < this.height &&
        j.x > -JELLY_RADIUS * 4 &&
        j.x < this.width + JELLY_RADIUS * 4,
    );
  }

  private spawnItems(dt: number) {
    this.msUntilNextItemSpawn -= dt * 1000;
    if (this.msUntilNextItemSpawn > 0) return;

    this.msUntilNextItemSpawn =
      ITEM_SPAWN_INTERVAL_MIN_MS + Math.random() * (ITEM_SPAWN_INTERVAL_MAX_MS - ITEM_SPAWN_INTERVAL_MIN_MS);

    if (this.items.length >= ITEM_MAX_CONCURRENT) return;

    const unlockedTypes = getUnlockedItemTypes(getLevelForScore(this.score));
    const type = unlockedTypes[Math.floor(Math.random() * unlockedTypes.length)];

    this.items.push({
      id: this.nextItemId++,
      type,
      x: ITEM_RADIUS + Math.random() * (this.width - ITEM_RADIUS * 2),
      y: 90 + Math.random() * (this.height - 130),
    });
  }

  private collectItems() {
    this.items = this.items.filter((item) => {
      const distance = Math.hypot(item.x - this.fish.x, item.y - this.fish.y);
      const collected = distance < FISH_RADIUS + ITEM_RADIUS;
      if (collected) this.activateItem(item.type);
      return !collected;
    });
  }

  private activateItem(type: ItemType) {
    switch (type) {
      case 'bubbleShield':
        this.invincibleUntil = this.elapsedSeconds + SHIELD_DURATION_MS / 1000;
        break;
      case 'pufferMode':
        this.invincibleUntil = this.elapsedSeconds + PUFFER_DURATION_MS / 1000;
        break;
      case 'coralMissile':
        this.fireMissiles();
        break;
      case 'whaleShark':
        this.spawnWhaleShark();
        break;
      case 'coralBarrier':
        this.startCoralBarrier();
        break;
    }
  }

  private fireMissiles() {
    for (let i = 0; i < MISSILE_COUNT; i++) {
      const target = this.jellies[Math.floor(Math.random() * this.jellies.length)] as
        | Jellyfish
        | undefined;
      const angle = target
        ? Math.atan2(target.y - this.fish.y, target.x - this.fish.x)
        : -Math.PI / 2 + (Math.random() - 0.5);

      this.missiles.push({
        id: this.nextMissileId++,
        x: this.fish.x,
        y: this.fish.y,
        vx: Math.cos(angle) * MISSILE_SPEED,
        vy: Math.sin(angle) * MISSILE_SPEED,
        targetId: target?.id ?? null,
        ageMs: 0,
      });
    }
  }

  private updateMissiles(dt: number) {
    for (const missile of this.missiles) {
      missile.ageMs += dt * 1000;
      const target = this.jellies.find((j) => j.id === missile.targetId);
      if (target) {
        const angle = Math.atan2(target.y - missile.y, target.x - missile.x);
        missile.vx = Math.cos(angle) * MISSILE_SPEED;
        missile.vy = Math.sin(angle) * MISSILE_SPEED;
      }
      missile.x += missile.vx * dt;
      missile.y += missile.vy * dt;
    }

    const survivingMissiles: Missile[] = [];
    for (const missile of this.missiles) {
      const outOfBounds =
        missile.x < -20 || missile.x > this.width + 20 || missile.y < -20 || missile.y > this.height + 20;
      const expired = missile.ageMs > MISSILE_MAX_LIFETIME_MS;
      if (outOfBounds || expired) continue;

      const hitJellyId = this.jellies.find(
        (jelly) => Math.hypot(jelly.x - missile.x, jelly.y - missile.y) < MISSILE_RADIUS + JELLY_RADIUS,
      )?.id;

      if (hitJellyId !== undefined) {
        this.jellies = this.jellies.filter((j) => j.id !== hitJellyId);
        this.score += JELLY_KILL_BONUS_SCORE;
        continue;
      }

      survivingMissiles.push(missile);
    }
    this.missiles = survivingMissiles;
  }

  private spawnWhaleShark() {
    this.whaleSharks.push({
      id: this.nextWhaleSharkId++,
      x: this.fish.x,
      y: this.height + WHALE_SHARK_RADIUS,
    });
  }

  private updateWhaleSharks(dt: number) {
    for (const shark of this.whaleSharks) {
      shark.y -= WHALE_SHARK_SPEED * dt;
      this.jellies = this.jellies.filter((jelly) => {
        const hit = Math.hypot(jelly.x - shark.x, jelly.y - shark.y) < WHALE_SHARK_RADIUS + JELLY_RADIUS;
        if (hit) this.score += JELLY_KILL_BONUS_SCORE;
        return !hit;
      });
    }
    this.whaleSharks = this.whaleSharks.filter((shark) => shark.y > -WHALE_SHARK_RADIUS);
  }

  private startCoralBarrier() {
    if (this.coralBarrier?.phase === 'holding') {
      this.coralBarrier.holdMsLeft = CORAL_BARRIER_HOLD_MS;
      return;
    }
    this.coralBarrier = {
      phase: 'holding',
      holdMsLeft: CORAL_BARRIER_HOLD_MS,
      orbs: Array.from({ length: CORAL_BARRIER_ORB_COUNT }, (_, i) => ({
        angle: (i / CORAL_BARRIER_ORB_COUNT) * Math.PI * 2,
        x: this.fish.x,
        y: this.fish.y,
        vx: 0,
        vy: 0,
      })),
    };
  }

  private updateCoralBarrier(dt: number) {
    const barrier = this.coralBarrier;
    if (!barrier) return;

    if (barrier.phase === 'holding') {
      for (const orb of barrier.orbs) {
        orb.angle += dt * 3;
        orb.x = this.fish.x + Math.cos(orb.angle) * CORAL_BARRIER_ORBIT_RADIUS;
        orb.y = this.fish.y + Math.sin(orb.angle) * CORAL_BARRIER_ORBIT_RADIUS;
      }
      barrier.holdMsLeft -= dt * 1000;
      if (barrier.holdMsLeft <= 0) {
        barrier.phase = 'firing';
        for (const orb of barrier.orbs) {
          orb.vx = Math.cos(orb.angle) * CORAL_BARRIER_FIRE_SPEED;
          orb.vy = Math.sin(orb.angle) * CORAL_BARRIER_FIRE_SPEED;
        }
      }
      return;
    }

    for (const orb of barrier.orbs) {
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
    }

    for (const orb of barrier.orbs) {
      this.jellies = this.jellies.filter((jelly) => {
        const hit =
          Math.hypot(jelly.x - orb.x, jelly.y - orb.y) < CORAL_BARRIER_ORB_RADIUS + JELLY_RADIUS;
        if (hit) this.score += JELLY_KILL_BONUS_SCORE;
        return !hit;
      });
    }

    barrier.orbs = barrier.orbs.filter(
      (orb) => orb.x > -50 && orb.x < this.width + 50 && orb.y > -50 && orb.y < this.height + 50,
    );
    if (barrier.orbs.length === 0) this.coralBarrier = null;
  }

  private resolveFishJellyCollisions(): boolean {
    const survivors: Jellyfish[] = [];
    let gameOver = false;
    const invincible = this.elapsedSeconds < this.invincibleUntil;

    for (const jelly of this.jellies) {
      const distance = Math.hypot(jelly.x - this.fish.x, jelly.y - this.fish.y);
      const colliding = distance < FISH_RADIUS + JELLY_RADIUS;

      if (!colliding) {
        survivors.push(jelly);
      } else if (invincible) {
        this.score += JELLY_KILL_BONUS_SCORE;
      } else {
        gameOver = true;
        survivors.push(jelly);
      }
    }

    this.jellies = survivors;
    return gameOver;
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

    for (const item of this.items) this.drawItem(item);
    for (const jelly of this.jellies) this.drawJellyfish(jelly);
    for (const shark of this.whaleSharks) this.drawWhaleShark(shark);
    for (const missile of this.missiles) this.drawMissile(missile);
    if (this.coralBarrier) this.drawCoralBarrier(this.coralBarrier);
    this.drawFish(this.fish);
  }

  private drawFish(pos: Vec2) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(pos.x, pos.y);

    if (this.elapsedSeconds < this.invincibleUntil) {
      const pulse = 1 + Math.sin(this.elapsedSeconds * 8) * 0.15;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, FISH_RADIUS * 1.7 * pulse, FISH_RADIUS * 1.4 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

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

  private drawItem(item: Item) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(item.x, item.y);

    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, ITEM_RADIUS);
    glow.addColorStop(0, 'white');
    glow.addColorStop(1, ITEM_COLORS[item.type]);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, ITEM_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  private drawMissile(missile: Missile) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(missile.x, missile.y);
    ctx.rotate(Math.atan2(missile.vy, missile.vx));

    ctx.fillStyle = '#ff7043';
    ctx.beginPath();
    ctx.moveTo(MISSILE_RADIUS * 1.6, 0);
    ctx.lineTo(-MISSILE_RADIUS, -MISSILE_RADIUS);
    ctx.lineTo(-MISSILE_RADIUS, MISSILE_RADIUS);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawWhaleShark(shark: WhaleShark) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(shark.x, shark.y);

    ctx.fillStyle = '#5f87a8';
    ctx.beginPath();
    ctx.ellipse(0, 0, WHALE_SHARK_RADIUS, WHALE_SHARK_RADIUS * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8f3fa';
    ctx.beginPath();
    ctx.ellipse(0, WHALE_SHARK_RADIUS * 0.2, WHALE_SHARK_RADIUS * 0.8, WHALE_SHARK_RADIUS * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5f87a8';
    ctx.beginPath();
    ctx.moveTo(-WHALE_SHARK_RADIUS, 0);
    ctx.lineTo(-WHALE_SHARK_RADIUS * 1.4, -WHALE_SHARK_RADIUS * 0.4);
    ctx.lineTo(-WHALE_SHARK_RADIUS * 1.4, WHALE_SHARK_RADIUS * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawCoralBarrier(barrier: CoralBarrierState) {
    const { ctx } = this;
    for (const orb of barrier.orbs) {
      ctx.save();
      ctx.translate(orb.x, orb.y);
      ctx.fillStyle = ITEM_COLORS.coralBarrier;
      ctx.beginPath();
      ctx.arc(0, 0, CORAL_BARRIER_ORB_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
