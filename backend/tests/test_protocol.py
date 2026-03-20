from backend.app.protocol import parse_client_message


def test_parse_set_mode_message() -> None:
    message = parse_client_message('{"type":"set_mode","mode":"live_cv"}')
    assert getattr(message, "type") == "set_mode"
    assert getattr(message, "mode") == "live_cv"


def test_parse_presenter_command_message() -> None:
    message = parse_client_message(
        '{"type":"presenter_command","command":{"action":"start_countdown"}}'
    )
    assert getattr(message, "type") == "presenter_command"
