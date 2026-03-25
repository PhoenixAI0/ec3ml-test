import { motion } from "framer-motion";
import { useAppStore } from "../store";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.16 },
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

const reasons = [
  "your room will never be cold again once the gpu starts training",
  "\"it's over / we're back\" becomes your entire personality",
  "you can tell people you're building skynet when you're actually just teaching a camera how to see a rock",
  "51% accuracy is technically a passing grade",
  "you get to use \"loss\" and \"bias\" in a sentence and sound like a philosopher",
  "it's just spicy statistics but with way cooler names",
  "you finally get to understand why ai hands always have 7 fingers",
  "gpu go brrr",
] as const;

export function Reasons() {
  const { nextScene } = useAppStore();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex w-full max-w-[1280px] flex-col items-center justify-center px-8 py-6 select-none"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-4">
        <div className="h-px w-10 bg-accent/25" />
        <span className="font-mono text-xs uppercase tracking-[0.34em] text-accent/60">
          Reasons For Joining ML
        </span>
        <div className="h-px w-10 bg-accent/25" />
      </motion.div>

      <motion.h2
        variants={fadeUp}
        className="mt-4 max-w-3xl text-balance text-center font-display text-[clamp(2.4rem,4.4vw,3.8rem)] font-bold leading-[1.02] text-gradient-animated"
      >
        valid reasons only
      </motion.h2>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {reasons.map((reason, index) => (
          <motion.div
            key={reason}
            variants={fadeUp}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative min-h-[7.75rem] overflow-hidden rounded-[22px] border border-border/60 bg-base-100/28 p-4 backdrop-blur-sm transition-all duration-300 lg:min-h-[8.5rem]"
          >
            <div className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted/35">
              0{index + 1}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.08] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <p className="relative pr-7 text-balance font-body text-[clamp(0.92rem,1vw,1rem)] leading-[1.28] text-text-primary/88">
              {reason}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.button
        variants={fadeUp}
        onClick={nextScene}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="mt-6 rounded-full border border-accent/20 bg-accent/[0.05] px-7 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent transition-colors duration-300 hover:border-accent/35 hover:bg-accent/[0.08]"
      >
        also yes actual ml
      </motion.button>
    </motion.div>
  );
}
