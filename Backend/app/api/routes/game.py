from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.database.session import get_db
from app.models.player import Game, Player, GameStatus
from pydantic import BaseModel

router = APIRouter()

class GameResponse(BaseModel):
    id: int
    player1_username: str
    player2_username: str | None
    status: str
    winner_username: str | None
    total_moves: int
    started_at: str | None
    finished_at: str | None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[GameResponse])
async def get_games(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Get list of games"""
    query = db.query(Game)
    
    if status:
        try:
            game_status = GameStatus(status)
            query = query.filter(Game.status == game_status)
        except ValueError:
            pass
    
    games = query.order_by(desc(Game.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for game in games:
        player1 = db.query(Player).get(game.player1_id)
        player2 = db.query(Player).get(game.player2_id) if game.player2_id else None
        winner = db.query(Player).get(game.winner_id) if game.winner_id else None
        
        result.append({
            "id": game.id,
            "player1_username": player1.username if player1 else "Unknown",
            "player2_username": player2.username if player2 else None,
            "status": game.status.value,
            "winner_username": winner.username if winner else None,
            "total_moves": game.total_moves,
            "started_at": game.started_at.isoformat() if game.started_at else None,
            "finished_at": game.finished_at.isoformat() if game.finished_at else None
        })
    
    return result

@router.get("/{game_id}")
async def get_game(game_id: int, db: Session = Depends(get_db)):
    """Get game details by ID"""
    game = db.query(Game).get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    player1 = db.query(Player).get(game.player1_id)
    player2 = db.query(Player).get(game.player2_id) if game.player2_id else None
    winner = db.query(Player).get(game.winner_id) if game.winner_id else None
    
    return {
        "id": game.id,
        "player1": {
            "id": player1.id,
            "username": player1.username
        } if player1 else None,
        "player2": {
            "id": player2.id,
            "username": player2.username
        } if player2 else None,
        "winner": {
            "id": winner.id,
            "username": winner.username
        } if winner else None,
        "status": game.status.value,
        "result": game.result.value if game.result else None,
        "board_state": game.board_state,
        "current_turn": game.current_turn,
        "total_moves": game.total_moves,
        "started_at": game.started_at,
        "finished_at": game.finished_at,
        "created_at": game.created_at
    }