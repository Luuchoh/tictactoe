import socketio
from typing import Dict, Set
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.player import Game, Room, Player, GameStatus, GameResult
from app.services.game_services import GameService

class GameHandler:
    def __init__(self, sio: socketio.AsyncServer):
        self.sio = sio
        self.active_connections: Dict[str, Dict] = {}  # sid -> {room_code, player_id}
        self.rooms: Dict[str, Set[str]] = {}  # room_code -> set of sids
        self.game_service = GameService()

    def get_db(self) -> Session:
        return SessionLocal()

    async def handle_join_room(self, sid: str, data: dict):
        """Handle player joining a room"""
        try:
            room_code = data.get('room_code')
            player_id = data.get('player_id')
            username = data.get('username')

            if not room_code or not username:
                await self.sio.emit('error', {'message': 'Missing room_code or username'}, room=sid)
                return

            db = self.get_db()
            try:
                # Get or create player
                player = db.query(Player).filter(Player.username == username).first()
                if not player:
                    player = Player(username=username, display_name=username)
                    db.add(player)
                    db.commit()
                    db.refresh(player)
                
                player_id = player.id

                # Get room
                room = db.query(Room).filter(Room.code == room_code).first()
                if not room:
                    await self.sio.emit('error', {'message': 'Room not found'}, room=sid)
                    return

                # Join socket.io room
                await self.sio.enter_room(sid, room_code)
                
                # Track connection
                self.active_connections[sid] = {
                    'room_code': room_code,
                    'player_id': player_id,
                    'username': username
                }
                
                if room_code not in self.rooms:
                    self.rooms[room_code] = set()
                self.rooms[room_code].add(sid)

                # Get or create game
                game = db.query(Game).filter(Game.room_id == room.id).first()
                if not game:
                    game = Game(
                        room_id=room.id,
                        player1_id=player_id,
                        status=GameStatus.WAITING
                    )
                    db.add(game)
                elif not game.player2_id:
                    game.player2_id = player_id
                    game.status = GameStatus.IN_PROGRESS
                    game.started_at = datetime.utcnow()
                    room.status = GameStatus.IN_PROGRESS
                    room.started_at = datetime.utcnow()

                db.commit()
                db.refresh(game)

                # Notify room
                await self.sio.emit('room_joined', {
                    'room_code': room_code,
                    'player_id': player_id,
                    'username': username,
                    'game_id': game.id,
                    'player_number': 1 if game.player1_id == player_id else 2
                }, room=sid)

                # Broadcast to room
                await self.sio.emit('player_joined', {
                    'username': username,
                    'players_count': len(self.rooms[room_code])
                }, room=room_code, skip_sid=sid)

                # Start game if both players present
                if game.player2_id and game.status == GameStatus.IN_PROGRESS:
                    await self.sio.emit('game_started', {
                        'game_id': game.id,
                        'player1': db.query(Player).get(game.player1_id).username,
                        'player2': db.query(Player).get(game.player2_id).username,
                        'current_turn': game.current_turn
                    }, room=room_code)

            finally:
                db.close()

        except Exception as e:
            print(f"Error in join_room: {str(e)}")
            await self.sio.emit('error', {'message': str(e)}, room=sid)

    async def handle_leave_room(self, sid: str, data: dict):
        """Handle player leaving a room"""
        if sid not in self.active_connections:
            return

        connection = self.active_connections[sid]
        room_code = connection['room_code']

        await self.sio.leave_room(sid, room_code)
        self.rooms[room_code].discard(sid)
        del self.active_connections[sid]

        await self.sio.emit('player_left', {
            'username': connection['username']
        }, room=room_code)

    async def handle_make_move(self, sid: str, data: dict):
        """Handle player making a move"""
        try:
            if sid not in self.active_connections:
                return

            game_id = data.get('game_id')
            position = data.get('position')  # 0-8
            
            if position is None or not (0 <= position <= 8):
                await self.sio.emit('error', {'message': 'Invalid position'}, room=sid)
                return

            connection = self.active_connections[sid]
            room_code = connection['room_code']
            player_id = connection['player_id']

            db = self.get_db()
            try:
                game = db.query(Game).get(game_id)
                if not game:
                    await self.sio.emit('error', {'message': 'Game not found'}, room=sid)
                    return

                # Validate turn
                current_player = game.player1_id if game.current_turn == 1 else game.player2_id
                if current_player != player_id:
                    await self.sio.emit('error', {'message': ''}, room=sid)
                    return

                # Validate position is empty
                board = list(game.board_state)
                if board[position] != '0':
                    await self.sio.emit('error', {'message': 'Position already taken'}, room=sid)
                    return

                # Make move
                board[position] = str(game.current_turn)
                game.board_state = ''.join(board)
                game.total_moves += 1

                # Check for winner
                winner = self.game_service.check_winner(game.board_state)
                
                if winner:
                    game.status = GameStatus.FINISHED
                    game.finished_at = datetime.utcnow()
                    if winner == 1:
                        game.winner_id = game.player1_id
                        game.result = GameResult.PLAYER1_WIN
                    elif winner == 2:
                        game.winner_id = game.player2_id
                        game.result = GameResult.PLAYER2_WIN
                    else:
                        game.result = GameResult.DRAW

                    # Update player stats
                    self.game_service.update_player_stats(db, game)
                    
                    # Update room
                    room = db.query(Room).get(game.room_id)
                    room.status = GameStatus.FINISHED
                    room.finished_at = datetime.utcnow()

                else:
                    # Switch turn
                    game.current_turn = 2 if game.current_turn == 1 else 1

                db.commit()

                # Broadcast move
                await self.sio.emit('move_made', {
                    'game_id': game.id,
                    'position': position,
                    'player': current_player,
                    'board': game.board_state,
                    'current_turn': game.current_turn
                }, room=room_code)

                # Notify if game over
                if winner is not None:
                    result_msg = "Draw!" if winner == 0 else f"Player {winner} wins!"
                    await self.sio.emit('game_over', {
                        'game_id': game.id,
                        'winner': winner,
                        'result': result_msg,
                        'board': game.board_state
                    }, room=room_code)

            finally:
                db.close()

        except Exception as e:
            print(f"Error in make_move: {str(e)}")
            await self.sio.emit('error', {'message': str(e)}, room=sid)

    async def handle_ready(self, sid: str, data: dict):
        """Handle player ready status"""
        if sid not in self.active_connections:
            return

        connection = self.active_connections[sid]
        room_code = connection['room_code']

        await self.sio.emit('player_ready', {
            'username': connection['username']
        }, room=room_code)

    async def handle_chat_message(self, sid: str, data: dict):
        """Handle chat messages in room"""
        if sid not in self.active_connections:
            return

        connection = self.active_connections[sid]
        room_code = connection['room_code']
        message = data.get('message', '')

        if message:
            await self.sio.emit('chat_message', {
                'username': connection['username'],
                'message': message,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room_code)

    async def handle_disconnect(self, sid: str):
        """Handle player disconnection"""
        if sid not in self.active_connections:
            return

        connection = self.active_connections[sid]
        room_code = connection['room_code']

        if room_code in self.rooms:
            self.rooms[room_code].discard(sid)
            
            await self.sio.emit('player_disconnected', {
                'username': connection['username']
            }, room=room_code)

        del self.active_connections[sid]