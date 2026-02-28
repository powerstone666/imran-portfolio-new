"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PROJECTS = [
  {
    title: "Prompt Doctor",
    subtitle: "MCP Middleware for Agentic AI",
    link: "https://github.com/powerstone666/prompt-doctor",
    points: [
      "Built an MCP server that intelligently rewrites and enhances user prompts before routing to agents, improving task execution quality without requiring prompt-engineering expertise.",
      "Designed a RAG architecture with privacy-first local embeddings and lexical repository search, making responses codebase-aware.",
      "Integrated Gitleaks into the enhancement flow to prevent accidental leakage of secrets during prompt processing.",
    ],
  },
  {
    title: "Env Scanner",
    subtitle: "24x7 GitHub Secret Exposure Monitor",
    link: "https://envscanner.vercel.app",
    points: [
      "Built a real-time scanner that continuously monitors global GitHub commits for exposed secrets and API keys.",
      "Engineered a high-concurrency regex detection pipeline across vendors (OpenAI, Gemini, DeepSeek, Qwen, and others) with real-time validation to reduce false positives.",
      "Implemented AI-based validation for database credentials and cloud config leaks at scale when direct checks were not feasible.",
      "Identified 500+ active API keys to date, showing measurable proactive security impact.",
    ],
  },
  {
    title: "Lume",
    subtitle: "Movie and TV Streaming  App",
    link: "https://github.com/powerstone666/project-lume",
    points: [
      "Built a modern React app (Vite + Material UI) powered by TMDB for trending, genre discovery, smart search, and personalized recommendations.",
      "Implemented multi-season episode navigation, custom player, fullscreen and cast support, with polished responsive UX across devices.",
      "Shipped PWA capabilities, dark glassmorphism aesthetics, smooth motion, lazy loading, code splitting, and smart caching for performance.",
    ],
  },
  {
    title: "MelodyMind",
    subtitle: "AI-Powered Music Streaming PWA",
    link: "https://github.com/powerstone666/MelodyMind",
    points: [
      "Developed a full-stack Music Streaming PWA with intelligent recommendations through AI and music streaming using JioSaavn, and Last.fm integrations.",
      "Added emotion-aware music using face-api.js for mood detection and adaptive recommendations.",
      "Built advanced playback features: queue controls, visualization, transitions, offline library management, and network-aware behavior.",
      "Enabled optional Firebase authentication for sync and personalization while preserving authentication-free offline listening.",
    ],
  },
] as const;

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const railViewportRef = useRef<HTMLDivElement>(null);
  const railTrackRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = railViewportRef.current;
    const track = railTrackRef.current;
    const title = titleRef.current;
    const bgContainer = bgRef.current;
    if (!section || !viewport || !track) return;

    const context = gsap.context(() => {
      // 1. Title & track entry transition when coming from Experience section
      if (title && track) {
        gsap.fromTo(
          [title, track],
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 95%", // Starts animating earlier
              end: "top 35%",
              scrub: 1.2,
            },
          }
        );
      }

      // 2. Background (River) cinematic fade-in transition
      if (bgContainer) {
        gsap.fromTo(
          bgContainer,
          { opacity: 0, scale: 1.05 },
          {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top 95%", // Right as it becomes visible below Experience
              end: "top 20%",
              scrub: 1,
            },
          }
        );
      }

      const getMaxShift = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

      gsap.set(track, { x: 0 });

      const trackScroll = gsap.to(track, {
        x: () => -getMaxShift(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getMaxShift()}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 3. Card scale effect as they scroll into center
      cardsRef.current.forEach((card) => {
        if (!card) return;

        // Animate the scale of the card based on its position in the viewport
        gsap.to(card, {
          scale: 1.05, // Slightly zoom in 
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: card,
            containerAnimation: trackScroll,
            start: "left center", // Start zooming when the left edge hits the center
            end: "center center", // Fully zoomed when the card center hits the center
            scrub: true,
          },
        });

        gsap.to(card, {
          scale: 1, // Return to normal scale
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: card,
            containerAnimation: trackScroll,
            start: "center center", // Start shrinking when the card center passes the center
            end: "right center", // Fully returned to normal when the right edge hits the center
            scrub: true,
          },
        });
      });

    }, section);

    ScrollTrigger.refresh();
    return () => context.revert();
  }, []);

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden border-t border-white/10"
    >
      <div
        ref={bgRef}
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(4,6,10,0.85) 0%, rgba(4,6,10,0.35) 15%, rgba(4,6,10,0.35) 85%, rgba(4,6,10,0.85) 100%), url('/projects/projects-map-main.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_24%,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_84%_76%,rgba(90,130,180,0.1),transparent_38%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-16 md:px-8">
        <div ref={titleRef} className="w-full text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-zinc-300/85">Case Board</p>
          <h2 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] md:text-6xl">
            <span className="bg-linear-to-b from-zinc-50 via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Projects
            </span>
          </h2>
        </div>

        <div className="mt-10">
          <div className="mb-3 text-center text-[11px] uppercase tracking-[0.22em] text-zinc-400/90">
            Scroll Sideways Through Cases
          </div>

          <div ref={railViewportRef} className="overflow-hidden pb-2">
            <div
              ref={railTrackRef}
              className="flex min-w-max items-start px-1 py-3 pr-4 md:pr-6 will-change-transform"
            >
              {PROJECTS.map((project, index) => (
                <div key={project.title} className="flex items-start">
                  <article
                    ref={(el) => {
                      cardsRef.current[index] = el;
                    }}
                    className="w-82.5 shrink-0 snap-start rounded-2xl border border-white/16 bg-black/42 p-5 backdrop-blur-md md:w-90 md:p-6 origin-center will-change-transform"
                  >
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400/90">Case File</p>
                    <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.06em] text-zinc-100 md:text-3xl">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-300/85">
                      {project.subtitle}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-200/90">
                      {project.points.map((point) => (
                        <li key={point}>- {point}</li>
                      ))}
                    </ul>
                    <a
                      href={project.link}
                      className="mt-5 inline-flex items-center rounded-md border border-white/25 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-100 transition hover:border-white/60 hover:bg-white/14"
                    >
                      Open Case File
                    </a>
                  </article>

                  {index < PROJECTS.length - 1 ? (
                    <div className="relative mx-2 mt-28 hidden h-8 w-24 shrink-0 md:block">
                      <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[repeating-linear-gradient(to_right,rgba(220,220,220,0.35)_0_10px,transparent_10px_16px)]" />
                      <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-red-200/55 bg-red-500/35 shadow-[0_0_10px_rgba(239,68,68,0.55)]" />
                      <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-red-200/55 bg-red-500/35 shadow-[0_0_10px_rgba(239,68,68,0.55)]" />
                    </div>
                  ) : null}
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
