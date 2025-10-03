from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.player import Player
from pydantic import BaseModel

router = APIRouter()

class PlayerCreate(BaseModel):
    username: str
    display_name: str

class PlayerResponse(BaseModel):
    id: int
    username: str
    display_name: str
    total_games: int
    wins: int
    losses: int
    draws: int
    win_rate: float

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PlayerResponse])
async def get_players(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of all players"""
    players = db.query(Player).offset(skip).limit(limit).all()
    return players

@router.get("/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get player by ID"""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@router.post("/", response_model=PlayerResponse)
async def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    """Create a new player"""
    # Check if username exists
    existing = db.query(Player).filter(Player.username == player.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    db_player = Player(**player.dict())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player