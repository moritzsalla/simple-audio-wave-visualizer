import { useEffect, useRef, useState } from "react";
import styles from "./Visualizer.module.css";
import { AudioEventCallback, AudioPlayer } from "../AudioPlayer/AudioPlayer";
import { getCssVariable } from "../utils";

declare global {
	interface Window {
		webkitAudioContext: typeof AudioContext;
	}
}

const CONFIG = {
	LINE_APPEARANCE: {
		THICKNESS: 0.15, // Bar thickness as a percentage of canvas width
		SPACING: 30, // Space between bars
		COLOR: "--color-secondary", // CSS variable for color
	},
	LABELS: {
		PLAY: "Play",
		PAUSE: "Pause",
	},
	AUDIO: {
		FFT_SIZE: 256, // Size of the FFT (Fast Fourier Transform)
		BUFFER_LENGTH: 11, // Number of visualization bars
	},
} as const;

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

	// Set up audio context and analyzer
	const setupAudio = (audioElement: HTMLAudioElement) => {
		if (audioContextRef.current) return;

		const AudioContextClass = window.AudioContext || window.webkitAudioContext;
		const audioContext = new AudioContextClass();
		audioContextRef.current = audioContext;

		const analyser = audioContext.createAnalyser();
		analyser.fftSize = CONFIG.AUDIO.FFT_SIZE;
		analyserRef.current = analyser;

		const source = audioContext.createMediaElementSource(audioElement);
		source.connect(analyser);
		analyser.connect(audioContext.destination);
		sourceRef.current = source;
	};

	// Draw visualization on canvas
	const drawVisualization = () => {
		const canvas = canvasRef.current;
		const analyser = analyserRef.current;

		if (!canvas || !analyser) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const bufferLength = CONFIG.AUDIO.BUFFER_LENGTH;
		const dataArray = new Uint8Array(bufferLength);

		analyser.getByteFrequencyData(dataArray);

		// Clear and setup canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.imageSmoothingEnabled = true;

		const barWidth =
			(canvas.width / bufferLength) * CONFIG.LINE_APPEARANCE.THICKNESS;
		const fillColor =
			getCssVariable(CONFIG.LINE_APPEARANCE.COLOR) || "rgb(0, 0, 0)";
		let x = 0;

		// Draw each bar
		for (let i = 0; i < bufferLength; i++) {
			const barHeight = Math.floor(dataArray[i] / 2);
			const y = canvas.height / 2 - barHeight / 2;

			ctx.fillStyle = fillColor;
			ctx.fillRect(x, y, barWidth, barHeight);

			x += barWidth + CONFIG.LINE_APPEARANCE.SPACING;
		}

		animationFrameRef.current = requestAnimationFrame(drawVisualization);
	};

	const handleAudioPlay: AudioEventCallback = ({ audioElement }) => {
		setIsCollapsed(false);
		setupAudio(audioElement);
		animationFrameRef.current = requestAnimationFrame(drawVisualization);
	};

	const handleAudioPause: AudioEventCallback = () => {
		setIsCollapsed(true);

		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
	};

	// Cleanup resources
	useEffect(() => {
		return () => {
			if (audioContextRef.current) {
				audioContextRef.current.close();
				audioContextRef.current = null;
			}

			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
		};
	}, []);

	const pauseLabel = CONFIG.LABELS.PAUSE;
	const playLabel = CONFIG.LABELS.PLAY;

	return (
		<div className={styles.container}>
			<AudioPlayer
				src={src}
				onPlay={handleAudioPlay}
				onPause={handleAudioPause}
			>
				{({ isPaused }) => {
					const label = isPaused ? playLabel : pauseLabel;
					const minLabelWidth = `max(${playLabel.length}ch, ${pauseLabel.length}ch)`;

					return (
						<div className={styles.inner}>
							<span
								className={styles.control}
								style={{ minWidth: minLabelWidth }}
							>
								{label}
							</span>

							<div className={styles.mask} data-collapse={isCollapsed}>
								<canvas ref={canvasRef} className={styles.waves} />
							</div>
						</div>
					);
				}}
			</AudioPlayer>
		</div>
	);
};
