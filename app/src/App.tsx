import { motion } from "framer-motion";
import { SCENES } from "@shared/types";
import { useWebSocket } from "./hooks/useWebSocket";
import { useKeyboard } from "./hooks/useKeyboard";
import { Background } from "./components/Background";
import { PresenterPanel } from "./components/PresenterPanel";
import { SceneTransition } from "./components/SceneTransition";
import { AboutMe } from "./scenes/AboutMe";
import { Closing } from "./scenes/Closing";
import { BehindTheScenes } from "./scenes/BehindTheScenes";
import { FamiliarExamples } from "./scenes/Briefing";
import { DemoBridge } from "./scenes/DemoBridge";
import { Intro } from "./scenes/Intro";
import { JoinMl } from "./scenes/JoinMl";
import { LiveDemo } from "./scenes/LiveDemo";
import { Reasons } from "./scenes/Reasons";
import { VibeCoding } from "./scenes/VibeCoding";
import { WhatMlSectionDoes } from "./scenes/WhatMlSectionDoes";
import { useAppStore } from "./store";

function HudCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const isTop = position.startsWith("t");
  const isLeft = position.endsWith("l");

  return (
    <div
      className="hud-corner"
      style={{
        top: isTop ? 16 : undefined,
        bottom: !isTop ? 16 : undefined,
        left: isLeft ? 16 : undefined,
        right: !isLeft ? 16 : undefined,
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        style={{
          transform: `scale(${isLeft ? 1 : -1}, ${isTop ? 1 : -1})`,
        }}
      >
        <path
          d="M0 20V2C0 0.895 0.895 0 2 0H20"
          stroke="rgba(167,139,250,0.15)"
          strokeWidth="1"
        />
        <circle cx="0" cy="20" r="1.5" fill="rgba(167,139,250,0.25)" />
        <circle cx="20" cy="0" r="1.5" fill="rgba(167,139,250,0.25)" />
      </svg>
    </div>
  );
}

const SCENE_LABELS: Record<string, string> = {
  intro: "01",
  about: "02",
  vibes: "03",
  reasons: "04",
  familiar: "05",
  section: "06",
  bridge: "07",
  demo: "08",
  behind: "09",
  closing: "10",
  join: "11",
};

export default function App() {
  const { scene } = useAppStore();
  const { send, sendBinary, connect, disconnect } = useWebSocket();
  useKeyboard({ send });

  const scenes = {
    intro: <Intro />,
    about: <AboutMe />,
    vibes: <VibeCoding />,
    reasons: <Reasons />,
    familiar: <FamiliarExamples />,
    section: <WhatMlSectionDoes />,
    bridge: <DemoBridge />,
    demo: <LiveDemo sendBinary={sendBinary} />,
    behind: <BehindTheScenes />,
    closing: <Closing />,
    join: <JoinMl />,
  };

  const sceneIndex = SCENES.indexOf(scene);

  return (
    <div className="relative w-full h-full bg-base overflow-hidden">
      <Background />

      {/* HUD frame corners */}
      <HudCorner position="tl" />
      <HudCorner position="tr" />
      <HudCorner position="bl" />
      <HudCorner position="br" />

      {/* Scene counter — top right */}
      <div className="fixed top-5 right-16 z-30 pointer-events-none">
        <span className="font-mono text-[10px] text-text-muted/25 tracking-[0.3em]">
          {SCENE_LABELS[scene]}/{String(SCENES.length).padStart(2, "0")}
        </span>
      </div>

      <div className="relative z-10 w-full h-full">
        <SceneTransition sceneKey={scene}>{scenes[scene]}</SceneTransition>
      </div>

      {/* Navigation — vertical dots on left edge */}
      <div className="fixed left-7 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3">
        {SCENES.map((value, index) => (
          <motion.button
            key={value}
            onClick={() => useAppStore.getState().setScene(value)}
            className={`rounded-full transition-all duration-400 cursor-pointer ${
              index === sceneIndex
                ? "w-1.5 h-7 bg-accent"
                : "w-1.5 h-1.5 bg-text-muted/25 hover:bg-text-muted/50"
            }`}
            whileHover={{ scale: 1.5 }}
            whileTap={{ scale: 0.85 }}
            layout
          />
        ))}
      </div>

      {/* Presenter toggle hint */}
      <div className="fixed bottom-5 right-7 z-20">
        <span className="font-mono text-[10px] text-text-muted/15 select-none tracking-wider">
          P
        </span>
      </div>

      <PresenterPanel send={send} connect={connect} disconnect={disconnect} />
    </div>
  );
}
