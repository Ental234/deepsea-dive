import type { GameOverResult } from '../game/types';
import shellStyles from './Screen.module.css';
import styles from './GameOverScreen.module.css';

interface GameOverScreenProps {
  result: GameOverResult;
  onRetry: () => void;
}

export function GameOverScreen({ result, onRetry }: GameOverScreenProps) {
  return (
    <div className={shellStyles.shell}>
      <div className={shellStyles.frame} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.card}>
          <h1 className={styles.title}>게임 종료</h1>
          <p className={styles.scoreLabel}>FINAL SCORE</p>
          <p className={styles.scoreValue}>{result.score}</p>
          <p className={styles.survived}>생존 시간 {result.survivedSeconds}초</p>
          <button className={styles.retryButton} onClick={onRetry}>
            다시 시작
          </button>
        </div>
      </div>
    </div>
  );
}
