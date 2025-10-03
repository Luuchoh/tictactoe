import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Copy, Check } from 'lucide-react';
import Board from '../components/Game/Board';
import { socket, connectSocket } from '../services/socket';

export default function OnlineGame() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || 'Player';

  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState(1);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, finished
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    connectSocket();

    // Join room
    socket.emit('join_room', {
      room_code: roomCode,
      username: username
    });

    // Listen for events
    socket.on('room_joined', (data) => {
      console.log('Room joined:', data);
      setPlayerNumber(data.player_number);
      setGameId(data.game_id);
    });

    socket.on('player_joined', (data) => {
      console.log('Player joined:', data);
      if (data.username !== username) {
        setOpponent(data.username);
      }
    });

    socket.on('game_started', (data) => {
      console.log('Game started:', data);
      setGameStatus('playing');
      setCurrentTurn(data.current_turn);
      if (data.player1 !== username) {
        setOpponent(data.player1);
      } else {
        setOpponent(data.player2);
      }
    });

    socket.on('move_made', (data) => {
      console.log('Move made:', data);
      const newBoard = data.board.split('').map(c => {
        if (c === '0') return null;
        if (c === '1') return 'X';
        if (c === '2') return 'O';
        return null;
      });
      setBoard(newBoard);
      setCurrentTurn(data.current_turn);
    });

    socket.on('game_over', (data) => {
      console.log('Game over:', data);
      const newBoard = data.board.split('').map(c => {
        if (c === '0') return null;
        if (c === '1') return 'X';
        if (c === '2') return 'O';
        return null;
      });
      setBoard(newBoard);
      setGameStatus('finished');
      setWinner(data.winner);
      
      // Find winning line
      if (data.winner !== 0) {
        findWinningLine(newBoard);
      }
    });

    socket.on('player_disconnected', (data) => {
      console.log('Player disconnected:', data);
      alert(`${data.username} se ha desconectado`);
      navigate('/lobby');
    });

    socket.on('chat_message', (data) => {
      setChatMessages(prev => [...prev, data]);
    });

    socket.on('error', (data) => {
      console.error('Socket error:', data);
      alert(data.message);
    });

    return () => {
      socket.emit('leave_room', { room_code: roomCode });
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('game_started');
      socket.off('move_made');
      socket.off('game_over');
      socket.off('player_disconnected');
      socket.off('chat_message');
      socket.off('error');
    };
  }, [roomCode, username, navigate]);

  const findWinningLine = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        setWinningLine(line);
        return;
      }
    }
  };

  const handleCellClick = (index) => {
    if (gameStatus !== 'playing') return;
    if (board[index] !== null) return;
    if (currentTurn !== playerNumber) return;

    socket.emit('make_move', {
      game_id: gameId,
      position: index
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    socket.emit('chat_message', {
      message: messageInput
    });
    
    setMessageInput('');
  };

  const isMyTurn = currentTurn === playerNumber;
  const mySymbol = playerNumber === 1 ? 'X' : 'O';
  const opponentSymbol = playerNumber === 1 ? 'O' : 'X';

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/lobby')}
            className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Salir</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="text-white font-mono text-xl">{roomCode}</div>
            <button
              onClick={copyRoomCode}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2">
            {/* Players Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`bg-white/10 backdrop-blur-lg border rounded-xl p-4 ${
                isMyTurn ? 'ring-2 ring-blue-400' : 'border-white/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{mySymbol}</div>
                  <div>
                    <div className="text-white font-semibold">{username}</div>
                    <div className="text-sm text-blue-200">Tú</div>
                  </div>
                </div>
              </div>

              <div className={`bg-white/10 backdrop-blur-lg border rounded-xl p-4 ${
                !isMyTurn && gameStatus === 'playing' ? 'ring-2 ring-pink-400' : 'border-white/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{opponentSymbol}</div>
                  <div>
                    <div className="text-white font-semibold">
                      {opponent || 'Esperando...'}
                    </div>
                    <div className="text-sm text-blue-200">Oponente</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Status */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mb-6 text-center">
              {gameStatus === 'waiting' && (
                <div>
                  <Users className="w-12 h-12 text-blue-300 mx-auto mb-2 animate-pulse" />
                  <h2 className="text-xl text-white font-semibold mb-2">
                    Esperando al oponente...
                  </h2>
                  <p className="text-blue-200">
                    Comparte el código <span className="font-mono font-bold">{roomCode}</span>
                  </p>
                </div>
              )}

              {gameStatus === 'playing' && (
                <div>
                  <h2 className="text-xl text-white font-semibold mb-2">
                    {isMyTurn ? '¡Tu turno!' : 'Turno del oponente'}
                  </h2>
                  <div className={`text-4xl font-bold ${
                    isMyTurn ? 'text-blue-400' : 'text-pink-400'
                  }`}>
                    {isMyTurn ? mySymbol : opponentSymbol}
                  </div>
                </div>
              )}

              {gameStatus === 'finished' && (
                <div>
                  {winner === 0 ? (
                    <h2 className="text-2xl font-bold text-yellow-400">¡Empate!</h2>
                  ) : winner === playerNumber ? (
                    <h2 className="text-2xl font-bold text-green-400">¡Ganaste!</h2>
                  ) : (
                    <h2 className="text-2xl font-bold text-red-400">Perdiste</h2>
                  )}
                  <button
                    onClick={() => navigate('/lobby')}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    Volver al Lobby
                  </button>
                </div>
              )}
            </div>

            {/* Board */}
            <Board
              board={board}
              onCellClick={handleCellClick}
              winningLine={winningLine}
              disabled={gameStatus !== 'playing' || !isMyTurn}
            />
          </div>

          {/* Chat */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 flex flex-col h-[600px]">
            <h3 className="text-xl font-bold text-white mb-4">Chat</h3>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.username === username
                      ? 'bg-blue-500/20 ml-auto'
                      : 'bg-white/10'
                  } max-w-[80%]`}
                >
                  <div className="text-xs text-blue-200 mb-1">{msg.username}</div>
                  <div className="text-white">{msg.message}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}