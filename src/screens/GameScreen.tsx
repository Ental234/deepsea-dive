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

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    engineRef.current?.setTarget(event.clientX - rect.left, event.clientY - rect.top);
  };

  const level = getLevelForScore(score);

  return (
    <div className={styles.frame} ref={frameRef}>
      <canvas ref={canvasRef} className={styles.canvas} onPointerDown={handlePointerDown} />
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
