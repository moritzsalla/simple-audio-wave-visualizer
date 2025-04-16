import { useEffect, useRef, useState } from "react";

import styles from "./AudioPlayer.module.scss";

export type AudioEventCallback = (context: {
  audioElement: HTMLAudioElement;
}) => void;

type AudioPlayerProps = {
  src: string;
  loop?: boolean;
  className?: string;
  children?: (playerState: {
    isPaused: boolean;
    isLooping: boolean;
  }) => React.ReactNode;
  onPlay?: AudioEventCallback;
  onPause?: AudioEventCallback;
};

export const AudioPlayer = ({
  src,
  loop = true,
  className,
  children,
  onPlay,
  onPause,
}: AudioPlayerProps) => {
  const [isPaused, setIsPaused] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      console.error("Audio element not found.");
      return;
    }

    if (isPaused) {
      audioElement
        .play()
        .then(() => {
          onPlay?.({ audioElement });
          setIsPaused(false);
        })
        .catch((error) => {
          console.error("Failed to start audio playback:", error);
        });
    } else {
      onPause?.({ audioElement });
      setIsPaused(true);
      audioElement.pause();
    }
  };

  // Cleanup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    return () => {
      audio.pause();
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src={src} loop={loop} className={styles.audio} />
      <button
        type="button"
        // Announce to screen readers
        aria-live="polite"
        role="switch"
        aria-checked={!isPaused}
        // First tab stop
        tabIndex={1}
        onClick={togglePlayPause}
        className={className}
      >
        {children?.({ isPaused, isLooping: loop }) ??
          (isPaused ? "Play" : "Pause")}
      </button>
    </>
  );
};
