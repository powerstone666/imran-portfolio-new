"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { GiBat } from "react-icons/gi";

export default function CustomCursor() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorOutlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine if it's a touch device; if so, we disable the custom cursor globally
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      return;
    }

    const cursorDot = cursorDotRef.current;
    const cursorOutline = cursorOutlineRef.current;
    if (!cursorDot || !cursorOutline) return;

    // 1. Safely inject global cursor hiding styles EXACTLY ONCE on mount
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(styleEl);

    // Initial setup for GSAP values (opacity 0, scale 1) so it doesn't flicker on load
    gsap.set(cursorDot, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 1 });
    gsap.set(cursorOutline, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 1 });

    // 2. Use GSAP's quickTo for high-performance mapping mapped directly to the DOM
    const xDot = gsap.quickTo(cursorDot, "x", { duration: 0.02, ease: "power3" });
    const yDot = gsap.quickTo(cursorDot, "y", { duration: 0.02, ease: "power3" });
    const xOutline = gsap.quickTo(cursorOutline, "x", { duration: 0.15, ease: "power3" });
    const yOutline = gsap.quickTo(cursorOutline, "y", { duration: 0.15, ease: "power3" });

    let isVisible = false;

    // Movement tracking
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

    // Tracking leaving and entering window
    const onMouseLeaveDocument = () => {
      gsap.to([cursorDot, cursorOutline], { autoAlpha: 0, duration: 0.2 });
      isVisible = false;
    };
    
    const onMouseEnterDocument = () => {
      gsap.to([cursorDot, cursorOutline], { autoAlpha: 1, duration: 0.2 });
      isVisible = true;
    };

    let isHovering = false;

    // Tracking hover states without React re-renders interfering with the injected `<style>` tag
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Triggers scale-up if hovering over interactable elements
      const interactable = target.closest(
        "a, button, input, textarea, select, .noir-navbar-link, .cine-enter, .cine-skip"
      );
      
      if (interactable && !isHovering) {
        isHovering = true;
        // Enlarge and redden Bat
        gsap.to(cursorDot, { scale: 1.5, rotation: 15, duration: 0.2 });
        cursorDot.style.color = "#ef4444";
        cursorDot.style.filter = "drop-shadow(0 0 8px rgba(239,68,68,0.8))";
        
        // Enlarge Outline
        gsap.to(cursorOutline, { scale: 1.6, backgroundColor: "rgba(255,255,255,0.1)", duration: 0.2 });
      } else if (!interactable && isHovering) {
        isHovering = false;
        // Restore Bat
        gsap.to(cursorDot, { scale: 1, rotation: 0, duration: 0.2 });
        cursorDot.style.color = "#ffffff";
        cursorDot.style.filter = "none";
        
        // Restore Outline
        gsap.to(cursorOutline, { scale: 1, backgroundColor: "transparent", duration: 0.2 });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);
    document.documentElement.addEventListener("mouseleave", onMouseLeaveDocument);
    document.documentElement.addEventListener("mouseenter", onMouseEnterDocument);

    return () => {
      // 3. Clean up the injected global style and listeners exactly once on component unmount
      document.head.removeChild(styleEl);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      document.documentElement.removeEventListener("mouseleave", onMouseLeaveDocument);
      document.documentElement.removeEventListener("mouseenter", onMouseEnterDocument);
    };
  }, []);

  return (
    <>
      {/* Trailing Outline Ring */}
      <div
        ref={cursorOutlineRef}
        className="pointer-events-none fixed left-0 top-0 z-9998 hidden h-10 w-10 rounded-full border-[1.5px] border-white/40 mix-blend-exclusion sm:block"
      />
      
      {/* Center Precision Icon */}
      <div
        ref={cursorDotRef}
        className="pointer-events-none fixed left-0 top-0 z-9999 hidden mix-blend-exclusion sm:flex items-center justify-center text-white transition-shadow duration-200"
      >
        <GiBat size={24} />
      </div>
    </>
  );
}
