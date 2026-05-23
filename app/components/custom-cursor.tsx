"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { GiBat } from "react-icons/gi";
import { useDevicePerformance } from "../lib/use-device-performance";

export default function CustomCursor() {
  const { jitTier } = useDevicePerformance();
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorOutlineRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device on mount
    if (typeof window !== "undefined") {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);

  useEffect(() => {
    if (jitTier === "slow") return;
    if (isTouchDevice) return;

    const cursorDot = cursorDotRef.current;
    const cursorOutline = cursorOutlineRef.current;
    if (!cursorDot || !cursorOutline) return;

    const styleEl = document.createElement("style");
    styleEl.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(styleEl);

    gsap.set(cursorDot, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 1 });
    gsap.set(cursorOutline, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 1 });

    const xDot = gsap.quickTo(cursorDot, "x", { duration: 0.02, ease: "power3" });
    const yDot = gsap.quickTo(cursorDot, "y", { duration: 0.02, ease: "power3" });
    const xOutline = gsap.quickTo(cursorOutline, "x", { duration: 0.15, ease: "power3" });
    const yOutline = gsap.quickTo(cursorOutline, "y", { duration: 0.15, ease: "power3" });

    let isVisible = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) {
        gsap.to([cursorDot, cursorOutline], { autoAlpha: 1, duration: 0.2 });
        isVisible = true;
      }
      xDot(e.clientX);
      yDot(e.clientY);
      xOutline(e.clientX);
      yOutline(e.clientY);
    };

    const onMouseLeaveDocument = () => {
      gsap.to([cursorDot, cursorOutline], { autoAlpha: 0, duration: 0.2 });
      isVisible = false;
    };

    const onMouseEnterDocument = () => {
      gsap.to([cursorDot, cursorOutline], { autoAlpha: 1, duration: 0.2 });
      isVisible = true;
    };

    let isHovering = false;

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactable = target.closest(
        "a, button, input, textarea, select, .noir-navbar-link, .cine-enter, .cine-skip"
      );

      if (interactable && !isHovering) {
        isHovering = true;
        gsap.to(cursorDot, { scale: 1.5, rotation: 15, duration: 0.2 });
        cursorDot.style.color = "#ef4444";
        cursorDot.style.filter = "drop-shadow(0 0 8px rgba(239,68,68,0.8))";
        gsap.to(cursorOutline, { scale: 1.6, backgroundColor: "rgba(255,255,255,0.1)", duration: 0.2 });
      } else if (!interactable && isHovering) {
        isHovering = false;
        gsap.to(cursorDot, { scale: 1, rotation: 0, duration: 0.2 });
        cursorDot.style.color = "#ffffff";
        cursorDot.style.filter = "none";
        gsap.to(cursorOutline, { scale: 1, backgroundColor: "transparent", duration: 0.2 });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);
    document.documentElement.addEventListener("mouseleave", onMouseLeaveDocument);
    document.documentElement.addEventListener("mouseenter", onMouseEnterDocument);

    return () => {
      document.head.removeChild(styleEl);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      document.documentElement.removeEventListener("mouseleave", onMouseLeaveDocument);
      document.documentElement.removeEventListener("mouseenter", onMouseEnterDocument);
    };
  }, [jitTier, isTouchDevice]);

  // Don't render cursor elements on touch devices
  if (isTouchDevice) return null;

  return (
    <>
      <div
        ref={cursorOutlineRef}
        className="pointer-events-none fixed left-0 top-0 z-[9998] hidden h-10 w-10 rounded-full border-[1.5px] border-white/40 mix-blend-exclusion sm:block"
      />
      <div
        ref={cursorDotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden items-center justify-center text-white mix-blend-exclusion sm:flex"
      >
        <GiBat size={24} />
      </div>
    </>
  );
}
