import { motion } from "framer-motion";

const orbs = [
  { x: "15%", y: "20%", size: 400, color: "rgba(0, 229, 160, 0.04)", delay: 0 },
  { x: "75%", y: "60%", size: 500, color: "rgba(0, 229, 160, 0.03)", delay: 2 },
  { x: "50%", y: "80%", size: 350, color: "rgba(255, 107, 74, 0.02)", delay: 4 },
];

export function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 bg-grid opacity-100" />

      {/* Floating orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, #08080c 100%)",
        }}
      />
    </div>
  );
}
