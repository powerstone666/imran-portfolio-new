"use client";

import { useDevicePerformance } from "../lib/use-device-performance";

export default function PerformanceIndicator() {
  const { jitTier } = useDevicePerformance();

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2 py-1 backdrop-blur-sm">
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-300 hidden sm:inline">
        {jitTier === 'slow' && 'Slow'}
        {jitTier === 'fast' && 'Fast'}
        {jitTier === 'blazing' && 'Fast'}
      </span>
    </div>
  );
}
