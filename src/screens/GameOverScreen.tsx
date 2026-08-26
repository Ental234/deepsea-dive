import { useState } from 'react';
import { submitScore } from '../lib/supabase';
import type { GameOverResult } from '../game/types';
import shellStyles from './Screen.module.css';
import styles from './GameOverScreen.module.css';

interface GameOverScreenProps {
  result: GameOverResult;
  onRetry: () => void;
  onSubmitted: (nickname: string) => void;
}

export function GameOverScreen({ result, onRetry, onSubmitted }: GameOverScreenProps) {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (!trimmed || status === 'submitting') return;

    setStatus('submitting');
    try {
      await submitScore(trimmed, result.score, result.survivedSeconds);
      onSubmitted(trimmed);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={shellStyles.shell}>
      <div className={shellStyles.frame} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.card}>
          <h1 className={styles.title}>게임 종료</h1>
          <p className={styles.scoreLabel}>FINAL SCORE</p>
          <p className={styles.scoreValue}>{result.score}</p>
          <p className={styles.survived}>생존 시간 {result.survivedSeconds}초</p>

          <input
            className={styles.nicknameInput}
            placeholder="닉네임을 입력하세요"
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          {status === 'error' && <p className={styles.errorText}>등록에 실패했어요. 다시 시도해주세요.</p>}

          <button
            className={styles.registerButton}
            onClick={handleSubmit}
            disabled={!nickname.trim() || status === 'submitting'}
          >
            {status === 'submitting' ? '등록 중...' : '랭킹 등록'}
          </button>
          <button className={styles.retryButton} onClick={onRetry}>
            다시 시작
          </button>
        </div>
      </div>
    </div>
  );
}
