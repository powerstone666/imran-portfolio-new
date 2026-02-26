"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { Briefcase, Shield, MapPin, Calendar } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Badge = {
  label: string;
  domain: string;
  logoUrl?: string;
  iconUrl?: string;
};

const ENGINEERING_COMPANY_BADGES: Badge[] = [
  { label: "Value AI Labs", domain: "valueailabs.ai", logoUrl: "/experience/value-ai-labs.png" },
  { label: "Next.js", domain: "nextjs.org" },
  { label: "TypeScript", domain: "typescriptlang.org" },
  { label: "Salesforce", domain: "salesforce.com" },
  { label: "Azure", domain: "azure.microsoft.com" },
  { label: "DocuSign", domain: "docusign.com", iconUrl: "https://icons.duckduckgo.com/ip3/docusign.com.ico" },
  { label: "Authorize.net", domain: "authorize.net" },
  { label: "Gemini", domain: "gemini.google.com" },
  { label: "GitHub", domain: "github.com" },
  { label: "Playwright", domain: "playwright.dev" },
  { label: "Jest", domain: "jestjs.io" },
  { label: "Codex", domain: "openai.com" },
  { label: "GSuite", domain: "workspace.google.com" },
];

const COMMUNITY_COMPANY_BADGES: Badge[] = [
  { label: "Security Boat", domain: "securityboat.in" },
  { label: "Kommunicate", domain: "kommunicate.io" },
];

function FaviconBadge({ label, domain, logoUrl, iconUrl }: Badge) {
  const imgSrc = logoUrl || iconUrl || `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  return (
    <span className={`inline-flex items-center rounded-full border border-white/20 bg-black/40 backdrop-blur ${logoUrl ? "px-2 py-0.5" : "gap-2 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-200/90"}`}>
      {logoUrl ? (
        <Image
          src={imgSrc}
          alt={`${label} icon`}
          width={80}
          height={24}
          className="h-8 w-auto object-cover"
          unoptimized
        />
      ) : (
        <Image
          src={imgSrc}
          alt={`${label} icon`}
          width={16}
          height={16}
          className="h-4 w-4 rounded-sm"
          unoptimized
        />
      )}
      {!logoUrl && label}
    </span>
  );
}

export default function ExperienceSection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const securityPanelRef = useRef<HTMLElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const securityTopLayerRef = useRef<HTMLDivElement>(null);
  const securityBaseLayerRef = useRef<HTMLDivElement>(null);
  const securityCardRef = useRef<HTMLDivElement>(null);
  const securityTagWrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = securityPanelRef.current;
    const topLayer = securityTopLayerRef.current;
    const baseLayer = securityBaseLayerRef.current;
    const card = securityCardRef.current;
    const tagWrapper = securityTagWrapperRef.current;
    if (!panel || !topLayer || !baseLayer || !card || !tagWrapper) return;

    const ctx = gsap.context(() => {
      const title = titleRef.current;
      const mm = gsap.matchMedia();

      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0, y: 50, filter: "blur(8px)" },
          {
            opacity: 1, y: 0, filter: "blur(0px)", ease: "none",
            scrollTrigger: { trigger: sectionRef.current, start: "top 80%", end: "top 50%", scrub: 0.6 },
          },
        );
      }

      mm.add("(min-width: 768px)", () => {
        const ROTATION_START = 0;
        gsap.set(topLayer, { rotate: 180, scale: 1.05, transformOrigin: "50% 50%" });
        gsap.set(baseLayer, { rotate: 180, scale: 1.05, opacity: 0, transformOrigin: "50% 50%" });
        gsap.set(card, { rotate: 180, transformOrigin: "50% 50%" });
        gsap.set(tagWrapper, { rotate: 180, transformOrigin: "50% 50%" });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            start: "bottom bottom",
            end: "+=165%",
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            onEnter: () => { baseLayer.style.opacity = ''; baseLayer.classList.add("experience-glitch-layer"); },
            onLeave: () => { baseLayer.classList.remove("experience-glitch-layer"); baseLayer.style.opacity = '0'; },
            onEnterBack: () => { baseLayer.style.opacity = ''; baseLayer.classList.add("experience-glitch-layer"); },
            onLeaveBack: () => { baseLayer.classList.remove("experience-glitch-layer"); baseLayer.style.opacity = '0'; },
          },
        });

        tl.to({}, { duration: ROTATION_START })
          .set(topLayer, { opacity: 1 }, 0)
          .to(topLayer, { rotate: 0, scale: 1, ease: "none", duration: 1.2 }, ROTATION_START)
          .to(card, { rotate: 0, xPercent: -42, ease: "none", duration: 1.2 }, ROTATION_START + 0.1)
          .to(tagWrapper, { rotate: 0, ease: "none", duration: 1.2 }, ROTATION_START);
      });

      mm.add("(max-width: 767px)", () => {
        const ROTATION_START = 0;
        gsap.set(topLayer, { rotate: 180, scale: 1.04, transformOrigin: "50% 50%" });
        gsap.set(baseLayer, { rotate: 180, scale: 1.04, opacity: 0, transformOrigin: "50% 50%" });
        gsap.set(card, { rotate: 180, transformOrigin: "50% 50%" });
        gsap.set(tagWrapper, { rotate: 180, transformOrigin: "50% 50%" });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            start: "bottom bottom",
            end: "+=140%",
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            onEnter: () => { baseLayer.style.opacity = ''; baseLayer.classList.add("experience-glitch-layer"); },
            onLeave: () => { baseLayer.classList.remove("experience-glitch-layer"); baseLayer.style.opacity = '0'; },
            onEnterBack: () => { baseLayer.style.opacity = ''; baseLayer.classList.add("experience-glitch-layer"); },
            onLeaveBack: () => { baseLayer.classList.remove("experience-glitch-layer"); baseLayer.style.opacity = '0'; },
          },
        });

        tl.to({}, { duration: ROTATION_START })
          .set(topLayer, { opacity: 1 }, 0)
          .to(topLayer, { rotate: 0, scale: 1, ease: "none", duration: 1.1 }, ROTATION_START)
          .to(card, { rotate: 0, xPercent: -8, ease: "none", duration: 1.05 }, ROTATION_START + 0.08)
          .to(tagWrapper, { rotate: 0, ease: "none", duration: 1.1 }, ROTATION_START);
      });

      return () => mm.revert();
    }, panel);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="experience" className="relative z-45 border-t border-white/10 bg-[#050608]">
      <article className="relative min-h-screen overflow-hidden border-b border-white/10">
          <Image
          src="/experience/experience-engineer-noir-blue.png"
          alt="Engineer noir persona"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.12),transparent_38%),linear-gradient(110deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.58)_48%,rgba(0,0,0,0.76)_100%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-16 md:px-8">
          <div ref={titleRef} className="mb-12 w-full max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400/90">Career</p>
            <h2 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] md:text-6xl">
              <span className="bg-linear-to-b from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent drop-shadow-md">
                Experience
              </span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400/80">
              Building systems, leading teams, and scaling products in the AI era.
            </p>
          </div>

          <div className="max-w-3xl space-y-5 rounded-2xl border border-white/14 bg-black/38 p-5 backdrop-blur-md md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-200">
                <Briefcase size={14} />
                Software Engineer
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-300">
                Value AI Labs
              </span>
            </div>

            <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-zinc-100 md:text-5xl">
              Value AI Labs
            </h2>

            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-zinc-300/90">
              <span className="inline-flex items-center gap-2">
                <Calendar size={13} />
                Aug 2025 - Present
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={13} />
                Bengaluru, KA
              </span>
            </div>

            <ul className="space-y-3 text-sm leading-relaxed text-zinc-200/92 md:text-base">
              <li>
                Led end-to-end development of a Loan Origination System (LOS) for a major US-based private lender,
                transforming operations from offline to fully digital.
              </li>
              <li>
                Automated the complete loan lifecycle from borrower onboarding to loan approval, eliminating manual processes,
                improving processing efficiency, and accelerating loan approvals.
              </li>
              <li>
                Architected the full application flow including RBAC, centralized permission guard, and 7+ role-based workflow orchestration;
                implemented in-app caching reducing response time from 5s to 100ms, integrated admin panel, and built comprehensive backend and UI automation test suites.
              </li>
              <li>
                Integrated critical third-party services including Authorize.net (Visa) payment gateway, DocuSign embedded eSignature SDK,
                and automated third-party report handling.
              </li>
              <li>
                Built a smart AI-powered contract viewer for a law firm using Azure OCR for text extraction, regex-based page classification,
                and Gemini AI for signature detection and specimen-based signature matching.
              </li>
            </ul>

            <div className="flex flex-wrap gap-2 pt-1">
              {ENGINEERING_COMPANY_BADGES.map((badge) => (
                <FaviconBadge key={badge.label} {...badge} />
              ))}
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-6 right-3 select-none text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200/85 [writing-mode:vertical-rl]"
          style={{ transform: "rotate(180deg)" }}
        >
          Software Engineer
        </div>
      </article>

      <article ref={securityPanelRef} className="relative min-h-screen overflow-hidden">
        <div ref={securityBaseLayerRef} className="absolute inset-0">
          {/* Stretched fill layer */}
          <Image
            src="/experience/experience-engineer-noir-blue.png"
            alt=""
            fill
            className="object-cover"
            style={{
              filter: "brightness(0.7) contrast(1.12)",
              transform: "scale(1.05)",
            }}
            sizes="100vw"
            priority
          />
          {/* Full image layer */}
          <Image
            src="/experience/experience-engineer-noir-blue.png"
            alt="Engineer inversion layer"
            fill
            className="object-contain"
            style={{
              filter: "brightness(0.95) contrast(1.12)",
            }}
            sizes="100vw"
            priority
          />
        </div>
        <div ref={securityTopLayerRef} className="absolute inset-0">
          {/* Stretched fill layer */}
          <Image
            src="/experience/experience-security-noir-clean.png"
            alt=""
            fill
            className="object-cover"
            style={{
              filter: "brightness(0.6)",
              transform: "scale(1.05)",
            }}
            sizes="100vw"
            priority
          />
          {/* Full image layer */}
          <Image
            src="/experience/experience-security-noir-clean.png"
            alt="Security noir persona"
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(112deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.78)_100%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-end px-4 py-16 md:px-8">
          <div
            ref={securityCardRef}
            className="max-w-3xl space-y-5 rounded-2xl border border-red-300/22 bg-black/44 p-5 backdrop-blur-md md:p-8"
            style={{ transform: "rotate(180deg)" }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-red-100">
                <Shield size={14} />
                Community Volunteer
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-300">
                Security Boat
              </span>
            </div>

            <h3 className="text-3xl font-black uppercase tracking-[0.08em] text-zinc-100 md:text-5xl">
              Cybersecurity Experience
            </h3>

            <p className="text-sm leading-relaxed text-zinc-200/92 md:text-base">
              Conducted cybersecurity workshops and meetups across multiple companies, educating students and working professionals
              on security best practices and real-world threat scenarios.
            </p>
            <p className="text-sm leading-relaxed text-zinc-200/92 md:text-base">
              Led community initiatives including publishing security-focused blogs on Slack, organizing and moderating quizzes,
              delivering talks, and coordinating end-to-end event operations and Hall of Fame  at{" "}
              <a
                href="https://www.kommunicate.io/hall-of-fame"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-100 underline decoration-zinc-300/50 underline-offset-4"
              >
                kommunicate.io/hall-of-fame
              </a>
              .
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {COMMUNITY_COMPANY_BADGES.map((badge) => (
                <FaviconBadge key={badge.label} {...badge} />
              ))}
            </div>
          </div>
        </div>

        <div ref={securityTagWrapperRef} className="pointer-events-none absolute inset-0">
          <div
            aria-hidden="true"
            className="absolute bottom-6 right-3 select-none text-[11px] font-semibold uppercase tracking-[0.22em] text-red-200/85 [writing-mode:vertical-rl]"
            style={{ transform: "rotate(180deg)" }}
          >
            Cybersecurity
          </div>
        </div>
      </article>
    </section>
  );
}
