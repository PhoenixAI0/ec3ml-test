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
      <div className="relative w-full h-full bg-base-50 border border-border/60 rounded-lg overflow-hidden">
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

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-warm/[0.03]" />

        {/* Tracking grid dots */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 64 }).map((_, index) => (
            <motion.div
              key={index}
              className="absolute w-[3px] h-[3px] rounded-full bg-accent"
              style={{
                left: `${12 + (index % 8) * 11}%`,
                top: `${12 + Math.floor(index / 8) * 11}%`,
              }}
              animate={{
                opacity: handDetected ? [0.1, 0.7, 0.2] : [0.03, 0.1, 0.03],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: index * 0.04,
              }}
            />
          ))}
        </div>

        {/* Detection bounding box */}
        <AnimatePresence>
          {showDetection && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-[15%] border border-accent/30 rounded-lg"
            >
              <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-2 border-l-2 border-accent rounded-tl-sm" />
              <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-2 border-r-2 border-accent rounded-tr-sm" />
              <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-2 border-l-2 border-accent rounded-bl-sm" />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-2 border-r-2 border-accent rounded-br-sm" />
              <div className="absolute -top-7 left-0 flex items-center gap-2">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-accent"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase">
                  reading gesture
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detected move emoji */}
        <AnimatePresence mode="wait">
          {currentMove && currentMove !== "unknown" && showDetection && !showCountdown && (
            <motion.div
              key={currentMove}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", damping: 12 }}
              className="absolute inset-0 flex items-center justify-center z-10 text-7xl"
            >
              {MOVE_EMOJI[currentMove as keyof typeof MOVE_EMOJI]}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown */}
        <AnimatePresence>
          {showCountdown && (
            <motion.div
              key={`cd-${countdownValue}`}
              initial={{ opacity: 0, scale: 2.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute inset-0 flex items-center justify-center z-20"
            >
              <span className="font-display text-[8rem] text-accent text-glow-accent font-extrabold leading-none">
                {countdownValue}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle / waiting state */}
        {!handDetected && (demoPhase === "idle" || demoPhase === "waiting_for_hand") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
          >
            <div className="font-mono text-text-muted text-sm tracking-[0.2em]">
              {mode === "simulate" ? "simulation" : "waiting for hand"}
            </div>
            <div className="mt-2 font-mono text-[10px] text-text-muted/60 uppercase tracking-[0.35em]">
              {cameraError ?? streamLabel}
            </div>
            <motion.div
              className="mt-4 w-16 h-[2px] rounded-full bg-gradient-to-r from-transparent via-accent/30 to-transparent"
              animate={{ scaleX: [0.3, 1, 0.3], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}

        {/* Camera error */}
        {!cameraActive && mode === "live_cv" && cameraError && (
          <div className="absolute top-4 left-4 right-4 z-20 rounded-lg border border-warm/25 bg-base/90 backdrop-blur-sm px-4 py-2.5 font-mono text-xs text-warm">
            {cameraError}
          </div>
        )}

        {/* Status bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-base/85 backdrop-blur-md border-t border-border/40 px-4 py-2.5 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  handDetected ? "bg-teal" : "bg-text-muted/50"
                }`}
              />
              {handDetected && (
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-teal animate-ping opacity-40" />
              )}
            </div>
            <span className="font-mono text-[10px] text-text-secondary tracking-[0.15em]">
              {handDetected
                ? "TRACKING"
                : mode === "simulate"
                  ? "SIMULATION"
                  : "NO INPUT"}
            </span>
          </div>
          <span className="font-mono text-[10px] text-text-muted/50">{streamLabel}</span>
        </div>
      </div>

      {/* Confidence bars below camera */}
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
