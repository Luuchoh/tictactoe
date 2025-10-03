import { X } from 'lucide-react';

export default function NicknameModal({ isOpen, onClose, nickname, setNickname, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center p-4 z-[9999]" >
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md relative shadow-2xl transform transition-all" >
        <button
          onClick={onClose}
          className="absolute text-gray-400 hover:text-white"
          style={{ top: 4, right: 4 }}
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-4">Elige tu apodo</h2>
        <p className="text-blue-200 mb-6">
          Este nombre se mostrará a otros jugadores cuando juegues en línea.
        </p>
        
        <form onSubmit={onSubmit}>
          <div className="mb-6">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full font-bold bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="Tu apodo"
              autoFocus
              maxLength={20}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-white/5 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            disabled={!nickname.trim()}
          >
            Jugar
          </button>
        </form>
      </div>
    </div>
  );
}
