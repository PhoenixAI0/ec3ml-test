from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field, TypeAdapter


class HelloMessage(BaseModel):
    type: Literal["hello"]


class RequestStateMessage(BaseModel):
    type: Literal["request_state"]


class AdvanceRoundMessage(BaseModel):
    type: Literal["advance_round"]


class ResetRoundMessage(BaseModel):
    type: Literal["reset_round"]


class StartAutoplayMessage(BaseModel):
    type: Literal["start_autoplay"]


class StopAutoplayMessage(BaseModel):
    type: Literal["stop_autoplay"]


class SetModeMessage(BaseModel):
    type: Literal["set_mode"]
    mode: Literal["simulate", "live_cv"]


class PresenterOverrideMessage(BaseModel):
    type: Literal["presenter_override"]
    payload: dict[str, object]


class PresenterCommandMessage(BaseModel):
    type: Literal["presenter_command"]
    command: dict[str, object]


ClientMessage = Annotated[
    HelloMessage
    | RequestStateMessage
    | AdvanceRoundMessage
    | ResetRoundMessage
    | StartAutoplayMessage
    | StopAutoplayMessage
    | SetModeMessage
    | PresenterOverrideMessage
    | PresenterCommandMessage,
    Field(discriminator="type"),
]

CLIENT_MESSAGE_ADAPTER = TypeAdapter(ClientMessage)


def parse_client_message(payload: str) -> BaseModel:
    return CLIENT_MESSAGE_ADAPTER.validate_json(payload)
