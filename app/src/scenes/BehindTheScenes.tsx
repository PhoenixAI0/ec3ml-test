import { motion } from "framer-motion";

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.2, delayChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25, filter: "blur(3px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const steps = [
  {
    icon: "📷",
    title: "camera",
    desc: "live frame",
    accentColor: "text-text-primary",
    borderColor: "border-text-muted/20 hover:border-text-muted/40",
    dotColor: "bg-text-secondary",
    number: "01",
  },
  {
    icon: "🖐️",
    title: "landmarks",
    desc: "where the fingers are",
    accentColor: "text-accent",
    borderColor: "border-accent/25 hover:border-accent/45",
    dotColor: "bg-accent",
    number: "02",
  },
  {
    icon: "🧠",
    title: "prediction",
    desc: "rock / paper / scissors",
    accentColor: "text-teal",
    borderColor: "border-teal/25 hover:border-teal/45",
    dotColor: "bg-teal",
    number: "03",
  },
  {
    icon: "🎮",
    title: "move",
    desc: "lock it in",
    accentColor: "text-warm",
    borderColor: "border-warm/25 hover:border-warm/45",
    dotColor: "bg-warm",
    number: "04",
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
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-6">
        <div className="w-8 h-px bg-accent/30" />
        <span className="font-mono text-xs text-accent/60 uppercase tracking-[0.35em]">
          Behind The Scenes
        </span>
        <div className="w-8 h-px bg-accent/30" />
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="mb-4 text-center font-display font-bold text-proj-xl text-gradient-accent"
      >
        how the demo works
      </motion.div>

      <motion.p
        variants={fadeUp}
        className="mb-12 text-center font-body text-proj-base text-text-secondary/72"
      >
        frame to guess to game
      </motion.p>

      <div className="flex flex-wrap items-center justify-center gap-0">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            variants={fadeUp}
            className="flex items-center"
          >
            <motion.div
              className={`relative flex min-h-60 w-[220px] flex-col items-center justify-center gap-5 rounded-[28px] border bg-base-100/40 px-8 py-10 backdrop-blur-sm transition-all duration-300 ${step.borderColor}`}
              whileHover={{
                y: -4,
                rotateX: 2,
                rotateY: i % 2 === 0 ? 2 : -2,
                transition: { duration: 0.3 },
              }}
              style={{ transformStyle: "preserve-3d", perspective: 800 }}
            >
              <div className="absolute -top-3 left-5">
                <span className="font-mono text-[10px] text-text-muted/40 bg-base-50 px-2 py-0.5 rounded tracking-widest border border-border/30">
                  {step.number}
                </span>
              </div>

              {/* Accent dot top-right */}
              <motion.div
                className={`absolute top-4 right-4 w-1.5 h-1.5 rounded-full ${step.dotColor}`}
                animate={{ opacity: [0.2, 0.7, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />

              <div className="relative">
                <span className="text-5xl block relative z-10">{step.icon}</span>
                <motion.div
                  className="absolute -inset-4 rounded-full border border-accent/[0.08]"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.6,
                  }}
                />
                <motion.div
                  className="absolute -inset-4 rounded-full border border-accent/[0.05]"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.6 + 0.5,
                  }}
                />
              </div>

              <div className="text-center">
                <div className={`font-display font-bold text-proj-lg ${step.accentColor}`}>
                  {step.title}
                </div>
                <div className="font-body text-proj-sm text-text-secondary/70 mt-1.5">
                  {step.desc}
                </div>
              </div>
            </motion.div>

            {i < steps.length - 1 && (
              <div className="relative mx-3 hidden items-center md:flex">
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.25, duration: 0.5 }}
                  className="flex items-center origin-left relative w-20"
                >
                  <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20" />

                  {[0, 1, 2].map((dot) => (
                    <motion.div
                      key={dot}
                      className="absolute w-1 h-1 rounded-full bg-accent/60"
                      style={{ top: "50%", marginTop: -2 }}
                      animate={{
                        left: ["0%", "100%"],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        delay: dot * 0.6 + i * 0.3,
                        ease: "linear",
                      }}
                    />
                  ))}

                  <motion.div
                    className="absolute right-0 flex items-center"
                    animate={{ x: [0, 3, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-accent/40"
                    >
                      <path
                        d="M4 2l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                </motion.div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeUp} className="mt-14 max-w-lg text-center">
        <p className="font-body text-proj-base text-text-secondary/70 leading-relaxed">
          not magic
          <span className="text-text-muted/55">, just a lot of trying, tuning, and rerunning things</span>
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="mt-10 flex items-center gap-1.5">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full"
            style={{
              background:
                i < 5
                  ? "rgba(167,139,250,0.5)"
                  : i < 10
                    ? "rgba(45,212,191,0.4)"
                    : "rgba(251,146,60,0.4)",
            }}
            animate={{
              opacity: [0.15, 1, 0.15],
              scale: [0.6, 1.4, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.08,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
