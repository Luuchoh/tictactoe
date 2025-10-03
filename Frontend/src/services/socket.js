import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8000';

let socket = null;

export const connectSocket = () => {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export { socket };