import { motion } from "framer-motion";
import { useAppStore } from "../store";

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function Intro() {
  const { nextScene, connected } = useAppStore();

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center text-center px-8 select-none"
    >
      {/* Badge */}
      <motion.div
        variants={fadeUp}
        className="mb-8 px-4 py-1.5 rounded-full border border-border bg-base-100/50 backdrop-blur-sm"
      >
        <span className="font-mono text-xs text-text-secondary tracking-widest uppercase">
          EC³ Computing Club
        </span>
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={fadeUp}
        className="font-display font-extrabold text-proj-hero text-text-primary leading-none tracking-tight"
      >
        ML Training
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        variants={fadeUp}
        className="mt-6 font-body text-proj-xl text-text-secondary max-w-xl leading-relaxed"
      >
        we made the camera play rock paper scissors
      </motion.p>

      {/* Decorative line */}
      <motion.div
        variants={fadeUp}
        className="mt-10 w-16 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"
      />

      {/* CTA */}
      <motion.button
        variants={fadeUp}
        onClick={nextScene}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="mt-10 group flex items-center gap-3 px-8 py-3 rounded-lg border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer"
      >
        <span className="font-body text-proj-base text-accent font-medium">
          start demo
        </span>
        <motion.span
          className="text-accent"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          →
        </motion.span>
      </motion.button>

      {/* Connection status */}
      <motion.div
        variants={fadeUp}
        className="mt-8 flex items-center gap-2"
      >
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            connected ? "bg-accent" : "bg-warm animate-pulse"
          }`}
        />
        <span className="font-mono text-xs text-text-muted">
          {connected ? "system ready" : "connecting..."}
        </span>
      </motion.div>
    </motion.div>
  );
}
