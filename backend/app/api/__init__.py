from .collections import router as collections_router
from .books import router as books_router
from .board_games import router as board_games_router
from .auth import router as auth_router

__all__ = ["collections_router", "books_router", "board_games_router", "auth_router"]
