"use client";

import { useDevicePerformance } from "../lib/use-device-performance";

export default function PerformanceWalker() {
  const { jitTier } = useDevicePerformance();

  const duration = jitTier === "slow" ? "14s" : jitTier === "fast" ? "7s" : "3.5s";
  const animationName = jitTier === "slow" ? "chase-turtle" : jitTier === "fast" ? "chase-rabbit" : "chase-cheetah";

  const phrase =
    jitTier === "slow"
      ? "You too slow..."
      : jitTier === "fast"
      ? "Need a bit faster"
      : "I'm the fastest";

  const textColor =
    jitTier === "slow" ? "#7db88a" : jitTier === "fast" ? "#e8e8e8" : "#d4956a";

  return (
    <div className="pointer-events-none absolute top-0 left-0 w-full h-6 overflow-hidden" style={{ zIndex: 100 }}>
      <div
        className="absolute top-0 flex items-center gap-2 whitespace-nowrap"
        style={{ animation: `${animationName} ${duration} linear infinite`, willChange: "transform" }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: textColor }}>
          {phrase}
        </span>
      </div>
    </div>
  );
}
