"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconBrandNextjs,
  IconBrandReact,
  IconBrandNodejs,
  IconBrandPython,
  IconBrandCpp,
  IconDeviceMobile,
  IconDatabase,
  IconBolt,
  IconCode,
  IconRobot,
  IconSettingsAutomation,
  IconTerminal2,
} from "@tabler/icons-react";

const TECHS = [
  { icon: IconBrandNextjs, name: "Next.js", accent: "#fff" },
  { icon: IconBrandReact, name: "React", accent: "#61DAFB" },
  { icon: IconBrandReact, name: "React Native", accent: "#A78BFA" },
  { icon: IconBrandNodejs, name: "Node.js", accent: "#68A063" },
  { icon: IconDatabase, name: "AdonisJS", accent: "#5A45FF" },
  { icon: IconCode, name: "MERN", accent: "#00ED64" },
  { icon: IconBrandPython, name: "Python", accent: "#FFD43B" },
  { icon: IconBrandCpp, name: "C++", accent: "#659BD3" },
  { icon: IconRobot, name: "GHL", accent: "#FF6B35" },
  { icon: IconSettingsAutomation, name: "n8n", accent: "#EA4B71" },
];

/* ── Rotating role titles ── */
const ROLES = [
  "Full Stack Developer",
  "Automation Engineer",
  "Mobile App Builder",
];

const About = () => {
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % ROLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.2 },
    },
  };

  const fadeUp = {
    hidden: { y: 16, opacity: 0, filter: "blur(6px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative w-screen h-dvh flex items-center justify-center overflow-hidden ">
      {/* ── Grid lines (subtle) ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Ambient glow ── */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] z-[2]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168,85,247,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Content ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 flex flex-col items-center"
      >
        {/* ── Tag ── */}
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-2 mb-6"
        >
          <IconTerminal2
            className="w-4 h-4"
            style={{ color: "#A855F7" }}
            stroke={2}
          />
          <span
            className="text-[11px] tracking-[0.25em] uppercase font-semibold"
            style={{
              color: "rgba(168,85,247,0.7)",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          >
            about me
          </span>
        </motion.div>

        {/* ── Heading with rotating role ── */}
        <motion.div variants={fadeUp} className="text-center mb-2">
          <h2
            className="text-[clamp(1.8rem,5vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-white/90"
            style={{
              fontFamily: "'Outfit', 'Sora', sans-serif",
            }}
          >
            I build things for the web
          </h2>
        </motion.div>

        {/* ── Rotating subtitle ── */}
        <motion.div
          variants={fadeUp}
          className="h-8 sm:h-9 overflow-hidden mb-8 sm:mb-10"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={roleIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="block text-base sm:text-lg font-medium"
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: "#A855F7",
              }}
            >
              {`// ${ROLES[roleIndex]}`}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* ── Bio — compact paragraph ── */}
        <motion.p
          variants={fadeUp}
          className="text-center text-white/40 text-sm sm:text-[15px] leading-[1.8] max-w-2xl mb-10 sm:mb-12"
          style={{
            fontFamily: "'DM Sans', 'General Sans', sans-serif",
          }}
        >
          Full Stack Developer from Lahore, Pakistan. I craft fast, responsive
          web apps with{" "}
          <span className="text-white/70 font-medium">Next.js</span> &amp; the{" "}
          <span className="text-white/70 font-medium">MERN stack</span>, build
          mobile experiences in{" "}
          <span className="text-white/70 font-medium">React Native</span>, and
          wire up smart business automations with{" "}
          <span className="text-white/70 font-medium">GoHighLevel</span> &amp;{" "}
          <span className="text-white/70 font-medium">n8n</span> — connecting
          CRMs, funnels, and backend systems so businesses can scale without the
          manual grind.
        </motion.p>

        {/* ── Tech Marquee ── */}
        <motion.div
          variants={fadeUp}
          className="w-full max-w-3xl overflow-hidden mb-10 sm:mb-12"
        >
          {/* Fade masks */}
          <div className="relative">
            

            <div className="flex gap-5 animate-marquee">
              {[...TECHS, ...TECHS].map((tech, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 shrink-0 px-4 py-2.5 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <tech.icon
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                    style={{ color: tech.accent }}
                    stroke={1.5}
                  />
                  <span
                    className="text-xs sm:text-sm font-semibold text-white/50 whitespace-nowrap"
                    style={{
                      fontFamily: "'DM Sans', 'General Sans', sans-serif",
                    }}
                  >
                    {tech.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Three stat pills ── */}
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
          {[
            { icon: IconCode, label: "Web & APIs", color: "#61DAFB" },
            { icon: IconDeviceMobile, label: "Mobile Apps", color: "#A78BFA" },
            { icon: IconBolt, label: "Automations", color: "#FF6B35" },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2, scale: 1.03 }}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full cursor-default"
              style={{
                background: `${item.color}08`,
                border: `1px solid ${item.color}18`,
              }}
            >
              <item.icon
                className="w-4 h-4"
                style={{ color: item.color }}
                stroke={2}
              />
              <span
                className="text-xs sm:text-sm font-semibold"
                style={{
                  color: `${item.color}AA`,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }}
              >
                {item.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Inline keyframes for marquee ── */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default About;