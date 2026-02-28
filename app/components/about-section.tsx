"use client";

import { useEffect, useState } from "react";
import AiVoiceSection from "./ai-voice-section";
import AboutNarrationPanel from "./about-narration-panel";

const ABOUT_GALLERY_IMAGES = Array.from({ length: 15 }, (_, index) => `/myPhotos/about-gallery-${String(index + 1).padStart(2, "0")}.jpeg`);
const ABOUT_IMAGE_SWAP_MS = 2800;
export type { NarrationSegment } from "./about-narration-panel";
import type { NarrationSegment } from "./about-narration-panel";

type AboutSectionProps = {
  isMuted?: boolean;
  narrationSegments: NarrationSegment[];
};

export default function AboutSection({ isMuted = false, narrationSegments }: AboutSectionProps) {
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
        className="relative overflow-hidden border-t border-white/10 px-5 py-10 md:px-8 md:py-14"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(128deg, rgba(3,6,18,0.92) 0%, rgba(6,30,44,0.84) 48%, rgba(12,44,92,0.72) 100%), url('/myPhotos/about-main.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center 28%",
            filter: "grayscale(0.6) contrast(1.08) brightness(0.68)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(84,156,255,0.22),transparent_36%),radial-gradient(circle_at_72%_62%,rgba(74,255,201,0.2),transparent_38%),radial-gradient(circle_at_90%_8%,rgba(170,220,255,0.15),transparent_30%)]" />

        <AboutNarrationPanel
          activeImage={activeImage}
          isMuted={isMuted}
          narrationSegments={narrationSegments}
        />
      </div>

      <AiVoiceSection isMuted={isMuted} />
    </section>
  );
}
