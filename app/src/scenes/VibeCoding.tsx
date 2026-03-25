import { motion } from "framer-motion";
import { useAppStore } from "../store";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.16 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: "blur(5px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const greentext = [
  "be me",
  "open cursor",
  "\"hey claude, build me a rock paper scissors app\"",
  "it writes 1000 lines of code",
  "i don't read a single line",
  "just hit \"accept all\"",
  "error.log is 5gb",
  "paste the error log back with no comment",
  "it mostly works",
  "its so over (everything is broken)",
  "we’re so back (claude found the missing bracket)",
  "karpathy smiles from the clouds",
  "mfw i'm just a vibes orchestrator",
] as const;

export function VibeCoding() {
  const { nextScene } = useAppStore();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex w-full max-w-[1200px] flex-col items-center justify-center px-8 py-7 select-none"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-4">
        <div className="h-px w-10 bg-accent/25" />
        <span className="font-mono text-xs uppercase tracking-[0.34em] text-accent/60">
          Vibe Coding
        </span>
        <div className="h-px w-10 bg-accent/25" />
      </motion.div>

      <motion.h2
        variants={fadeUp}
        className="mt-5 text-center font-display text-[clamp(2.8rem,5vw,4.2rem)] font-bold leading-[1.02] text-gradient-animated"
      >
        vibe coding!
      </motion.h2>

      <motion.div
        variants={fadeUp}
        className="mt-8 w-full overflow-hidden rounded-[30px] border border-teal/20 bg-[#0b120f]/90 p-6 shadow-[0_0_60px_rgba(45,212,191,0.05)] backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 border-b border-teal/10 pb-4">
          <div className="h-2.5 w-2.5 rounded-full bg-warm/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-teal/60" />
          <div className="ml-3 font-mono text-[10px] uppercase tracking-[0.24em] text-teal/45">
            greentext.txt
          </div>
        </div>

        <div className="mt-5 space-y-2 font-mono text-[clamp(0.98rem,1.25vw,1.14rem)] leading-[1.42]">
          {greentext.map((line, index) => (
            <motion.div
              key={line}
              variants={fadeUp}
              className="flex items-start gap-3 text-[#89f59f]"
              transition={{ delay: 0.06 * index }}
            >
              <span className="select-none text-[#6fe187]">{">"}</span>
              <span className="text-balance">{line}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.p
        variants={fadeUp}
        className="mt-5 max-w-4xl text-balance text-center font-body text-[clamp(0.98rem,1.3vw,1.08rem)] leading-[1.35] text-text-secondary/72"
      >
        currently using an ai to help me build an ml model that can finally tell
        me which ai i should use to build my next ml model
      </motion.p>

      <motion.button
        variants={fadeUp}
        onClick={nextScene}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="mt-7 rounded-full border border-accent/20 bg-accent/[0.05] px-7 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent transition-colors duration-300 hover:border-accent/35 hover:bg-accent/[0.08]"
      >
        more valid reasons
      </motion.button>
    </motion.div>
  );
}
