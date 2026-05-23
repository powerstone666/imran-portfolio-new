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

type PixelRatioListener = (ratio: number) => void;

class PerformanceMonitor {
  private deviceTier: PerformanceTier = "fast";
  private jitTier: PerformanceTier = "fast";
  private listeners: Listener[] = [];
  private pixelRatioListeners: PixelRatioListener[] = [];
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

  // ── Dynamic pixel ratio ──
  // When FPS drops below 5, reduce pixel ratio to ease GPU load
  private currentPixelRatio = typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2.0) : 1;
  private readonly MIN_PIXEL_RATIO = 0.5;
  private readonly PIXEL_RATIO_STEP = 0.25;
  private lowFpsCount = 0;
  private readonly LOW_FPS_THRESHOLD = 2; // 2 consecutive samples below 5 FPS

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

  getPixelRatio(): number {
    return this.currentPixelRatio;
  }

  start(initialTier: PerformanceTier) {
    if (this.isRunning || typeof window === "undefined") return;
    this.isRunning = true;
    this.jitTier = initialTier;
    this.currentPixelRatio = Math.min(window.devicePixelRatio, 2.0);
    this.lastSampleTime = performance.now();
    this.frameCount = 0;
    this.fpsHistory = [];
    this.smoothedFps = 60;
    this.tierStabilityCount = 0;
    this.pendingTier = null;
    this.lowFpsCount = 0;

    document.addEventListener("visibilitychange", this.handleVisibility);
    this.rafId = requestAnimationFrame(this.tick);

    // Immediately notify subscribers of the initial tier
    this.notify();
    this.notifyPixelRatio();
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
      this.lowFpsCount = 0;
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

      // ── Dynamic pixel ratio adjustment ──
      if (this.smoothedFps < 5) {
        this.lowFpsCount++;
        if (this.lowFpsCount >= this.LOW_FPS_THRESHOLD) {
          if (this.currentPixelRatio > this.MIN_PIXEL_RATIO) {
            this.currentPixelRatio = Math.max(
              this.MIN_PIXEL_RATIO,
              this.currentPixelRatio - this.PIXEL_RATIO_STEP
            );
            this.notifyPixelRatio();
            // eslint-disable-next-line no-console
            console.warn(
              `[JIT] FPS dropped to ${this.smoothedFps.toFixed(1)}. Reducing pixel ratio to ${this.currentPixelRatio.toFixed(2)}`
            );
          }
          this.lowFpsCount = 0;
        }
      } else if (this.smoothedFps > 25 && this.currentPixelRatio < window.devicePixelRatio) {
        // FPS recovered — gradually restore pixel ratio
        this.lowFpsCount++;
        if (this.lowFpsCount >= 4) { // ~2 seconds of good FPS
          this.currentPixelRatio = Math.min(
            window.devicePixelRatio,
            this.currentPixelRatio + this.PIXEL_RATIO_STEP
          );
          this.notifyPixelRatio();
          // eslint-disable-next-line no-console
          console.log(
            `[JIT] FPS recovered to ${this.smoothedFps.toFixed(1)}. Restoring pixel ratio to ${this.currentPixelRatio.toFixed(2)}`
          );
          this.lowFpsCount = 0;
        }
      } else {
        this.lowFpsCount = 0;
      }

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

  private notifyPixelRatio() {
    this.pixelRatioListeners.forEach((l) => l(this.currentPixelRatio));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  subscribePixelRatio(listener: PixelRatioListener): () => void {
    this.pixelRatioListeners.push(listener);
    return () => {
      this.pixelRatioListeners = this.pixelRatioListeners.filter((l) => l !== listener);
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
