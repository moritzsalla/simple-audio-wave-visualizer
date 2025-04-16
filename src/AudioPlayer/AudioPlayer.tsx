import { useEffect, useRef, useState } from "react";
import styles from "./AudioPlayer.module.css";

const CONFIG = {
	// Used as fallbacks if no children function is provided
	LABELS: {
		PLAY: "Play",
		PAUSE: "Pause",
		LOADING: "Loading...",
	},
} as const;

type AudioCtx = { audioElement: HTMLAudioElement };
export type AudioEventCallback = (context: AudioCtx) => void;
export type AudioErrorCallback = (error: Error, context: AudioCtx) => void;

type PlayerState = {
	isPaused: boolean;
	isLooping: boolean;
	isLoading: boolean;
};

type AudioPlayerProps = {
	src: string;
	loop?: boolean;
	className?: string;
	children?: (playerState: PlayerState) => React.ReactNode;
	onPlay?: AudioEventCallback;
	onPause?: AudioEventCallback;
	onError?: AudioErrorCallback;
};

export const AudioPlayer = ({
	src,
	loop = true,
	className,
	children,
	onPlay,
	onPause,
	onError,
}: AudioPlayerProps) => {
	const [isPaused, setIsPaused] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);

	const play = async () => {
		const audioElement = audioRef.current;
		if (!audioElement) {
			console.error("Audio element not found.");
			return;
		}

		setIsLoading(true);

		try {
			await audioElement.play();
			onPlay?.({ audioElement });
			setIsPaused(false);
		} catch (error) {
			const typedError =
				error instanceof Error ? error : new Error(String(error));

			console.error("Failed to start audio playback:", typedError);
			onError?.(typedError, { audioElement });
		} finally {
			setIsLoading(false);
		}
	};

	const pause = () => {
		const audioElement = audioRef.current;
		if (!audioElement) {
			console.error("Audio element not found.");
			return;
		}

		onPause?.({ audioElement });
		setIsPaused(true);
		audioElement.pause();
	};

	const togglePlayPause = () => {
		if (isPaused) {
			play();
		} else {
			pause();
		}
	};

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handleEnded = () => setIsPaused(true);
		const handleError = (e: ErrorEvent) => {
			const error = new Error(`Audio playback error: ${e.message}`);
			console.error(error);
			onError?.(error, { audioElement: audio });
			setIsPaused(true);
		};

		audio.addEventListener("ended", handleEnded);
		audio.addEventListener("error", handleError);

		return () => {
			audio.pause();
			audio.removeEventListener("ended", handleEnded);
			audio.removeEventListener("error", handleError);
		};
	}, [onError]);

	const childrenEl =
		children?.({ isPaused, isLooping: loop, isLoading }) ??
		(isLoading
			? CONFIG.LABELS.LOADING
			: isPaused
			? CONFIG.LABELS.PLAY
			: CONFIG.LABELS.PAUSE);

	return (
		<>
			<audio ref={audioRef} src={src} loop={loop} className={styles.audio} />
			<button
				type="button"
				aria-live="polite"
				role="switch"
				aria-checked={!isPaused}
				aria-busy={isLoading}
				disabled={isLoading}
				tabIndex={1}
				onClick={togglePlayPause}
				className={className}
			>
				{childrenEl}
			</button>
		</>
	);
};
