"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ThreeNoirBg from "./three-noir-bg";

import {
  SiJavascript,
  SiTypescript,
  SiPostgresql,
  SiMysql,
  SiMongodb,
  SiAmazonwebservices,
  SiSalesforce,
  SiGithubactions,
  SiLangchain,
  SiOnnx,
  SiJest,
  SiGit,
  SiGithub,
  SiGooglecloud,
  SiNextdotjs,
  SiFastify,
  SiExpress,
  SiNodedotjs,
  SiReact,
  SiHtml5,
  SiCss3,
  SiGithubcopilot,
  SiOpenai,
  SiDocker
} from "react-icons/si";
import {
  FaJava,
  FaDatabase,
  FaShieldAlt,
  FaRobot,
  FaBrain,
  FaClipboardList,
  FaVial,
  FaServer,
  FaCloud,
  FaTheaterMasks,
} from "react-icons/fa";

gsap.registerPlugin(ScrollTrigger);

const I = 17; // icon size

/* ── Tree data ───────────────────────────────────────────── */
type Skill = { name: string; icon: ReactNode };
type Branch = { label: string; color: string; items: Skill[] };

const LANGUAGES: Skill[] = [
  { name: "Java", icon: <FaJava size={I} /> },
  { name: "TypeScript", icon: <SiTypescript size={I} /> },
  { name: "JavaScript", icon: <SiJavascript size={I} /> },
  { name: "SQL", icon: <FaDatabase size={I} /> },
];

const LEFT_BRANCHES: Branch[] = [
  {
    label: "Frontend",
    color: "rgb(180 220 255)",
    items: [
      { name: "React", icon: <SiReact size={I} /> },
      { name: "Next.js", icon: <SiNextdotjs size={I} /> },
      { name: "HTML5", icon: <SiHtml5 size={I} /> },
      { name: "CSS3", icon: <SiCss3 size={I} /> },
    ],
  },
  {
    label: "Backend",
    color: "rgb(180 220 200)",
    items: [
      { name: "Node.js", icon: <SiNodedotjs size={I} /> },
      { name: "Express.js", icon: <SiExpress size={I} /> },
      { name: "Fastify", icon: <SiFastify size={I} /> },
    ],
  },
  {
    label: "AI & LLM",
    color: "rgb(180 255 240)",
    items: [
      { name: "RAG Pipelines", icon: <FaBrain size={I} /> },
      { name: "MCP Servers", icon: <FaServer size={I} /> },
      { name: "LangChain", icon: <SiLangchain size={I} /> },
      { name: "ADK", icon: <FaRobot size={I} /> },
      { name: "ONNX Runtime", icon: <SiOnnx size={I} /> },
    ],
  },
];

const RIGHT_BRANCHES: Branch[] = [
  {
    label: "Databases",
    color: "rgb(255 210 170)",
    items: [
      { name: "PostgreSQL", icon: <SiPostgresql size={I} /> },
      { name: "MySQL", icon: <SiMysql size={I} /> },
      { name: "MongoDB", icon: <SiMongodb size={I} /> },
    ],
  },
  {
    label: "Cloud & DevOps",
    color: "rgb(200 180 255)",
    items: [
      { name: "AWS", icon: <SiAmazonwebservices size={I} /> },
      { name: "Azure", icon: <FaCloud size={I} /> },
      { name: "Salesforce", icon: <SiSalesforce size={I} /> },
      { name: "GitHub Actions", icon: <SiGithubactions size={I} /> },
      {name:"Docker",icon: <SiDocker size={I} />}
    ],
  },
  {
    label: "Security & Testing",
    color: "rgb(255 200 200)",
    items: [
      { name: "RBAC", icon: <FaShieldAlt size={I} /> },
      { name: "Strix-AI", icon: <FaRobot size={I} /> },
      { name: "Playwright", icon: <FaTheaterMasks size={I} /> },
      { name: "Jest", icon: <SiJest size={I} /> },
      { name: "Manual Testing", icon: <FaVial size={I} /> },
    ],
  },
];

const TOOLS: Skill[] = [
  { name: "Git", icon: <SiGit size={I} /> },
  { name: "GitHub", icon: <SiGithub size={I} /> },
  { name: "G-Suite", icon: <SiGooglecloud size={I} /> },
  { name: "Backlog Mgmt", icon: <FaClipboardList size={I} /> },
  { name: "Codex", icon: <SiOpenai size={I} /> },
  { name: "GitHub Copilot", icon: <SiGithubcopilot size={I} /> },
];

/* ── Reusable node ──────────────────────────────────────── */
function SkillNode({ skill, color }: { skill: Skill; color: string }) {
  return (
    <div className="skill-tree-node group flex flex-col items-center gap-1.5">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
        style={{
          color,
          borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
          boxShadow: `0 0 18px color-mix(in srgb, ${color} 20%, transparent)`,
        }}
      >
        {skill.icon}
      </div>
      <span
        className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider"
        style={{ color }}
      >
        {skill.name}
      </span>
    </div>
  );
}

/* ── Branch group ───────────────────────────────────────── */
function BranchGroup({ branch }: { branch: Branch }) {
  return (
    <div className="skill-tree-branch flex flex-col items-center gap-3">
      <span
        className="text-sm font-bold uppercase tracking-widest"
        style={{ color: branch.color }}
      >
        {branch.label}
      </span>
      {/* Vertical connector */}
      <div
        className="tree-glow tree-connector h-5 w-0.5 rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${branch.color} 30%, transparent)` }}
      />
      <div className="flex flex-wrap items-start justify-center gap-4">
        {branch.items.map((s) => (
          <SkillNode key={s.name} skill={s} color={branch.color} />
        ))}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */
export default function SkillsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const tree = treeRef.current;
    const title = titleRef.current;
    if (!section || !tree || !title) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        title,
        { opacity: 0, y: 50, filter: "blur(8px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)", ease: "none",
          scrollTrigger: { trigger: section, start: "top 82%", end: "top 50%", scrub: 0.6 },
        },
      );

      const nodes = tree.querySelectorAll(".skill-tree-node");
      gsap.fromTo(
        nodes,
        { opacity: 0, y: 30, scale: 0.8 },
        {
          opacity: 1, y: 0, scale: 1, ease: "none", stagger: 0.02,
          scrollTrigger: { trigger: tree, start: "top 85%", end: "top 40%", scrub: 0.6 },
        },
      );

      const branches = tree.querySelectorAll(".skill-tree-branch");
      gsap.fromTo(
        branches,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, ease: "none", stagger: 0.04,
          scrollTrigger: { trigger: tree, start: "top 80%", end: "top 35%", scrub: 0.6 },
        },
      );

      const connectors = tree.querySelectorAll(".tree-connector");
      gsap.fromTo(
        connectors,
        { scaleY: 0 },
        {
          scaleY: 1, ease: "none", stagger: 0.03,
          scrollTrigger: { trigger: tree, start: "top 80%", end: "top 45%", scrub: 0.6 },
        },
      );

      // Flowing glow animation — energy pulse flows top → bottom
      const allFlowEls = Array.from(tree.querySelectorAll(".tree-glow, .skill-tree-node"));
      if (allFlowEls.length) {
        // Evaluate vertical positions to sort them by row
        const elsWithTop = allFlowEls.map((el) => ({
          el,
          top: el.getBoundingClientRect().top,
        }));
        elsWithTop.sort((a, b) => a.top - b.top);

        // Group elements that are roughly on the same horizontal line
        const groups: Element[][] = [];
        let currentGroupTops: number[] = [];
        elsWithTop.forEach((item) => {
          if (groups.length === 0) {
            groups.push([item.el]);
            currentGroupTops.push(item.top);
          } else {
            const avgTop = currentGroupTops.reduce((a, b) => a + b, 0) / currentGroupTops.length;
            if (Math.abs(item.top - avgTop) < 40) { // 40px threshold for being on same row
              groups[groups.length - 1].push(item.el);
              currentGroupTops.push(item.top);
            } else {
              groups.push([item.el]);
              currentGroupTops = [item.top];
            }
          }
        });

        const tl = gsap.timeline({
          repeat: -1,
          yoyo: true,
          repeatDelay: 2.0, // increased wait time between loops
          delay: 1,
          scrollTrigger: { trigger: tree, start: "top 80%", toggleActions: "play pause resume pause" },
        });

        const timeDelayPerRow = 0.8; // slowing down the time liquid takes to move to the next row

        groups.forEach((group, groupIdx) => {
          group.forEach((el) => {
            const isNode = el.classList.contains("skill-tree-node");
            if (isNode) {
              const iconDiv = el.querySelector("div");
              if (iconDiv) {
                // Just add a subtle liquid pass-through glow, no blinking or scaling
                tl.to(
                  iconDiv,
                  {
                    boxShadow: "0 0 24px rgba(180,200,255,0.4)",
                    duration: 1.0, // longer glow activation
                    ease: "power2.in",
                  },
                  groupIdx * timeDelayPerRow,
                );
                tl.to(
                  iconDiv,
                  {
                    boxShadow: "0 0 18px rgba(180,200,255,0.0)", 
                    duration: 1.5, // longer glow fade out
                    ease: "power2.out",
                    clearProps: "boxShadow", // allow original React styles to resume
                  },
                  groupIdx * timeDelayPerRow + 1.0,
                );
              }
            } else {
              // Tree glow connector
              tl.fromTo(
                el,
                { opacity: 0.3, boxShadow: "0 0 0px rgba(180,200,255,0)" },
                {
                  opacity: 1,
                  boxShadow: "0 0 12px rgba(180,200,255,0.7), 0 0 24px rgba(180,200,255,0.4)",
                  duration: 1.0,
                  ease: "power2.in",
                },
                groupIdx * timeDelayPerRow,
              );
              tl.to(
                el,
                {
                  opacity: 0.3,
                  boxShadow: "0 0 0px rgba(180,200,255,0)",
                  duration: 1.5,
                  ease: "power2.out",
                },
                groupIdx * timeDelayPerRow + 1.0,
              );
            }
          });
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const langColor = "rgb(200 210 255)";
  const toolColor = "rgb(220 220 180)";

  return (
    <section
      id="skill"
      ref={sectionRef}
      className="relative z-33 overflow-hidden border-t border-white/8 py-20"
    >
      {/* ── Noir background image ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/skill/noir-detective-skill-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* ── 3D Rain & Fog Overlay ── */}
      <div className="pointer-events-none absolute inset-0 z-10 w-full h-full overflow-hidden">
        <ThreeNoirBg />
      </div>

      {/* ── Noir gradient overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: `
            linear-gradient(135deg, rgba(6,6,10,0.6) 0%, rgba(12,12,18,0.4) 40%, rgba(8,8,14,0.7) 100%),
            radial-gradient(ellipse at 50% 20%, rgba(200,210,255,0.05) 0%, transparent 50%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, rgba(6,6,10,0.7) 0%, rgba(12,12,18,0.6) 40%, rgba(8,8,14,0.75) 100%),
            radial-gradient(ellipse at 50% 20%, rgba(200,210,255,0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* ── Title ── */}
      <div ref={titleRef} className="relative z-30 mb-14 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400/90">Arsenal</p>
        <h2 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] md:text-6xl">
          <span className="bg-linear-to-b from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Skills
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400/80">
          Tools of the trade, sharpened through production battles and late-night debugging.
        </p>
      </div>

      {/* ── Skill Tree ── */}
      <div ref={treeRef} className="relative z-30 mx-auto flex max-w-5xl flex-col items-center px-4">

        {/* ─── Level 1: Languages ─── */}
        <div className="flex flex-col items-center">
          <span className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: langColor }}>
            Languages
          </span>
          <div className="flex items-start gap-5 md:gap-8">
            {LANGUAGES.map((s) => (
              <SkillNode key={s.name} skill={s} color={langColor} />
            ))}
          </div>
        </div>

        {/* │ Vertical trunk */}
        <div className="tree-glow h-12 w-0.75 rounded-full" style={{ backgroundColor: "rgba(180,190,220,0.5)" }} />

        {/* ─── Horizontal split bar ─── */}
        <div className="flex w-full max-w-2xl items-center">
          <div className="tree-glow h-0.5 flex-1 rounded-full" style={{ backgroundColor: "rgba(180,190,220,0.4)" }} />
          <div className="tree-glow mx-2 h-3 w-3 rounded-full" style={{ backgroundColor: "rgba(180,190,220,0.5)" }} />
          <div className="tree-glow h-0.5 flex-1 rounded-full" style={{ backgroundColor: "rgba(180,190,220,0.4)" }} />
          <div className="h-0.5 flex-1 rounded-full" style={{ backgroundColor: "rgba(180,190,220,0.4)" }} />
        </div>

        {/* ─── Level 2: Left & Right branches ─── */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-0 md:grid-cols-2">
          {/* Left side */}
          <div className="flex flex-col items-center">
            {/* │ Down from split bar */}
            <div className="tree-glow h-8 w-0.75 rounded-full" style={{ backgroundColor: "rgba(180,220,255,0.4)" }} />
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-400">
              TypeScript · JavaScript
            </p>
            {LEFT_BRANCHES.map((b) => (
              <div key={b.label} className="flex flex-col items-center">
                {/* │ connector between branches */}
                <div className="tree-glow h-6 w-0.5 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${b.color} 40%, transparent)` }} />
                <BranchGroup branch={b} />
              </div>
            ))}
          </div>

          {/* Right side */}
          <div className="flex flex-col items-center">
            {/* │ Down from split bar */}
            <div className="tree-glow h-8 w-0.75 rounded-full" style={{ backgroundColor: "rgba(255,210,170,0.4)" }} />
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-400">
              SQL · DevSecOps
            </p>
            {RIGHT_BRANCHES.map((b) => (
              <div key={b.label} className="flex flex-col items-center">
                {/* │ connector between branches */}
                <div className="tree-glow h-6 w-0.5 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${b.color} 40%, transparent)` }} />
                <BranchGroup branch={b} />
              </div>
            ))}
          </div>
        </div>

        {/* ─── Merge bar ─── */}
        <div className="flex w-full max-w-2xl items-center">
          <div className="tree-glow h-0.5 flex-1 rounded-full" style={{ backgroundColor: "rgba(220,220,180,0.35)" }} />
          <div className="tree-glow mx-2 h-3 w-3 rounded-full" style={{ backgroundColor: "rgba(220,220,180,0.45)" }} />
          <div className="tree-glow h-0.5 flex-1 rounded-full" style={{ backgroundColor: "rgba(220,220,180,0.35)" }} />
        </div>

        {/* │ Down to Tools */}
        <div className="tree-glow h-8 w-0.75 rounded-full" style={{ backgroundColor: "rgba(220,220,180,0.4)" }} />

        {/* ─── Level 3: Tools ─── */}
        <div className="flex flex-col items-center">
          <span className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: toolColor }}>
            Tools
          </span>
          <div className="flex flex-wrap items-start justify-center gap-5 md:gap-8">
            {TOOLS.map((s) => (
              <SkillNode key={s.name} skill={s} color={toolColor} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
