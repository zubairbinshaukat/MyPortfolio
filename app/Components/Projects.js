"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  IconExternalLink,
  IconFolder,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import Image from "next/image";

const PROJECTS = [
  {
    name: "OpenCinema",
    desc: "Attention to detail and innovative features that completely transform the movie discovery workflow.",
    link: "https://opencinema2.netlify.app",
    image: "https://ik.imagekit.io/xosswhicz/project1.png",
    tags: ["Next.js", "React", "API"],
    accent: "#61DAFB",
    num: "01",
  },
  {
    name: "Biz-Xpert Web",
    desc: "Seamless implementation with results exceeding expectations. A remarkably flexible business platform.",
    link: "https://www.biz-xpert.com",
    image: "/projects/biz-xpert.png",
    tags: ["Next.js", "Node.js", "GHL"],
    accent: "#A78BFA",
    num: "02",
  },
  {
    name: "Biz-Xpert Mobile",
    desc: "Cross-platform mobile experience currently in active development with React Native.",
    link: "",
    image: "/projects/bizmobile1.png",
    tags: ["React Native", "Mobile"],
    accent: "#FF6B35",
    num: "03",
  },
];

const SWIPE_THRESHOLD = 50;

const Projects = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = () => setCurrentIndex((p) => (p + 1) % PROJECTS.length);
  const goPrev = () =>
    setCurrentIndex((p) => (p - 1 + PROJECTS.length) % PROJECTS.length);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goNext();
    else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
  };

  /* Build visual stack: index 0 = front card */
  const getStack = () => {
    const result = [];
    for (let depth = PROJECTS.length - 1; depth >= 0; depth--) {
      const idx = (currentIndex + depth) % PROJECTS.length;
      result.push({ ...PROJECTS[idx], originalIndex: idx, depth });
    }
    return result;
  };

  const stack = getStack();

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
    <section className="relative w-screen h-dvh flex items-center justify-center overflow-hidden">
      {/* Grid bg */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow — reacts to current card accent */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] z-[2] transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at center, ${PROJECTS[currentIndex].accent}0C 0%, transparent 70%)`,
        }}
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
          },
        }}
        className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 flex flex-col items-center"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="w-full mb-6 sm:mb-10">
          <div className="flex items-center gap-2 mb-3">
            <IconFolder
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
              selected work
            </span>
          </div>
          <div className="flex items-end justify-between">
            <h2
              className="text-[clamp(1.8rem,5vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-white/90"
              style={{ fontFamily: "'Outfit', 'Sora', sans-serif" }}
            >
              Projects
            </h2>
            <span
              className="text-sm font-bold text-white/20 hidden sm:block"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {String(currentIndex + 1).padStart(2, "0")} /{" "}
              {String(PROJECTS.length).padStart(2, "0")}
            </span>
          </div>
        </motion.div>

        {/* ── Stacked Card Carousel ── */}
        <motion.div
          variants={fadeUp}
          className="relative w-full flex items-center justify-center"
          style={{ height: "clamp(320px, 52vh, 440px)" }}
        >
          {stack.map((project) => {
            const { depth, originalIndex } = project;
            const isTop = depth === 0;

            return (
              <motion.div
                key={originalIndex}
                layout
                className={`absolute w-[90%] max-w-lg sm:max-w-xl rounded-2xl overflow-hidden ${
                  isTop
                    ? "cursor-grab active:cursor-grabbing"
                    : "pointer-events-none"
                }`}
                style={{
                  zIndex: PROJECTS.length - depth,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  touchAction: "pan-y",
                }}
                animate={{
                  scale: 1 - depth * 0.055,
                  y: depth * 16,
                  opacity: depth > 2 ? 0 : 1 - depth * 0.25,
                }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={isTop ? handleDragEnd : undefined}
                whileDrag={isTop ? { scale: 0.96, rotate: -1.5 } : {}}
              >
                {/* Image */}
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.name}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover object-top select-none"
                    draggable={false}
                  />
                  <div className="absolute inset-0 
                  bg-gradient-to-t from-[#08080C] via-[#08080C]/30 to-transparent
                  " />

                  {/* Number badge */}
                  <div
                    className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider"
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(8px)",
                      color: project.accent,
                      fontFamily: "'JetBrains Mono', monospace",
                      border: `1px solid ${project.accent}30`,
                    }}
                  >
                    {project.num}
                  </div>

                  {/* External link */}
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform pointer-events-auto"
                      style={{
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconExternalLink
                        className="w-3.5 h-3.5 text-white/60"
                        stroke={2}
                      />
                    </a>
                  )}
                </div>

                {/* Info */}
                <div className="px-5 pb-5 pt-2 bg-black">
                  <h3
                    className="text-lg sm:text-xl font-bold text-white/85 mb-1.5"
                    style={{ fontFamily: "'Outfit', 'Sora', sans-serif" }}
                  >
                    {project.name}
                  </h3>
                  <p
                    className="text-white/30 text-xs sm:text-[13px] leading-relaxed mb-3 line-clamp-2"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {project.desc}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag, j) => (
                      <span
                        key={j}
                        className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: `${project.accent}0A`,
                          color: `${project.accent}90`,
                          border: `1px solid ${project.accent}15`,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {!project.link && (
                      <span
                        className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: "rgba(255,200,50,0.06)",
                          color: "rgba(255,200,50,0.6)",
                          border: "1px solid rgba(255,200,50,0.1)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        In Dev
                      </span>
                    )}
                  </div>
                </div>

                {/* Accent glow on top card */}
                {isTop && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 0 1px ${project.accent}20, 0 0 40px ${project.accent}06`,
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Navigation ── */}
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-5 mt-6 sm:mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goPrev}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <IconChevronLeft className="w-5 h-5 text-white/40" stroke={2} />
          </motion.button>

          <div className="flex gap-2">
            {PROJECTS.map((p, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? 28 : 8,
                  background:
                    i === currentIndex
                      ? PROJECTS[currentIndex].accent
                      : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goNext}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <IconChevronRight className="w-5 h-5 text-white/40" stroke={2} />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Projects;