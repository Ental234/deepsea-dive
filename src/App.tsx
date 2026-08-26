import { useState } from 'react';
import { GameOverScreen } from './screens/GameOverScreen';
import { GameScreen } from './screens/GameScreen';
import { RankingScreen } from './screens/RankingScreen';
import { StartScreen } from './screens/StartScreen';
import type { GameOverResult } from './game/types';

type Screen =
  | { name: 'start' }
  | { name: 'game' }
  | { name: 'gameover'; result: GameOverResult }
  | { name: 'ranking'; justSubmitted?: { nickname: string; score: number } };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'start' });

  switch (screen.name) {
    case 'start':
      return (
        <StartScreen
          onStart={() => setScreen({ name: 'game' })}
          onViewRanking={() => setScreen({ name: 'ranking' })}
        />
      );
    case 'game':
      return (
        <GameScreen onGameOver={(result) => setScreen({ name: 'gameover', result })} />
      );
    case 'gameover':
      return (
        <GameOverScreen
          result={screen.result}
          onRetry={() => setScreen({ name: 'game' })}
          onSubmitted={(nickname) =>
            setScreen({ name: 'ranking', justSubmitted: { nickname, score: screen.result.score } })
          }
        />
      );
    case 'ranking':
      return (
        <RankingScreen
          onBack={() => setScreen({ name: 'start' })}
          justSubmitted={screen.justSubmitted}
        />
      );
  }
}

export default App;
