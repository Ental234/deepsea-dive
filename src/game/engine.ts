import {
  FISH_ACCEL,
  FISH_DRAG,
  FISH_MAX_SPEED,
  FISH_RADIUS,
  FISH_STOP_DISTANCE,
  JELLY_BASE_SPEED,
  JELLY_LEVEL_SPAWN_BONUS_MS,
  JELLY_LEVEL_SPEED_BONUS,
  JELLY_RADIUS,
  JELLY_SPAWN_INTERVAL_MIN_MS,
  JELLY_SPAWN_INTERVAL_START_MS,
  JELLY_SPAWN_RAMP_PER_SEC,
  JELLY_SPEED_RAMP_PER_SEC,
  SCORE_PER_SECOND,
  TEST_SPAWN_ALL_ITEMS,
} from './constants';
import {
  ITEM_MAX_CONCURRENT,
  ITEM_RADIUS,
  ITEM_SPAWN_INTERVAL_MAX_MS,
  ITEM_SPAWN_INTERVAL_MIN_MS,
  JELLY_KILL_BONUS_SCORE,
  MISSILE_BARRAGE_DURATION_MS,
  MISSILE_COUNT,
  MISSILE_MAX_LIFETIME_MS,
  MISSILE_RADIUS,
  MISSILE_SPEED,
  MISSILE_VOLLEY_INTERVAL_MS,
  SHIELD_BLINK_START_MS,
  SHIELD_DURATION_MS,
  SHOCKWAVE_DURATION_MS,
  SHOCKWAVE_THICKNESS,
  WHALE_SHARK_RADIUS,
  WHALE_SHARK_SPEED,
  WHIRLPOOL_DURATION_MS,
  WHIRLPOOL_RADIUS,
  type ItemType,
} from './items';
import {
  ITEM_UNLOCK_ORDER,
  getLevelForScore,
  getUnlockedItemTypes,
  getUnlockedSpawnEdges,
} from './leveling';
import type {
  GameOverResult,
  Item,
  Jellyfish,
  Missile,
  Shockwave,
  Vec2,
  WhaleShark,
  Whirlpool,
} from './types';

interface GameEngineCallbacks {
  onScoreUpdate: (score: number) => void;
  onGameOver: (result: GameOverResult) => void;
}

const ITEM_COLORS: Record<ItemType, string> = {
  bubbleShield: '#8ad9f0',
  coralMissile: '#ff7043',
  whirlpool: '#6cc6e6',
  whaleShark: '#8fb7d4',
  shockwave: '#ffdd8f',
};

// 아이템 본체 그라디언트의 바깥쪽(짙은) 색
const ITEM_COLORS_DEEP: Record<ItemType, string> = {
  bubbleShield: '#4bb6d6',
  coralMissile: '#e0552c',
  whirlpool: '#2f86a6',
  whaleShark: '#5f87a8',
  shockwave: '#e9a63a',
};

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  private fish: Vec2 = { x: 0, y: 0 };
  private fishVel: Vec2 = { x: 0, y: 0 };
  private pointer: Vec2 | null = null; // 마지막 포인터 위치 (캔버스 좌표)
  private holding = false; // 포인터를 꾹 누르고 있는 중인지

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

  private whirlpools: Whirlpool[] = [];

  private shockwave: Shockwave | null = null;

  // 산호가시 유도탄: 픽업 시 일정 시간 동안 주기적으로 소량 연사
  private missileBarrage: { msLeft: number; msUntilNextVolley: number } | null = null;

  private invincibleUntil = 0; // elapsedSeconds 기준 시각
  private shieldBlinkPhase = 0; // 실드 종료 직전 점멸용 누적 위상

  private testItemsSpawned = false; // TEST_SPAWN_ALL_ITEMS 초기 배치 완료 여부

  private fishFacing = 1; // 1 = 오른쪽, -1 = 왼쪽
  private fishTilt = 0; // 이동 방향에 따른 몸통 기울기 (rad)
  private bubbles: { x: number; y: number; r: number; speed: number; drift: number }[] = [];

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

    if (this.bubbles.length === 0) this.initBubbles();
  }

  private initBubbles() {
    const count = Math.round((this.width * this.height) / 26000);
    this.bubbles = Array.from({ length: Math.max(10, Math.min(count, 32)) }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      r: 1 + Math.random() * 2.6,
      speed: 12 + Math.random() * 26,
      drift: Math.random() * Math.PI * 2,
    }));
  }

  private updateBubbles(dt: number) {
    for (const b of this.bubbles) {
      b.drift += dt * 1.5;
      b.y -= b.speed * dt;
      b.x += Math.sin(b.drift) * 6 * dt;
      if (b.y + b.r < 0) {
        b.y = this.height + b.r;
        b.x = Math.random() * this.width;
      }
    }
  }

  pointerDown(x: number, y: number) {
    this.pointer = { x, y };
    this.holding = true;
  }

  pointerMove(x: number, y: number) {
    this.pointer = { x, y };
  }

  pointerUp() {
    this.holding = false;
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

    if (TEST_SPAWN_ALL_ITEMS && !this.testItemsSpawned && this.width > 0 && this.height > 0) {
      this.spawnAllItemsForTest();
      this.testItemsSpawned = true;
    }

    this.updateBubbles(dt);
    this.moveFish(dt);
    this.updateShieldBlink(dt);
    this.spawnJellies(dt);
    this.moveJellies(dt);

    this.spawnItems(dt);
    this.collectItems();

    this.updateMissileBarrage(dt);
    this.updateMissiles(dt);
    this.updateWhaleSharks(dt);
    this.updateWhirlpools(dt);
    this.updateShockwave(dt);

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
    if (this.width === 0 || this.height === 0) return; // 리사이즈 전이면 대기

    const vel = this.fishVel;

    // 꾹 누르고 있는 동안: 포인터 방향으로 가속
    if (this.holding && this.pointer) {
      const dx = this.pointer.x - this.fish.x;
      const dy = this.pointer.y - this.fish.y;
      const distance = Math.hypot(dx, dy);
      if (distance > FISH_STOP_DISTANCE) {
        vel.x += (dx / distance) * FISH_ACCEL * dt;
        vel.y += (dy / distance) * FISH_ACCEL * dt;
      }
    }

    // 관성: 속도를 매 프레임 감쇠 (프레임레이트 독립적)
    const damp = Math.exp(-FISH_DRAG * dt);
    vel.x *= damp;
    vel.y *= damp;

    // 속도 상한
    const speed = Math.hypot(vel.x, vel.y);
    if (speed > FISH_MAX_SPEED) {
      vel.x = (vel.x / speed) * FISH_MAX_SPEED;
      vel.y = (vel.y / speed) * FISH_MAX_SPEED;
    }

    this.fish.x += vel.x * dt;
    this.fish.y += vel.y * dt;

    // 벽에 닿으면 그 축 속도를 죽여 미끄러짐 방지 (살짝 튕김)
    const r = FISH_RADIUS;
    if (this.fish.x < r) {
      this.fish.x = r;
      vel.x *= -0.25;
    } else if (this.fish.x > this.width - r) {
      this.fish.x = this.width - r;
      vel.x *= -0.25;
    }
    if (this.fish.y < r) {
      this.fish.y = r;
      vel.y *= -0.25;
    } else if (this.fish.y > this.height - r) {
      this.fish.y = this.height - r;
      vel.y *= -0.25;
    }

    // 바라보는 방향 / 기울기는 속도 벡터에서 유도
    if (Math.abs(vel.x) > 8) this.fishFacing = vel.x >= 0 ? 1 : -1;
    const movingSpeed = Math.hypot(vel.x, vel.y);
    const targetTilt =
      movingSpeed > 12
        ? Math.max(-0.5, Math.min(0.5, (vel.y / movingSpeed) * 0.5)) * this.fishFacing
        : 0;
    this.fishTilt += (targetTilt - this.fishTilt) * Math.min(1, dt * 8);
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

    const pool = TEST_SPAWN_ALL_ITEMS
      ? ITEM_UNLOCK_ORDER
      : getUnlockedItemTypes(getLevelForScore(this.score));
    const type = pool[Math.floor(Math.random() * pool.length)];

    this.items.push({
      id: this.nextItemId++,
      type,
      x: ITEM_RADIUS + Math.random() * (this.width - ITEM_RADIUS * 2),
      y: 90 + Math.random() * (this.height - 130),
    });
  }

  /** 테스트용: 5종 아이템을 화면 상단에 가로로 하나씩 배치 */
  private spawnAllItemsForTest() {
    const margin = ITEM_RADIUS + 16;
    const span = this.width - margin * 2;
    ITEM_UNLOCK_ORDER.forEach((type, i) => {
      this.items.push({
        id: this.nextItemId++,
        type,
        x: margin + (span * (i + 0.5)) / ITEM_UNLOCK_ORDER.length,
        y: this.height * 0.3,
      });
    });
  }

  /** 거품 실드 종료 직전 점멸: 남은 시간이 짧을수록 빠르게 */
  private updateShieldBlink(dt: number) {
    const remainingMs = (this.invincibleUntil - this.elapsedSeconds) * 1000;
    if (remainingMs > 0 && remainingMs < SHIELD_BLINK_START_MS) {
      const k = remainingMs / SHIELD_BLINK_START_MS; // 1 → 0
      const freqHz = 4 + (1 - k) * 10; // 4Hz → 14Hz
      this.shieldBlinkPhase += freqHz * Math.PI * 2 * dt;
    } else {
      this.shieldBlinkPhase = 0;
    }
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
      case 'whirlpool':
        this.spawnWhirlpool();
        break;
      case 'coralMissile':
        this.startMissileBarrage();
        break;
      case 'whaleShark':
        this.spawnWhaleShark();
        break;
      case 'shockwave':
        this.triggerShockwave();
        break;
    }
  }

  private startMissileBarrage() {
    this.fireMissileVolley(); // 픽업 즉시 1회
    this.missileBarrage = {
      msLeft: MISSILE_BARRAGE_DURATION_MS,
      msUntilNextVolley: MISSILE_VOLLEY_INTERVAL_MS,
    };
  }

  private updateMissileBarrage(dt: number) {
    const barrage = this.missileBarrage;
    if (!barrage) return;

    const ms = dt * 1000;
    barrage.msLeft -= ms;
    barrage.msUntilNextVolley -= ms;

    if (barrage.msUntilNextVolley <= 0 && barrage.msLeft > 0) {
      this.fireMissileVolley();
      barrage.msUntilNextVolley += MISSILE_VOLLEY_INTERVAL_MS;
    }

    if (barrage.msLeft <= 0) this.missileBarrage = null;
  }

  private fireMissileVolley() {
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

  private spawnWhirlpool() {
    this.whirlpools.push({
      x: this.fish.x,
      y: this.fish.y,
      msLeft: WHIRLPOOL_DURATION_MS,
      spinPhase: Math.random() * Math.PI * 2,
    });
  }

  private updateWhirlpools(dt: number) {
    for (const whirlpool of this.whirlpools) {
      whirlpool.msLeft -= dt * 1000;
      whirlpool.spinPhase += dt * 3.5;

      // 주변 해파리를 중심으로 끌어당김
      const pullRange = WHIRLPOOL_RADIUS * 2;
      for (const jelly of this.jellies) {
        const dx = whirlpool.x - jelly.x;
        const dy = whirlpool.y - jelly.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1 && dist < pullRange) {
          const pull = 90 * dt * (1 - dist / pullRange);
          jelly.x += (dx / dist) * pull;
          jelly.y += (dy / dist) * pull;
        }
      }

      // 닿은 해파리 제거 + 보너스
      this.jellies = this.jellies.filter((jelly) => {
        const hit =
          Math.hypot(jelly.x - whirlpool.x, jelly.y - whirlpool.y) < WHIRLPOOL_RADIUS + JELLY_RADIUS;
        if (hit) this.score += JELLY_KILL_BONUS_SCORE;
        return !hit;
      });
    }
    this.whirlpools = this.whirlpools.filter((whirlpool) => whirlpool.msLeft > 0);
  }

  private triggerShockwave() {
    // 화면 어느 구석까지도 닿도록 대각선 길이를 최대 반경으로
    const maxRadius = Math.hypot(this.width, this.height) + 40;
    this.shockwave = { x: this.fish.x, y: this.fish.y, radius: 0, maxRadius };
  }

  private updateShockwave(dt: number) {
    const wave = this.shockwave;
    if (!wave) return;

    wave.radius += (wave.maxRadius / (SHOCKWAVE_DURATION_MS / 1000)) * dt;

    // 파면이 지나간 영역(반경 안쪽) 해파리 전부 제거
    this.jellies = this.jellies.filter((jelly) => {
      const hit = Math.hypot(jelly.x - wave.x, jelly.y - wave.y) <= wave.radius;
      if (hit) this.score += JELLY_KILL_BONUS_SCORE;
      return !hit;
    });

    if (wave.radius >= wave.maxRadius) this.shockwave = null;
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

    // 수면 → 심해 세로 그라디언트
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#4aa3bd');
    bg.addColorStop(0.5, '#215d78');
    bg.addColorStop(1, '#0f2b3a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // 위에서 스며드는 빛 기둥
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const beam = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    beam.addColorStop(0, 'rgba(188, 236, 246, 0.14)');
    beam.addColorStop(1, 'rgba(188, 236, 246, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(width * 0.12, 0);
    ctx.lineTo(width * 0.32, 0);
    ctx.lineTo(width * 0.5, height * 0.72);
    ctx.lineTo(width * 0.26, height * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width * 0.64, 0);
    ctx.lineTo(width * 0.8, 0);
    ctx.lineTo(width * 0.74, height * 0.6);
    ctx.lineTo(width * 0.52, height * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 떠오르는 기포
    for (const b of this.bubbles) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fill();
    }

    for (const item of this.items) this.drawItem(item);
    for (const whirlpool of this.whirlpools) this.drawWhirlpool(whirlpool);
    for (const jelly of this.jellies) this.drawJellyfish(jelly);
    for (const shark of this.whaleSharks) this.drawWhaleShark(shark);
    for (const missile of this.missiles) this.drawMissile(missile);
    if (this.shockwave) this.drawShockwave(this.shockwave);
    this.drawFish(this.fish);

    // 가장자리 비네트로 심해 심도 강조
    const vignette = ctx.createRadialGradient(
      width / 2,
      height * 0.5,
      Math.min(width, height) * 0.35,
      width / 2,
      height * 0.5,
      Math.max(width, height) * 0.8,
    );
    vignette.addColorStop(0, 'rgba(4, 18, 26, 0)');
    vignette.addColorStop(1, 'rgba(4, 18, 26, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  private drawFish(pos: Vec2) {
    const { ctx } = this;
    const R = FISH_RADIUS;
    const t = this.elapsedSeconds;
    const bob = Math.sin(t * 3) * 1.5;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // 바닥 그림자 (몸통 흔들림과 무관하게 고정)
    ctx.beginPath();
    ctx.ellipse(0, R * 2.3, R * 1.15, R * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.13)';
    ctx.fill();

    ctx.translate(0, bob);
    ctx.rotate(this.fishTilt);
    ctx.scale(this.fishFacing, 1);

    // 무적 상태 펄스 링 (종료 직전에는 점멸)
    if (t < this.invincibleUntil) {
      const pulse = 1 + Math.sin(t * 8) * 0.12;
      const remainingMs = (this.invincibleUntil - t) * 1000;
      const blink =
        remainingMs < SHIELD_BLINK_START_MS
          ? 0.12 + 0.88 * (0.5 + 0.5 * Math.sin(this.shieldBlinkPhase))
          : 1;
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.strokeStyle = 'rgba(173, 232, 244, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.8 * pulse, R * 1.5 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }

    const tailWave = Math.sin(t * 12) * 0.35;

    // 꼬리지느러미
    ctx.fillStyle = '#f4714a';
    ctx.beginPath();
    ctx.moveTo(-R * 0.6, 0);
    ctx.quadraticCurveTo(-R * 1.5, (-0.9 + tailWave) * R, -R * 1.9, (-0.5 + tailWave) * R);
    ctx.quadraticCurveTo(-R * 1.4, 0, -R * 1.9, (0.5 - tailWave) * R);
    ctx.quadraticCurveTo(-R * 1.5, (0.9 - tailWave) * R, -R * 0.6, 0);
    ctx.fill();

    // 등지느러미
    ctx.beginPath();
    ctx.moveTo(-R * 0.1, -R * 0.7);
    ctx.quadraticCurveTo(R * 0.1, -R * 1.5, R * 0.6, -R * 0.7);
    ctx.closePath();
    ctx.fill();

    // 몸통
    const body = ctx.createLinearGradient(0, -R, 0, R);
    body.addColorStop(0, '#ffa988');
    body.addColorStop(0.55, '#ff8a65');
    body.addColorStop(1, '#f4714a');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(R * 1.15, 0);
    ctx.quadraticCurveTo(R * 0.5, -R * 0.95, -R * 0.5, -R * 0.7);
    ctx.quadraticCurveTo(-R * 0.95, 0, -R * 0.5, R * 0.7);
    ctx.quadraticCurveTo(R * 0.5, R * 0.95, R * 1.15, 0);
    ctx.fill();

    // 배 하이라이트
    ctx.fillStyle = 'rgba(255, 236, 224, 0.5)';
    ctx.beginPath();
    ctx.ellipse(R * 0.1, R * 0.3, R * 0.7, R * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // 가슴지느러미
    ctx.fillStyle = 'rgba(244, 113, 74, 0.9)';
    ctx.beginPath();
    ctx.moveTo(R * 0.15, R * 0.15);
    ctx.quadraticCurveTo(-R * 0.1, R * 0.9, R * 0.55, R * 0.55);
    ctx.closePath();
    ctx.fill();

    // 눈
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(R * 0.62, -R * 0.12, R * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#26140c';
    ctx.beginPath();
    ctx.arc(R * 0.68, -R * 0.12, R * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(R * 0.63, -R * 0.18, R * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawJellyfish(jelly: Jellyfish) {
    const { ctx } = this;
    const R = JELLY_RADIUS;
    ctx.save();
    ctx.translate(jelly.x, jelly.y);

    // 은은한 글로우
    const glow = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R * 1.9);
    glow.addColorStop(0, 'rgba(244, 166, 216, 0.3)');
    glow.addColorStop(1, 'rgba(244, 166, 216, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // 촉수
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const bx = (i - 2) * R * 0.38;
      const phase = jelly.swayPhase + i * 0.7;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(209, 87, 159, 0.75)' : 'rgba(244, 166, 216, 0.7)';
      ctx.beginPath();
      ctx.moveTo(bx, R * 0.35);
      ctx.bezierCurveTo(
        bx + Math.sin(phase) * 5,
        R * 0.9,
        bx - Math.sin(phase) * 6,
        R * 1.5,
        bx + Math.sin(phase * 1.3) * 4,
        R * 2.1,
      );
      ctx.stroke();
    }

    // 갓(bell) — 아래쪽에 물결 스커트
    const bell = ctx.createLinearGradient(0, -R, 0, R * 0.5);
    bell.addColorStop(0, '#ffc4e6');
    bell.addColorStop(0.55, '#f3a0d4');
    bell.addColorStop(1, '#d1579f');
    ctx.fillStyle = bell;
    ctx.beginPath();
    ctx.moveTo(-R, R * 0.1);
    ctx.quadraticCurveTo(-R, -R * 1.05, 0, -R * 1.05);
    ctx.quadraticCurveTo(R, -R * 1.05, R, R * 0.1);
    ctx.quadraticCurveTo(R * 0.6, R * 0.4, R * 0.5, R * 0.16);
    ctx.quadraticCurveTo(R * 0.25, R * 0.42, 0, R * 0.18);
    ctx.quadraticCurveTo(-R * 0.25, R * 0.42, -R * 0.5, R * 0.16);
    ctx.quadraticCurveTo(-R * 0.6, R * 0.4, -R, R * 0.1);
    ctx.closePath();
    ctx.fill();

    // 갓 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-R * 0.28, -R * 0.45, R * 0.26, R * 0.42, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 안쪽 라인
    ctx.strokeStyle = 'rgba(160, 40, 110, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-R * 0.7, R * 0.02);
    ctx.quadraticCurveTo(0, -R * 0.3, R * 0.7, R * 0.02);
    ctx.stroke();

    ctx.restore();
  }

  private drawItem(item: Item) {
    const { ctx } = this;
    const R = ITEM_RADIUS;
    const color = ITEM_COLORS[item.type];
    const t = this.elapsedSeconds + item.id;
    const pulse = 1 + Math.sin(t * 3) * 0.06;

    ctx.save();
    ctx.translate(item.x, item.y);

    // 외곽 글로우 (#RRGGBBAA)
    const glow = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R * 2.1);
    glow.addColorStop(0, `${color}73`);
    glow.addColorStop(1, `${color}00`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, R * 2.1, 0, Math.PI * 2);
    ctx.fill();

    // 본체
    const body = ctx.createRadialGradient(-R * 0.35, -R * 0.35, R * 0.2, 0, 0, R * pulse);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(0.5, color);
    body.addColorStop(1, ITEM_COLORS_DEEP[item.type]);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, R * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, R * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // 상단 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-R * 0.3, -R * 0.4, R * 0.34, R * 0.2, -0.5, 0, Math.PI * 2);
    ctx.fill();

    this.drawItemGlyph(item.type);

    ctx.restore();
  }

  private drawItemGlyph(type: ItemType) {
    const { ctx } = this;
    const s = ITEM_RADIUS * 0.62;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    switch (type) {
      case 'bubbleShield': {
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.82, -s * 0.5);
        ctx.lineTo(s * 0.82, s * 0.25);
        ctx.quadraticCurveTo(s * 0.82, s, 0, s * 1.05);
        ctx.quadraticCurveTo(-s * 0.82, s, -s * 0.82, s * 0.25);
        ctx.lineTo(-s * 0.82, -s * 0.5);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'coralMissile': {
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.1);
        ctx.lineTo(s * 0.7, s * 0.5);
        ctx.lineTo(0, s * 0.1);
        ctx.lineTo(-s * 0.7, s * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'whirlpool': {
        // 나선 글리프
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 3; a += 0.2) {
          const rad = (a / (Math.PI * 3)) * s * 1.05;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        break;
      }
      case 'whaleShark': {
        ctx.beginPath();
        ctx.ellipse(-s * 0.1, 0, s * 0.85, s * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, 0);
        ctx.lineTo(-s * 1.2, -s * 0.5);
        ctx.lineTo(-s * 1.2, s * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'shockwave': {
        // 중심에서 퍼지는 동심 호
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.34 * i, -Math.PI * 0.72, Math.PI * 0.22);
          ctx.stroke();
        }
        break;
      }
    }
    ctx.restore();
  }

  private drawMissile(missile: Missile) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(missile.x, missile.y);
    ctx.rotate(Math.atan2(missile.vy, missile.vx));

    // 꼬리 트레일
    const trail = ctx.createLinearGradient(-MISSILE_RADIUS * 4.5, 0, 0, 0);
    trail.addColorStop(0, 'rgba(255, 209, 102, 0)');
    trail.addColorStop(1, 'rgba(255, 160, 90, 0.7)');
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(-MISSILE_RADIUS * 4.5, -MISSILE_RADIUS * 0.5);
    ctx.lineTo(0, -MISSILE_RADIUS * 0.5);
    ctx.lineTo(0, MISSILE_RADIUS * 0.5);
    ctx.lineTo(-MISSILE_RADIUS * 4.5, MISSILE_RADIUS * 0.5);
    ctx.closePath();
    ctx.fill();

    // 산호가시 본체
    ctx.fillStyle = '#ff7043';
    ctx.beginPath();
    ctx.moveTo(MISSILE_RADIUS * 1.9, 0);
    ctx.quadraticCurveTo(0, -MISSILE_RADIUS * 1.1, -MISSILE_RADIUS, -MISSILE_RADIUS * 0.7);
    ctx.quadraticCurveTo(-MISSILE_RADIUS * 0.4, 0, -MISSILE_RADIUS, MISSILE_RADIUS * 0.7);
    ctx.quadraticCurveTo(0, MISSILE_RADIUS * 1.1, MISSILE_RADIUS * 1.9, 0);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 224, 200, 0.85)';
    ctx.beginPath();
    ctx.arc(MISSILE_RADIUS * 0.5, -MISSILE_RADIUS * 0.15, MISSILE_RADIUS * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawWhaleShark(shark: WhaleShark) {
    const { ctx } = this;
    const R = WHALE_SHARK_RADIUS;
    const t = this.elapsedSeconds;
    ctx.save();
    ctx.translate(shark.x, shark.y);

    // 후광
    const halo = ctx.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 1.5);
    halo.addColorStop(0, 'rgba(143, 183, 212, 0.22)');
    halo.addColorStop(1, 'rgba(143, 183, 212, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(-Math.PI / 2); // 위로 헤엄치는 방향
    const tailWave = Math.sin(t * 6) * 0.25;

    // 꼬리
    ctx.fillStyle = '#4f7797';
    ctx.beginPath();
    ctx.moveTo(-R * 0.85, 0);
    ctx.quadraticCurveTo(-R * 1.25, (-0.5 + tailWave) * R, -R * 1.5, (-0.15 + tailWave) * R);
    ctx.quadraticCurveTo(-R * 1.15, 0, -R * 1.5, (0.15 - tailWave) * R);
    ctx.quadraticCurveTo(-R * 1.25, (0.5 - tailWave) * R, -R * 0.85, 0);
    ctx.fill();

    // 등지느러미
    ctx.beginPath();
    ctx.moveTo(-R * 0.05, -R * 0.5);
    ctx.quadraticCurveTo(R * 0.1, -R * 0.95, R * 0.45, -R * 0.5);
    ctx.closePath();
    ctx.fill();

    // 몸통
    const body = ctx.createLinearGradient(0, -R * 0.6, 0, R * 0.6);
    body.addColorStop(0, '#6f97b8');
    body.addColorStop(1, '#4f7797');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, R, R * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // 배
    ctx.fillStyle = '#e8f3fa';
    ctx.beginPath();
    ctx.ellipse(R * 0.05, R * 0.22, R * 0.78, R * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    // 옆지느러미
    ctx.fillStyle = '#4f7797';
    ctx.beginPath();
    ctx.moveTo(R * 0.15, R * 0.3);
    ctx.quadraticCurveTo(R * 0.1, R * 0.8, R * 0.6, R * 0.55);
    ctx.closePath();
    ctx.fill();

    // 점무늬
    ctx.fillStyle = 'rgba(232, 243, 250, 0.75)';
    const spots: [number, number][] = [
      [-R * 0.4, -R * 0.2],
      [-R * 0.15, -R * 0.32],
      [R * 0.1, -R * 0.15],
      [-R * 0.25, R * 0.05],
      [R * 0.35, -R * 0.28],
      [-R * 0.55, R * 0.1],
    ];
    for (const [sx, sy] of spots) {
      ctx.beginPath();
      ctx.arc(sx, sy, R * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    // 눈
    ctx.fillStyle = '#1c2b36';
    ctx.beginPath();
    ctx.arc(R * 0.7, -R * 0.05, R * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawWhirlpool(whirlpool: Whirlpool) {
    const { ctx } = this;
    const R = WHIRLPOOL_RADIUS;
    const age = WHIRLPOOL_DURATION_MS - whirlpool.msLeft;
    const grow = Math.min(1, age / 300); // 첫 0.3초 동안 커짐
    const fade = Math.min(1, whirlpool.msLeft / 400); // 마지막 0.4초 동안 사라짐
    const scale = 0.5 + 0.5 * grow;

    ctx.save();
    ctx.translate(whirlpool.x, whirlpool.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = grow * (0.4 + 0.6 * fade);

    // 바깥 빛무리
    const halo = ctx.createRadialGradient(0, 0, R * 0.12, 0, 0, R);
    halo.addColorStop(0, 'rgba(214, 246, 250, 0.55)');
    halo.addColorStop(0.6, 'rgba(108, 198, 230, 0.32)');
    halo.addColorStop(1, 'rgba(47, 134, 166, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();

    // 회전하는 나선 팔
    ctx.rotate(whirlpool.spinPhase);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) {
      ctx.beginPath();
      for (let t = 0; t <= 1.0001; t += 0.06) {
        const ang = arm * ((Math.PI * 2) / 3) + t * Math.PI * 2.2;
        const rad = R * (0.12 + 0.85 * t);
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // 중심 눈(어두운 빨림)
    ctx.rotate(-whirlpool.spinPhase * 2.2);
    const eye = ctx.createRadialGradient(0, 0, 1, 0, 0, R * 0.3);
    eye.addColorStop(0, 'rgba(8, 26, 34, 0.6)');
    eye.addColorStop(1, 'rgba(8, 26, 34, 0)');
    ctx.fillStyle = eye;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawShockwave(wave: Shockwave) {
    const { ctx } = this;
    const p = Math.min(1, wave.radius / wave.maxRadius); // 0 → 1
    const alpha = Math.max(0, 1 - p); // 퍼질수록 옅어짐
    const width = SHOCKWAVE_THICKNESS * (0.35 + 0.65 * (1 - p));

    ctx.save();
    ctx.translate(wave.x, wave.y);

    // 파면 안쪽 옅은 플래시
    const fill = ctx.createRadialGradient(
      0,
      0,
      Math.max(1, wave.radius - SHOCKWAVE_THICKNESS * 2.2),
      0,
      0,
      Math.max(2, wave.radius),
    );
    fill.addColorStop(0, 'rgba(255, 240, 205, 0)');
    fill.addColorStop(0.75, `rgba(255, 233, 176, ${0.06 * alpha})`);
    fill.addColorStop(1, `rgba(255, 221, 143, ${0.3 * alpha})`);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(2, wave.radius), 0, Math.PI * 2);
    ctx.fill();

    // 바깥 넓은 링
    ctx.strokeStyle = `rgba(255, 208, 120, ${0.45 * alpha})`;
    ctx.lineWidth = width * 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, wave.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 안쪽 밝은 링
    ctx.strokeStyle = `rgba(255, 250, 232, ${0.95 * alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(0, 0, wave.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
