import { motion } from "framer-motion";

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.2, delayChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const steps = [
  {
    icon: "📷",
    title: "camera",
    desc: "captures your hand",
    color: "border-text-muted/30",
  },
  {
    icon: "🧠",
    title: "model",
    desc: "reads the gesture",
    color: "border-accent/40",
  },
  {
    icon: "⚡",
    title: "prediction",
    desc: "rock, paper, or scissors",
    color: "border-warm/40",
  },
];

export function BehindTheScenes() {
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
        how it works
      </motion.div>

      {/* Pipeline */}
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <motion.div key={step.title} variants={fadeUp} className="flex items-center">
            {/* Card */}
            <div
              className={`flex flex-col items-center gap-4 px-10 py-8 rounded-xl border bg-base-100/50 backdrop-blur-sm ${step.color}`}
            >
              <span className="text-5xl">{step.icon}</span>
              <div className="text-center">
                <div className="font-display font-bold text-proj-lg text-text-primary">
                  {step.title}
                </div>
                <div className="font-body text-proj-sm text-text-secondary mt-1">
                  {step.desc}
                </div>
              </div>
            </div>

            {/* Arrow connector */}
            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.5 + i * 0.2, duration: 0.4 }}
                className="flex items-center mx-2"
              >
                <div className="w-12 h-px bg-gradient-to-r from-text-muted/30 to-text-muted/10" />
                <div className="text-text-muted/40 text-lg">→</div>
                <div className="w-12 h-px bg-gradient-to-r from-text-muted/10 to-text-muted/30" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Punchline */}
      <motion.div
        variants={fadeUp}
        className="mt-14 max-w-lg text-center"
      >
        <p className="font-body text-proj-base text-text-secondary leading-relaxed">
          the ML section trains computers to recognise patterns
          <br />
          and builds things with that
        </p>
      </motion.div>

      {/* Subtle data flow animation */}
      <motion.div
        variants={fadeUp}
        className="mt-8 flex items-center gap-1"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent/30"
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.12,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
