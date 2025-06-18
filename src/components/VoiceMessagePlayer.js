import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import styles from "../styles/VoiceMessagePlayer.module.css"
import WaveSurfer from "wavesurfer.js";

const VoiceMessagePlayer = ({ src, isOwn }) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!wavesurferRef.current) return;
    if (wavesurferRef.current.isPlaying()) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
  };

  useEffect(() => {
    if (!src || !containerRef.current) return;

    let wavesurfer;

    const initWaveSurfer = async () => {
      try {
        wavesurfer = WaveSurfer.create({
          container: containerRef.current,
          waveColor: isOwn ? "#ccc" : "#b3cdfa",
          progressColor: isOwn ? "#3ba55d" : "#2563eb",
          barWidth: 2,
          height: 40,
          interact: true,
          normalize: true,
          splitChannels: true,
        });

        wavesurfer.load(src);
        wavesurferRef.current = wavesurfer;

        wavesurfer.on("ready", () => {
          setDuration(wavesurfer.getDuration());
        });

        wavesurfer.on("audioprocess", () => {
          setCurrentTime(wavesurfer.getCurrentTime());
        });

        wavesurfer.on("finish", () => {
          setIsPlaying(false);
          wavesurfer.seekTo(0);
        });

        wavesurfer.on("play", () => setIsPlaying(true));
        wavesurfer.on("pause", () => setIsPlaying(false));
      } catch (err) {
        console.error("WaveSurfer load error:", err);
      }
    };

    initWaveSurfer();

    return () => {
      try {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }
      } catch (err) {
        if (err?.message?.includes('signal is aborted')) {
          // Игнорируем эту ошибку
          return;
        }
        console.warn("WaveSurfer destroy failed", err);
      }
    };
  }, [src, isOwn]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className={styles.voiceWrapper}>
        <button className={styles.playButton + ' ' + (isOwn ? styles.playButtonOwn : styles.playButtonOther)} onClick={togglePlay}>
        {isPlaying ? <FaPause className={styles.pause} /> : <FaPlay className={styles.play} />}
        </button>

        <div ref={containerRef} className={styles.waveformContainer} />

        <span className={styles.timeCounter}>{formatTime(currentTime)}</span>
    </div>
    );
};

export default VoiceMessagePlayer;