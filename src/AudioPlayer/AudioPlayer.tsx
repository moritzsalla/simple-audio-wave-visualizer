import { useEffect, useRef, useState } from "react";

import styles from "./AudioPlayer.module.css";

type AudioCtx = { audioElement: HTMLAudioElement };

export type AudioEventCallback = (context: AudioCtx) => void;

type PlayerState = {
	isPaused: boolean;
	isLooping: boolean;
};

type AudioPlayerProps = {
	src: string;
	loop?: boolean;
	className?: string;
	children?: (playerState: PlayerState) => React.ReactNode;
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

	const childrenEl =
		children?.({ isPaused, isLooping: loop }) ?? (isPaused ? "Play" : "Pause");

	return (
		<>
			<audio ref={audioRef} src={src} loop={loop} className={styles.audio} />
			<button
				type="button"
				aria-live="polite" // Announce to screen readers
				role="switch"
				aria-checked={!isPaused}
				tabIndex={1} // First tab stop
				onClick={togglePlayPause}
				className={className}
			>
				{childrenEl}
			</button>
		</>
	);
};
