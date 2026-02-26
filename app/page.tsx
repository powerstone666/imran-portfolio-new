"use client";

import { useState } from "react";
import HomeExperience from "./components/home-experience";
import AboutSection from "./components/about-section";
import SkillsSection from "./components/skills-section";
import ExperienceSection from "./components/experience-section";

export default function Home() {
  const [isHomeOpen, setIsHomeOpen] = useState(false);

  return (
    <>
      <HomeExperience onOpenChange={setIsHomeOpen} />
      {isHomeOpen && (
        <>
          <AboutSection />
          <SkillsSection />
          <ExperienceSection />
        </>
      )}
    </>
  );
}
