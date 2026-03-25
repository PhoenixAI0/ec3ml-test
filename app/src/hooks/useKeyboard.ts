import { useEffect } from "react";
import type { ClientMessage, Scene } from "@shared/types";
import { SCENES } from "@shared/types";
import { useAppStore } from "../store";

interface Props {
  send: (message: ClientMessage) => void;
}

export function useKeyboard({ send }: Props) {
  const { nextScene, prevScene, setScene, togglePresenter, scene, connected } =
    useAppStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (scene === "demo" && connected) {
        switch (e.key) {
          case " ":
          case "Enter":
            e.preventDefault();
            send({ type: "advance_round" });
            return;
          case "r":
          case "R":
            e.preventDefault();
            send({
              type: "presenter_command",
              command: { action: "set_computer_move", move: "rock" },
            });
            return;
          case "p":
            e.preventDefault();
            send({
              type: "presenter_command",
              command: { action: "set_computer_move", move: "paper" },
            });
            return;
          case "s":
          case "S":
            e.preventDefault();
            send({
              type: "presenter_command",
              command: { action: "set_computer_move", move: "scissors" },
            });
            return;
          case "P":
            if (!e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              togglePresenter();
            }
            return;
        }
      }

      if (/^[0-9]$/.test(e.key)) {
        const idx = Number.parseInt(e.key, 10);
        if (idx >= 0 && idx < SCENES.length) {
          setScene(SCENES[idx] as Scene);
        }
        return;
      }

      if (e.key === "j" || e.key === "J") {
        setScene(SCENES[SCENES.length - 1] as Scene);
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          nextScene();
          break;
        case "ArrowLeft":
        case "Backspace":
          e.preventDefault();
          prevScene();
          break;
        case "p":
          if (!e.metaKey && !e.ctrlKey) {
            togglePresenter();
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [connected, nextScene, prevScene, scene, send, setScene, togglePresenter]);
}
