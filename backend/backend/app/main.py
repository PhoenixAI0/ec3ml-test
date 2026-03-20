from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from backend.app.runtime import AppRuntime

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

runtime = AppRuntime()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await runtime.startup()
    try:
        yield
    finally:
        await runtime.shutdown()


app = FastAPI(title="RPS Showcase Backend", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, object]:
    return await runtime.health_snapshot()


@app.get("/debug/state")
async def debug_state() -> dict[str, object]:
    return await runtime.debug_snapshot()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await runtime.connect(websocket)
    try:
        while True:
            try:
                message = await websocket.receive()
            except RuntimeError as exc:
                if 'disconnect message has been received' in str(exc):
                    break
                raise

            if message.get("type") == "websocket.disconnect":
                break
            if "text" in message and message["text"] is not None:
                await runtime.handle_text(websocket, message["text"])
            elif "bytes" in message and message["bytes"] is not None:
                await runtime.handle_binary(message["bytes"])
    except WebSocketDisconnect:
        pass
    finally:
        await runtime.disconnect(websocket)
