from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database.session import Base

class GameStatus(enum.Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"

class GameResult(enum.Enum):
    PLAYER1_WIN = "player1_win"
    PLAYER2_WIN = "player2_win"
    DRAW = "draw"

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    total_games = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    games_as_player1 = relationship("Game", foreign_keys="Game.player1_id", back_populates="player1")
    games_as_player2 = relationship("Game", foreign_keys="Game.player2_id", back_populates="player2")

    @property
    def win_rate(self):
        if self.total_games == 0:
            return 0.0
        return round((self.wins / self.total_games) * 100, 2)

    @property
    def rank_score(self):
        """Calculate rank score: wins * 3 + draws * 1"""
        return self.wins * 3 + self.draws

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    is_public = Column(Boolean, default=True)
    max_players = Column(Integer, default=2)
    status = Column(Enum(GameStatus), default=GameStatus.WAITING)
    created_by = Column(Integer, ForeignKey("players.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    game = relationship("Game", back_populates="room", uselist=False)
    creator = relationship("Player")

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), unique=True)
    player1_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    player2_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    winner_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    status = Column(Enum(GameStatus), default=GameStatus.WAITING)
    result = Column(Enum(GameResult), nullable=True)
    board_state = Column(String(9), default="000000000")  # 0=empty, 1=player1, 2=player2
    current_turn = Column(Integer, default=1)  # 1 or 2
    total_moves = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    room = relationship("Room", back_populates="game")
    player1 = relationship("Player", foreign_keys=[player1_id], back_populates="games_as_player1")
    player2 = relationship("Player", foreign_keys=[player2_id], back_populates="games_as_player2")
    winner = relationship("Player", foreign_keys=[winner_id])