"use client";

import { useEffect, useState } from "react";
import AiVoiceSection from "./ai-voice-section";

const ABOUT_GALLERY_IMAGES = Array.from({ length: 15 }, (_, index) => `/myPhotos/about-gallery-${String(index + 1).padStart(2, "0")}.jpeg`);
const ABOUT_IMAGE_SWAP_MS = 2800;

type AboutSectionProps = {
  isMuted?: boolean;
};

export default function AboutSection({ isMuted = false }: AboutSectionProps) {
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
          <div className="max-w-md md:max-w-xl">
            <div className="space-y-4 text-base leading-relaxed text-zinc-200/90 md:text-lg">
              <p>
                The world is moving fast.<br />
                Systems are replacing processes.<br />
                Intelligence is becoming automated.
              </p>
              <p className="font-semibold text-zinc-100">
                I chose not to compete with machines —<br />
                I chose to build alongside them.
              </p>
              <p>
                I design systems that listen, validate, and act.<br />
                From high-concurrency security scanners<br />
                to AI-powered contract intelligence platforms.
              </p>
              <p>
                I work where signals are noisy,<br />
                where performance matters,<br />
                and where automation replaces friction.
              </p>
              <p className="italic text-zinc-300">
                I am not just writing code.<br />
                I am engineering in the age of AI.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AiVoiceSection isMuted={isMuted} />
    </section>
  );
}
