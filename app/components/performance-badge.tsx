"use client";

import { useEffect, useState } from "react";
import { useDevicePerformance } from "../lib/use-device-performance";
import { performanceMonitor } from "../lib/performance-monitor";

export default function PerformanceBadge() {
  const { jitTier, isReady } = useDevicePerformance();
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(performanceMonitor.getCurrentFps());
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const tierColor =
    jitTier === "slow"
      ? "text-red-400 border-red-400/30 bg-red-500/10"
      : jitTier === "fast"
      ? "text-yellow-400 border-yellow-400/30 bg-yellow-500/10"
      : "text-emerald-400 border-emerald-400/30 bg-emerald-500/10";

  const tierLabel = jitTier === "slow" ? "SLOW" : jitTier === "fast" ? "FAST" : "BLAZING FAST";

  return (
    <div
      className={`fixed top-3 left-3 z-[9999] flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md ${tierColor}`}
    >
      <span className="tabular-nums">
        {isReady && fps !== null ? `${fps} FPS` : "..."}
      </span>
      <span className="opacity-60">|</span>
      <span>{isReady ? tierLabel : "Measuring..."}</span>
    </div>
  );
}
