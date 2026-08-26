import { useState } from 'react';
import { GameOverScreen } from './screens/GameOverScreen';
import { GameScreen } from './screens/GameScreen';
import { StartScreen } from './screens/StartScreen';
import type { GameOverResult } from './game/types';

type Screen =
  | { name: 'start' }
  | { name: 'game' }
  | { name: 'gameover'; result: GameOverResult };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'start' });

  switch (screen.name) {
    case 'start':
      return <StartScreen onStart={() => setScreen({ name: 'game' })} />;
    case 'game':
      return (
        <GameScreen onGameOver={(result) => setScreen({ name: 'gameover', result })} />
      );
    case 'gameover':
      return (
        <GameOverScreen result={screen.result} onRetry={() => setScreen({ name: 'game' })} />
      );
  }
}

export default App;
