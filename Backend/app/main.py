from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.session import engine, Base
from app.api.routes import game, player, room, stats
from app.websocket.game_handler import GameHandler

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.CORS_ORIGINS
)

# Initialize game handler
game_handler = GameHandler(sio)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    yield
    # Shutdown
    print("👋 Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Tic-Tac-Toe Multiplayer API",
    description="Backend API for multiplayer tic-tac-toe game",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(player.router, prefix="/api/players", tags=["players"])
app.include_router(game.router, prefix="/api/games", tags=["games"])
app.include_router(room.router, prefix="/api/rooms", tags=["rooms"])
app.include_router(stats.router, prefix="/api/stats", tags=["statistics"])

# Socket.IO events
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit('connected', {'sid': sid}, room=sid)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    await game_handler.handle_disconnect(sid)

@sio.event
async def join_room(sid, data):
    await game_handler.handle_join_room(sid, data)

@sio.event
async def leave_room(sid, data):
    await game_handler.handle_leave_room(sid, data)

@sio.event
async def make_move(sid, data):
    await game_handler.handle_make_move(sid, data)

@sio.event
async def ready(sid, data):
    await game_handler.handle_ready(sid, data)

@sio.event
async def chat_message(sid, data):
    await game_handler.handle_chat_message(sid, data)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Tic-Tac-Toe Multiplayer API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Mount Socket.IO app
socket_app = socketio.ASGIApp(sio, app)

# Export for uvicorn
app = socket_app