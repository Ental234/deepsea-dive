import { useEffect, useState } from 'react';
import { fetchTopScores, type ScoreRow } from '../lib/supabase';
import shellStyles from './Screen.module.css';
import styles from './RankingScreen.module.css';

interface RankingScreenProps {
  onBack: () => void;
  justSubmitted?: { nickname: string; score: number };
}

function rankClassName(rank: number): string {
  if (rank === 1) return styles.rankGold;
  if (rank === 2) return styles.rankSilver;
  if (rank === 3) return styles.rankBronze;
  return '';
}

export function RankingScreen({ onBack, justSubmitted }: RankingScreenProps) {
  const [scores, setScores] = useState<ScoreRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchTopScores()
      .then(setScores)
      .catch(() => setError(true));
  }, []);

  return (
    <div className={shellStyles.shell}>
      <div className={shellStyles.frame}>
        <div className={styles.content}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={onBack}>
              ←
            </button>
            <h1 className={styles.title}>명예의 전당</h1>
          </div>

          <div className={styles.list}>
            {error && <p className={styles.message}>랭킹을 불러오지 못했어요.</p>}
            {!error && scores === null && <p className={styles.message}>불러오는 중...</p>}
            {!error && scores?.length === 0 && <p className={styles.message}>아직 등록된 기록이 없어요.</p>}
            {scores?.map((row, index) => {
              const rank = index + 1;
              const isMine =
                !!justSubmitted &&
                row.nickname === justSubmitted.nickname &&
                row.score === justSubmitted.score;
              return (
                <div
                  key={row.id}
                  className={`${styles.row} ${isMine ? styles.rowMine : index % 2 === 1 ? styles.rowEven : ''}`}
                >
                  <div className={`${styles.rank} ${rankClassName(rank)}`}>{rank}</div>
                  <div className={styles.nickname}>{row.nickname}</div>
                  <div className={styles.score}>{row.score}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
