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

export function useDevicePerformance() {
  const [jitTier, setJitTier] = useState<PerformanceTier>("fast");
  const [isReady, setIsReady] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const init = async () => {
      // Wait a tick for the page to start rendering
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Measure actual FPS during startup
      const initialFps = await measureInitialFps();
      const initialTier = getTierFromFps(initialFps);

      // Set the initial tier BEFORE starting the monitor
      setJitTier(initialTier);
      setIsReady(true);

      // Start the monitor with the measured tier
      // The monitor will immediately notify all subscribers with the initial tier
      performanceMonitor.start(initialTier);
    };

    init();

    return () => {
      performanceMonitor.stop();
    };
  }, []);

  useEffect(() => {
    return performanceMonitor.subscribe((newTier) => {
      setJitTier(newTier);
    });
  }, []);

  return {
    jitTier,
    isReady,
  };
}
