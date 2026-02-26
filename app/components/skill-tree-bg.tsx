"use client";

import { useEffect, useRef } from "react";

/**
 * Yggdrasil-style SVG world tree background.
 * Elegant, symmetrical, subtle — inspired by Loki's tree / Moana's tattoo art.
 * Uses SVG instead of Three.js for cleaner ornamental lines.
 * Scroll-driven opacity via IntersectionObserver.
 */
export default function SkillTreeBg() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Animate paths with scroll
    const paths = svg.querySelectorAll<SVGPathElement>(".tree-path");
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = svg.getBoundingClientRect();
        const vh = window.innerHeight;
        // Drive reveal over a larger window so the drawing starts near heading and
        // continues down the section instead of completing too early at the top.
        const revealStart = vh * 0.9;
        const revealEnd = -rect.height * 0.25;
        const progress = Math.max(0, Math.min(1, (revealStart - rect.top) / (revealStart - revealEnd)));

        paths.forEach((path, idx) => {
          const length = path.getTotalLength();
          const delay = idx * 0.03;
          const p = Math.max(0, Math.min(1, (progress - delay) / 0.7));
          path.style.strokeDashoffset = `${length * (1 - p)}`;
          path.style.opacity = `${Math.min(1, p * 1.5)}`;
        });

        // Subtle drift so the background feels alive instead of static.
        const yShift = 10 - progress * 26;
        svg.style.transform = `translate(-50%, ${yShift}px)`;

        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const trunkColor = "rgba(160,175,200,0.35)";
  const branchColor = "rgba(160,175,200,0.25)";
  const rootColor = "rgba(140,155,180,0.22)";
  const leafColor = "rgba(170,185,210,0.18)";

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1200"
        fill="none"
        className="absolute left-1/2 top-0 h-full w-auto min-w-full -translate-x-1/2"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ═══ Roots ═══ */}
        {/* Center root */}
        <path className="tree-path" d="M500 1200 Q500 1050 500 950 Q498 880 500 800" stroke={rootColor} strokeWidth="8" strokeLinecap="round" />
        {/* Left root curves */}
        <path className="tree-path" d="M500 1100 Q460 1050 380 1020 Q300 1000 220 1040 Q160 1070 120 1150" stroke={rootColor} strokeWidth="5" strokeLinecap="round" />
        <path className="tree-path" d="M500 1080 Q470 1030 420 1000 Q350 970 280 990 Q200 1020 160 1080" stroke={rootColor} strokeWidth="3" strokeLinecap="round" />
        <path className="tree-path" d="M460 1060 Q420 1090 340 1120 Q280 1140 200 1200" stroke={rootColor} strokeWidth="2.5" strokeLinecap="round" />
        {/* Right root curves */}
        <path className="tree-path" d="M500 1100 Q540 1050 620 1020 Q700 1000 780 1040 Q840 1070 880 1150" stroke={rootColor} strokeWidth="5" strokeLinecap="round" />
        <path className="tree-path" d="M500 1080 Q530 1030 580 1000 Q650 970 720 990 Q800 1020 840 1080" stroke={rootColor} strokeWidth="3" strokeLinecap="round" />
        <path className="tree-path" d="M540 1060 Q580 1090 660 1120 Q720 1140 800 1200" stroke={rootColor} strokeWidth="2.5" strokeLinecap="round" />

        {/* ═══ Trunk ═══ */}
        <path className="tree-path" d="M500 800 Q498 700 500 600 Q502 500 500 400" stroke={trunkColor} strokeWidth="10" strokeLinecap="round" />
        {/* Trunk texture lines */}
        <path className="tree-path" d="M494 780 Q492 680 494 580 Q490 500 492 420" stroke={trunkColor} strokeWidth="2" strokeLinecap="round" />
        <path className="tree-path" d="M506 780 Q508 680 506 580 Q510 500 508 420" stroke={trunkColor} strokeWidth="2" strokeLinecap="round" />

        {/* ═══ Main branches — left ═══ */}
        <path className="tree-path" d="M500 500 Q460 460 400 420 Q330 380 260 360 Q200 350 140 370" stroke={branchColor} strokeWidth="6" strokeLinecap="round" />
        <path className="tree-path" d="M500 450 Q440 400 360 350 Q280 310 200 280 Q140 260 80 270" stroke={branchColor} strokeWidth="5" strokeLinecap="round" />
        <path className="tree-path" d="M500 400 Q450 350 380 290 Q320 240 240 200 Q180 170 100 160" stroke={branchColor} strokeWidth="4" strokeLinecap="round" />
        <path className="tree-path" d="M500 350 Q460 300 400 240 Q350 190 280 140 Q220 100 140 80" stroke={branchColor} strokeWidth="3.5" strokeLinecap="round" />

        {/* ═══ Main branches — right ═══ */}
        <path className="tree-path" d="M500 500 Q540 460 600 420 Q670 380 740 360 Q800 350 860 370" stroke={branchColor} strokeWidth="6" strokeLinecap="round" />
        <path className="tree-path" d="M500 450 Q560 400 640 350 Q720 310 800 280 Q860 260 920 270" stroke={branchColor} strokeWidth="5" strokeLinecap="round" />
        <path className="tree-path" d="M500 400 Q550 350 620 290 Q680 240 760 200 Q820 170 900 160" stroke={branchColor} strokeWidth="4" strokeLinecap="round" />
        <path className="tree-path" d="M500 350 Q540 300 600 240 Q650 190 720 140 Q780 100 860 80" stroke={branchColor} strokeWidth="3.5" strokeLinecap="round" />

        {/* ═══ Crown / canopy swirls ═══ */}
        {/* Left ornamental swirls */}
        <path className="tree-path" d="M260 360 Q220 330 200 280 Q190 240 220 210 Q250 190 280 220 Q300 250 280 280" stroke={leafColor} strokeWidth="2.5" strokeLinecap="round" />
        <path className="tree-path" d="M200 280 Q160 260 130 220 Q110 180 140 150 Q170 130 200 160 Q220 190 200 220" stroke={leafColor} strokeWidth="2" strokeLinecap="round" />
        <path className="tree-path" d="M140 370 Q100 350 70 310 Q50 270 80 240 Q110 220 140 260" stroke={leafColor} strokeWidth="2" strokeLinecap="round" />
        <path className="tree-path" d="M140 80 Q110 50 100 20 Q95 -10 120 -20 Q150 -10 150 30 Q145 60 120 70" stroke={leafColor} strokeWidth="2" strokeLinecap="round" />
        <path className="tree-path" d="M240 200 Q200 160 180 120 Q170 80 200 60 Q230 50 240 90 Q245 130 230 160" stroke={leafColor} strokeWidth="2" strokeLinecap="round" />

        {/* Right ornamental swirls */}
        <path className="tree-path" d="M740 360 Q780 330 800 280 Q810 240 780 210 Q750 190 720 220 Q700 250 720 280" stroke={leafColor} strokeWidth="2.5" strokeLinecap="round" />
        <path className="tree-path" d="M800 280 Q840 260 870 220 Q890 180 860 150 Q830 130 800 160 Q780 190 800 220" stroke={leafColor} strokeWidth="2" strokeLinecap="round" />
        <path className="tree-path" d="M860 370 Q900 350 930 310 Q950 270 920 240 Q890 220 860 260" stroke={leafColor} strokeWidth="2" strokeLinecap="round" />
        <path className="tree-path" d="M860 80 Q890 50 900 20 Q905 -10 880 -20 Q850 -10 850 30 Q855 60 880 70" stroke={leafColor} strokeWidth="2" strokeLinecap="round" />
        <path className="tree-path" d="M760 200 Q800 160 820 120 Q830 80 800 60 Q770 50 760 90 Q755 130 770 160" stroke={leafColor} strokeWidth="2" strokeLinecap="round" />

        {/* ═══ Top crown arc ═══ */}
        <path className="tree-path" d="M280 140 Q340 60 420 20 Q500 0 580 20 Q660 60 720 140" stroke={branchColor} strokeWidth="3" strokeLinecap="round" />
        <path className="tree-path" d="M200 200 Q300 100 400 50 Q500 30 600 50 Q700 100 800 200" stroke={leafColor} strokeWidth="2" strokeLinecap="round" />

        {/* ═══ Center ornament (knot at trunk split) ═══ */}
        <circle cx="500" cy="500" r="14" stroke={trunkColor} strokeWidth="2.5" fill="none" className="tree-path" />
        <circle cx="500" cy="500" r="8" stroke={trunkColor} strokeWidth="1.5" fill="none" className="tree-path" />
        <circle cx="500" cy="400" r="6" stroke={branchColor} strokeWidth="1.5" fill="none" className="tree-path" />
      </svg>
    </div>
  );
}
