import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/engine';
import { ITEM_UNLOCK_ORDER, getLevelForScore } from '../game/leveling';
import type { GameOverResult } from '../game/types';
import { ItemIcon, LockIcon } from './GameIcons';
import styles from './GameScreen.module.css';

interface GameScreenProps {
  onGameOver: (result: GameOverResult) => void;
}

export function GameScreen({ onGameOver }: GameScreenProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const engine = new GameEngine(canvas, {
      onScoreUpdate: setScore,
      onGameOver,
    });
    engineRef.current = engine;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      engine.resize(width, height);
    });
    resizeObserver.observe(frame);

    engine.start();

    return () => {
      resizeObserver.disconnect();
      engine.stop();
      engineRef.current = null;
    };
  }, [onGameOver]);

  const pointerPos = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    // 손가락/커서가 캔버스 밖으로 나가도 move 이벤트를 계속 받도록 캡처
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* 캡처 불가한 환경은 무시 */
    }
    const { x, y } = pointerPos(event);
    engineRef.current?.pointerDown(x, y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.buttons === 0 && event.pointerType === 'mouse') return;
    const { x, y } = pointerPos(event);
    engineRef.current?.pointerMove(x, y);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* noop */
    }
    engineRef.current?.pointerUp();
  };

  const level = getLevelForScore(score);

  return (
    <div className={styles.frame} ref={frameRef}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className={styles.hud}>
        <div>
          <p className={styles.scoreLabel}>SCORE</p>
          <p className={styles.scoreValue}>{score}</p>
        </div>
        <div className={styles.levelPill}>LV {level}</div>
      </div>
      <div className={styles.itemRow}>
        {ITEM_UNLOCK_ORDER.map((type, index) => {
          const unlocked = index < level;
          return (
            <div
              key={type}
              className={unlocked ? styles.itemSlotUnlocked : styles.itemSlot}
            >
              {unlocked ? <ItemIcon type={type} /> : <LockIcon />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
