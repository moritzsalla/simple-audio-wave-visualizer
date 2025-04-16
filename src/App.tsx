import { Visualizer } from "./Visualizer/Visualizer";
import "./styles.css";

export default function App() {
  return (
    <div className="App">
      <h1>Audio Waveform Visualizer</h1>
      <h2>Click button below</h2>

      <Visualizer src="file_example_MP3_700KB.mp3" />
    </div>
  );
}
