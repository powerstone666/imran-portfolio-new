"use client";

const CURRENT_YEAR = new Date().getFullYear();

export default function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-[#04060a]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-center md:flex-row md:px-8 md:text-left">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
          © {CURRENT_YEAR} Imran Pasha. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-zinc-400">
          <a href="#" className="transition hover:text-zinc-200">Home</a>
          <a href="#projects" className="transition hover:text-zinc-200">Projects</a>
          <a href="#contact" className="transition hover:text-zinc-200">Contact</a>
        </div>
      </div>
    </footer>
  );
}
