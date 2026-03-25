import { motion } from "framer-motion";
import type { Confidences, Move, PredictedMove } from "@shared/types";
import { MOVE_EMOJI } from "@shared/types";

interface Props {
  confidences: Confidences;
  currentMove: PredictedMove | null;
}

const moves: Move[] = ["rock", "paper", "scissors"];

export function ConfidenceBars({ confidences, currentMove }: Props) {
  return (
    <div className="flex gap-5 items-end justify-center">
      {moves.map((move) => {
        const value = confidences[move];
        const isActive = currentMove === move;

        return (
          <div key={move} className="flex items-center gap-2.5 min-w-[130px]">
            <span className="text-lg w-8 text-center">{MOVE_EMOJI[move]}</span>
            <div className="flex-1 h-1.5 bg-base-200/80 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isActive
                    ? "bg-gradient-to-r from-accent to-accent/70"
                    : "bg-text-muted/25"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${value * 100}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            <span
              className={`font-mono text-[10px] w-10 text-right tabular-nums ${
                isActive ? "text-accent" : "text-text-muted/60"
              }`}
            >
              {Math.round(value * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
