export type PerformanceTier = "slow" | "fast" | "blazing";

const TIER_ORDER: PerformanceTier[] = ["slow", "fast", "blazing"];

// ── FPS to Tier mapping ──
//  0–10  → slow
// 11–39  → fast
// 40+    → blazing
function getTierFromFps(fps: number): PerformanceTier {
  if (fps <= 10) return "slow";
  if (fps <= 39) return "fast";
  return "blazing";
}

type Listener = (tier: PerformanceTier) => void;

class PerformanceMonitor {
  private deviceTier: PerformanceTier = "fast";
  private jitTier: PerformanceTier = "fast";
  private listeners: Listener[] = [];
  private rafId: number | null = null;
  private isRunning = false;

  // Raw sample buffer (last N instantaneous FPS readings)
  private fpsHistory: number[] = [];
  private readonly HISTORY_SIZE = 20; // ~10 seconds of data (500ms each)

  // Frame counting for each 500ms window
  private lastSampleTime = 0;
  private frameCount = 0;

  // Smoothed (rolling average) FPS
  public smoothedFps = 60;

  // Hysteresis: require N consecutive tier-changes before notifying
  private tierStabilityCount = 0;
  private pendingTier: PerformanceTier | null = null;
  private readonly TIER_CHANGE_THRESHOLD = 3; // 3 consecutive samples (~1.5s) to switch tiers

  setDeviceTier(tier: PerformanceTier) {
    this.deviceTier = tier;
  }

  getTier(): PerformanceTier {
    return this.jitTier;
  }

  getDeviceTier(): PerformanceTier {
    return this.deviceTier;
  }

  getCurrentFps(): number {
    return Math.round(this.smoothedFps);
  }

  start(initialTier: PerformanceTier) {
    if (this.isRunning || typeof window === "undefined") return;
    this.isRunning = true;
    this.jitTier = initialTier; // Start from whatever was measured, not hardware
    this.lastSampleTime = performance.now();
    this.frameCount = 0;
    this.fpsHistory = [];
    this.smoothedFps = 60;
    this.tierStabilityCount = 0;
    this.pendingTier = null;

    document.addEventListener("visibilitychange", this.handleVisibility);
    this.rafId = requestAnimationFrame(this.tick);

    // Immediately notify subscribers of the initial tier
    this.notify();
  }

  stop() {
    document.removeEventListener("visibilitychange", this.handleVisibility);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
  }

  private handleVisibility = () => {
    if (!document.hidden) {
      this.lastSampleTime = performance.now();
      this.frameCount = 0;
      this.fpsHistory = [];
      this.tierStabilityCount = 0;
      this.pendingTier = null;
    }
  };

  private tick = (now: number) => {
    this.frameCount++;
    const elapsed = now - this.lastSampleTime;

    if (elapsed >= 500) {
      // Compute instantaneous FPS for this window
      const instantFps = (this.frameCount * 1000) / elapsed;

      // Add to rolling history
      this.fpsHistory.push(instantFps);
      if (this.fpsHistory.length > this.HISTORY_SIZE) {
        this.fpsHistory.shift();
      }

      // Compute smoothed (rolling average)
      const avg =
        this.fpsHistory.reduce((sum, val) => sum + val, 0) /
        this.fpsHistory.length;
      this.smoothedFps = avg;

      // Determine tier from smoothed value
      const detectedTier = getTierFromFps(this.smoothedFps);

      // Hysteresis: only change tier after N consecutive confirmations
      if (detectedTier !== this.jitTier) {
        if (this.pendingTier === detectedTier) {
          this.tierStabilityCount++;
          if (this.tierStabilityCount >= this.TIER_CHANGE_THRESHOLD) {
            this.jitTier = detectedTier;
            this.tierStabilityCount = 0;
            this.pendingTier = null;
            this.notify();
          }
        } else {
          this.pendingTier = detectedTier;
          this.tierStabilityCount = 1;
        }
      } else {
        // Same tier — reset stability counter
        this.pendingTier = null;
        this.tierStabilityCount = 0;
      }

      // Reset window
      this.lastSampleTime = now;
      this.frameCount = 0;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private notify() {
    this.listeners.forEach((l) => l(this.jitTier));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
