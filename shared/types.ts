export type Scene =
  | "intro"
  | "about"
  | "vibes"
  | "reasons"
  | "familiar"
  | "section"
  | "bridge"
  | "demo"
  | "behind"
  | "closing"
  | "join";
export const SCENES: Scene[] = [
  "intro",
  "about",
  "vibes",
  "reasons",
  "familiar",
  "section",
  "bridge",
  "demo",
  "behind",
  "closing",
  "join",
];

export type Move = "rock" | "paper" | "scissors";
export type PredictedMove = Move | "unknown";
export type DemoPhase =
  | "idle"
  | "waiting_for_hand"
  | "hand_detected"
  | "predicting"
  | "countdown"
  | "locked"
  | "reveal"
  | "result";
export type RuntimeMode = "simulate" | "live_cv";
export type PredictionSource = "simulation" | "live_cv" | "presenter";
export type ClassifierKind = "heuristic" | "learned";
export type ClassifierPreference = "auto" | ClassifierKind;
export type RoundOutcome = "player" | "computer" | "draw";

export interface Confidences {
  rock: number;
  paper: number;
  scissors: number;
}

export interface RoundResult {
  playerMove: Move;
  computerMove: Move;
  outcome: RoundOutcome;
}

export interface Score {
  player: number;
  computer: number;
}

export interface ClassifierStatus {
  requested: ClassifierPreference;
  active: ClassifierKind;
  modelLoaded: boolean;
  fallbackReason: string | null;
}

export interface HealthStatus {
  mode: RuntimeMode;
  activeClassifier: ClassifierKind;
  handDetected: boolean;
  prediction: PredictedMove | null;
  stable: boolean;
  recentConfidence: number;
  frameAgeMs: number | null;
  clients: number;
  message: string | null;
}

export interface GameState {
  mode: RuntimeMode;
  phase: DemoPhase;
  handDetected: boolean;
  predictedMove: PredictedMove | null;
  predictionStable: boolean;
  predictionSource: PredictionSource;
  playerMove: Move | null;
  lockedPlayerMove: Move | null;
  computerMove: Move | null;
  confidences: Confidences;
  countdownValue: number;
  result: RoundResult | null;
  score: Score;
  overrideActive: boolean;
  classifierStatus: ClassifierStatus;
  health: HealthStatus;
}

export const DEFAULT_CONFIDENCES: Confidences = {
  rock: 0,
  paper: 0,
  scissors: 0,
};

export const DEFAULT_CLASSIFIER_STATUS: ClassifierStatus = {
  requested: "auto",
  active: "heuristic",
  modelLoaded: false,
  fallbackReason: "Learned model not loaded",
};

export const DEFAULT_HEALTH_STATUS: HealthStatus = {
  mode: "simulate",
  activeClassifier: "heuristic",
  handDetected: false,
  prediction: null,
  stable: false,
  recentConfidence: 0,
  frameAgeMs: null,
  clients: 0,
  message: null,
};

export const DEFAULT_GAME_STATE: GameState = {
  mode: "simulate",
  phase: "idle",
  handDetected: false,
  predictedMove: null,
  predictionStable: false,
  predictionSource: "simulation",
  playerMove: null,
  lockedPlayerMove: null,
  computerMove: null,
  confidences: { ...DEFAULT_CONFIDENCES },
  countdownValue: 3,
  result: null,
  score: { player: 0, computer: 0 },
  overrideActive: false,
  classifierStatus: { ...DEFAULT_CLASSIFIER_STATUS },
  health: { ...DEFAULT_HEALTH_STATUS },
};

export type ClientMessage =
  | { type: "hello" }
  | { type: "request_state" }
  | { type: "advance_round" }
  | { type: "reset_round" }
  | { type: "start_autoplay" }
  | { type: "stop_autoplay" }
  | { type: "set_mode"; mode: RuntimeMode }
  | {
      type: "presenter_override";
      payload: PresenterOverride;
    }
  | {
      type: "presenter_command";
      command: PresenterCommand;
    };

export type PresenterOverride =
  | { action: "set_hand_detected"; detected: boolean }
  | { action: "set_prediction"; move: Move; confidences: Confidences }
  | { action: "start_countdown" }
  | { action: "set_computer_move"; move: Move }
  | { action: "trigger_reveal" }
  | { action: "trigger_result" }
  | { action: "reset" }
  | { action: "clear_prediction_override" }
  | { action: "set_mode"; mode: RuntimeMode };

export type PresenterCommand =
  | { action: "set_mode"; mode: RuntimeMode }
  | {
      action: "set_prediction_override";
      move: PredictedMove;
      confidences: Confidences;
    }
  | { action: "clear_prediction_override" }
  | { action: "start_countdown" }
  | { action: "set_computer_move"; move: Move }
  | { action: "trigger_reveal" }
  | { action: "trigger_result" }
  | { action: "reset" };

export type ServerMessage =
  | { type: "state_snapshot"; state: GameState }
  | { type: "connection_status"; connected: boolean }
  | { type: "mode_update"; mode: RuntimeMode }
  | { type: "hand_status"; detected: boolean }
  | {
      type: "prediction_update";
      move: PredictedMove;
      confidences: Confidences;
      stable: boolean;
      source: PredictionSource;
    }
  | { type: "countdown_update"; count: number }
  | { type: "phase_change"; phase: DemoPhase }
  | { type: "round_locked"; playerMove: Move }
  | { type: "computer_move"; move: Move }
  | { type: "round_result"; result: RoundResult }
  | { type: "score_update"; score: Score }
  | { type: "classifier_status"; status: ClassifierStatus }
  | { type: "health_status"; health: HealthStatus }
  | { type: "debug_ack"; message: string }
  | { type: "error"; message: string };

export function determineOutcome(player: Move, computer: Move): RoundOutcome {
  if (player === computer) {
    return "draw";
  }
  if (
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper")
  ) {
    return "player";
  }
  return "computer";
}

export function randomMove(): Move {
  const moves: Move[] = ["rock", "paper", "scissors"];
  return moves[Math.floor(Math.random() * moves.length)];
}

export const MOVE_EMOJI: Record<Move, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};
