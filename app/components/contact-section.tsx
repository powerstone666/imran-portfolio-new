"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Loader2, CheckCircle, Send } from "lucide-react";
import { useDevicePerformance } from "../lib/use-device-performance";

gsap.registerPlugin(ScrollTrigger);

type SubmitStatus = "idle" | "submitting" | "success" | "error";

type ContactSectionProps = {
  isMuted?: boolean;
};

export default function ContactSection({ isMuted = false }: ContactSectionProps) {
  const { jitTier } = useDevicePerformance();
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        setStatus("success");
        form.reset();
        // Reset after 5 seconds
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  // Sync video mute state with global navbar audio control
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Video Intersection Logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let playCount = 0;
    let hasEnteredView = false;

    const startCycle = () => {
      playCount = 0;
      video.currentTime = 0;
      void video.play().catch(() => {
        // Autoplay may be blocked in some browsers until user gesture.
      });
    };

    const handleEnded = () => {
      playCount= 1;
      if (playCount < 1) {
        video.currentTime = 0;
        void video.play().catch(() => {});
        return;
      }
      video.pause();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (entry.isIntersecting) {
          if (!hasEnteredView) {
            hasEnteredView = true;
            startCycle();
          }
          return;
        }

        hasEnteredView = false;
        video.pause();
      },
      { threshold: 0.55 },
    );

    observer.observe(video);
    video.addEventListener("ended", handleEnded);

    return () => {
      observer.disconnect();
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  // GSAP Entry Animations
  useLayoutEffect(() => {
    if (jitTier === "slow") return;
    const section = sectionRef.current;
    const bg = bgRef.current;
    const textGroup = textRef.current;
    const formGroup = formRef.current;

    if (!section || !bg || !textGroup || !formGroup) return;

    const ctx = gsap.context(() => {
      // 1. Background Cinematic Fade + Scale
      gsap.fromTo(
        bg,
        { opacity: 0, scale: 1.05 },
        {
          opacity: 1,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 95%", // Start fading in as soon as it enters viewport
            end: "top 20%",
            scrub: 1,
          },
        }
      );

      // 2. Text Group & Video container slide up
      gsap.fromTo(
        textGroup.children,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%", // Starts a bit after the background
            end: "top 35%",
            scrub: 1.2,
          },
        }
      );

      // 3. Form Group slide up (slightly delayed after text)
      gsap.fromTo(
        formGroup,
        { opacity: 0, y: 70 },
        {
          opacity: 1,
          y: 0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 65%",
            end: "top 30%",
            scrub: 1.2,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [jitTier]);

  return (
    <section ref={sectionRef} id="contact" className="relative min-h-screen overflow-hidden border-t border-white/10">
      <div
        ref={bgRef}
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(4,5,8,0.84) 0%, rgba(5,6,10,0.62) 42%, rgba(4,5,8,0.84) 100%), url('/contact/contact-noir-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_82%_74%,rgba(140,170,220,0.12),transparent_35%)]" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-8 px-5 py-16 md:px-8 lg:grid-cols-2">
        <div ref={textRef}>
          <p className="text-xs uppercase tracking-[0.32em] text-zinc-300/85">Reach Out</p>
          <h2 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] md:text-6xl">
            <span className="bg-linear-to-b from-zinc-50 via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Contact
            </span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-200/88 md:text-base">
            Open to software engineering roles, AI systems collaboration, and security-focused builds.
            Send a message and I will get back to you.
          </p>

          <div className="mt-8 rounded-2xl border border-white/16 bg-black/35 p-4 backdrop-blur-md md:p-5">
            <video
              ref={videoRef}
              className="h-64 w-full rounded-xl object-cover md:h-90"
              src="/contact/Noir_Detective_s_AI_Developer_War.mp4"
              muted
              playsInline
              preload="metadata"
            />
          </div>
        </div>

        <div ref={formRef} className="rounded-2xl border border-white/16 bg-black/42 p-5 backdrop-blur-md md:p-8">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <CheckCircle size={48} className="text-emerald-400" strokeWidth={1.5} />
              <div>
                <p className="text-lg font-semibold text-white">Message Sent</p>
                <p className="mt-1 text-sm text-zinc-300/80">I will get back to you soon.</p>
              </div>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-2 rounded-md border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-300 transition hover:border-white/40 hover:text-white"
              >
                Send Another
              </button>
            </div>
          ) : (
            <form
              className="space-y-4"
              action="https://formspree.io/f/mgegrqwy"
              method="post"
              onSubmit={handleSubmit}
            >
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-300/90">
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  required
                  disabled={status === "submitting"}
                  className="w-full rounded-lg border border-white/18 bg-black/35 px-3 py-2.5 text-zinc-100 outline-none transition focus:border-white/45 disabled:opacity-50"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-300/90">
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  disabled={status === "submitting"}
                  className="w-full rounded-lg border border-white/18 bg-black/35 px-3 py-2.5 text-zinc-100 outline-none transition focus:border-white/45 disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="contact-subject" className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-300/90">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  required
                  disabled={status === "submitting"}
                  className="w-full rounded-lg border border-white/18 bg-black/35 px-3 py-2.5 text-zinc-100 outline-none transition focus:border-white/45 disabled:opacity-50"
                  placeholder="Project idea / Role"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-300/90">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  disabled={status === "submitting"}
                  className="w-full rounded-lg border border-white/18 bg-black/35 px-3 py-2.5 text-zinc-100 outline-none transition focus:border-white/45 disabled:opacity-50"
                  placeholder="Tell me about your project or opportunity"
                />
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex items-center gap-2 rounded-md border border-white/26 bg-white/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100 transition hover:border-white/60 hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Send Message
                  </>
                )}
              </button>

              {status === "error" && (
                <p className="text-xs text-red-400/90">
                  Something went wrong. Please try again or reach out directly via email.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
