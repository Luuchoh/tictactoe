from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.models.player import Room, Player, GameStatus

router = APIRouter()

class RoomCreate(BaseModel):
    name: str
    code: str
    is_public: bool = True
    created_by: str

class RoomResponse(BaseModel):
    id: int
    code: str
    name: str
    is_public: bool
    status: str
    players_count: Optional[int] = 0

    class Config:
        from_attributes = True

@router.get("/", response_model=List[RoomResponse])
async def get_rooms(db: Session = Depends(get_db)):
    """Get list of active rooms"""
    rooms = db.query(Room).filter(
        Room.status.in_([GameStatus.WAITING, GameStatus.IN_PROGRESS])
    ).all()
    
    # Add players count
    result = []
    for room in rooms:
        room_dict = {
            "id": room.id,
            "code": room.code,
            "name": room.name,
            "is_public": room.is_public,
            "status": room.status.value,
            "players_count": 1 if room.game and room.game.player2_id else 0
        }
        result.append(room_dict)
    
    return result

@router.get("/{room_code}")
async def get_room(room_code: str, db: Session = Depends(get_db)):
    """Get room by code"""
    room = db.query(Room).filter(Room.code == room_code).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return {
        "id": room.id,
        "code": room.code,
        "name": room.name,
        "is_public": room.is_public,
        "status": room.status.value,
        "created_at": room.created_at
    }

@router.post("/", response_model=RoomResponse)
async def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    """Create a new room"""
    # Check if code already exists
    existing = db.query(Room).filter(Room.code == room.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room code already exists")
    
    # Get or create player
    player = db.query(Player).filter(Player.username == room.created_by).first()
    if not player:
        player = Player(username=room.created_by, display_name=room.created_by)
        db.add(player)
        db.commit()
        db.refresh(player)
    
    # Create room
    db_room = Room(
        name=room.name,
        code=room.code,
        is_public=room.is_public,
        created_by=player.id,
        status=GameStatus.WAITING
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    
    return {
        "id": db_room.id,
        "code": db_room.code,
        "name": db_room.name,
        "is_public": db_room.is_public,
        "status": db_room.status.value,
        "players_count": 0
    }