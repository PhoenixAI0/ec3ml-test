import { create } from "zustand";
import type {
  ClassifierStatus,
  Confidences,
  DemoPhase,
  GameState,
  HealthStatus,
  Move,
  PredictedMove,
  RoundResult,
  RuntimeMode,
  Scene,
  Score,
} from "@shared/types";
import {
  DEFAULT_CLASSIFIER_STATUS,
  DEFAULT_GAME_STATE,
  DEFAULT_HEALTH_STATUS,
  SCENES,
} from "@shared/types";

interface AppState {
  scene: Scene;
  setScene: (scene: Scene) => void;
  nextScene: () => void;
  prevScene: () => void;

  connected: boolean;
  setConnected: (connected: boolean) => void;

  mode: RuntimeMode;
  demoPhase: DemoPhase;
  handDetected: boolean;
  predictedMove: PredictedMove | null;
  predictionStable: boolean;
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

  applyGameState: (state: GameState) => void;
  setMode: (mode: RuntimeMode) => void;
  setDemoPhase: (phase: DemoPhase) => void;
  setHandDetected: (detected: boolean) => void;
  setPredictedMove: (move: PredictedMove | null, stable?: boolean) => void;
  setPlayerMove: (move: Move | null) => void;
  setLockedPlayerMove: (move: Move | null) => void;
  setComputerMove: (move: Move | null) => void;
  setConfidences: (confidences: Confidences) => void;
  setCountdownValue: (value: number) => void;
  setResult: (result: RoundResult | null) => void;
  setScore: (score: Score) => void;
  setClassifierStatus: (status: ClassifierStatus) => void;
  setHealth: (health: HealthStatus) => void;

  presenterOpen: boolean;
  togglePresenter: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  scene: "intro",
  setScene: (scene) => set({ scene }),
  nextScene: () => {
    const index = SCENES.indexOf(get().scene);
    if (index < SCENES.length - 1) {
      set({ scene: SCENES[index + 1] });
    }
  },
  prevScene: () => {
    const index = SCENES.indexOf(get().scene);
    if (index > 0) {
      set({ scene: SCENES[index - 1] });
    }
  },

  connected: false,
  setConnected: (connected) => set({ connected }),

  mode: DEFAULT_GAME_STATE.mode,
  demoPhase: DEFAULT_GAME_STATE.phase,
  handDetected: DEFAULT_GAME_STATE.handDetected,
  predictedMove: DEFAULT_GAME_STATE.predictedMove,
  predictionStable: DEFAULT_GAME_STATE.predictionStable,
  playerMove: DEFAULT_GAME_STATE.playerMove,
  lockedPlayerMove: DEFAULT_GAME_STATE.lockedPlayerMove,
  computerMove: DEFAULT_GAME_STATE.computerMove,
  confidences: DEFAULT_GAME_STATE.confidences,
  countdownValue: DEFAULT_GAME_STATE.countdownValue,
  result: DEFAULT_GAME_STATE.result,
  score: DEFAULT_GAME_STATE.score,
  overrideActive: DEFAULT_GAME_STATE.overrideActive,
  classifierStatus: DEFAULT_CLASSIFIER_STATUS,
  health: DEFAULT_HEALTH_STATUS,

  applyGameState: (state) =>
    set({
      mode: state.mode,
      demoPhase: state.phase,
      handDetected: state.handDetected,
      predictedMove: state.predictedMove,
      predictionStable: state.predictionStable,
      playerMove: state.playerMove,
      lockedPlayerMove: state.lockedPlayerMove,
      computerMove: state.computerMove,
      confidences: state.confidences,
      countdownValue: state.countdownValue,
      result: state.result,
      score: state.score,
      overrideActive: state.overrideActive,
      classifierStatus: state.classifierStatus,
      health: state.health,
    }),

  setMode: (mode) => set({ mode }),
  setDemoPhase: (demoPhase) => set({ demoPhase }),
  setHandDetected: (handDetected) => set({ handDetected }),
  setPredictedMove: (predictedMove, predictionStable = false) =>
    set({
      predictedMove,
      predictionStable,
      playerMove:
        predictedMove && predictedMove !== "unknown"
          ? predictedMove
          : get().lockedPlayerMove,
    }),
  setPlayerMove: (playerMove) => set({ playerMove }),
  setLockedPlayerMove: (lockedPlayerMove) =>
    set({
      lockedPlayerMove,
      playerMove: lockedPlayerMove ?? get().playerMove,
    }),
  setComputerMove: (computerMove) => set({ computerMove }),
  setConfidences: (confidences) => set({ confidences }),
  setCountdownValue: (countdownValue) => set({ countdownValue }),
  setResult: (result) => set({ result }),
  setScore: (score) => set({ score }),
  setClassifierStatus: (classifierStatus) => set({ classifierStatus }),
  setHealth: (health) => set({ health }),

  presenterOpen: false,
  togglePresenter: () => set((state) => ({ presenterOpen: !state.presenterOpen })),
}));
