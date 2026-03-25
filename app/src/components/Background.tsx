import { motion } from "framer-motion";

export function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Dot grid */}
      <div className="absolute inset-0 bg-grid opacity-100" />

      {/* Main mesh gradient blob */}
      <motion.div
        className="absolute mesh-blob"
        style={{
          width: "120%",
          height: "120%",
          left: "-10%",
          top: "-10%",
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Accent orb — top left */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          left: "5%",
          top: "10%",
          background:
            "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{
          y: [0, -25, 0, 15, 0],
          x: [0, 10, -8, 5, 0],
          scale: [1, 1.08, 0.96, 1.04, 1],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Teal orb — bottom right */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          right: "5%",
          bottom: "10%",
          background:
            "radial-gradient(circle, rgba(45,212,191,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{
          y: [0, 20, 0, -15, 0],
          x: [0, -12, 8, -4, 0],
          scale: [1, 0.95, 1.06, 0.98, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />

      {/* Warm orb — center bottom */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 350,
          height: 350,
          left: "50%",
          bottom: "5%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(circle, rgba(251,146,60,0.03) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
        animate={{
          y: [0, -18, 0, 12, 0],
          scale: [1, 1.1, 0.92, 1.05, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6,
        }}
      />

      {/* Vignette — darker edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, #07070f 100%)",
        }}
      />

      {/* Top edge gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-32"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,7,15,0.5), transparent)",
        }}
      />
    </div>
  );
}
