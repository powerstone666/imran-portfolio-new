"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { requestAudioFocus, subscribeToAudioFocus } from "../lib/audio-focus";

const ABOUT_NARRATION_SRC = "/about/myvoice.m4a";
const ABOUT_NARRATION_VOLUME = 0.35;
const ABOUT_BG_MUSIC_SRC = "/stan.mp3";
const ABOUT_BG_MUSIC_VOLUME = 0.015;

export type NarrationSegment = {
  start: number;
  end: number;
  text: string;
};

type AboutNarrationPanelProps = {
  activeImage: string;
  isMuted?: boolean;
  narrationSegments: NarrationSegment[];
  onImageError?: (image: string) => void;
};

export default function AboutNarrationPanel({
  activeImage,
  isMuted = false,
  narrationSegments,
  onImageError,
}: AboutNarrationPanelProps) {
  const [activeNarrationIndex, setActiveNarrationIndex] = useState(0);
  const [narrationCurrentTime, setNarrationCurrentTime] = useState(0);
  const [narrationDuration, setNarrationDuration] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const narrationAudioRef = useRef<HTMLAudioElement>(null);
  const bgMusicAudioRef = useRef<HTMLAudioElement>(null);
  const isNarrationInViewRef = useRef(false);

  useEffect(() => {
    const audio = narrationAudioRef.current;
    const bgMusicAudio = bgMusicAudioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = ABOUT_NARRATION_VOLUME;
    audio.muted = isMuted;
    if (isMuted && !audio.paused) {
      audio.pause();
    }

    if (bgMusicAudio) {
      bgMusicAudio.volume = ABOUT_BG_MUSIC_VOLUME;
      bgMusicAudio.muted = isMuted;
      if (isMuted && !bgMusicAudio.paused) {
        bgMusicAudio.pause();
      }
    }

    if (!isMuted && isNarrationInViewRef.current) {
      requestAudioFocus(audio);
      void audio.play().catch(() => {});
      if (bgMusicAudio) {
        void bgMusicAudio.play().catch(() => {});
      }
    }
  }, [isMuted]);

  useEffect(() => {
    const panel = panelRef.current;
    const audio = narrationAudioRef.current;
    const bgMusicAudio = bgMusicAudioRef.current;
    if (!panel || !audio || !bgMusicAudio) {
      return;
    }

    let hasEntered = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        if (entry.isIntersecting) {
          isNarrationInViewRef.current = true;
          hasEntered = true;
          if (!isMuted) {
            requestAudioFocus(audio);
            void audio.play().catch(() => {});
            void bgMusicAudio.play().catch(() => {});
          }
          return;
        }

        isNarrationInViewRef.current = false;
        if (!hasEntered) {
          return;
        }
        audio.pause();
        bgMusicAudio.pause();
      },
      { threshold: 0.45 },
    );

    observer.observe(panel);
    return () => observer.disconnect();
  }, [isMuted]);

  useEffect(() => {
    const narrationAudio = narrationAudioRef.current;
    const bgMusicAudio = bgMusicAudioRef.current;
    if (!narrationAudio || !bgMusicAudio) {
      return;
    }

    const stopBackgroundMusic = () => {
      if (!bgMusicAudio.paused) {
        bgMusicAudio.pause();
      }
    };

    narrationAudio.addEventListener("pause", stopBackgroundMusic);
    narrationAudio.addEventListener("ended", stopBackgroundMusic);
    return () => {
      narrationAudio.removeEventListener("pause", stopBackgroundMusic);
      narrationAudio.removeEventListener("ended", stopBackgroundMusic);
    };
  }, []);

  useEffect(() => {
    const narrationAudio = narrationAudioRef.current;
    if (!narrationAudio) {
      return;
    }
    return subscribeToAudioFocus(narrationAudio);
  }, []);

  useEffect(() => {
    const audio = narrationAudioRef.current;
    if (!audio) {
      return;
    }

    const updatePlaybackClock = () => {
      const currentTime = Math.max(0, audio.currentTime);
      setNarrationCurrentTime(currentTime);

      let index = narrationSegments.findIndex(
        (segment) => currentTime >= segment.start && currentTime < segment.end,
      );
      if (index < 0) {
        index = narrationSegments.reduce((acc, segment, segmentIndex) => {
          if (currentTime >= segment.start) {
            return segmentIndex;
          }
          return acc;
        }, 0);
      }
      setActiveNarrationIndex(index);
    };

    const handleLoadedMetadata = () => {
      setActiveNarrationIndex(0);
      setNarrationCurrentTime(0);
      setNarrationDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const handleEnded = () => {
      setNarrationCurrentTime(Number.isFinite(audio.duration) ? audio.duration : 0);
      setActiveNarrationIndex(Math.max(0, narrationSegments.length - 1));
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", updatePlaybackClock);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", updatePlaybackClock);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [narrationSegments]);

  const narrationProgress =
    narrationDuration > 0 ? Math.min(1, Math.max(0, narrationCurrentTime / narrationDuration)) : 0;
  const visibleWindowSize = 3;
  const maxVisibleStart = Math.max(0, narrationSegments.length - visibleWindowSize);
  const visibleStartIndex = Math.min(Math.max(0, activeNarrationIndex - 1), maxVisibleStart);
  const visibleLyrics = narrationSegments.slice(
    visibleStartIndex,
    Math.min(narrationSegments.length, visibleStartIndex + visibleWindowSize),
  );

  useLayoutEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) {
      return;
    }

    const activeLine = container.querySelector('[data-lyric-active="true"]');
    if (activeLine) {
      gsap
        .timeline()
        .fromTo(
          activeLine,
          { scale: 0.96, filter: "blur(0.8px)" },
          { scale: 1.06, filter: "blur(0px)", duration: 0.14, ease: "power2.out" },
        )
        .to(activeLine, { scale: 1, duration: 0.14, ease: "power2.inOut" });
    }
  }, [activeNarrationIndex]);

  const formatClock = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div ref={panelRef} className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(280px,420px)_1fr] lg:gap-12">
      <div className="rounded-3xl border border-white/20 bg-black/35 p-4 shadow-[0_28px_64px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="relative overflow-hidden rounded-2xl border border-white/14">
          <div className="relative aspect-12/10">
            <Image
              key={activeImage}
              src={activeImage}
              alt="Imran Pasha"
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              className="about-showcase-image object-cover"
              onError={() => onImageError?.(activeImage)}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold tracking-[0.08em] text-zinc-300/90">
            <span>{formatClock(narrationCurrentTime)}</span>
            <span>{formatClock(narrationDuration || 30)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/90 transition-[width] duration-200"
              style={{ width: `${narrationProgress * 100}%` }}
            />
          </div>
          <div className="pt-1 text-center">
            <p className="text-2xl font-black tracking-[0.02em] text-zinc-100">The Dossier</p>
            <p className="text-sm font-medium text-zinc-300/85">Imran Pasha — Recorded Narrative
</p>
          </div>
        </div>
      </div>

      <div className="min-h-[420px] p-6 md:p-8">
        <div ref={lyricsContainerRef} className="space-y-5">
          {visibleLyrics.map((segment, offsetIndex) => {
            const absoluteIndex = visibleStartIndex + offsetIndex;
            return (
              <p
                key={`${absoluteIndex}-${segment.start}-${segment.text}`}
                data-lyric-line="true"
                data-lyric-active={absoluteIndex === activeNarrationIndex ? "true" : "false"}
                className="text-4xl font-black leading-[1.08] tracking-tight transition-all duration-300 md:text-5xl"
                style={{
                  opacity: absoluteIndex === activeNarrationIndex ? 1 : 0.35,
                  color: absoluteIndex === activeNarrationIndex ? "rgb(244 248 255)" : "rgb(198 214 235)",
                }}
              >
                {segment.text}
              </p>
            );
          })}
        </div>
      </div>

      <audio ref={narrationAudioRef} src={ABOUT_NARRATION_SRC} preload="auto" className="hidden" />
      <audio ref={bgMusicAudioRef} src={ABOUT_BG_MUSIC_SRC} loop preload="auto" className="hidden" />
    </div>
  );
}
