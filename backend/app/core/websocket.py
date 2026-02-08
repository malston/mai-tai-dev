"""
WebSocket connection manager for real-time messaging.
"""
from typing import Dict, Set
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections per channel."""

    def __init__(self):
        # Map of channel_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel_id: str):
        """Accept a WebSocket connection and add it to a channel."""
        await websocket.accept()
        if channel_id not in self.active_connections:
            self.active_connections[channel_id] = set()
        self.active_connections[channel_id].add(websocket)
        logger.info(f"WebSocket connected to channel {channel_id}")

    def disconnect(self, websocket: WebSocket, channel_id: str):
        """Remove a WebSocket connection from a channel."""
        if channel_id in self.active_connections:
            self.active_connections[channel_id].discard(websocket)
            if not self.active_connections[channel_id]:
                del self.active_connections[channel_id]
        logger.info(f"WebSocket disconnected from channel {channel_id}")

    async def broadcast_to_channel(self, channel_id: str, message: dict):
        """Send a message to all connections in a channel."""
        if channel_id not in self.active_connections:
            return

        disconnected = set()
        for websocket in self.active_connections[channel_id]:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket: {e}")
                disconnected.add(websocket)

        # Clean up disconnected sockets
        for ws in disconnected:
            self.active_connections[channel_id].discard(ws)


# Global connection manager instance
manager = ConnectionManager()

