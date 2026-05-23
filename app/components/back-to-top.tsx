"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past ~80vh
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`
        fixed bottom-6 left-6 z-[9998]
        flex h-10 w-10 items-center justify-center
        rounded-full border border-white/20
        bg-black/60 text-white/80 backdrop-blur-md
        transition-all duration-500 ease-out
        hover:border-white/40 hover:bg-black/80 hover:text-white
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
        md:bottom-8 md:left-auto md:right-8 md:h-12 md:w-12
        ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}
      `}
    >
      <ArrowUp size={18} strokeWidth={2} className="md:h-5 md:w-5" />
    </button>
  );
}
