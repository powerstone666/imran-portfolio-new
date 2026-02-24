"use client";

import { useEffect, useState } from "react";
import AiVoiceSection from "./ai-voice-section";

const ABOUT_GALLERY_IMAGES = Array.from({ length: 15 }, (_, index) => `/myPhotos/about-gallery-${String(index + 1).padStart(2, "0")}.jpeg`);
const ABOUT_IMAGE_SWAP_MS = 2800;

export default function AboutSection() {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setImageIndex((prev) => (prev + 1) % ABOUT_GALLERY_IMAGES.length);
    }, ABOUT_IMAGE_SWAP_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeImage = ABOUT_GALLERY_IMAGES[imageIndex];

  return (
    <section className="relative z-[34]">
      <div
        id="about"
        className="relative grid min-h-[62vh] grid-cols-1 overflow-hidden border-t border-white/10 md:grid-cols-2"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(8,8,8,0.56) 0%, rgba(10,10,10,0.34) 42%, rgba(8,8,8,0.52) 100%), url('/myPhotos/about-main.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center 28%",
            filter: "grayscale(0.95) contrast(1.08) brightness(0.84)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_84%_76%,rgba(255,255,255,0.05),transparent_38%)]" />

        <div className="relative flex items-center justify-center p-5 md:p-8">
          <div className="relative w-full max-w-md overflow-hidden rounded-[22px] border border-white/24 bg-black/65 shadow-[0_18px_36px_rgba(0,0,0,0.62)] md:max-w-lg">
            <div className="relative aspect-[4/3]">
              <img
                key={activeImage}
                src={activeImage}
                alt="Imran Pasha"
                loading="lazy"
                decoding="async"
                className="about-showcase-image h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="relative flex items-center p-5 md:p-8">
          <div className="max-w-md md:max-w-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-300/90">About</p>
            <h2 className="mt-3 text-4xl font-black uppercase tracking-[0.1em] md:text-6xl">
              <span className="bg-gradient-to-b from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_8px_30px_rgba(0,0,0,0.85)]">
                Imran Pasha
              </span>
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-zinc-300/90 md:text-base">
              Systems Engineer in the AI Era
            </p>
            <p className="mt-6 max-w-xl text-2xl italic leading-relaxed text-zinc-100/95 [font-family:'Times_New_Roman',serif] md:text-3xl">
              Calm under pressure. Precise under uncertainty.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-zinc-200/90">
              I build software systems with a noir mindset. I focus on adaptability, strong fundamentals,
              and production-ready engineering that stays valuable as AI transforms the stack.
            </p>
          </div>
        </div>
      </div>

      <AiVoiceSection />
    </section>
  );
}
