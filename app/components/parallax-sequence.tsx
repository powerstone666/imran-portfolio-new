"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const FPS = 20;
const FRAME_EXCLUSIONS = new Set([28, 29]);

type ParallaxFrameResource = ImageBitmap | HTMLImageElement;

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

function getFrameDimensions(frame: ParallaxFrameResource) {
  if ("naturalWidth" in frame) {
    return { width: frame.naturalWidth, height: frame.naturalHeight };
  }
  return { width: frame.width, height: frame.height };
}

const PARALLAX_FRAME_PATHS = createFramePaths();
let parallaxFramesPromise: Promise<ParallaxFrameResource[]> | null = null;

async function loadParallaxFrame(src: string): Promise<ParallaxFrameResource> {
  if (typeof createImageBitmap !== "function") {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load frame: ${src}`));
      img.src = src;
    });
    return img;
  }

  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to fetch frame: ${src}`);
  }
  const blob = await response.blob();
  return createImageBitmap(blob);
}

export function preloadParallaxFrames(): Promise<ParallaxFrameResource[]> {
  if (!parallaxFramesPromise) {
    parallaxFramesPromise = Promise.all(PARALLAX_FRAME_PATHS.map((src) => loadParallaxFrame(src)));
  }
  return parallaxFramesPromise;
}

type ParallaxSequenceProps = {
  isActive?: boolean;
  isLowEnd?: boolean;
};

export default function ParallaxSequence({ isActive = true, isLowEnd = false }: ParallaxSequenceProps) {
  const framePaths = useMemo(() => PARALLAX_FRAME_PATHS, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<ParallaxFrameResource[]>([]);
  const [areFramesReady, setAreFramesReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void preloadParallaxFrames()
      .then((frames) => {
        if (isMounted) {
          framesRef.current = frames;
          setAreFramesReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          framesRef.current = [];
          setAreFramesReady(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isActive || !areFramesReady) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || framePaths.length === 0 || framesRef.current.length === 0) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      return;
    }

    let currentIndex = 0;
    let frameTimer = 0;

    let internalWidth = 0;
    let internalHeight = 0;

    const syncCanvasSize = (frame: ParallaxFrameResource) => {
      const { width: sourceWidth, height: sourceHeight } = getFrameDimensions(frame);
      if (internalWidth !== sourceWidth || internalHeight !== sourceHeight) {
        internalWidth = sourceWidth;
        internalHeight = sourceHeight;
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
      }
    };

    const drawFrame = (frameIndex: number) => {
      const frame = framesRef.current[frameIndex];
      if (!frame) {
        return;
      }

      syncCanvasSize(frame);
      context.clearRect(0, 0, internalWidth, internalHeight);
      context.drawImage(frame, 0, 0, internalWidth, internalHeight);
    };

    // Draw the initial frame immediately
    drawFrame(currentIndex);

    let lastDrawTime = 0;
    const currentFps = isLowEnd ? FPS / 2 : FPS;
    const interval = 1000 / currentFps;

    const animate = (now: number) => {
      if (lastDrawTime === 0) {
        lastDrawTime = now;
      }

      const delta = now - lastDrawTime;
      if (delta >= interval) {
        currentIndex = (currentIndex + 1) % framesRef.current.length;
        drawFrame(currentIndex);
        lastDrawTime = now - (delta % interval);
      }

      frameTimer = window.requestAnimationFrame(animate);
    };

    frameTimer = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frameTimer);
    };
  }, [areFramesReady, isActive, isLowEnd, framePaths.length]);

  return (
    <div
      className="noir-layer-parallax"
      aria-hidden="true"
      style={isActive ? undefined : { opacity: 0, pointerEvents: "none" }}
    >
      <canvas ref={canvasRef} className="noir-parallax-frame" />
    </div>
  );
}
