"use client";

const imagePreloadCache = new Map<string, Promise<void>>();

function preloadSingleImage(src: string): Promise<void> {
  const existing = imagePreloadCache.get(src);
  if (existing) {
    return existing;
  }

  const pending = new Promise<void>((resolve, reject) => {
    const img = new window.Image();
    img.decoding = "async";
    img.loading = "eager";
    img.onload = async () => {
      try {
        if (typeof img.decode === "function") {
          await img.decode();
        }
      } catch {
        // Ignore decode failures and continue with loaded image.
      }
      resolve();
    };
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;

    if (img.complete) {
      resolve();
    }
  });

  imagePreloadCache.set(src, pending);
  return pending;
}

export async function preloadImages(sources: string[]): Promise<void> {
  const uniqueSources = Array.from(new Set(sources.filter(Boolean)));
  if (uniqueSources.length === 0) {
    return;
  }

  await Promise.allSettled(uniqueSources.map((src) => preloadSingleImage(src)));
}
