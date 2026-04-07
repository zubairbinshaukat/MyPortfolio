"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  IconQuote,
  IconStar,
  IconChevronLeft,
  IconChevronRight,
  IconMessageCircle,
} from "@tabler/icons-react";

const TESTIMONIALS = [
  {
    name: "Uzair Khan",
    role: "Co-Founder at Devsmat",
    company: "Devsmat Inc.",
    image:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=Uzair&accessories[]&eyebrows=defaultNatural,flatNatural,default&eyes=default,happy,side&mouth=default",
    content:
      "Always brings smart ideas and clean code to every project. Super reliable and easy to work with.",
    rating: 5,
    accent: "#61DAFB",
  },
  {
    name: "Faraz Ahmad",
    role: "Co-Founder at Indepth Solutions",
    company: "Indepth Solution Inc.",
    image:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=Faraz&accessories[]&eyebrows=defaultNatural,flatNatural,default&eyes=default,happy,side&mouth=default",
    content:
      "Zubair is not a person but a legend. Working alongside him was never less than a suspense movie where you must expect the unexpected. He always somehow finds a way to exceed your expectations. Truly an inspiration.",
    rating: 5,
    accent: "#A78BFA",
  },
  {
    name: "Qamar Bin Hanif",
    role: "Co-Founder at Devsmat",
    company: "Devsmat Inc.",
    image:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=Qamar&accessories[]&eyebrows=defaultNatural,flatNatural,default&eyes=default,happy,side&mouth=default",
    content:
      "Quick learner with a real passion for coding. Turns tricky tasks into smooth solutions every time.",
    rating: 5,
    accent: "#FF6B35",
  },
];

const SWIPE_THRESHOLD = 50;

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = useCallback(
    () => setCurrentIndex((p) => (p + 1) % TESTIMONIALS.length),
    []
  );
  const goPrev = () =>
    setCurrentIndex(
      (p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
    );

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goNext();
    else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
  };

  useEffect(() => {
    const timer = setInterval(goNext, 8000);
    return () => clearInterval(timer);
  }, [goNext]);

  const getStack = () => {
    const result = [];
    for (let depth = TESTIMONIALS.length - 1; depth >= 0; depth--) {
      const idx = (currentIndex + depth) % TESTIMONIALS.length;
      result.push({ ...TESTIMONIALS[idx], originalIndex: idx, depth });
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
    /* Section bg is fully transparent — inherits parent bg */
    <section className="relative w-screen h-dvh flex items-center justify-center overflow-hidden">
      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] z-[2] transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at center, ${TESTIMONIALS[currentIndex].accent}0A 0%, transparent 70%)`,
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
        <motion.div variants={fadeUp} className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <IconMessageCircle
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
              kind words
            </span>
          </div>
          <h2
            className="text-[clamp(1.8rem,5vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-white/90"
            style={{ fontFamily: "'Outfit', 'Sora', sans-serif" }}
          >
            Testimonials
          </h2>
        </motion.div>

        {/* ── Stacked Cards ── */}
        <motion.div
          variants={fadeUp}
          className="relative w-full flex items-center justify-center"
          style={{ height: "340px" }}
        >
          {stack.map((testimonial) => {
            const { depth, originalIndex } = testimonial;
            const isTop = depth === 0;

            return (
              <motion.div
                key={originalIndex}
                layout
                className={`absolute w-[92%] max-w-lg sm:max-w-2xl rounded-2xl overflow-hidden ${
                  isTop
                    ? "cursor-grab active:cursor-grabbing"
                    : "pointer-events-none"
                }`}
                style={{
                  zIndex: TESTIMONIALS.length - depth,
                  /* ── Card bg — not section ── */
                  background: "rgba(0,0,0,0.8)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  touchAction: "pan-y",
                  /* ── FIXED HEIGHT — all cards identical ── */
                  height: "300px",
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
                {/* flex-col layout pins author to bottom */}
                <div className="flex flex-col h-full p-6 sm:p-8">
                  {/* Top: quote + content */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <IconQuote
                      className="w-7 h-7 sm:w-8 sm:h-8 mb-3 shrink-0"
                      style={{ color: `${testimonial.accent}50` }}
                      stroke={1.5}
                    />
                    {/* line-clamp keeps all cards same visual height */}
                    <p
                      className="text-white/55 text-sm sm:text-[15px] leading-[1.75] line-clamp-4"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                  </div>

                  {/* Bottom: stars + divider + author — always pinned */}
                  <div className="shrink-0 pt-3">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <IconStar
                          key={i}
                          className="w-3.5 h-3.5"
                          style={{ color: "#FFD43B", fill: "#FFD43B" }}
                          stroke={1.5}
                        />
                      ))}
                    </div>
                    <div
                      className="w-full h-px mb-3"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                    <div className="flex items-center gap-3">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full select-none shrink-0"
                        style={{
                          border: `2px solid ${testimonial.accent}30`,
                          background: "rgba(255,255,255,0.05)",
                        }}
                        draggable={false}
                      />
                      <div className="min-w-0">
                        <h4
                          className="text-sm font-bold text-white/80 truncate"
                          style={{
                            fontFamily: "'Outfit', 'Sora', sans-serif",
                          }}
                        >
                          {testimonial.name}
                        </h4>
                        <p
                          className="text-[11px] text-white/30 truncate"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top-card accent glow */}
                {isTop && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 0 1px ${testimonial.accent}18, 0 0 40px ${testimonial.accent}05`,
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
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <IconChevronLeft className="w-5 h-5 text-white/40" stroke={2} />
          </motion.button>

          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? 28 : 8,
                  background:
                    i === currentIndex
                      ? TESTIMONIALS[currentIndex].accent
                      : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goNext}
            className="w-10 h-10 rounded-full flex items-center justify-center"
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

export default Testimonials;