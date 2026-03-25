import { motion } from "framer-motion";
import { useAppStore } from "../store";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.18 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(5px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const lines = [
  "ruichen / phoenix / prime intellect",
  "was a human once :)",
  "professional bug creator",
  "still waiting for my model to finish training",
  "99% agi, 1% sleep",
  "i speak python more fluently than english",
  "probably just a fine-tuned version of myself",
] as const;

export function AboutMe() {
  const { nextScene } = useAppStore();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex w-full max-w-[1180px] flex-col items-center justify-center px-8 py-8 select-none"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-4">
        <div className="h-px w-10 bg-accent/25" />
        <span className="font-mono text-xs uppercase tracking-[0.34em] text-accent/60">
          About Me
        </span>
        <div className="h-px w-10 bg-accent/25" />
      </motion.div>

      <motion.h2
        variants={fadeUp}
        className="mt-5 text-center font-display text-[clamp(2.6rem,4.8vw,4rem)] font-bold leading-[1.02] text-gradient-animated"
      >
        about me
      </motion.h2>

      <div className="mt-10 grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lines.map((line, index) => (
          <motion.div
            key={line}
            variants={fadeUp}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative min-h-[8rem] overflow-hidden rounded-[24px] border border-border/60 bg-base-100/28 p-5 backdrop-blur-sm transition-all duration-300"
          >
            <div className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted/35">
              0{index + 1}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.08] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <p className="relative pr-7 text-balance font-body text-[clamp(1rem,1.15vw,1.08rem)] leading-[1.3] text-text-primary/88">
              {line}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.button
        variants={fadeUp}
        onClick={nextScene}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="mt-7 rounded-full border border-accent/20 bg-accent/[0.05] px-7 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent transition-colors duration-300 hover:border-accent/35 hover:bg-accent/[0.08]"
      >
        vibe coding
      </motion.button>
    </motion.div>
  );
}
