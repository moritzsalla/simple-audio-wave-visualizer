"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./Visualizer.module.css";
import { AudioEventCallback, AudioPlayer } from "../AudioPlayer/AudioPlayer";
import { getCssVariable } from "../utils";

const LINE_THICKNESS_SCALAR = 0.15;
const LINE_COLOR_VARIABLE = "--color-secondary";
const LINE_SPACING = 30;
const PLAY_LABEL = "Play";
const PAUSE_LABEL = "Pause";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export type VisualizerProps = {
  src: string;
};

export const Visualizer = ({ src }: VisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleAudioPlay: AudioEventCallback = ({ audioElement }) => {
    setIsCollapsed(false);

    // Initialize Web Audio API
    if (!audioContextRef.current) {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      sourceRef.current = source;
    }

    const draw = () => {
      if (!analyserRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Buffer length is hard coded to yield 11 lines.
      // (Amount of lines == buffer items)
      // You can uncomment the following line to get the actual buffer length.
      // const bufferLength = analyserRef.current.frequencyBinCount;
      const bufferLength = 11;
      const dataArray = new Uint8Array(bufferLength);

      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Enable anti-aliasing
      ctx.imageSmoothingEnabled = true;

      const barWidth = (canvas.width / bufferLength) * LINE_THICKNESS_SCALAR;
      let barHeight = 0,
        x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = Math.floor((dataArray[i] ?? 0) / 2);
        const x0 = x;
        const x1 = barWidth;
        const y0 = canvas.height / 2 - barHeight / 2;
        const y1 = barHeight;
        ctx.fillStyle = getCssVariable(LINE_COLOR_VARIABLE) ?? "rgb(0, 0, 0)";
        ctx.fillRect(x0, y0, x1, y1);
        x += barWidth + LINE_SPACING;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };
    animationFrameRef.current = requestAnimationFrame(draw);
  };

  const handleAudioPause: AudioEventCallback = () => {
    setIsCollapsed(true);

    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
  };

  // Cleanup
  useEffect(() => {
    const animationFrame = animationFrameRef.current;
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <AudioPlayer
        src={src}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
      >
        {({ isPaused }) => (
          <div className={styles.inner}>
            <span
              className={styles.control}
              style={{
                // Persistent label width
                minWidth: `max(${PLAY_LABEL.length}ch, ${PAUSE_LABEL.length}ch)`,
              }}
            >
              {isPaused ? PLAY_LABEL : PAUSE_LABEL}
            </span>
            <div className={styles.mask} data-collapse={isCollapsed}>
              <canvas ref={canvasRef} className={styles.waves} />
            </div>
          </div>
        )}
      </AudioPlayer>
    </div>
  );
};
