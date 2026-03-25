import { motion } from "framer-motion";
import { useAppStore } from "../store";

const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: "blur(5px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function DemoBridge() {
  const { nextScene } = useAppStore();

  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="relative flex w-full max-w-6xl flex-col items-center justify-center px-8 text-center select-none"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-4">
        <div className="h-px w-12 bg-accent/25" />
        <span className="font-mono text-xs uppercase tracking-[0.34em] text-accent/60">
          Pattern Found
        </span>
        <div className="h-px w-12 bg-accent/25" />
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="mt-12 flex items-center justify-center gap-4 sm:gap-8"
      >
        {[
          { value: "6", accent: "text-text-primary border-border/60 bg-base-100/28" },
          { value: "7", accent: "text-accent border-accent/20 bg-accent/[0.06]" },
        ].map((item, index) => (
          <motion.div
            key={item.value}
            className={`flex h-[clamp(12rem,26vw,18rem)] w-[clamp(12rem,26vw,18rem)] items-center justify-center rounded-[32px] border backdrop-blur-sm ${item.accent}`}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.14, duration: 0.55, ease: "easeOut" }}
          >
            <span className="font-display text-[clamp(5.5rem,16vw,10rem)] font-extrabold leading-none">
              {item.value}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        variants={fadeUp}
        className="mt-10 max-w-2xl text-balance font-body text-[clamp(1rem,1.7vw,1.35rem)] text-text-secondary/74"
      >
        now let the camera try doing that with your hands
      </motion.p>

      <motion.button
        variants={fadeUp}
        onClick={nextScene}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="mt-10 rounded-full border border-accent/20 bg-accent/[0.05] px-8 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent transition-colors duration-300 hover:border-accent/35 hover:bg-accent/[0.08]"
      >
        go live
      </motion.button>
    </motion.div>
  );
}
