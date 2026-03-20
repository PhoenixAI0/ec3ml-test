import { useCallback, useEffect, useRef } from "react";
import type { ClientMessage, ServerMessage } from "@shared/types";
import { useAppStore } from "../store";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3001/ws";
const RECONNECT_INTERVAL = 2000;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const manualClose = useRef(false);
  const store = useAppStore();

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendBinary = useCallback((payload: Blob | ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
    }
  }, []);

  const handleMessage = useCallback((message: ServerMessage) => {
    const state = useAppStore.getState();
    switch (message.type) {
      case "state_snapshot":
        state.applyGameState(message.state);
        break;
      case "connection_status":
        state.setConnected(message.connected);
        break;
      case "mode_update":
        state.setMode(message.mode);
        break;
      case "hand_status":
        state.setHandDetected(message.detected);
        break;
      case "prediction_update":
        state.setPredictedMove(message.move, message.stable);
        state.setConfidences(message.confidences);
        break;
      case "countdown_update":
        state.setCountdownValue(message.count);
        break;
      case "phase_change":
        state.setDemoPhase(message.phase);
        break;
      case "round_locked":
        state.setLockedPlayerMove(message.playerMove);
        state.setPlayerMove(message.playerMove);
        break;
      case "computer_move":
        state.setComputerMove(message.move);
        break;
      case "round_result":
        state.setResult(message.result);
        break;
      case "score_update":
        state.setScore(message.score);
        break;
      case "classifier_status":
        state.setClassifierStatus(message.status);
        break;
      case "health_status":
        state.setHealth(message.health);
        break;
      case "debug_ack":
      case "error":
        break;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const socket = new WebSocket(WS_URL);
    socket.binaryType = "blob";
    wsRef.current = socket;
    manualClose.current = false;

    socket.onopen = () => {
      useAppStore.getState().setConnected(true);
      send({ type: "hello" });
    };

    socket.onmessage = (event) => {
      if (typeof event.data !== "string") {
        return;
      }

      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch {
        // Ignore malformed server messages.
      }
    };

    socket.onclose = () => {
      useAppStore.getState().setConnected(false);
      wsRef.current = null;
      if (!manualClose.current) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_INTERVAL);
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }, [handleMessage, send]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    manualClose.current = true;
    wsRef.current?.close();
    wsRef.current = null;
    useAppStore.getState().setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      manualClose.current = true;
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    send,
    sendBinary,
    connect,
    disconnect,
    connected: store.connected,
  };
}
