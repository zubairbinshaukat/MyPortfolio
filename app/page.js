"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronUp } from "@tabler/icons-react";
import { Hero } from "./Components/Hero";
import Projects from "./Components/Projects";
import About from "./Components/About";
import Testimonials from "./Components/Testimonials";
import Contact from "./Components/Contact";

// Stable constant outside component — prevents unnecessary effect re-runs
const SECTIONS = ["hero", "about", "projects", "testimonials", "contact"];

// Paper stack animation:
//   Scroll DOWN (direction=1):  current page shrinks up into the "stack", new page rises from below
//   Scroll UP   (direction=-1): current page drops back down, previous page expands out of the stack
const stackVariants = {
  enter: (direction) => ({
    y: direction > 0 ? "100%" : "-5%",
    scale: direction > 0 ? 1 : 0.92,
    opacity: direction > 0 ? 1 : 0,
  }),
  center: {
    y: "0%",
    scale: 1,
    opacity: 1,
  },
  exit: (direction) => ({
    y: direction > 0 ? "-5%" : "100%",
    scale: direction > 0 ? 0.92 : 1,
    opacity: direction > 0 ? 0 : 1,
  }),
};

const Page = () => {
  const [currentSection, setCurrentSection] = useState("hero");
  const [direction, setDirection] = useState(1);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialDot, setTutorialDot] = useState(0);
  const isScrollingRef = useRef(false);

  // Ref keeps event handlers up-to-date with current section without
  // requiring the effect to re-register on every render
  const currentSectionRef = useRef(currentSection);
  useEffect(() => {
    currentSectionRef.current = currentSection;
  }, [currentSection]);

  const navigateToSection = (section) => {
    const currentIndex = SECTIONS.indexOf(currentSectionRef.current);
    const targetIndex = SECTIONS.indexOf(section);
    setDirection(targetIndex > currentIndex ? 1 : -1);
    setCurrentSection(section);
  };

  // Tutorial animation on initial page load only
  useEffect(() => {
    const tutorialStartTimeout = setTimeout(() => {
      setShowTutorial(true);

      let step = 0;
      const totalSteps = 8;
      const stepDuration = 300;

      const dotInterval = setInterval(() => {
        if (step <= 4) {
          setTutorialDot(step);
        } else if (step < 8) {
          setTutorialDot(8 - step);
        }

        step++;

        if (step >= totalSteps) {
          clearInterval(dotInterval);
          setTutorialDot(0);
          setTimeout(() => setShowTutorial(false), 600);
        }
      }, stepDuration);
    }, 100);

    return () => clearTimeout(tutorialStartTimeout);
  }, []);

  // Scroll / touch navigation — registered once, reads section via ref
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;
    let touchStartX = 0;
    let hasMoved = false;

    const goToNext = () => {
      const idx = SECTIONS.indexOf(currentSectionRef.current);
      if (idx < SECTIONS.length - 1) {
        setDirection(1);
        setCurrentSection(SECTIONS[idx + 1]);
      }
    };

    const goToPrev = () => {
      const idx = SECTIONS.indexOf(currentSectionRef.current);
      if (idx > 0) {
        setDirection(-1);
        setCurrentSection(SECTIONS[idx - 1]);
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      if (isScrollingRef.current) return;
      // Ignore micro-scrolls (trackpad inertia tail)
      if (Math.abs(e.deltaY) < 20) return;

      isScrollingRef.current = true;
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 900);

      if (e.deltaY > 0) goToNext();
      else goToPrev();
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchEndY = touchStartY;
      hasMoved = false;
    };

    const handleTouchMove = (e) => {
      touchEndY = e.touches[0].clientY;
      const touchCurrentX = e.touches[0].clientX;

      const verticalDistance = Math.abs(touchEndY - touchStartY);
      const horizontalDistance = Math.abs(touchCurrentX - touchStartX);

      if (verticalDistance > horizontalDistance && verticalDistance > 10) {
        hasMoved = true;
        const currentIdx = SECTIONS.indexOf(currentSectionRef.current);
        const isSwipingDown = touchEndY > touchStartY;
        if (currentIdx > 0 || !isSwipingDown) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (isScrollingRef.current || !hasMoved) return;

      const swipeDistance = touchStartY - touchEndY;
      if (Math.abs(swipeDistance) > 50) {
        isScrollingRef.current = true;
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 900);

        if (swipeDistance > 0) goToNext();
        else goToPrev();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []); // empty — stable via ref

  const getSectionComponent = (section) => {
    switch (section) {
      case "hero":
        return <Hero />;
      case "about":
        return <About />;
      case "projects":
        return <Projects />;
      case "testimonials":
        return <Testimonials />;
      case "contact":
        return <Contact />;
      default:
        return <Hero />;
    }
  };

  const currentIndex = SECTIONS.indexOf(currentSection);
  const isFirst = currentIndex === 0;

  return (
    <div className="relative w-screen h-dvh overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentSection}
          custom={direction}
          variants={stackVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.55,
            ease: [0.32, 0.72, 0, 1],
          }}
          style={{ transformOrigin: "top center" }}
          className="absolute inset-0 w-full h-full"
        >
          {getSectionComponent(currentSection)}
        </motion.div>
      </AnimatePresence>

      {/* Back to Top Button - Only show when not on first section */}
      <AnimatePresence>
        {!isFirst && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="fixed bottom-5 right-5 z-50"
          >
            <motion.button
              onClick={() => {
                setDirection(-1);
                setCurrentSection("hero");
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative p-3 sm:p-4 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 hover:from-purple-600 hover:via-violet-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              title="Back to Top"
            >
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <IconChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Text - Shows during tutorial animation only */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="sm:hidden absolute right-8 top-1/2 bottom-1/2 -translate-y-1/2 z-40"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={({ opacity: [0.7, 1, 0.7] }, { y: [0, -8, 0] })}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className=""
              >
                <p className="text-white/70 text-sm font-medium tracking-wide text-nowrap">
                  Scroll to explore
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Indicators with Tutorial Animation */}
      <div className="fixed sm:right-6 right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4">
        {SECTIONS.map((section, index) => {
          const isActive = showTutorial
            ? index === tutorialDot
            : currentSection === section;

          return (
            <motion.button
              key={section}
              onClick={() => navigateToSection(section)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="relative group"
              aria-label={`Go to ${section} section`}
              disabled={showTutorial}
            >
              <motion.div
                animate={
                  showTutorial && index === tutorialDot
                    ? {
                        scale: [1, 1.8, 1],
                        rotate: [0, 180, 360],
                      }
                    : isActive && !showTutorial
                    ? {
                        scale: 1.25,
                      }
                    : {
                        scale: 1,
                      }
                }
                transition={{
                  duration: showTutorial ? 0.4 : 0.3,
                  ease: "easeInOut",
                }}
                className={`sm:w-3 sm:h-3 w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 shadow-lg shadow-purple-500/50"
                    : "bg-gray-400 hover:bg-gray-300"
                }`}
              />

              {/* Tooltip on hover - only show when tutorial is not active */}
              {!showTutorial && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none capitalize shadow-lg">
                  {section}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default Page;
