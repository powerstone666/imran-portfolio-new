"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Volume2, VolumeX } from "lucide-react";
import BackgroundAudio from "./background-audio";
import EnvironmentCursorLayer from "./environment-cursor-layer";
import LetterboxBars from "./letterbox-bars";
import LightningLayer from "./lightning-layer";
import Navbar from "./navbar";
import ParallaxSequence from "./parallax-sequence";

gsap.registerPlugin(ScrollTrigger);

/* ── Timing ─────────────────────────────────────────────────── */
const FRAME_DURATION_MS = 3200; // each cinematic beat
const FADE_TO_BLACK_MS = 800; // darkness between frames
const TYPEWRITER_CHAR_MS = 38; // per-character reveal speed
const RAIN_VOLUME = 0.3; // rain ambience volume
const HOME_REVEAL_SCROLL_END = "+=60%";

/* ── Assets ─────────────────────────────────────────────────── */
type FrameTransition = "zoom-burst" | "slide-left" | "tilt-rise" | "blur-reveal" | "drift-up" | "slam-in";

const STORY_FRAMES: { src: string; kenBurns: { x: string; y: string; scale: number }; transition: FrameTransition }[] = [
  { src: "/loading/noir_loader_1.png", kenBurns: { x: "-2%", y: "-1%", scale: 1.08 }, transition: "zoom-burst" },
  { src: "/loading/noir_loader_3.png", kenBurns: { x: "2%", y: "0%", scale: 1.07 }, transition: "blur-reveal" },
  { src: "/loading/noir_loader_5.png", kenBurns: { x: "-1.5%", y: "0.5%", scale: 1.06 }, transition: "drift-up" },
  { src: "/loading/noir_loader_4.png", kenBurns: { x: "0%", y: "-1.5%", scale: 1.05 }, transition: "slam-in" },
];
const WAITING_FRAME = { src: "/loading/noir_story_4.png", kenBurns: { x: "0.5%", y: "-1%", scale: 1.04 }, transition: "drift-up" as FrameTransition };

const DIALOGUES = [
  "We trained the machines. They took the shifts.",
  "I refuse to fade into the background.",
  "The future belongs to those who adapt.",
  "I choose to evolve before I disappear.",
];

const PROFILE_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com" },
  { label: "GitHub", href: "https://github.com" },
  { label: "Mail", href: "mailto:imran@example.com" },
  { label: "GFG", href: "https://www.geeksforgeeks.org/user/" },
  { label: "Download Resume", href: "/resume.pdf" },
];

/* ── Component ──────────────────────────────────────────────── */
type HomeExperienceProps = {
  onOpenChange?: (isOpen: boolean) => void;
};

export default function HomeExperience({ onOpenChange }: HomeExperienceProps) {
  const [phase, setPhase] = useState<"cinematic" | "awaiting" | "transitioning" | "open">("cinematic");
  const [frameIndex, setFrameIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isFadingToBlack, setIsFadingToBlack] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHomeLayersActive, setIsHomeLayersActive] = useState(true);

  const imageRef = useRef<HTMLImageElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLElement>(null);
  const rainAudioRef = useRef<HTMLAudioElement>(null);
  const revealSectionRef = useRef<HTMLElement>(null);
  const revealPinRef = useRef<HTMLDivElement>(null);
  const revealContentRef = useRef<HTMLDivElement>(null);

  const shouldRunMainScene = phase === "open" || phase === "transitioning";
  const shouldPlayHomeAudio = phase === "open" && isHomeLayersActive;
  const shouldRenderHomeLayers = shouldRunMainScene && isHomeLayersActive;
  const isLoading = phase !== "open";
  const currentFrame = useMemo(
    () => (phase === "cinematic" ? STORY_FRAMES[frameIndex] : WAITING_FRAME),
    [phase, frameIndex],
  );
  const currentDialogue = useMemo(() => DIALOGUES[frameIndex], [frameIndex]);

  const stopRain = useCallback((immediate = false) => {
    const audio = rainAudioRef.current;
    if (!audio) return;

    if (immediate) {
      audio.volume = 0;
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    gsap.to(audio, {
      volume: 0,
      duration: 0.9,
      ease: "power1.out",
      onComplete: () => {
        audio.pause();
        audio.currentTime = 0;
      },
    });
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stopRain(true);
      }
      return next;
    });
  }, [stopRain]);

  /* ── Loader rain ambience (rain.mp3) ─────────────────────── */
  useEffect(() => {
    const audio = rainAudioRef.current;
    if (!audio) return;

    if (isMuted) {
      stopRain(true);
      return;
    }

    const shouldPlayRain = phase === "cinematic" || phase === "awaiting";
    if (!shouldPlayRain) {
      stopRain();
      return;
    }

    const startRain = () => {
      audio.volume = RAIN_VOLUME;
      audio.play().catch(() => {
        // Browser policy may block until user gesture.
      });
    };

    startRain();

    const startOnGesture = () => {
      startRain();
      window.removeEventListener("pointerdown", startOnGesture);
      window.removeEventListener("keydown", startOnGesture);
    };

    window.addEventListener("pointerdown", startOnGesture);
    window.addEventListener("keydown", startOnGesture);

    return () => {
      window.removeEventListener("pointerdown", startOnGesture);
      window.removeEventListener("keydown", startOnGesture);
    };
  }, [phase, isMuted, stopRain]);

  useEffect(() => () => stopRain(true), [stopRain]);

  useEffect(() => {
    onOpenChange?.(phase === "open");
  }, [phase, onOpenChange]);

  /* ── Typewriter effect ─────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "cinematic") return;
    setTypedText("");
    const text = currentDialogue;
    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex += 1;
      setTypedText(text.slice(0, charIndex));
      if (charIndex >= text.length) clearInterval(interval);
    }, TYPEWRITER_CHAR_MS);
    return () => clearInterval(interval);
  }, [frameIndex, phase, currentDialogue]);

  /* ── Cinematic sequence driver ─────────────────────────────── */
  useEffect(() => {
    if (phase !== "cinematic") return;

    const timers: number[] = [];

    for (let i = 1; i < STORY_FRAMES.length; i++) {
      // Start fade-to-black before switching frame
      const fadeTimer = window.setTimeout(() => {
        setIsFadingToBlack(true);
      }, i * FRAME_DURATION_MS - FADE_TO_BLACK_MS);
      timers.push(fadeTimer);

      // Switch frame
      const frameTimer = window.setTimeout(() => {
        setFrameIndex(i);
        setIsFadingToBlack(false);
      }, i * FRAME_DURATION_MS);
      timers.push(frameTimer);
    }

    // Transition to awaiting
    const awaitFade = window.setTimeout(() => {
      setIsFadingToBlack(true);
    }, STORY_FRAMES.length * FRAME_DURATION_MS - FADE_TO_BLACK_MS);
    timers.push(awaitFade);

    const awaitTimer = window.setTimeout(() => {
      setPhase("awaiting");
      setIsFadingToBlack(false);
    }, STORY_FRAMES.length * FRAME_DURATION_MS);
    timers.push(awaitTimer);

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase]);

  /* ── Unique transition per frame + Ken Burns ───────────────── */
  useLayoutEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const kb = currentFrame.kenBurns;
    const dur = FRAME_DURATION_MS / 1000;
    const tl = gsap.timeline();

    // Each transition starts from a unique initial state
    const from: gsap.TweenVars = {};
    const to: gsap.TweenVars = {
      opacity: 1,
      scale: kb.scale,
      x: kb.x,
      y: kb.y,
      rotation: 0,
      filter: "contrast(1.1) saturate(0.7) brightness(0.72)",
      duration: dur,
      ease: "power1.inOut",
    };

    switch (currentFrame.transition) {
      case "zoom-burst":
        // Starts zoomed way in, punches outward
        Object.assign(from, {
          opacity: 0, scale: 1.35, x: "0%", y: "0%", rotation: 0,
          filter: "contrast(1.5) saturate(0) brightness(0.1)",
        });
        to.ease = "power3.out";
        break;

      case "slide-left":
        // Slides in from the right like a film strip
        Object.assign(from, {
          opacity: 0, scale: 1.02, x: "12%", y: "0%", rotation: 0,
          filter: "contrast(1.2) saturate(0) brightness(0.25)",
        });
        to.ease = "power2.inOut";
        break;

      case "tilt-rise":
        // Tilts up from below with slight rotation
        Object.assign(from, {
          opacity: 0, scale: 1.04, x: "0%", y: "8%", rotation: 1.5,
          filter: "contrast(1.3) saturate(0) brightness(0.2)",
        });
        to.ease = "power2.out";
        break;

      case "blur-reveal":
        // Starts heavily blurred, sharpens into focus
        Object.assign(from, {
          opacity: 0, scale: 1.08, x: "0%", y: "0%", rotation: 0,
          filter: "contrast(0.8) saturate(0) brightness(0.15) blur(18px)",
        });
        to.filter = "contrast(1.1) saturate(0.7) brightness(0.72) blur(0px)";
        to.ease = "power1.out";
        break;

      case "drift-up":
        // Floats up gently from darkness
        Object.assign(from, {
          opacity: 0, scale: 0.96, x: "-1%", y: "5%", rotation: -0.5,
          filter: "contrast(1.4) saturate(0) brightness(0.08)",
        });
        to.ease = "sine.inOut";
        break;

      case "slam-in":
        // Slams in fast from scaled up, hard landing
        Object.assign(from, {
          opacity: 0, scale: 1.2, x: "-6%", y: "-3%", rotation: -1,
          filter: "contrast(1.6) saturate(0) brightness(0.05)",
        });
        to.ease = "back.out(1.2)";
        break;
    }

    tl.fromTo(img, from, to);

    return () => {
      tl.progress(1);
      tl.kill();
    };
  }, [frameIndex, currentFrame]);

  /* ── Subtitle entrance ─────────────────────────────────────── */
  useLayoutEffect(() => {
    if (phase !== "cinematic") return;
    const el = subtitleRef.current;
    if (!el) return;

    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.3 },
    );

    return () => {
      tl.kill();
    };
  }, [frameIndex, phase]);

  /* ── Awaiting reveal animation ─────────────────────────────── */
  useLayoutEffect(() => {
    if (phase !== "awaiting") return;
    const el = containerRef.current;
    if (!el) return;

    const children = el.querySelectorAll(".cine-reveal");
    const tl = gsap.timeline();

    tl.fromTo(
      children,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.25, ease: "power3.out", delay: 0.4 },
    );

    return () => {
      tl.kill();
    };
  }, [phase]);

  /* ── Transition-out animation ────────────────────────────── */
  useLayoutEffect(() => {
    if (phase !== "transitioning") return;
    const loader = loaderRef.current;
    if (!loader) { setPhase("open"); return; }

    const topBar = loader.querySelector(".cine-letterbox-top") as HTMLElement;
    const bottomBar = loader.querySelector(".cine-letterbox-bottom") as HTMLElement;
    const content = loader.querySelectorAll(".cine-frame, .cine-awaiting, .cine-grain, .cine-vignette");

    const tl = gsap.timeline({
      onComplete: () => setPhase("open"),
    });

    // 1. Flash white briefly
    tl.to(loader, {
      backgroundColor: "rgb(255,255,255)",
      duration: 0.12,
      ease: "power4.in",
    });

    // 2. Back to black + fade out content
    tl.to(loader, {
      backgroundColor: "#000",
      duration: 0.3,
      ease: "power2.out",
    }, 0.12);

    tl.to(content, {
      opacity: 0,
      scale: 1.05,
      duration: 0.6,
      ease: "power2.in",
    }, 0.12);

    // 3. Letterbox bars expand to cover full screen
    tl.to([topBar, bottomBar], {
      height: "52vh",
      duration: 0.7,
      ease: "power3.inOut",
    }, 0.4);

    // 4. Entire loader slides up and fades
    tl.to(loader, {
      y: "-100%",
      opacity: 0,
      duration: 0.8,
      ease: "power3.inOut",
    }, 0.9);

    return () => { tl.kill(); };
  }, [phase]);

  /* ── Scroll reveal on home scene ─────────────────────────── */
  useLayoutEffect(() => {
    if (phase !== "open") return;
    const section = revealSectionRef.current;
    const pinWrap = revealPinRef.current;
    const content = revealContentRef.current;
    if (!section || !pinWrap || !content) return;

    const revealTween = gsap.fromTo(
      content,
      { opacity: 0, y: 130, scale: 0.96, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.05,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: HOME_REVEAL_SCROLL_END,
          scrub: 0.45,
          toggleActions: "play none none reverse",
        },
      },
    );

    const pinTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: HOME_REVEAL_SCROLL_END,
      pin: pinWrap,
      pinSpacing: true,
    });

    const backgroundTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: HOME_REVEAL_SCROLL_END,
        scrub: true,
      },
    });

    backgroundTimeline
      .to(".noir-layer-parallax", { yPercent: -6, scale: 1.02, ease: "none" }, 0)
      .to(".noir-layer-environment", { yPercent: -4, scale: 1.015, ease: "none" }, 0)
      .to(".noir-layer-lightning", { yPercent: -2, ease: "none" }, 0);

    ScrollTrigger.refresh();

    return () => {
      pinTrigger.kill();
      backgroundTimeline.scrollTrigger?.kill();
      backgroundTimeline.kill();
      revealTween.scrollTrigger?.kill();
      revealTween.kill();
    };
  }, [phase]);

  /* ── Home layers/audio only while Home section is visible ── */
  useLayoutEffect(() => {
    if (phase !== "open") return;
    const homeSection = revealSectionRef.current;
    if (!homeSection) return;

    const syncHomeLayersFromHomeVisibility = () => {
      const rect = homeSection.getBoundingClientRect();
      const isHomeVisible = rect.top < window.innerHeight && rect.bottom > 0;
      setIsHomeLayersActive(isHomeVisible);
    };

    syncHomeLayersFromHomeVisibility();

    const visibilityTrigger = ScrollTrigger.create({
      trigger: homeSection,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => setIsHomeLayersActive(true),
      onEnterBack: () => setIsHomeLayersActive(true),
      onLeave: () => setIsHomeLayersActive(false),
      onLeaveBack: () => setIsHomeLayersActive(false),
      onRefresh: syncHomeLayersFromHomeVisibility,
    });

    return () => {
      visibilityTrigger.kill();
      setIsHomeLayersActive(true);
    };
  }, [phase]);

  const handleSkip = useCallback(() => {
    setIsFadingToBlack(true);
    setTimeout(() => {
      setPhase("awaiting");
      setIsFadingToBlack(false);
    }, 400);
  }, []);

  const handleEnter = useCallback(() => {
    stopRain();
    setPhase("transitioning");
  }, [stopRain]);

  return (
    <>
      {shouldRunMainScene && (
        <Navbar
          isActive={shouldRunMainScene}
          isHomeSceneActive={isHomeLayersActive}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}
      <main className={`noir-stage ${shouldRunMainScene ? "noir-main-visible" : "noir-main-hidden"}`}>
        <audio
          ref={rainAudioRef}
          src="/rain.mp3"
          loop
          preload="auto"
          aria-hidden="true"
          style={{ display: "none" }}
        />

        {shouldRunMainScene && (
          <>
            <BackgroundAudio shouldPlay={shouldPlayHomeAudio} muted={isMuted} />
            <ParallaxSequence isActive={shouldRenderHomeLayers} />
            <EnvironmentCursorLayer isActive={shouldRenderHomeLayers} />
            <LightningLayer isActive={shouldRenderHomeLayers} />
          </>
        )}

        {isLoading && (
          <section ref={loaderRef} className="cine-loader" aria-label="Cinematic intro">
            {/* ── Animated letterbox bars ── */}
            <LetterboxBars isAwaiting={phase === "awaiting" || phase === "transitioning"} />

            {/* ── Film grain overlay ── */}
            <div className="cine-grain" />

            {/* ── Vignette ── */}
            <div className="cine-vignette" />

            {/* ── Fade-to-black curtain ── */}
            <div className={`cine-blackout ${isFadingToBlack ? "cine-blackout-active" : ""}`} />

            {/* ── Frame image ── */}
            <img
              key={currentFrame.src}
              ref={imageRef}
              src={currentFrame.src}
              alt=""
              className="cine-frame"
            />

            {/* ── Dystopian film treatment ── */}
            <div className="cine-film-flicker" aria-hidden="true" />
            <div className="cine-film-scratches" aria-hidden="true" />
            <div className="cine-film-haze" aria-hidden="true" />

            {/* ── Cinematic subtitle (typewriter) ── */}
            {phase === "cinematic" && (
              <p key={`sub-${frameIndex}`} ref={subtitleRef} className="cine-subtitle">
                {typedText}
                <span className="cine-cursor" />
              </p>
            )}

            {/* ── Skip button ── */}
            {phase === "cinematic" && (
              <button className="cine-skip" onClick={handleSkip} type="button">
                Skip Intro →
              </button>
            )}

            <button
              className="cine-mute"
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              aria-pressed={isMuted}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={16} strokeWidth={2.1} /> : <Volume2 size={16} strokeWidth={2.1} />}
            </button>

            {/* ── Awaiting / CTA ── */}
            {(phase === "awaiting" || phase === "transitioning") && (
              <div ref={containerRef} className="cine-awaiting">
                <h2 className="cine-reveal cine-tagline">
                  The city rewrites itself.<br />I write back.
                </h2>
                <p className="cine-reveal cine-tagline-sub">
                  In an AI dystopia, I build the skills that stay irreplaceable.
                </p>
                <button className="cine-reveal cine-enter" onClick={handleEnter} type="button">
                  <span className="cine-enter-glow" />
                  <span className="cine-enter-text">Enter the Story</span>
                </button>
              </div>
            )}
          </section>
        )}

        {phase === "open" && (
          <section
            ref={revealSectionRef}
            className="relative z-[35] min-h-[150vh] px-6 md:px-14"
          >
            <div ref={revealPinRef} className="flex min-h-screen w-full items-center justify-center">
              <div ref={revealContentRef} className="pointer-events-auto max-w-4xl opacity-0 text-center">
                <h1 className="relative inline-block text-5xl font-black uppercase tracking-[0.14em] md:text-8xl">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 translate-y-[2px] text-white/28 blur-[1.2px]"
                  >
                    Imran Pasha
                  </span>
                  <span className="bg-gradient-to-b from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
                    Imran Pasha
                  </span>
                </h1>
                <p className="mt-4 text-sm uppercase tracking-[0.32em] text-zinc-300/85 md:text-base">
                  Systems Engineer in the AI Era
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {PROFILE_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                      className="inline-flex items-center rounded-md border border-white/30 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-zinc-100 transition hover:border-white/55 hover:bg-white/10"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
