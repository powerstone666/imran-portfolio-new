"use client";

import { useState } from "react";
import HomeExperience from "./components/home-experience";
import AboutSection from "./components/about-section";
import type { NarrationSegment } from "./components/about-section";
import SkillsSection from "./components/skills-section";
import ExperienceSection from "./components/experience-section";
import ProjectsSection from "./components/projects-section";
import ContactSection from "./components/contact-section";
import SiteFooter from "./components/site-footer";

const ABOUT_NARRATION_SEGMENTS: NarrationSegment[] = [
  { start: 0.0, end: 3.74, text: "The world is moving fast." },
  { start: 3.74, end: 6.34, text: "Systems are replacing processes." },
  { start: 6.34, end: 8.3, text: "Intelligence is becoming automated." },
  { start: 8.3, end: 10.74, text: "I choose not to compete with machines." },
  { start: 10.74, end: 13.02, text: "I choose to build alongside them." },
  { start: 13.02, end: 16.78, text: "I design systems that listen, validate and act." },
  { start: 16.78, end: 20.98, text: "From high concurrency security scanners to Loan Originating Systems." },
  { start: 20.98, end: 27.78, text: "I work where signals are noisy, where performance matters, and where automation replaces friction." },
  { start: 27.78, end: 29.82, text: "I am not just writing code." },
  { start: 29.82, end: 32.14, text: "I am engineering in the age of AI." },
  { start: 32.14, end: 34.46, text: "I am Imran Pasha." },
];

export default function Home() {
  const [isHomeOpen, setIsHomeOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <>
      <HomeExperience 
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onOpenChange={setIsHomeOpen} 
      />
      {isHomeOpen && (
        <>
          <AboutSection isMuted={isMuted} narrationSegments={ABOUT_NARRATION_SEGMENTS} />
          <SkillsSection />
          <ExperienceSection />
          <ProjectsSection />
          <ContactSection isMuted={isMuted} />
          <SiteFooter />
        </>
      )}
    </>
  );
}
