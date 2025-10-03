import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import Board from '../components/Game/Board.jsx';

export default function LocalGame() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line };
      }
    }

    if (squares.every(square => square !== null)) {
      return { winner: 'draw', line: [] };
    }

    return null;
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      
      if (result.winner === 'draw') {
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      } else {
        setScores(prev => ({ ...prev, [result.winner]: prev[result.winner] + 1 }));
      }
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine([]);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0, draws: 0 });
    resetGame();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-3xl font-bold text-white">Juego Local</h1>
          <button
            onClick={resetScores}
            className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-1">X</div>
            <div className="text-2xl text-white font-bold">{scores.X}</div>
            <div className="text-sm text-blue-200">Jugador 1</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-1" />
            <div className="text-2xl text-white font-bold">{scores.draws}</div>
            <div className="text-sm text-blue-200">Empates</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 text-center">
            <div className="text-4xl font-bold text-pink-400 mb-1">O</div>
            <div className="text-2xl text-white font-bold">{scores.O}</div>
            <div className="text-sm text-blue-200">Jugador 2</div>
          </div>
        </div>

        {/* Game Status */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mb-6 text-center">
          {winner ? (
            <div>
              {winner === 'draw' ? (
                <h2 className="text-2xl font-bold text-yellow-400">¡Empate!</h2>
              ) : (
                <h2 className="text-2xl font-bold text-white">
                  ¡Ganó el Jugador{' '}
                  <span className={winner === 'X' ? 'text-blue-400' : 'text-pink-400'}>
                    {winner}
                  </span>!
                </h2>
              )}
              <button
                onClick={resetGame}
                className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Jugar de Nuevo
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl text-blue-200 mb-2">Turno del Jugador</h2>
              <div className={`text-4xl font-bold ${currentPlayer === 'X' ? 'text-blue-400' : 'text-pink-400'}`}>
                {currentPlayer}
              </div>
            </div>
          )}
        </div>

        {/* Board */}
        <Board
          board={board}
          onCellClick={handleClick}
          winningLine={winningLine}
          disabled={!!winner}
        />
      </div>
    </div>
  );
}