import { motion } from "framer-motion";
import { useAppStore } from "../store";

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.18, delayChildren: 0.3 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const floatingEmojis = [
  { emoji: "🪨", x: "12%", y: "18%", size: 40, delay: 0, duration: 14 },
  { emoji: "📄", x: "85%", y: "22%", size: 36, delay: 2, duration: 16 },
  { emoji: "✂️", x: "78%", y: "72%", size: 38, delay: 4, duration: 13 },
  { emoji: "🧠", x: "15%", y: "75%", size: 34, delay: 1, duration: 15 },
];

export function Intro() {
  const { nextScene, connected } = useAppStore();

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="relative flex flex-col items-center justify-center text-center px-8 select-none"
    >
      {/* Floating emoji particles */}
      {floatingEmojis.map((item, i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none select-none"
          style={{
            left: item.x,
            top: item.y,
            fontSize: item.size,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 0.1, 0.08, 0.12, 0],
            y: [0, -20, 8, -12, 0],
            x: [0, 8, -5, 3, 0],
            rotate: [0, 5, -3, 2, 0],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          {item.emoji}
        </motion.div>
      ))}

      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-8">
        <motion.div
          className="w-10 h-px bg-accent/30"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        />
        <span className="font-mono text-xs text-accent/70 uppercase tracking-[0.35em]">
          EC³ Computing Club
        </span>
        <motion.div
          className="w-10 h-px bg-accent/30"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        />
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="font-display font-extrabold text-proj-hero text-gradient-animated leading-none tracking-tight max-w-5xl"
      >
        ml
      </motion.h1>

      <motion.div
        variants={fadeUp}
        className="mt-8 w-36 neon-line-animated"
      />

      <motion.p
        variants={fadeUp}
        className="mt-8 max-w-2xl text-balance font-body text-proj-xl text-text-secondary leading-relaxed"
      >
        we make computers think
      </motion.p>

      <motion.div
        variants={fadeUp}
        className="mt-8 flex items-center gap-4 rounded-full border border-border/60 bg-base-100/35 px-5 py-2.5 backdrop-blur-sm"
      >
        {[
          { emoji: "data", label: "data", delay: 0.8 },
          { emoji: "patterns", label: "patterns", delay: 1.0 },
          { emoji: "demos", label: "demos", delay: 1.2 },
        ].map((item) => (
          <motion.div
            key={item.label}
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: item.delay, duration: 0.5 }}
          >
            <span className="font-mono text-[10px] text-accent/45 uppercase tracking-[0.22em]">
              {item.emoji}
            </span>
            {item.label !== "demos" && (
              <span className="h-1 w-1 rounded-full bg-text-muted/35" />
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        variants={fadeUp}
        onClick={nextScene}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="mt-12 group relative flex items-center gap-3 px-10 py-4 rounded-xl overflow-hidden cursor-pointer border-glow"
      >
        <div className="absolute inset-0 rounded-xl bg-accent/[0.04]" />
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-accent/10 via-accent/5 to-teal/5" />
        {/* Shimmer sweep on hover */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
          />
        </div>
        <span className="relative font-body text-proj-base text-accent font-medium tracking-wide">
          start
        </span>
        <motion.span
          className="relative text-accent text-xl"
          animate={{ x: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          →
        </motion.span>
      </motion.button>

      <motion.div
        variants={fadeUp}
        className="mt-10 flex items-center gap-3"
      >
        <div className="relative">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-teal" : "bg-warm animate-pulse"
            }`}
          />
          {connected && (
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-teal animate-ping opacity-40" />
          )}
        </div>
        <span className="font-mono text-xs text-text-muted tracking-wider">
          {connected ? "system ready" : "connecting..."}
        </span>
      </motion.div>
    </motion.div>
  );
}
