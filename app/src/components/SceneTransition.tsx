import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  sceneKey: string;
  children: ReactNode;
}

const variants = {
  enter: {
    opacity: 0,
    y: 40,
    scale: 0.98,
    filter: "blur(6px)",
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.99,
    filter: "blur(4px)",
  },
};

export function SceneTransition({ sceneKey, children }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sceneKey}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
