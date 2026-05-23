"use client";

import { useEffect, useState } from "react";
import { useDevicePerformance } from "../lib/use-device-performance";
import { performanceMonitor } from "../lib/performance-monitor";

export default function PerformanceBadge() {
  const { jitTier } = useDevicePerformance();
  const [fps, setFps] = useState<number>(0);

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

  const tierLabel = jitTier === "slow" ? "SLOW" : jitTier === "fast" ? "FAST" : "BLAZING";

  return (
    <div
      className={`fixed bottom-3 right-3 z-[9999] flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest backdrop-blur-md md:top-3 md:left-3 md:bottom-auto md:right-auto md:gap-2 md:px-3 md:py-1 md:text-[10px] ${tierColor}`}
    >
      <span className="tabular-nums">{fps}</span>
      <span className="opacity-60 hidden sm:inline">|</span>
      <span>{tierLabel}</span>
    </div>
  );
}
