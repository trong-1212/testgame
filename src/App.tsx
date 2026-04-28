import { useState, useCallback } from 'react';
import { useGameCanvas } from './game/FruitNinjaGame';
import { GameState, MAX_LIVES } from './game/types';
import { Heart, Play, RotateCcw, Sword, Zap } from 'lucide-react';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);

  const callbacks = useCallback(() => ({
    onScoreChange: (s: number) => setScore(s),
    onLivesChange: (l: number) => setLives(l),
    onGameOver: () => setGameState('gameover'),
  }), []);

  const cb = callbacks();
  const { canvasRef, start } = useGameCanvas({
    onScoreChange: cb.onScoreChange,
    onLivesChange: cb.onLivesChange,
    onGameOver: cb.onGameOver,
  });

  const handleStart = () => {
    setGameState('playing');
    start();
  };

  const handleRestart = () => {
    setScore(0);
    setLives(MAX_LIVES);
    setGameState('playing');
    start();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* HUD */}
      {gameState === 'playing' && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 pointer-events-none z-10">
          <div className="glass px-5 py-2.5 flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-white font-bold text-xl tracking-wide tabular-nums">{score}</span>
          </div>
          <div className="glass px-5 py-2.5 flex items-center gap-1.5">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-all duration-300 ${
                  i < lives
                    ? 'text-red-500 fill-red-500 scale-100'
                    : 'text-gray-600 scale-75 opacity-40'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="glass-strong p-10 flex flex-col items-center gap-8 max-w-md w-[90%]">
            <div className="flex flex-col items-center gap-3">
              <div className="text-6xl mb-1">🍉</div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                Fruit Ninja
              </h1>
              <p className="text-gray-400 text-sm text-center leading-relaxed max-w-xs">
                Swipe to slice fruits. Avoid bombs. Don't let fruits fall!
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Sword className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Drag mouse or swipe to slice</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Heart className="w-4 h-4 text-red-400 shrink-0" />
                <span>3 lives -- missed fruit costs 1</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="text-lg leading-none shrink-0">💣</span>
                <span>Slice a bomb and it's game over</span>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="group relative w-full py-3.5 rounded-xl font-bold text-lg text-white
                bg-gradient-to-r from-blue-600 to-cyan-500
                hover:from-blue-500 hover:to-cyan-400
                active:scale-[0.97] transition-all duration-200
                shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
                flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" />
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
          <div className="glass-strong p-10 flex flex-col items-center gap-6 max-w-sm w-[90%]">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-3xl font-extrabold text-white">Game Over</h2>
              {lives <= 0 ? (
                <p className="text-gray-400 text-sm">You ran out of lives!</p>
              ) : (
                <p className="text-gray-400 text-sm">You hit a bomb!</p>
              )}
            </div>

            <div className="glass px-8 py-5 flex flex-col items-center gap-1">
              <span className="text-gray-400 text-xs uppercase tracking-widest">Final Score</span>
              <span className="text-5xl font-extrabold text-white tabular-nums">{score}</span>
            </div>

            <button
              onClick={handleRestart}
              className="group relative w-full py-3.5 rounded-xl font-bold text-lg text-white
                bg-gradient-to-r from-blue-600 to-cyan-500
                hover:from-blue-500 hover:to-cyan-400
                active:scale-[0.97] transition-all duration-200
                shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
                flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
