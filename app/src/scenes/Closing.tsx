import { motion } from "framer-motion";

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const cards = [
  {
    text: "build stuff",
    accent: "border-accent/30 hover:border-accent/60",
    glow: "hover:shadow-[0_0_30px_rgba(0,229,160,0.08)]",
  },
  {
    text: "test ideas",
    accent: "border-warm/30 hover:border-warm/60",
    glow: "hover:shadow-[0_0_30px_rgba(255,107,74,0.08)]",
  },
  {
    text: "figure out why it failed",
    accent: "border-text-muted/30 hover:border-text-secondary/60",
    glow: "hover:shadow-[0_0_30px_rgba(107,107,123,0.08)]",
  },
];

export function Closing() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center px-8 select-none"
    >
      {/* Section label */}
      <motion.div
        variants={fadeUp}
        className="mb-10 font-mono text-xs text-text-muted uppercase tracking-widest"
      >
        ML Training
      </motion.div>

      {/* Cards */}
      <div className="flex gap-6">
        {cards.map((card) => (
          <motion.div
            key={card.text}
            variants={fadeUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`px-10 py-10 rounded-xl border bg-base-100/50 backdrop-blur-sm transition-all duration-300 ${card.accent} ${card.glow}`}
          >
            <div className="font-display font-bold text-proj-xl text-text-primary text-center whitespace-nowrap">
              {card.text}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Closing line */}
      <motion.div
        variants={fadeUp}
        className="mt-14"
      >
        <p className="font-body text-proj-lg text-text-secondary text-center">
          come break things with us
        </p>
      </motion.div>

      {/* Decorative dots */}
      <motion.div
        variants={fadeUp}
        className="mt-8 flex items-center gap-2"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-text-muted/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-warm/40" />
      </motion.div>
    </motion.div>
  );
}
