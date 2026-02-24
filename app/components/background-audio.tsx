"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const BACKGROUND_VOLUME = 0.22;

type BackgroundAudioProps = {
  shouldPlay?: boolean;
  muted?: boolean;
};

export type BackgroundAudioHandle = {
  playFromGesture: () => Promise<void>;
};

const BackgroundAudio = forwardRef<BackgroundAudioHandle, BackgroundAudioProps>(function BackgroundAudio(
  { shouldPlay = true, muted = false },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useImperativeHandle(ref, () => ({
    playFromGesture: async () => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }
      audio.volume = BACKGROUND_VOLUME;
      await audio.play();
    },
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = BACKGROUND_VOLUME;
    if (!shouldPlay) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    if (muted) {
      audio.pause();
      return;
    }

    let hasStarted = false;

    const tryPlay = async () => {
      if (hasStarted) {
        return;
      }

      try {
        await audio.play();
        hasStarted = true;
      } catch {
        // Browser autoplay policy can block playback until first user interaction.
      }
    };

    const startOnUserGesture = () => {
      void tryPlay();
      if (hasStarted) {
        window.removeEventListener("pointerdown", startOnUserGesture);
        window.removeEventListener("keydown", startOnUserGesture);
      }
    };

    void tryPlay();
    window.addEventListener("pointerdown", startOnUserGesture);
    window.addEventListener("keydown", startOnUserGesture);

    return () => {
      window.removeEventListener("pointerdown", startOnUserGesture);
      window.removeEventListener("keydown", startOnUserGesture);
    };
  }, [shouldPlay, muted]);

  return (
    <audio
      ref={audioRef}
      src="/stan.mp3"
      loop
      preload="auto"
      autoPlay
      aria-hidden="true"
      style={{ display: "none" }}
    />
  );
});

export default BackgroundAudio;
