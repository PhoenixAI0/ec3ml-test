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
      ? "you win"
      : result?.outcome === "computer"
        ? "computer wins"
        : result?.outcome === "draw"
          ? "draw"
          : "";

  const outcomeColor =
    result?.outcome === "player"
      ? "text-accent text-glow-accent"
      : result?.outcome === "computer"
        ? "text-warm text-glow-warm"
        : "text-text-secondary";

  return (
    <div className="w-full h-full flex select-none">
      <div className="flex-1 flex flex-col items-center justify-center pl-10 pr-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
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

      <div className="w-[340px] flex flex-col items-center justify-center pr-10 pl-4 py-6 gap-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-accent" : "bg-warm animate-pulse"
            }`}
          />
          <div className="font-mono text-xs text-text-muted uppercase tracking-widest">
            {connected ? mode.replace("_", " ") : "offline"}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="font-mono text-xs text-text-muted uppercase tracking-widest mb-2">
            score
          </div>
          <div className="font-display font-bold text-proj-2xl text-text-primary">
            {score.player}
            <span className="text-text-muted mx-3 text-proj-lg">—</span>
            {score.computer}
          </div>
          <div className="flex justify-center gap-8 mt-1 font-mono text-xs text-text-muted">
            <span>you</span>
            <span>computer</span>
          </div>
        </motion.div>

        <div className="w-12 h-px bg-border" />

        <AnimatePresence mode="wait">
          {showMoves && (
            <motion.div
              key="moves"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-5"
            >
              <MoveCard
                label="you"
                move={result?.playerMove ?? playerMove}
                highlight={result?.outcome === "player"}
              />
              <span className="font-display text-proj-lg text-text-muted/50">
                vs
              </span>
              <MoveCard
                label="computer"
                move={
                  demoPhase === "locked"
                    ? null
                    : (result?.computerMove ?? computerMove)
                }
                highlight={result?.outcome === "computer"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 12 }}
              className={`font-display text-proj-xl font-bold ${outcomeColor}`}
            >
              {outcomeText}
            </motion.div>
          )}
        </AnimatePresence>

        {!showMoves && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <span className="font-mono text-xs text-text-muted/50 uppercase tracking-widest">
              {demoPhase === "idle"
                ? "stand by"
                : demoPhase === "waiting_for_hand"
                  ? "waiting for hand"
                  : demoPhase === "hand_detected"
                    ? "hand detected"
                    : demoPhase === "predicting"
                      ? "reading hand"
                      : demoPhase === "countdown"
                        ? "get ready"
                      : demoPhase}
            </span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center space-y-1"
        >
          <div className="font-mono text-[10px] text-text-muted/50 uppercase tracking-[0.24em]">
            space or enter to continue
          </div>
          <div className="font-mono text-[10px] text-text-muted/35 uppercase tracking-[0.22em]">
            R rock • P paper • S scissors
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
}: {
  label: string;
  move: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
        {label}
      </span>
      <motion.div
        layout
        className={`w-[88px] h-[88px] rounded-xl border-2 flex items-center justify-center text-5xl transition-colors duration-300 ${
          highlight
            ? "border-accent/60 bg-accent/10 glow-accent"
            : "border-border bg-base-100"
        }`}
      >
        <AnimatePresence mode="wait">
          {move ? (
            <motion.span
              key={move}
              initial={{ opacity: 0, scale: 0.4, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ type: "spring", damping: 12 }}
            >
              {MOVE_EMOJI[move as keyof typeof MOVE_EMOJI]}
            </motion.span>
          ) : (
            <motion.span
              key="unknown"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-3xl text-text-muted"
            >
              ?
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
