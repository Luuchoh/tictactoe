from sqlalchemy.orm import Session
from typing import Optional
from app.models.player import Game, Player

class GameService:
    """Service for game logic and operations"""

    def check_winner(self, board: str) -> Optional[int]:
        """
        Check if there's a winner in the current board state.
        Returns:
            1 if player 1 wins
            2 if player 2 wins
            0 if draw
            None if game continues
        """
        # Convert board string to list for easier access
        b = list(board)

        # Winning combinations
        winning_combos = [
            [0, 1, 2],  # Top row
            [3, 4, 5],  # Middle row
            [6, 7, 8],  # Bottom row
            [0, 3, 6],  # Left column
            [1, 4, 7],  # Middle column
            [2, 5, 8],  # Right column
            [0, 4, 8],  # Diagonal \
            [2, 4, 6],  # Diagonal /
        ]

        # Check for winner
        for combo in winning_combos:
            if b[combo[0]] == b[combo[1]] == b[combo[2]] != '0':
                return int(b[combo[0]])

        # Check for draw (no empty spaces)
        if '0' not in b:
            return 0

        # Game continues
        return None

    def update_player_stats(self, db: Session, game: Game) -> None:
        """Update player statistics after game ends"""
        player1 = db.query(Player).get(game.player1_id)
        player2 = db.query(Player).get(game.player2_id)

        if not player1 or not player2:
            return

        # Update total games
        player1.total_games += 1
        player2.total_games += 1

        # Update wins/losses/draws
        if game.winner_id == player1.id:
            player1.wins += 1
            player2.losses += 1
        elif game.winner_id == player2.id:
            player2.wins += 1
            player1.losses += 1
        else:  # Draw
            player1.draws += 1
            player2.draws += 1

        db.commit()

    def get_board_display(self, board_state: str) -> list:
        """Convert board string to display format"""
        symbols = {
            '0': '',
            '1': 'X',
            '2': 'O'
        }
        return [symbols[cell] for cell in board_state]

    def is_valid_move(self, board: str, position: int) -> bool:
        """Check if a move is valid"""
        if not (0 <= position <= 8):
            return False
        return board[position] == '0'

    def get_available_moves(self, board: str) -> list:
        """Get list of available positions"""
        return [i for i, cell in enumerate(board) if cell == '0']