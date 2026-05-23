import { useState, useEffect, useRef } from "react";
import { performanceMonitor } from "./performance-monitor";
import type { PerformanceTier } from "./performance-monitor";

// ── Measure actual rendering FPS for ~1 second ──
function measureInitialFps(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(30);
      return;
    }

    let frames = 0;
    const start = performance.now();
    let rafId: number;

    const tick = () => {
      frames++;
      const elapsed = performance.now() - start;
      if (elapsed < 600) {
        rafId = requestAnimationFrame(tick);
      } else {
        const fps = (frames / elapsed) * 1000;
        resolve(fps);
      }
    };

    rafId = requestAnimationFrame(tick);
  });
}

function getTierFromFps(fps: number): PerformanceTier {
  if (fps <= 10) return "slow";
  if (fps <= 39) return "fast";
  return "blazing";
}

// ── External measurement promise (set on first call, reused) ──
let measurementPromise: Promise<PerformanceTier> | null = null;

export async function measureDevicePerformance(): Promise<PerformanceTier> {
  if (measurementPromise) return measurementPromise;

  measurementPromise = (async () => {
    // Wait a tick for the page to start rendering
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Measure actual FPS during startup
    const initialFps = await measureInitialFps();
    const initialTier = getTierFromFps(initialFps);

    // Start the monitor with the measured tier
    performanceMonitor.start(initialTier);

    return initialTier;
  })();

  return measurementPromise;
}

export function useDevicePerformance() {
  const [jitTier, setJitTier] = useState<PerformanceTier>("slow");
  const [isReady, setIsReady] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Subscribe to tier changes from monitor
    const unsubscribe = performanceMonitor.subscribe((newTier) => {
      setJitTier(newTier);
      setIsReady(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    jitTier,
    isReady,
  };
}
