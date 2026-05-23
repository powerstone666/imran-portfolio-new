"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const FPS = 20;
const FRAME_EXCLUSIONS = new Set([28, 29]);

/** Static background for slow tier */
const STATIC_BG = "/parallax/noir_ny_start.png";

function createFramePaths() {
  const framePaths: string[] = [];
  for (let frameIndex = 1; frameIndex <= 182; frameIndex += 1) {
    if (FRAME_EXCLUSIONS.has(frameIndex)) continue;
    const frameNumber = String(frameIndex).padStart(3, "0");
    framePaths.push(`/parallax/frames/ezgif-frame-${frameNumber}.jpg`);
  }
  return framePaths;
}

type ParallaxFrameResource = ImageBitmap | HTMLImageElement;

function getFrameDimensions(frame: ParallaxFrameResource) {
  if ("naturalWidth" in frame) {
    return { width: frame.naturalWidth, height: frame.naturalHeight };
  }
  return { width: frame.width, height: frame.height };
}

const PARALLAX_FRAME_PATHS = createFramePaths();
let parallaxFramesPromise: Promise<ParallaxFrameResource[]> | null = null;
let optimizedFramesPromise: Promise<ParallaxFrameResource[]> | null = null;

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
  if (!response.ok) throw new Error(`Failed to fetch frame: ${src}`);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

function getOptimizedFramePaths(): string[] {
  // Use every other frame to halve the sequence (~90 frames)
  return PARALLAX_FRAME_PATHS.filter((_, i) => i % 2 === 0);
}

export function preloadParallaxFrames(): Promise<ParallaxFrameResource[]> {
  if (!parallaxFramesPromise) {
    parallaxFramesPromise = Promise.all(PARALLAX_FRAME_PATHS.map((src) => loadParallaxFrame(src)));
  }
  return parallaxFramesPromise;
}

export function preloadOptimizedFrames(): Promise<ParallaxFrameResource[]> {
  if (!optimizedFramesPromise) {
    optimizedFramesPromise = Promise.all(getOptimizedFramePaths().map((src) => loadParallaxFrame(src)));
  }
  return optimizedFramesPromise;
}

type ParallaxSequenceProps = {
  isActive?: boolean;
  jitTier?: "slow" | "fast" | "blazing";
};

export default function ParallaxSequence({ isActive = true, jitTier = "fast" }: ParallaxSequenceProps) {
  const isSlow = jitTier === "slow";
  const isFast = jitTier === "fast";
  const isBlazing = jitTier === "blazing";

  const framePaths = useMemo(() => {
    if (isFast) return getOptimizedFramePaths();
    return PARALLAX_FRAME_PATHS;
  }, [isFast]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<ParallaxFrameResource[]>([]);
  const [areFramesReady, setAreFramesReady] = useState(false);

  // ── SLOW: Static background ──
  if (isSlow) {
    return (
      <div
        className="noir-layer-parallax"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${STATIC_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: isActive ? 1 : 0,
          pointerEvents: "none",
        }}
      />
    );
  }

  // ── FAST / BLAZING: Animated parallax ──
  useEffect(() => {
    if (!isActive) {
      setAreFramesReady(false);
      return;
    }

    let isMounted = true;
    const preloadFn = isFast ? preloadOptimizedFrames : preloadParallaxFrames;

    void preloadFn()
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
  }, [isActive, isFast]);

  useEffect(() => {
    if (!isActive || !areFramesReady) return;

    const canvas = canvasRef.current;
    if (!canvas || framePaths.length === 0 || framesRef.current.length === 0) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

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
      if (!frame) return;
      syncCanvasSize(frame);
      context.clearRect(0, 0, internalWidth, internalHeight);
      context.drawImage(frame, 0, 0, internalWidth, internalHeight);
    };

    drawFrame(currentIndex);

    let lastDrawTime = 0;
    // Fast tier: reduce frame rate to 10 FPS (every 100ms)
    const interval = isFast ? 100 : 1000 / FPS;

    const animate = (now: number) => {
      if (lastDrawTime === 0) lastDrawTime = now;
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
  }, [areFramesReady, isActive, isFast, framePaths.length]);

  if (!isActive) return null;

  return (
    <div
      className="noir-layer-parallax"
      aria-hidden="true"
      style={{ opacity: isActive ? 1 : 0, pointerEvents: "none" }}
    >
      <canvas ref={canvasRef} className="noir-parallax-frame" />
    </div>
  );
}
