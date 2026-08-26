import shellStyles from './Screen.module.css';
import styles from './StartScreen.module.css';

interface StartScreenProps {
  onStart: () => void;
  onViewRanking: () => void;
}

export function StartScreen({ onStart, onViewRanking }: StartScreenProps) {
  return (
    <div className={shellStyles.shell}>
      <div className={shellStyles.frame}>
        <div className={styles.content}>
          <div>
            <h1 className={styles.title}>딥씨 다이브</h1>
            <p className={styles.subtitle}>해파리를 피하고, 최대한 오래 생존하세요</p>
          </div>

          <div className={styles.fish}>
            <div className={styles.fishTail} />
            <div className={styles.fishBody} />
          </div>

          <div className={styles.actions}>
            <button className={styles.startButton} onClick={onStart}>
              시작하기
            </button>
            <button className={styles.rankingButton} onClick={onViewRanking}>
              랭킹 보기
            </button>
            <p className={styles.hint}>화면을 탭해서 물고기를 이동시켜요</p>
          </div>
        </div>
      </div>
    </div>
  );
}
