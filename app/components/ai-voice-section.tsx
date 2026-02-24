"use client";

import { Mic, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const AUDIO_SOURCE = "/new-music.mp3";
const NODE_COUNT = 56;
const FFT_SIZE = 1024;

export default function AiVoiceSection() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const nodeLevelsRef = useRef<number[]>(Array.from({ length: NODE_COUNT }, () => 8));
  const hasInitializedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) {
      return;
    }

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.82;
    analyserRef.current = analyser;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const drawFrame = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) {
        animationFrameRef.current = window.requestAnimationFrame(drawFrame);
        return;
      }

      analyser.getByteFrequencyData(frequencyData);

      ctx.clearRect(0, 0, width, height);

      const nodeWidth = Math.max(3, Math.floor(width / NODE_COUNT) - 2);
      const totalNodeWidth = nodeWidth * NODE_COUNT;
      const gap = (width - totalNodeWidth) / Math.max(1, NODE_COUNT - 1);
      const midpoint = height / 2;
      const sampleStride = Math.max(1, Math.floor(frequencyData.length / NODE_COUNT));

      for (let index = 0; index < NODE_COUNT; index += 1) {
        const sample = frequencyData[index * sampleStride] ?? 0;
        const normalized = sample / 255;
        const target = 8 + normalized * (height * 0.46);
        const previous = nodeLevelsRef.current[index] ?? 8;
        const smoothed = previous + (target - previous) * 0.25;
        nodeLevelsRef.current[index] = smoothed;

        const barHeight = smoothed;
        const x = index * (nodeWidth + gap);
        const y = midpoint - barHeight / 2;

        ctx.fillStyle = "rgba(233, 236, 245, 0.9)";
        ctx.fillRect(x, y, nodeWidth, barHeight);
      }

      animationFrameRef.current = window.requestAnimationFrame(drawFrame);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    window.addEventListener("resize", resizeCanvas);

    resizeCanvas();
    animationFrameRef.current = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      source.disconnect();
      analyser.disconnect();
      audioContext.close().catch(() => {});
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    const context = audioContextRef.current;
    if (!audio || !context) {
      return;
    }

    if (context.state === "suspended") {
      await context.resume();
    }

    if (audio.paused) {
      await audio.play().catch(() => {});
      return;
    }

    audio.pause();
  };

  return (
    <section
      id="ai"
      className="relative flex min-h-screen flex-col justify-between overflow-hidden border-t border-white/10 px-6 py-14 md:py-16"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(140deg, rgba(2,2,3,0.72) 0%, rgba(6,6,8,0.58) 100%), url('/ai/ai-section-noir-bg-blank.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_82%,rgba(255,255,255,0.08),transparent_48%)]" />

      <div className="relative z-[2]">
        <h3 className="text-3xl font-black uppercase tracking-[0.14em] text-zinc-100 md:text-5xl">
          Imran&apos;s Assistant
        </h3>
      </div>

      <div className="relative z-[2] w-full">
        <canvas ref={canvasRef} className="h-44 w-full md:h-52" />
      </div>

      <div className="relative z-[2] flex items-center justify-center gap-3">
        <button
          type="button"
          className={[
            "inline-flex h-14 w-14 items-center justify-center rounded-full border transition",
            "border-zinc-100/35 bg-black/45 text-zinc-100 hover:border-zinc-100/65 hover:bg-zinc-700/28",
          ].join(" ")}
          aria-label="Microphone input"
        >
          <Mic size={21} />
        </button>
        <button
          type="button"
          className={[
            "inline-flex h-14 w-14 items-center justify-center rounded-full border transition",
            isPlaying
              ? "border-zinc-100/70 bg-zinc-200/20 text-zinc-50 shadow-[0_0_28px_rgba(255,255,255,0.35)]"
              : "border-zinc-100/35 bg-black/45 text-zinc-100 hover:border-zinc-100/65 hover:bg-zinc-700/28",
          ].join(" ")}
          onClick={togglePlayback}
          aria-label={isPlaying ? "Pause assistant preview audio" : "Start assistant preview audio"}
        >
          {isPlaying ? <Pause size={21} /> : <Play size={21} />}
        </button>
      </div>

      <audio ref={audioRef} src={AUDIO_SOURCE} loop preload="auto" />
    </section>
  );
}
