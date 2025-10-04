from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List

from app.database.session import get_db
from app.models.player import Player, Game, Room, GameStatus

router = APIRouter()

@router.get("/general")
async def get_general_stats(db: Session = Depends(get_db)):
    """Get general statistics"""
    total_players = db.query(func.count(Player.id)).scalar()
    total_games = db.query(func.count(Game.id)).scalar()
    finished_games = db.query(func.count(Game.id)).filter(
        Game.status == GameStatus.FINISHED
    ).scalar()
    active_rooms = db.query(func.count(Room.id)).filter(
        Room.status == GameStatus.IN_PROGRESS
    ).scalar()

    return {
        "total_players": total_players,
        "total_games": total_games,
        "finished_games": finished_games,
        "active_rooms": active_rooms,
        "active_players": active_rooms * 2  # Approximate
    }

@router.get("/ranking")
async def get_ranking(limit: int = 10, db: Session = Depends(get_db)):
    """Get player ranking by wins"""
    players = db.query(Player).order_by(
        desc(Player.wins),
        desc(Player.total_games)
    ).limit(limit).all()

    return [
        {
            "rank": idx + 1,
            "username": player.username,
            "display_name": player.display_name,
            "total_games": player.total_games,
            "wins": player.wins,
            "losses": player.losses,
            "draws": player.draws,
            "win_rate": player.win_rate,
            "rank_score": player.rank_score
        }
        for idx, player in enumerate(players)
    ]

@router.get("/player/{player_id}")
async def get_player_stats(player_id: int, db: Session = Depends(get_db)):
    """Get detailed stats for a player"""
    player = db.query(Player).get(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    recent_games = db.query(Game).filter(
        (Game.player1_id == player_id) | (Game.player2_id == player_id)
    ).filter(
        Game.status == GameStatus.FINISHED
    ).order_by(desc(Game.finished_at)).limit(10).all()

    return {
        "player": {
            "id": player.id,
            "username": player.username,
            "display_name": player.display_name,
            "total_games": player.total_games,
            "wins": player.wins,
            "losses": player.losses,
            "draws": player.draws,
            "win_rate": player.win_rate,
            "rank_score": player.rank_score,
            "created_at": player.created_at,
            "last_seen": player.last_seen
        },
        "recent_games": [
            {
                "id": game.id,
                "opponent": (
                    db.query(Player).get(game.player2_id).username
                    if game.player1_id == player_id
                    else db.query(Player).get(game.player1_id).username
                ),
                "result": (
                    "win" if game.winner_id == player_id
                    else "loss" if game.winner_id
                    else "draw"
                ),
                "total_moves": game.total_moves,
                "finished_at": game.finished_at
            }
            for game in recent_games
        ]
    }

@router.get("/leaderboard")
async def get_leaderboard(db: Session = Depends(get_db)):
    """Get comprehensive leaderboard with multiple categories"""
    # Most wins
    most_wins = db.query(Player).order_by(desc(Player.wins)).limit(5).all()
    
    # Best win rate (min 10 games)
    best_win_rate = db.query(Player).filter(
        Player.total_games >= 10
    ).order_by(desc(Player.wins / Player.total_games)).limit(5).all()
    
    # Most games played
    most_games = db.query(Player).order_by(desc(Player.total_games)).limit(5).all()

    return {
        "most_wins": [
            {
                "username": p.username,
                "wins": p.wins,
                "total_games": p.total_games
            }
            for p in most_wins
        ],
        "best_win_rate": [
            {
                "username": p.username,
                "win_rate": p.win_rate,
                "total_games": p.total_games
            }
            for p in best_win_rate
        ],
        "most_active": [
            {
                "username": p.username,
                "total_games": p.total_games
            }
            for p in most_games
        ]
    }