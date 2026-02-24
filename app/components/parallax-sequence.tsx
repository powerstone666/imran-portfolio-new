"use client";

import { useEffect, useMemo, useRef } from "react";

const FPS = 20;
const FRAME_EXCLUSIONS = new Set([28, 29]);

function createFramePaths() {
  const framePaths: string[] = [];

  for (let frameIndex = 1; frameIndex <= 182; frameIndex += 1) {
    if (FRAME_EXCLUSIONS.has(frameIndex)) {
      continue;
    }
    const frameNumber = String(frameIndex).padStart(3, "0");
    framePaths.push(`/parallax/frames/ezgif-frame-${frameNumber}.jpg`);
  }

  return framePaths;
}

type ParallaxSequenceProps = {
  isActive?: boolean;
};

export default function ParallaxSequence({ isActive = true }: ParallaxSequenceProps) {
  const framePaths = useMemo(createFramePaths, []);
  const totalFrames = framePaths.length;
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const image = imageRef.current;
    if (!image) {
      return;
    }

    let frameTimer = 0;
    let startTime = performance.now();
    let currentIndex = 0;
    image.src = framePaths[currentIndex];

    const animate = (now: number) => {
      if (now - startTime >= 1000 / FPS) {
        currentIndex = (currentIndex + 1) % totalFrames;
        image.src = framePaths[currentIndex];
        startTime = now;
      }

      frameTimer = window.requestAnimationFrame(animate);
    };

    frameTimer = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameTimer);
  }, [isActive, totalFrames, framePaths]);

  return (
    <div
      className="noir-layer-parallax"
      aria-hidden="true"
      style={isActive ? undefined : { opacity: 0, pointerEvents: "none" }}
    >
      <img ref={imageRef} src={framePaths[0]} alt="" className="noir-parallax-frame" />
    </div>
  );
}
