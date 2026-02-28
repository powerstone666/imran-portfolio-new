import { useState, useEffect } from 'react';

declare global {
  interface Navigator {
    deviceMemory?: number;
  }
}

export function useDevicePerformance() {
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const [isLowEnd] = useState(() => {
    if (typeof navigator !== 'undefined') {
      let lowEndDetected = false;
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        lowEndDetected = true;
      }
      if (navigator.deviceMemory && navigator.deviceMemory < 4) {
        lowEndDetected = true;
      }
      return lowEndDetected;
    }
    return false;
  });

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleMotionChange);
    } else {
      motionQuery.addListener(handleMotionChange);
    }

    return () => {
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', handleMotionChange);
      } else {
        motionQuery.removeListener(handleMotionChange);
      }
    };
  }, []);

  // Recalculate combined state
  const isDeviceLowEnd = isLowEnd || isReducedMotion;

  return { isLowEnd: isDeviceLowEnd, isReducedMotion };
}
