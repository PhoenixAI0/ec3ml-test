import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ClientMessage, Move, RuntimeMode, Scene } from "@shared/types";
import { MOVE_EMOJI, SCENES } from "@shared/types";
import { useAppStore } from "../store";

interface Props {
  send: (message: ClientMessage) => void;
  connect: () => void;
  disconnect: () => void;
}

const SCENE_LABELS: Record<Scene, string> = {
  intro: "1 — Intro",
  about: "2 — About",
  vibes: "3 — Vibes",
  reasons: "4 — Reasons",
  familiar: "5 — Familiar",
  section: "6 — Section",
  bridge: "7 — Bridge",
  demo: "8 — Demo",
  behind: "9 — Behind",
  closing: "10 — Closing",
  join: "11 — Join",
};

const MODES: RuntimeMode[] = ["simulate", "live_cv"];

export function PresenterPanel({ send, connect, disconnect }: Props) {
  const {
    presenterOpen,
    connected,
    scene,
    setScene,
    mode,
    demoPhase,
    score,
    handDetected,
    predictedMove,
    predictionStable,
    classifierStatus,
    health,
    overrideActive,
  } = useAppStore();

  if (!presenterOpen) {
    return null;
  }

  const btn =
    "px-3 py-1.5 rounded-md text-xs font-mono tracking-wide transition-all duration-200 cursor-pointer";
  const btnPrimary = `${btn} bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 hover:border-accent/35`;
  const btnWarm = `${btn} bg-warm/10 text-warm border border-warm/20 hover:bg-warm/20 hover:border-warm/35`;
  const btnMuted = `${btn} bg-base-200/80 text-text-secondary border border-border/60 hover:bg-base-300 hover:border-border`;

  const sendCommand = (
    command: Extract<ClientMessage, { type: "presenter_command" }>["command"]
  ) => {
    send({ type: "presenter_command", command });
  };

  const moves: Move[] = ["rock", "paper", "scissors"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-80 bg-base-100/95 backdrop-blur-xl border-l border-border/40 z-50 overflow-y-auto"
      >
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-text-primary tracking-wide uppercase">
              Presenter
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? "bg-teal" : "bg-warm"
                  }`}
                />
                {connected && (
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-teal animate-ping opacity-30" />
                )}
              </div>
              <span className="font-mono text-xs text-text-secondary">
                {connected ? "live" : "offline"}
              </span>
            </div>
          </div>

          <Section title="Connection">
            <div className="flex gap-2">
              <button className={btnPrimary} onClick={connect}>
                Connect
              </button>
              <button className={btnWarm} onClick={disconnect}>
                Disconnect
              </button>
            </div>
          </Section>

          <Section title="Scene">
            <div className="grid grid-cols-2 gap-2">
              {SCENES.map((value) => (
                <button
                  key={value}
                  className={`${btn} border ${
                    scene === value
                      ? "bg-accent/15 text-accent border-accent/30"
                      : "bg-base-200/80 text-text-secondary border-border/60 hover:bg-base-300"
                  }`}
                  onClick={() => setScene(value)}
                >
                  {SCENE_LABELS[value]}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Mode">
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((value) => (
                <button
                  key={value}
                  className={`${btn} border ${
                    mode === value
                      ? "bg-accent/15 text-accent border-accent/30"
                      : "bg-base-200/80 text-text-secondary border-border/60 hover:bg-base-300"
                  }`}
                  onClick={() => send({ type: "set_mode", mode: value })}
                >
                  {value.replace("_", " ")}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Status">
            <div className="space-y-1.5 font-mono text-xs text-text-muted">
              <div>
                phase: <span className="text-accent">{demoPhase}</span>
              </div>
              <div>
                score: {score.player}–{score.computer}
              </div>
              <div>
                prediction:{" "}
                <span className="text-accent">
                  {predictedMove ?? "none"}
                  {predictionStable ? " · stable" : ""}
                </span>
              </div>
              <div>
                hand:{" "}
                <span className={handDetected ? "text-teal" : "text-text-muted"}>
                  {handDetected ? "detected" : "none"}
                </span>
              </div>
              <div>
                classifier:{" "}
                <span className="text-accent">{classifierStatus.active}</span>
              </div>
              <div>
                frame age:{" "}
                <span className="text-text-secondary">
                  {health.frameAgeMs == null ? "n/a" : `${health.frameAgeMs} ms`}
                </span>
              </div>
              {health.message && <div>note: {health.message}</div>}
            </div>
          </Section>

          <Section title="Manual Override">
            <div className="space-y-3">
              <div className="font-mono text-xs text-text-muted">
                override:{" "}
                <span className={overrideActive ? "text-warm" : "text-text-secondary"}>
                  {overrideActive ? "latched" : "off"}
                </span>
              </div>
              <div className="flex gap-2">
                {moves.map((move) => (
                  <button
                    key={move}
                    className={btnMuted}
                    onClick={() =>
                      sendCommand({
                        action: "set_prediction_override",
                        move,
                        confidences: {
                          rock: move === "rock" ? 0.9 : 0.05,
                          paper: move === "paper" ? 0.9 : 0.05,
                          scissors: move === "scissors" ? 0.9 : 0.05,
                        },
                      })
                    }
                  >
                    {MOVE_EMOJI[move]}
                  </button>
                ))}
              </div>
              <button
                className={btnWarm}
                onClick={() => sendCommand({ action: "clear_prediction_override" })}
              >
                Clear Override
              </button>
            </div>
          </Section>

          <Section title="Demo Controls">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button className={btnPrimary} onClick={() => send({ type: "advance_round" })}>
                  Start Round
                </button>
                <button
                  className={btnPrimary}
                  onClick={() => sendCommand({ action: "start_countdown" })}
                >
                  Countdown
                </button>
                <button
                  className={btnPrimary}
                  onClick={() => sendCommand({ action: "trigger_reveal" })}
                >
                  Reveal
                </button>
                <button
                  className={btnPrimary}
                  onClick={() => sendCommand({ action: "trigger_result" })}
                >
                  Result
                </button>
              </div>

              <div>
                <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">
                  Computer Move
                </label>
                <div className="flex gap-2">
                  {moves.map((move) => (
                    <button
                      key={move}
                      className={btnMuted}
                      onClick={() =>
                        sendCommand({ action: "set_computer_move", move })
                      }
                    >
                      {MOVE_EMOJI[move]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/30">
                <button className={btnWarm} onClick={() => send({ type: "reset_round" })}>
                  Reset
                </button>
              </div>

              <div className="flex gap-2">
                <button className={btnPrimary} onClick={() => send({ type: "start_autoplay" })}>
                  Autoplay
                </button>
                <button className={btnMuted} onClick={() => send({ type: "stop_autoplay" })}>
                  Stop
                </button>
              </div>
            </div>
          </Section>

          <Section title="Keyboard">
            <div className="font-mono text-[10px] text-text-muted/70 space-y-1.5 tracking-wide">
              <div>Space / Enter — start round</div>
              <div>Hold stable gesture 2s — auto start</div>
              <div>R / P / S — set computer move</div>
              <div>← → / Backspace — navigate</div>
              <div>0–9 / J — jump to scene</div>
              <div>P — toggle panel</div>
              <div>Shift+P — panel during demo</div>
            </div>
          </Section>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h4 className="font-mono text-[10px] text-text-muted/60 uppercase tracking-[0.2em] mb-2.5">
        {title}
      </h4>
      {children}
    </div>
  );
}
