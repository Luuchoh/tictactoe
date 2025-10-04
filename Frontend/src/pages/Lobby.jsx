import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Lock, Unlock } from 'lucide-react';
import api from '../services/api';

export default function Lobby() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');

  const username = localStorage.getItem('tictactoe_nickname');
  useEffect(() => {
    if (!username) {
      navigate('/');
    }
  }, [username]);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  };

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    if (!username.trim() || !roomName.trim()) {
      setError('Por favor ingresa tu nombre y el nombre de la sala');
      return;
    }

    try {
      const code = generateRoomCode();
      const response = await api.post('/rooms', {
        name: roomName,
        code: code,
        is_public: isPublic,
        created_by: username
      });

      navigate(`/game/${code}`, { state: { username } });
    } catch (err) {
      setError('Error al crear la sala. Intenta de nuevo.');
    }
  };

  const joinRoom = (code) => {
    if (!username.trim()) {
      setError('Por favor ingresa tu nombre primero');
      return;
    }
    navigate(`/game/${code}`, { state: { username } });
  };

  const joinByCode = () => {
    if (!username.trim()) {
      setError('Por favor ingresa tu nombre primero');
      return;
    }
    if (!roomCode.trim()) {
      setError('Por favor ingresa el código de la sala');
      return;
    }
    navigate(`/game/${roomCode.toUpperCase()}`, { state: { username } });
  };

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-3xl font-bold text-white">Lobby Multijugador</h1>
          <div className="w-20"></div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 text-red-200">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create/Join Room */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Crear o Unirse</h2>

            {!showCreateForm ? (
              <div className="space-y-4">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Crear Nueva Sala
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-blue-200">o</span>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Unirse con Código
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="CÓDIGO"
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                      maxLength={6}
                    />
                    <button
                      onClick={joinByCode}
                      className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all"
                    >
                      Unirse
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Nombre de la Sala
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Mi Sala Increíble"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={50}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isPublic
                        ? 'bg-green-500/20 text-green-300 border border-green-500'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500'
                    }`}
                  >
                    {isPublic ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    <span>{isPublic ? 'Pública' : 'Privada'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-white/10 border border-white/20 text-white py-3 rounded-lg hover:bg-white/20 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createRoom}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    Crear Sala
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Rooms */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Salas Activas</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {rooms.length === 0 ? (
                <div className="text-center text-blue-200 py-8">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay salas disponibles</p>
                  <p className="text-sm mt-1">¡Sé el primero en crear una!</p>
                </div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white/10 border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold">{room.name}</h3>
                          {room.is_public ? (
                            <Unlock className="w-4 h-4 text-green-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-orange-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-blue-200">
                          <span className="font-mono">{room.code}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {room.players_count || 0}/2
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => joinRoom(room.code)}
                        disabled={(room.players_count || 0) >= 2}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Unirse
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}