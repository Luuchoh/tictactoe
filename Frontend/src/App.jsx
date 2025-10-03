import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LocalGame from './pages/LocalGame';
import OnlineGame from './pages/OnlineGame';
import AdminPanel from './pages/AdminPanel';
import Lobby from './pages/Lobby';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/local" element={<LocalGame />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game/:roomCode" element={<OnlineGame />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;