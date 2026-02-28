"use client";

import { useEffect, useState } from "react";
import AiVoiceSection from "./ai-voice-section";
import AboutNarrationPanel from "./about-narration-panel";
import type { NarrationSegment } from "./about-narration-panel";
import { preloadImages } from "../lib/asset-preload";
export type { NarrationSegment } from "./about-narration-panel";

const ABOUT_GALLERY_IMAGES = [
  "/myPhotos/about-gallery-01.jpeg",
  "/myPhotos/about-gallery-02.jpeg",
  "/myPhotos/about-gallery-03.jpeg",
  "/myPhotos/about-gallery-04.jpeg",
  "/myPhotos/about-gallery-05.jpeg",
  "/myPhotos/about-gallery-06.jpeg",
  "/myPhotos/about-gallery-07.jpeg",
  "/myPhotos/about-gallery-08.jpeg",
  "/myPhotos/about-gallery-09.jpeg",
  "/myPhotos/about-gallery-10.jpeg",
  "/myPhotos/about-gallery-11.jpeg",
  "/myPhotos/about-gallery-12.jpeg",
  "/myPhotos/about-gallery-13.jpeg"
];
const ABOUT_IMAGE_SWAP_MS = 2800;
const ABOUT_MAIN_IMAGE = "/myPhotos/about-main.jpeg";

type AboutSectionProps = {
  isMuted?: boolean;
  narrationSegments: NarrationSegment[];
};

export default function AboutSection({ isMuted = false, narrationSegments }: AboutSectionProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState(ABOUT_GALLERY_IMAGES);

  useEffect(() => {
    const imagesToPreload = [ABOUT_MAIN_IMAGE, ...ABOUT_GALLERY_IMAGES];
    const preload = () => {
      void preloadImages(imagesToPreload);
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preload);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = (window as Window).setTimeout(preload, 0);
    return () => (window as Window).clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (galleryImages.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, ABOUT_IMAGE_SWAP_MS);

    return () => window.clearInterval(intervalId);
  }, [galleryImages]);

  const handleGalleryImageError = (failedImage: string) => {
    setGalleryImages((prev) => {
      if (prev.length <= 1 || !prev.includes(failedImage)) {
        return prev;
      }
      return prev.filter((image) => image !== failedImage);
    });
  };

  const activeImage = galleryImages[imageIndex] ?? ABOUT_GALLERY_IMAGES[0];

  return (
    <section className="relative z-34">
      <div
        id="about"
        className="relative overflow-hidden border-t border-white/10 px-5 py-10 md:px-8 md:py-14"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              `linear-gradient(128deg, rgba(3,6,18,0.92) 0%, rgba(6,30,44,0.84) 48%, rgba(12,44,92,0.72) 100%), url('${ABOUT_MAIN_IMAGE}')`,
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
          onImageError={handleGalleryImageError}
        />
      </div>

      <AiVoiceSection isMuted={isMuted} />
    </section>
  );
}
