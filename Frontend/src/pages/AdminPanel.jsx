import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Target, TrendingUp, Medal } from 'lucide-react';
import api from '../services/api';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, rankingRes, leaderboardRes] = await Promise.all([
        api.get('/stats/general'),
        api.get('/stats/ranking?limit=10'),
        api.get('/stats/leaderboard')
      ]);

      setStats(statsRes.data);
      setRanking(rankingRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-3xl font-bold text-white">Panel de Estadísticas</h1>
          <div className="w-20"></div>
        </div>

        {/* General Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-white">
                {stats?.total_players || 0}
              </span>
            </div>
            <h3 className="text-blue-200 font-semibold">Jugadores Totales</h3>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold text-white">
                {stats?.total_games || 0}
              </span>
            </div>
            <h3 className="text-purple-200 font-semibold">Partidas Jugadas</h3>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-white">
                {stats?.finished_games || 0}
              </span>
            </div>
            <h3 className="text-green-200 font-semibold">Partidas Completadas</h3>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-lg border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-400" />
              <span className="text-3xl font-bold text-white">
                {stats?.active_rooms || 0}
              </span>
            </div>
            <h3 className="text-orange-200 font-semibold">Salas Activas</h3>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top 10 Ranking */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Top 10 Jugadores</h2>
            </div>

            <div className="space-y-3">
              {ranking.map((player, idx) => (
                <div
                  key={player.username}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    idx < 3 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                    idx === 1 ? 'bg-gray-300 text-gray-800' :
                    idx === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-blue-500/30 text-blue-200'
                  }`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </div>

                  <div className="flex-1">
                    <div className="text-white font-semibold">{player.username}</div>
                    <div className="flex gap-4 text-sm text-blue-200">
                      <span>{player.total_games} partidas</span>
                      <span className="text-green-400">{player.wins} victorias</span>
                      <span>{player.win_rate}% ratio</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      {player.rank_score}
                    </div>
                    <div className="text-xs text-blue-200">puntos</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboards */}
          <div className="space-y-6">
            {/* Most Wins */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Medal className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-white">Más Victorias</h3>
              </div>
              <div className="space-y-2">
                {leaderboard?.most_wins?.slice(0, 5).map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white font-medium">{player.username}</span>
                    <span className="text-green-400 font-bold">{player.wins} victorias</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Win Rate */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Mejor Ratio</h3>
              </div>
              <div className="space-y-2">
                {leaderboard?.best_win_rate?.slice(0, 5).map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white font-medium">{player.username}</span>
                    <div className="text-right">
                      <div className="text-blue-400 font-bold">{player.win_rate}%</div>
                      <div className="text-xs text-blue-200">{player.total_games} partidas</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Más Activos</h3>
              </div>
              <div className="space-y-2">
                {leaderboard?.most_active?.slice(0, 5).map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white font-medium">{player.username}</span>
                    <span className="text-purple-400 font-bold">{player.total_games} partidas</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}