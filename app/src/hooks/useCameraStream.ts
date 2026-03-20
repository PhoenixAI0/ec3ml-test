import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RuntimeMode } from "@shared/types";

interface Options {
  connected: boolean;
  mode: RuntimeMode;
  sendBinary: (payload: Blob) => void;
}

interface CameraState {
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraActive: boolean;
  cameraError: string | null;
  streamLabel: string;
}

const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 240;
const FRAME_INTERVAL_MS = 125;
const JPEG_QUALITY = 0.65;

export function useCameraStream({
  connected,
  mode,
  sendBinary,
}: Options): CameraState {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sendingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;
    canvasRef.current = canvas;
  }, []);

  useEffect(() => {
    if (mode !== "live_cv") {
      setCameraActive(false);
      streamRef.current = null;
      return;
    }

    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setCameraError(null);
        setCameraActive(true);
      } catch (error) {
        setCameraActive(false);
        setCameraError(error instanceof Error ? error.message : "Camera unavailable");
      }
    };

    void start();

    return () => {
      mounted = false;
      setCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "live_cv" || !cameraActive) {
      return;
    }

    let cancelled = false;

    const attach = async () => {
      const stream = streamRef.current;
      const video = videoRef.current;
      if (!stream || !video) {
        return;
      }
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      try {
        await video.play();
      } catch (error) {
        if (!cancelled) {
          setCameraError(error instanceof Error ? error.message : "Unable to play camera stream");
        }
      }
    };

    void attach();
    const timer = setInterval(() => {
      void attach();
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [cameraActive, mode]);

  useEffect(() => {
    if (!connected || mode !== "live_cv" || !cameraActive) {
      return;
    }

    const timer = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || sendingRef.current) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.drawImage(video, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      sendingRef.current = true;
      canvas.toBlob(
        (blob) => {
          if (blob) {
            sendBinary(blob);
          }
          sendingRef.current = false;
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    }, FRAME_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [cameraActive, connected, mode, sendBinary]);

  const streamLabel = useMemo(() => {
    if (mode !== "live_cv") {
      return "simulation mode";
    }
    if (cameraError) {
      return "camera blocked";
    }
    return `${FRAME_WIDTH}×${FRAME_HEIGHT} · 8fps target`;
  }, [cameraError, mode]);

  return {
    videoRef,
    cameraActive,
    cameraError,
    streamLabel,
  };
}
