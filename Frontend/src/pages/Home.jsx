import { useNavigate } from 'react-router-dom';
import { Gamepad2, Users, BarChart3, Globe } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            Tic-Tac-Toe
          </h1>
          <p className="text-xl text-blue-200">
            Juega localmente o en línea con amigos
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Local Game */}
          <button
            onClick={() => navigate('/local')}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-to-br from-pink-500 to-purple-500 p-4 rounded-full mb-4">
                <Gamepad2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Juego Local
              </h2>
              <p className="text-blue-200">
                Juega con un amigo en el mismo dispositivo
              </p>
            </div>
          </button>

          {/* Online Game */}
          <button
            onClick={() => navigate('/lobby')}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-full mb-4">
                <Globe className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Juego en Línea
              </h2>
              <p className="text-blue-200">
                Conecta con jugadores de todo el mundo
              </p>
            </div>
          </button>

          {/* Stats */}
          <button
            onClick={() => navigate('/admin')}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 md:col-span-2"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-full mb-4">
                <BarChart3 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Estadísticas y Rankings
              </h2>
              <p className="text-blue-200">
                Ve las estadísticas globales y el ranking de jugadores
              </p>
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg px-6 py-3 rounded-full">
            <Users className="w-5 h-5 text-blue-300" />
            <span className="text-blue-200">
              Multijugador con WebSockets
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}