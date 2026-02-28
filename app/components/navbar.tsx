"use client";

import { useEffect, useState } from "react";
import { Menu, Volume2, VolumeX, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "#" },
  { label: "About", href: "#about" },
  { label: "Skill", href: "#skill" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

type NavbarProps = {
  isMuted?: boolean;
  isHomeSceneActive?: boolean;
  onToggleMute?: () => void;
};

export default function Navbar({
  isMuted = false,
  isHomeSceneActive = true,
  onToggleMute,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("#");

  useEffect(() => {
    const handleScroll = () => {
      let currentSection = "#";
      
      for (const item of NAV_ITEMS) {
        if (item.href === "#") continue;
        const sectionEl = document.getElementById(item.href.substring(1));
        if (sectionEl) {
          const rect = sectionEl.getBoundingClientRect();
          // Assume section is active if it occupies the top ~40% of the screen
          if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.3) {
            currentSection = item.href;
          }
        }
      }

      console.log("Current active section:", currentSection);
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // setTimeout to ensure layout has occurred for newly mounted sections
    const timeoutId = setTimeout(handleScroll, 200);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleResize = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="noir-layer-nav">
      <nav
        className={[
          "noir-navbar",
          "w-full flex-col md:flex-row",
          isHomeSceneActive ? "noir-navbar--home" : "noir-navbar--solid",
        ].join(" ")}
        aria-label="Primary"
      >
        <div className="flex w-full md:w-auto items-center justify-between gap-3">
          <a className="noir-navbar-brand" href="#" onClick={closeMenu}>
            IMRAN PASHA
          </a>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              className="noir-navbar-mute"
              onClick={onToggleMute}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              aria-pressed={isMuted}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={15} strokeWidth={2.1} /> : <Volume2 size={15} strokeWidth={2.1} />}
            </button>

            <button
              type="button"
              className="noir-navbar-mute"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="noir-navbar-links"
            >
              {isMenuOpen ? <X size={18} strokeWidth={2.2} /> : <Menu size={18} strokeWidth={2.2} />}
            </button>
          </div>
        </div>

        <ul
          id="noir-navbar-links"
          className={[
            "noir-navbar-links mt-3 flex-col gap-2 md:mt-0 md:flex-row",
            isMenuOpen ? "flex!" : "hidden! md:inline-flex!",
          ].join(" ")}
        >
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <a
                className={`noir-navbar-link ${activeSection === item.href ? "active" : ""}`}
                href={item.href}
                onClick={closeMenu}
              >
                {item.label}
              </a>
            </li>
          ))}
          <li className="hidden md:block">
            <button
              type="button"
              className="noir-navbar-mute"
              onClick={onToggleMute}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              aria-pressed={isMuted}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={15} strokeWidth={2.1} /> : <Volume2 size={15} strokeWidth={2.1} />}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
