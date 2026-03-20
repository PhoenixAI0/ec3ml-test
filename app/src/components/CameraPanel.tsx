import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PredictedMove } from "@shared/types";
import { MOVE_EMOJI } from "@shared/types";
import { useAppStore } from "../store";
import { ConfidenceBars } from "./ConfidenceBars";

function ViewfinderCorners() {
  return (
    <>
      <div className="vf-corner" data-pos="tl" />
      <div className="vf-corner" data-pos="tr" />
      <div className="vf-corner" data-pos="bl" />
      <div className="vf-corner" data-pos="br" />
    </>
  );
}

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraActive: boolean;
  cameraError: string | null;
  streamLabel: string;
}

export function CameraPanel({
  videoRef,
  cameraActive,
  cameraError,
  streamLabel,
}: Props) {
  const {
    demoPhase,
    mode,
    handDetected,
    predictedMove,
    playerMove,
    countdownValue,
    confidences,
  } = useAppStore();

  const showCountdown = demoPhase === "countdown";
  const showDetection = handDetected && demoPhase !== "idle" && demoPhase !== "waiting_for_hand";
  const currentMove = demoPhase === "locked" ? playerMove : predictedMove;

  return (
    <div className="relative w-full max-w-[640px] aspect-[4/3] mx-auto">
      <div className="relative w-full h-full bg-base-50 border border-border rounded-sm overflow-hidden">
        <ViewfinderCorners />

        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            mode === "live_cv" && cameraActive ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="scanline absolute inset-0" />
        <div className="noise absolute inset-0" />

        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-warm/5" />

        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 64 }).map((_, index) => (
            <motion.div
              key={index}
              className="absolute w-1 h-1 rounded-full bg-accent"
              style={{
                left: `${12 + (index % 8) * 11}%`,
                top: `${12 + Math.floor(index / 8) * 11}%`,
              }}
              animate={{
                opacity: handDetected ? [0.15, 0.85, 0.25] : [0.04, 0.14, 0.04],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.05,
              }}
            />
          ))}
        </div>

        <AnimatePresence>
          {showDetection && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-[15%] border-2 border-accent/40 rounded-md"
            >
              <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-accent" />
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-accent" />
              <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-accent" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-accent" />
              <div className="absolute -top-7 left-0 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-xs text-accent tracking-wider uppercase">
                  hand detected
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {currentMove && currentMove !== "unknown" && showDetection && !showCountdown && (
            <motion.div
              key={currentMove}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center z-10 text-7xl"
            >
              {MOVE_EMOJI[currentMove as keyof typeof MOVE_EMOJI]}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCountdown && (
            <motion.div
              key={`cd-${countdownValue}`}
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center z-20"
            >
              <span className="font-display text-[7rem] text-accent text-glow-accent font-extrabold leading-none">
                {countdownValue}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {!handDetected && (demoPhase === "idle" || demoPhase === "waiting_for_hand") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
          >
            <div className="font-mono text-text-muted text-sm tracking-wider">
              {mode === "simulate" ? "simulation ready" : "waiting for hand"}
            </div>
            <div className="mt-2 font-mono text-xs text-text-muted/70 uppercase tracking-[0.3em]">
              {cameraError ?? streamLabel}
            </div>
            <motion.div
              className="mt-3 w-16 h-0.5 bg-text-muted/30"
              animate={{ scaleX: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}

        {!cameraActive && mode === "live_cv" && cameraError && (
          <div className="absolute top-4 left-4 right-4 z-20 rounded border border-warm/30 bg-base/85 px-3 py-2 font-mono text-xs text-warm">
            {cameraError}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-base/80 backdrop-blur-sm border-t border-border px-4 py-2 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                handDetected ? "bg-accent animate-pulse" : "bg-text-muted"
              }`}
            />
            <span className="font-mono text-xs text-text-secondary tracking-wide">
              {handDetected ? "TRACKING" : mode === "simulate" ? "SIMULATION" : "NO INPUT"}
            </span>
          </div>
          <span className="font-mono text-xs text-text-muted">{streamLabel}</span>
        </div>
      </div>

      <AnimatePresence>
        {showDetection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4"
          >
            <ConfidenceBars
              confidences={confidences}
              currentMove={currentMove as PredictedMove | null}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
