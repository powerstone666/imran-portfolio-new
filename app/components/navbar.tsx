"use client";

import { useState } from "react";
import { Menu, Volume2, VolumeX, X } from "lucide-react";
import NavbarAura from "./navbar-aura";

const NAV_ITEMS = [
  { label: "Home", href: "#" },
  { label: "About", href: "#about" },
  { label: "Skill", href: "#skill" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

type NavbarProps = {
  isActive?: boolean;
  isMuted?: boolean;
  isHomeSceneActive?: boolean;
  onToggleMute?: () => void;
};

export default function Navbar({
  isActive = true,
  isMuted = false,
  isHomeSceneActive = true,
  onToggleMute,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="noir-layer-nav">
      <NavbarAura isActive={isActive} />
      <nav
        className={[
          "noir-navbar",
          isHomeSceneActive ? "noir-navbar--home" : "noir-navbar--solid",
        ].join(" ")}
        aria-label="Primary"
      >
        <div className="flex items-center justify-between gap-3">
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
            "noir-navbar-links mt-3 flex-col gap-2 md:mt-0 md:flex md:flex-row",
            isMenuOpen ? "flex" : "hidden md:flex",
          ].join(" ")}
        >
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <a
                className="noir-navbar-link"
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
