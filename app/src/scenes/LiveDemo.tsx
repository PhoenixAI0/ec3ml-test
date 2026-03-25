import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../store";
import { CameraPanel } from "../components/CameraPanel";
import { MOVE_EMOJI } from "@shared/types";
import { useCameraStream } from "../hooks/useCameraStream";

interface Props {
  sendBinary: (payload: Blob | ArrayBuffer) => void;
}

export function LiveDemo({ sendBinary }: Props) {
  const { connected, mode, demoPhase, playerMove, computerMove, result, score } =
    useAppStore();
  const camera = useCameraStream({ connected, mode, sendBinary });

  const showResult = demoPhase === "result" && result;
  const showMoves =
    demoPhase === "reveal" || demoPhase === "result" || demoPhase === "locked";

  const outcomeText =
    result?.outcome === "player"
      ? "you win!"
      : result?.outcome === "computer"
        ? "you lose"
        : result?.outcome === "draw"
          ? "draw"
          : "";

  const modeText =
    !connected
      ? "offline"
      : mode === "live_cv"
        ? "live cv"
        : "simulation";

  const phaseText =
    demoPhase === "idle" || demoPhase === "waiting_for_hand"
      ? "waiting for hand"
      : demoPhase === "hand_detected" || demoPhase === "predicting"
        ? "reading gesture"
        : demoPhase === "countdown"
          ? "get ready!"
          : null;

  const outcomeColor =
    result?.outcome === "player"
      ? "text-teal text-glow-teal"
      : result?.outcome === "computer"
        ? "text-warm text-glow-warm"
        : "text-text-secondary";

  const resultFlashColor =
    result?.outcome === "player"
      ? "rgba(45,212,191,0.08)"
      : result?.outcome === "computer"
        ? "rgba(251,146,60,0.08)"
        : "rgba(167,139,250,0.05)";

  return (
    <div className="w-full h-full flex select-none">
      {/* Camera side */}
      <div className="flex-1 flex flex-col items-center justify-center pl-10 pr-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-[560px]"
        >
          <CameraPanel
            videoRef={camera.videoRef}
            cameraActive={camera.cameraActive}
            cameraError={camera.cameraError}
            streamLabel={camera.streamLabel}
          />
        </motion.div>
      </div>

      {/* Info side */}
      <div className="w-[360px] flex flex-col items-center justify-center pr-10 pl-4 py-6 gap-5 relative">
        {/* Result flash overlay */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-0 rounded-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: `radial-gradient(ellipse at center, ${resultFlashColor} 0%, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 z-10"
        >
          <div className="w-6 h-px bg-accent/30" />
          <span className="font-mono text-xs text-accent/60 uppercase tracking-[0.3em]">
            Live Demo
          </span>
          <div className="w-6 h-px bg-accent/30" />
        </motion.div>

        {/* Mode & connection */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 z-10"
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? "bg-teal" : "bg-warm animate-pulse"
            }`}
          />
          <span className="font-mono text-[11px] text-text-muted uppercase tracking-[0.2em]">
            mode: {modeText}
          </span>
        </motion.div>

        {/* Scoreboard card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl px-10 py-6 text-center z-10 relative overflow-hidden"
        >
          {/* Subtle inner shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/[0.02] to-transparent"
            animate={{ x: ["-200%", "200%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          <div className="font-mono text-[10px] text-text-muted uppercase tracking-[0.3em] mb-3 relative">
            scoreboard
          </div>
          <div className="flex items-baseline justify-center gap-5 relative">
            <div className="text-center">
              <motion.div
                key={`p-${score.player}`}
                initial={{ scale: 1 }}
                animate={{ scale: [1.2, 1] }}
                transition={{ duration: 0.3 }}
                className="font-display font-bold text-proj-2xl text-text-primary leading-none"
              >
                {score.player}
              </motion.div>
              <div className="font-mono text-[10px] text-teal/70 uppercase tracking-widest mt-1.5">
                you
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-proj-base text-text-muted/20 font-bold">vs</span>
            </div>
            <div className="text-center">
              <motion.div
                key={`c-${score.computer}`}
                initial={{ scale: 1 }}
                animate={{ scale: [1.2, 1] }}
                transition={{ duration: 0.3 }}
                className="font-display font-bold text-proj-2xl text-text-primary leading-none"
              >
                {score.computer}
              </motion.div>
              <div className="font-mono text-[10px] text-warm/70 uppercase tracking-widest mt-1.5">
                cpu
              </div>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="w-10 neon-line z-10" />

        {/* Move cards */}
        <AnimatePresence mode="wait">
          {showMoves && (
            <motion.div
              key="moves"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-5 z-10"
            >
              <MoveCard
                label="you"
                move={result?.playerMove ?? playerMove}
                highlight={result?.outcome === "player"}
                color="teal"
              />
              <span className="font-display text-proj-lg text-text-muted/20 font-bold">
                vs
              </span>
              <MoveCard
                label="cpu"
                move={
                  demoPhase === "locked"
                    ? null
                    : (result?.computerMove ?? computerMove)
                }
                highlight={result?.outcome === "computer"}
                color="warm"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result text */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 10, stiffness: 200 }}
              className={`font-display text-proj-xl font-bold text-center z-10 ${outcomeColor}`}
            >
              {outcomeText}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase text */}
        {phaseText && !showMoves && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center z-10"
          >
            <motion.span
              className="font-mono text-xs text-text-muted/50 uppercase tracking-[0.25em]"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {phaseText}
            </motion.span>
          </motion.div>
        )}

        {/* Keyboard hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center space-y-1.5 mt-auto z-10"
        >
          <div className="font-mono text-[10px] text-text-muted/40 uppercase tracking-[0.24em]">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-text-muted/20 text-text-muted/50 mr-1 text-[9px]">
              ␣
            </span>
            or hold a pose 2s
          </div>
          <div className="flex items-center justify-center gap-3 font-mono text-[10px] text-text-muted/30 uppercase tracking-[0.2em]">
            <span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-text-muted/15 text-text-muted/40 mr-0.5 text-[9px]">
                R
              </span>{" "}
              <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-text-muted/15 text-text-muted/40 mr-0.5 text-[9px]">
                P
              </span>{" "}
              <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-text-muted/15 text-text-muted/40 text-[9px]">
                S
              </span>
            </span>
            <span>rig cpu</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MoveCard({
  label,
  move,
  highlight = false,
  color = "accent",
}: {
  label: string;
  move: string | null;
  highlight?: boolean;
  color?: "teal" | "warm" | "accent";
}) {
  const borderColors = {
    teal: highlight
      ? "border-teal/50 bg-teal/[0.06] glow-teal"
      : "border-border bg-base-100/60",
    warm: highlight
      ? "border-warm/50 bg-warm/[0.06] glow-warm"
      : "border-border bg-base-100/60",
    accent: highlight
      ? "border-accent/50 bg-accent/[0.06] glow-accent"
      : "border-border bg-base-100/60",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.3em]">
        {label}
      </span>
      <motion.div
        layout
        className={`w-[92px] h-[92px] rounded-xl border-2 flex items-center justify-center text-5xl transition-all duration-300 backdrop-blur-sm ${borderColors[color]}`}
        animate={
          highlight
            ? { scale: [1, 1.06, 1], transition: { duration: 0.4 } }
            : {}
        }
      >
        <AnimatePresence mode="wait">
          {move ? (
            <motion.span
              key={move}
              initial={{ opacity: 0, scale: 0.2, rotate: -25 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.2 }}
              transition={{ type: "spring", damping: 10, stiffness: 200 }}
            >
              {MOVE_EMOJI[move as keyof typeof MOVE_EMOJI]}
            </motion.span>
          ) : (
            <motion.span
              key="unknown"
              animate={{ opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-3xl text-text-muted/50"
            >
              ?
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
