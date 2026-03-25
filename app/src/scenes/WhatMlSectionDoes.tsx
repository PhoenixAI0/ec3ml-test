import { motion } from "framer-motion";
import { useAppStore } from "../store";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.18 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(5px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function WhatMlSectionDoes() {
  const { nextScene } = useAppStore();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex w-full max-w-6xl flex-col items-center justify-center px-8 py-8 text-center select-none"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-4">
        <div className="h-px w-10 bg-accent/25" />
        <span className="font-mono text-xs uppercase tracking-[0.34em] text-accent/60">
          Pattern Recognition
        </span>
        <div className="h-px w-10 bg-accent/25" />
      </motion.div>

      <motion.h2
        variants={fadeUp}
        className="mt-6 text-balance font-display text-[clamp(2.6rem,4.5vw,4rem)] font-bold leading-[1.02] text-gradient-animated"
      >
        your brain is already doing ml
      </motion.h2>

      <motion.div
        variants={fadeUp}
        className="mt-12 flex items-center justify-center"
      >
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          className="relative flex h-[clamp(16rem,34vw,24rem)] w-[clamp(16rem,34vw,24rem)] items-center justify-center rounded-[36px] border border-accent/20 bg-accent/[0.05] backdrop-blur-sm"
        >
          <motion.div
            className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-accent/10 via-accent/[0.04] to-transparent"
            animate={{ opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute left-6 top-5 font-mono text-[10px] uppercase tracking-[0.24em] text-accent/55">
            pattern
          </div>
          <div className="relative font-display text-[clamp(7rem,20vw,14rem)] font-extrabold leading-none text-text-primary">
            6
          </div>
        </motion.div>
      </motion.div>

      <motion.p
        variants={fadeUp}
        className="mt-10 max-w-2xl text-balance font-body text-[clamp(1rem,1.6vw,1.25rem)] text-text-secondary/72"
      >
        you can already feel what comes next
      </motion.p>

      <motion.button
        variants={fadeUp}
        onClick={nextScene}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="mt-9 rounded-full border border-accent/20 bg-accent/[0.05] px-7 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent transition-colors duration-300 hover:border-accent/35 hover:bg-accent/[0.08]"
      >
        next
      </motion.button>
    </motion.div>
  );
}
