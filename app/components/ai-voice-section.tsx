"use client";

import { Mic, Square, Play, Pause, Trash2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  createObjectUrlFromAudioDataUrl,
  extractAudioDataUrl,
  readBlobAsDataUrl,
} from "../lib/assistant-audio";
import { requestAudioFocus, subscribeToAudioFocus } from "../lib/audio-focus";

const AUDIO_SOURCE = " ";
const CHERRY_MUSIC_VOLUME = 0.32;
const ASSISTANT_VOICE_VOLUME = 1.0;
const NODE_COUNT = 56;
const HALF_NODE_COUNT = Math.floor(NODE_COUNT / 2);
const FFT_SIZE = 1024;

type MediaAudioGraph = {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
};

const mediaAudioGraphCache = new WeakMap<HTMLMediaElement, MediaAudioGraph>();

function getOrCreateMediaAudioGraph(audio: HTMLMediaElement): MediaAudioGraph {
  const cached = mediaAudioGraphCache.get(audio);
  if (cached && cached.context.state !== "closed") {
    return cached;
  }

  const context = new AudioContext();
  const source = context.createMediaElementSource(audio);
  const graph = { context, source };
  mediaAudioGraphCache.set(audio, graph);
  return graph;
}

type AiVoiceSectionProps = {
  isMuted?: boolean;
};

export default function AiVoiceSection({ isMuted = false }: AiVoiceSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const nodeLevelsRef = useRef<number[]>(Array.from({ length: HALF_NODE_COUNT }, () => 8));
  // Assistant State
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const [isAssistantPlaying, setIsAssistantPlaying] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const assistantAudioRef = useRef<HTMLAudioElement | null>(null);
  const assistantAudioObjectUrlRef = useRef<string | null>(null);

  // Sync state to ref for requestAnimationFrame loop
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (assistantAudioObjectUrlRef.current) {
        URL.revokeObjectURL(assistantAudioObjectUrlRef.current);
        assistantAudioObjectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const assistantAudio = assistantAudioRef.current;
    if (assistantAudio) {
      assistantAudio.muted = isMuted;
      if (isMuted && !assistantAudio.paused) {
        assistantAudio.pause();
      }
    }

    const previewAudio = previewAudioRef.current;
    if (previewAudio) {
      previewAudio.muted = isMuted;
      if (isMuted && !previewAudio.paused) {
        previewAudio.pause();
      }
    }
  }, [isMuted]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        
        const assistantAudio = assistantAudioRef.current;
        if (!assistantAudio) return;

        if (entry.isIntersecting) {
          if (!isMuted) {
            const isPlayingIntro =
              !assistantAudio.paused && assistantAudio.src.includes("cherry.mp3");

            if (!isPlayingIntro) {
              assistantAudio.src = "/ai/cherry.mp3";
              assistantAudio.currentTime = 0;
              assistantAudio.volume = CHERRY_MUSIC_VOLUME;
              requestAudioFocus(assistantAudio);
              void assistantAudio.play().catch(() => {
                // Ignore NotAllowedError (Autoplay prevented)
              });
            }
          }
        } else {
          // Pause if intro/song is playing and we leave the section
          const isSong = assistantAudio.src.includes(".mp3");
          if (isSong && !assistantAudio.paused) {
            assistantAudio.pause();
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [isMuted]);

  useEffect(() => {
    const assistantAudio = assistantAudioRef.current;
    if (!assistantAudio) {
      return;
    }

    return subscribeToAudioFocus(assistantAudio, () => {
      isSpeakingRef.current = false;
      setIsAssistantPlaying(false);
    });
  }, []);

  useEffect(() => {
    const previewAudio = previewAudioRef.current;
    if (!previewAudio) {
      return;
    }
    return subscribeToAudioFocus(previewAudio, () => setIsPlayingPreview(false));
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) {
      return;
    }

    const { context: audioContext, source } = getOrCreateMediaAudioGraph(audio);
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.82;
    analyserRef.current = analyser;

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

    // Initialize layout sizes and subscribe to responsiveness
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const drawFrame = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) {
        animationFrameRef.current = window.requestAnimationFrame(drawFrame);
        return;
      }

      analyser.getByteFrequencyData(frequencyData);

      if (isSpeakingRef.current) {
        // Speaking state: original active jittery frequency
        const time = Date.now() / 150;
        for (let i = 0; i < frequencyData.length; i++) {
          const noise = Math.sin(time + i * 0.5) * 0.5 + 0.5;
          frequencyData[i] = noise > 0.4 ? Math.floor(Math.random() * 180) + 40 : 0;
        }
      } else if (isLoadingRef.current) {
        // Thinking state: smooth low-frequency sway
        const time = Date.now() / 900;
        for (let i = 0; i < frequencyData.length; i++) {
          const sway = Math.sin(time + i * 0.28) * 0.5 + 0.5;
          frequencyData[i] = Math.max(0, sway * 110 + 25);
        }
      } else {
        // Idle state: smooth cinematic drift with medium height (distinct from speaking/thinking)
        const time = Date.now() / 1350;
        for (let i = 0; i < frequencyData.length; i++) {
          const drift =
            Math.sin(time + i * 0.19) * 0.55 +
            Math.cos(time * 0.58 + i * 0.1) * 0.45;
          frequencyData[i] = Math.max(0, drift * 85 + 78);
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Add Noir soft white glow effect
      ctx.shadowColor = "rgba(255, 255, 255, 0.5)"; 
      ctx.shadowBlur = 12;

      const centerX = Math.floor(width / 2);
      const step = Math.max(6, (width / 2) / Math.max(1, HALF_NODE_COUNT));
      const nodeWidth = Math.max(4, Math.floor(step * 0.55)); // Wider gap, chunkier block
      const horizontalOffset = Math.floor((step - nodeWidth) / 2);
      
      // Bottom alignment baseline
      const baselineY = Math.floor(height * 0.75); // Draw line towards the lower section
      const sampleStride = Math.max(1, Math.floor(frequencyData.length / HALF_NODE_COUNT));

      // Draw the continuous baseline
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(0, baselineY, width, 1);

      for (let index = 0; index < HALF_NODE_COUNT; index += 1) {
        const sample = frequencyData[index * sampleStride] ?? 0;
        const normalized = sample / 255;
        // State-specific amplitude keeps each mode visually distinct
        const amplitudeScale = isSpeakingRef.current ? 0.5 : isLoadingRef.current ? 0.32 : 0.34;
        const target = 4 + normalized * (height * amplitudeScale);
        const previous = nodeLevelsRef.current[index] ?? 4;
        const smoothingFactor = isLoadingRef.current ? 0.12 : isSpeakingRef.current ? 0.25 : 0.18;
        const smoothed = previous + (target - previous) * smoothingFactor;
        nodeLevelsRef.current[index] = smoothed;

        const barHeight = smoothed;
        // Expand strictly upwards from the baseline
        const y = Math.floor(baselineY - barHeight);
        const xRight = Math.floor(centerX + index * step + horizontalOffset);
        const xLeft = Math.floor(centerX - (index + 1) * step + horizontalOffset);

        ctx.fillStyle = "rgba(250, 250, 250, 0.95)"; // Pure white
        ctx.fillRect(xRight, y, nodeWidth, barHeight);
        ctx.fillRect(xLeft, y, nodeWidth, barHeight);
      }

      animationFrameRef.current = window.requestAnimationFrame(drawFrame);
    };

    animationFrameRef.current = window.requestAnimationFrame(drawFrame); // Start the animation loop

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
      source.disconnect(analyser);
      analyser.disconnect();
    };
  }, []);

  // -- Audio Recording Logic -- //
  const startRecording = async () => {
    if (isAssistantPlaying) {
      const assistantAudio = assistantAudioRef.current;
      if (assistantAudio) {
        assistantAudio.pause();
      }
      setIsAssistantPlaying(false);
      isSpeakingRef.current = false;
    } else {
      // If intro or music is playing, pause it before recording.
      const assistantAudio = assistantAudioRef.current;
      if (assistantAudio && !assistantAudio.paused) {
        assistantAudio.pause();
        isSpeakingRef.current = false;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to speak to the Assistant.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all audio tracks to release the mic
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlayingPreview(false);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
  };

  const togglePreviewPlayback = () => {
    if (!previewAudioRef.current) return;
    if (isMuted) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
    } else {
      requestAudioFocus(previewAudioRef.current);
      previewAudioRef.current.play();
    }
  };

  // --------------------------- //



  const handleSendRecording = async () => {
    if (isLoading || !audioBlob) return;

    setIsLoading(true);

    // Stop preview if playing
    if (previewAudioRef.current && !previewAudioRef.current.paused) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }

    try {
      const base64Audio = await readBlobAsDataUrl(audioBlob);

      const res = await fetch("/api/genai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64Audio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Assistant Error:", data?.details || data?.error || "Request failed.");
        return;
      }

      const rawAudio = data?.audioObj?.audio ?? data?.audio;
      const audioDataUrl = extractAudioDataUrl(rawAudio);
      if (!audioDataUrl) {
        console.error("Assistant Error: No playable audio payload returned from API.", {
          payloadKeys: data && typeof data === "object" ? Object.keys(data) : null,
        });
        return;
      }

      const playbackSource = createObjectUrlFromAudioDataUrl(audioDataUrl) ?? audioDataUrl;
      const assistantAudio = assistantAudioRef.current;
      if (!assistantAudio) {
        console.error("Assistant audio element is unavailable.");
        return;
      }

      if (assistantAudioObjectUrlRef.current) {
        URL.revokeObjectURL(assistantAudioObjectUrlRef.current);
        assistantAudioObjectUrlRef.current = null;
      }
      if (playbackSource.startsWith("blob:")) {
        assistantAudioObjectUrlRef.current = playbackSource;
      }

      assistantAudio.src = playbackSource;
      assistantAudio.currentTime = 0;

      if (isMuted) {
        deleteRecording();
        return;
      }

      try {
        requestAudioFocus(assistantAudio);
        await assistantAudio.play();
        deleteRecording();
      } catch (playbackError) {
        isSpeakingRef.current = false;
        console.error("Assistant audio playback failed.", {
          error: playbackError,
          sourcePrefix: audioDataUrl.slice(0, 32),
        });
      }
    } catch (err) {
      console.error("Assistant request failed.", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      id="ai"
      ref={sectionRef}
      className="relative flex min-h-screen flex-col justify-start gap-3 overflow-hidden border-t border-white/10 px-6 py-14 md:gap-5 md:py-16"
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

      <div className="relative z-2 flex flex-col items-center gap-1.5 mt-4 md:mt-0">
        <h3 className="text-3xl font-black uppercase tracking-[0.14em] text-zinc-100 md:text-5xl text-center">
          Meet Cherry
        </h3>
        <p className="text-zinc-400 text-xs md:text-sm font-medium uppercase tracking-[0.2em] text-center max-w-md opacity-80">
          Because every protagonist needs reliable backup.
        </p>
      </div>

      <div className="relative z-2 flex w-full justify-center group/canvas mt-4">
        <div className="relative w-full max-w-5xl overflow-hidden min-h-64 flex flex-col items-center justify-end">
          {isLoading && (
            <div className="mb-2 flex h-10 w-full items-center justify-center transition-opacity duration-500">
              <span className="text-xl md:text-3xl font-black uppercase tracking-[0.14em] text-zinc-200/90">
                Thinking...
              </span>
            </div>
          )}
          <canvas ref={canvasRef} className="h-64 w-full md:h-72 opacity-90" />
        </div>
      </div>

      <div className="relative z-2 flex flex-col items-center justify-center gap-4 pb-6 mt-2 min-h-24">
        {audioUrl && audioBlob ? (
          // Playback / Send Controls (Unified Pill)
          <div className="flex items-center rounded-full border border-white/15 bg-black/60 p-2 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={togglePreviewPlayback}
              disabled={isLoading}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-100 transition hover:bg-zinc-700 disabled:opacity-50 shrink-0"
            >
              {isPlayingPreview ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
            </button>
            
            <div className="mx-4 flex h-1 w-24 overflow-hidden rounded-full bg-zinc-800 shrink-0">
              <div className="h-full w-full bg-zinc-400 rounded-full" />
            </div>
            
            <div className="flex items-center gap-1 border-l border-white/10 pl-3">
              <button 
                onClick={deleteRecording}
                disabled={isLoading}
                className="flex h-12 w-12 items-center justify-center rounded-full text-zinc-400 transition hover:bg-black/40 hover:text-white disabled:opacity-50"
                aria-label="Delete recording"
              >
                <Trash2 size={18} />
              </button>
              
              <button
                onClick={handleSendRecording}
                disabled={isLoading}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-black transition-all hover:bg-white hover:scale-105 hover:shadow-[0_0_24px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:hover:scale-100"
                aria-label="Send to AI"
              >
                <Send size={18} className="-ml-0.5" />
              </button>
            </div>
          </div>
        ) : (
          // Recording Control
          <>
            <button
              type="button"
              disabled={isLoading}
              onClick={isRecording ? stopRecording : startRecording}
              className={[
                "inline-flex h-20 w-20 items-center justify-center rounded-full border transition-all duration-300 relative group",
                isRecording 
                  ? "border-zinc-300 bg-zinc-100 text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-110"
                  : isLoading
                    ? "border-zinc-500 bg-zinc-800/40 text-zinc-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    : "border-zinc-100/35 bg-black/45 text-zinc-100 hover:border-zinc-300 hover:bg-zinc-800/40 hover:text-white hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              ].join(" ")}
              aria-label={isRecording ? "Stop recording" : "Click to speak"}
              title="Speak to Assistant"
            >
              {/* Pulse ring for recording state */}
              {isRecording && (
                <div className="absolute inset-0 rounded-full border border-zinc-100 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
              )}
              
              {isRecording ? <Square size={26} className="fill-current" /> : <Mic size={30} />}
            </button>
            
            <span className={`text-xs font-medium uppercase tracking-widest transition-colors ${isRecording ? 'text-zinc-100 animate-pulse' : 'text-zinc-500'}`}>
              {isAssistantPlaying ? "Assistant Speaking..." : isLoading ? 'Processing' : isRecording ? 'Recording...' : 'Tap to Speak'}
            </span>
          </>
        )}
      </div>

      {audioUrl && (
        <audio 
          ref={previewAudioRef} 
          src={audioUrl} 
          muted={isMuted}
          onPlay={() => setIsPlayingPreview(true)}
          onPause={() => setIsPlayingPreview(false)}
          onEnded={() => setIsPlayingPreview(false)}
          className="hidden" 
        />
      )}

      <audio
        ref={assistantAudioRef}
        muted={isMuted}
        onPlay={() => {
          const assistantAudio = assistantAudioRef.current;
          if (assistantAudio) {
            requestAudioFocus(assistantAudio);
            
            // Check if it's the AI speaking (blob) vs a music/intro file
            const isCherryTrack = assistantAudio.src.includes("cherry.mp3");
            if (isCherryTrack) {
              assistantAudio.volume = CHERRY_MUSIC_VOLUME;
              setIsAssistantPlaying(false); // Do not show "Assistant Speaking" text
            } else {
              assistantAudio.volume = ASSISTANT_VOICE_VOLUME;
              setIsAssistantPlaying(true);
            }
          }
          isSpeakingRef.current = true;
        }}
        onPause={() => {
          isSpeakingRef.current = false;
          setIsAssistantPlaying(false);
        }}
        onEnded={() => {
          isSpeakingRef.current = false;
          setIsAssistantPlaying(false);
        }}
        className="hidden"
      />
      
      <audio ref={audioRef} src={AUDIO_SOURCE} loop preload="auto" />
    </section>
  );
}
