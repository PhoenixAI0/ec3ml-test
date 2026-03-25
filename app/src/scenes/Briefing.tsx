import { motion } from "framer-motion";
import { useAppStore } from "../store";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.16 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const examples = [
  {
    label: "face unlock",
    icon: "🙂",
    accent: "accent",
    span: "md:col-span-4 md:row-span-2",
    glow: "from-accent/12 via-accent/5 to-transparent",
    border: "border-accent/20 hover:border-accent/40",
  },
  {
    label: "spam filter",
    icon: "✉️",
    accent: "warm",
    span: "md:col-span-3",
    glow: "from-warm/12 via-warm/5 to-transparent",
    border: "border-warm/20 hover:border-warm/40",
  },
  {
    label: "recommendations",
    icon: "★",
    accent: "teal",
    span: "md:col-span-5",
    glow: "from-teal/12 via-teal/5 to-transparent",
    border: "border-teal/20 hover:border-teal/40",
  },
  {
    label: "chatbots",
    icon: "💬",
    accent: "accent",
    span: "md:col-span-3",
    glow: "from-accent/10 via-accent/5 to-transparent",
    border: "border-accent/20 hover:border-accent/35",
  },
  {
    label: "autocorrect",
    icon: "⌨️",
    accent: "warm",
    span: "md:col-span-4",
    glow: "from-warm/10 via-warm/5 to-transparent",
    border: "border-warm/20 hover:border-warm/35",
  },
  {
    label: "photo search",
    icon: "🔎",
    accent: "teal",
    span: "md:col-span-5",
    glow: "from-teal/10 via-teal/5 to-transparent",
    border: "border-teal/20 hover:border-teal/35",
  },
] as const;

const accentText = {
  accent: "text-accent",
  warm: "text-warm",
  teal: "text-teal",
} as const;

export function FamiliarExamples() {
  const { nextScene } = useAppStore();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex w-full max-w-6xl flex-col items-center justify-center px-8 py-10 select-none"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-4">
        <div className="h-px w-10 bg-accent/25" />
        <span className="font-mono text-xs uppercase tracking-[0.34em] text-accent/60">
          Everyday Stuff
        </span>
        <div className="h-px w-10 bg-accent/25" />
      </motion.div>

      <motion.h2
        variants={fadeUp}
        className="mt-6 text-center font-display text-proj-2xl font-bold text-text-primary"
      >
        you already use ml
      </motion.h2>

      <motion.p
        variants={fadeUp}
        className="mt-4 text-center font-body text-proj-base text-text-secondary/75"
      >
        probably before breakfast
      </motion.p>

      <div className="mt-12 grid w-full grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[120px]">
        {examples.map((item, index) => (
          <motion.div
            key={item.label}
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.01 }}
            className={`group relative overflow-hidden rounded-[28px] border bg-base-100/30 p-6 backdrop-blur-sm transition-all duration-500 ${item.span} ${item.border}`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.glow} opacity-80 transition-opacity duration-500 group-hover:opacity-100`}
            />
            <div className="absolute right-5 top-4 font-mono text-[10px] tracking-[0.24em] text-text-muted/35">
              0{index + 1}
            </div>
            <motion.div
              className="absolute -right-6 -top-6 text-7xl opacity-[0.07]"
              animate={{ rotate: [0, 6, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }}
            >
              {item.icon}
            </motion.div>

            <div className="relative flex h-full flex-col justify-between">
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.24em] ${accentText[item.accent]}`}
              >
                familiar
              </span>
              <div className="max-w-[12ch] text-balance font-display text-[clamp(1.7rem,2.8vw,2.9rem)] font-bold leading-[0.95] text-text-primary">
                {item.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        variants={fadeUp}
        onClick={nextScene}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="mt-10 rounded-full border border-border/60 bg-base-100/50 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-text-secondary transition-colors duration-300 hover:border-accent/30 hover:text-accent"
      >
        what we actually do
      </motion.button>
    </motion.div>
  );
}
