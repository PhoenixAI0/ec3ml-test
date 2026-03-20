import { motion } from "framer-motion";
import { SCENES } from "@shared/types";
import { useWebSocket } from "./hooks/useWebSocket";
import { useKeyboard } from "./hooks/useKeyboard";
import { Background } from "./components/Background";
import { PresenterPanel } from "./components/PresenterPanel";
import { SceneTransition } from "./components/SceneTransition";
import { Closing } from "./scenes/Closing";
import { BehindTheScenes } from "./scenes/BehindTheScenes";
import { Intro } from "./scenes/Intro";
import { LiveDemo } from "./scenes/LiveDemo";
import { useAppStore } from "./store";

export default function App() {
  const { scene } = useAppStore();
  const { send, sendBinary, connect, disconnect } = useWebSocket();
  useKeyboard({ send });

  const scenes = {
    intro: <Intro />,
    demo: <LiveDemo sendBinary={sendBinary} />,
    behind: <BehindTheScenes />,
    closing: <Closing />,
  };

  const sceneIndex = SCENES.indexOf(scene);

  return (
    <div className="relative w-full h-full bg-base overflow-hidden">
      <Background />

      <div className="relative z-10 w-full h-full">
        <SceneTransition sceneKey={scene}>{scenes[scene]}</SceneTransition>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SCENES.map((value, index) => (
          <motion.button
            key={value}
            onClick={() => useAppStore.getState().setScene(value)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              index === sceneIndex
                ? "w-6 h-1.5 bg-accent"
                : "w-1.5 h-1.5 bg-text-muted/40 hover:bg-text-muted"
            }`}
            whileHover={{ scale: 1.3 }}
          />
        ))}
      </div>

      <div className="fixed bottom-6 right-6 z-20">
        <span className="font-mono text-xs text-text-muted/30 select-none">P</span>
      </div>

      <PresenterPanel send={send} connect={connect} disconnect={disconnect} />
    </div>
  );
}
