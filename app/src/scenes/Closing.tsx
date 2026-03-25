import { motion } from "framer-motion";

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(3px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const cards = [
  {
    text: "build stuff",
    icon: "🔨",
    borderClass: "border-accent/15 hover:border-accent/45",
    hoverBg: "hover:bg-accent/[0.04]",
    glowClass: "hover:shadow-[0_0_50px_rgba(167,139,250,0.12)]",
    accentDot: "bg-accent",
    tagline: "make the thing",
  },
  {
    text: "test ideas",
    icon: "🧪",
    borderClass: "border-warm/15 hover:border-warm/45",
    hoverBg: "hover:bg-warm/[0.04]",
    glowClass: "hover:shadow-[0_0_50px_rgba(251,146,60,0.12)]",
    accentDot: "bg-warm",
    tagline: "see what survives",
  },
  {
    text: "make it less wrong",
    icon: "💥",
    borderClass: "border-teal/15 hover:border-teal/45",
    hoverBg: "hover:bg-teal/[0.04]",
    glowClass: "hover:shadow-[0_0_50px_rgba(45,212,191,0.12)]",
    accentDot: "bg-teal",
    tagline: "repeat forever",
  },
  {
    text: "watch it finally work",
    icon: "✨",
    borderClass: "border-accent/15 hover:border-accent/45",
    hoverBg: "hover:bg-accent/[0.04]",
    glowClass: "hover:shadow-[0_0_50px_rgba(167,139,250,0.12)]",
    accentDot: "bg-accent",
    tagline: "worth it somehow",
  },
];

export function Closing() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center px-8 py-10 select-none"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-6">
        <div className="w-8 h-px bg-accent/30" />
        <span className="font-mono text-xs text-accent/60 uppercase tracking-[0.35em]">
          Why It Is Fun
        </span>
        <div className="w-8 h-px bg-accent/30" />
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="mb-12 max-w-3xl font-display font-bold text-proj-2xl text-center text-gradient-animated"
      >
        the fun part
      </motion.div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {cards.map((card, i) => (
          <motion.div
            key={card.text}
            variants={fadeUp}
            whileHover={{
              y: -8,
              rotateX: 2,
              rotateY: i === 0 ? 2 : i === 2 ? -2 : 0,
              transition: { duration: 0.3, ease: "easeOut" },
            }}
            style={{ transformStyle: "preserve-3d", perspective: 800 }}
            className={`group relative flex flex-col min-h-48 items-center justify-center px-8 py-10 rounded-2xl border bg-base-100/20 backdrop-blur-sm transition-all duration-500 ${card.borderClass} ${card.glowClass} ${card.hoverBg}`}
          >
            <motion.div
              className={`absolute top-4 right-4 w-1.5 h-1.5 rounded-full ${card.accentDot} opacity-20 group-hover:opacity-80 transition-all duration-500`}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
            />

            <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <motion.div
                className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"
                animate={{ x: ["-100%", "500%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
              />
            </div>

            <motion.span
              className="text-4xl mb-5 block relative z-10"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.5 + i * 0.15,
                type: "spring",
                damping: 8,
              }}
            >
              {card.icon}
            </motion.span>

            <div className="max-w-xs text-balance font-display font-bold text-proj-lg text-text-primary text-center leading-snug relative z-10">
              {card.text}
            </div>

            <div className="mt-2 font-mono text-[10px] text-text-muted/0 group-hover:text-text-muted/50 uppercase tracking-[0.2em] transition-all duration-500 relative z-10">
              {card.tagline}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeUp} className="mt-14 text-center">
        <p className="font-body text-proj-lg text-text-secondary">
          and then it finally works
        </p>
        <motion.div
          className="mt-3 w-24 neon-line-animated mx-auto"
        />
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="mt-8 flex items-center gap-3"
      >
        {[
          { color: "bg-accent/50", delay: 0 },
          { color: "bg-teal/50", delay: 0.3 },
          { color: "bg-warm/50", delay: 0.6 },
        ].map((dot, i) => (
          <motion.div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${dot.color}`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: dot.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
