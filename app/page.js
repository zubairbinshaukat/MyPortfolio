"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Hero } from "./Components/Hero";
import Projects from "./Components/Projects";

const Page = () => {
  const [currentSection, setCurrentSection] = useState("hero");

  const navigateToProjects = () => {
    setCurrentSection("projects");
  };

  const navigateToHero = () => {
    setCurrentSection("hero");
  };

  // Handle scroll navigation
  useEffect(() => {
    let isScrolling = false;
    let scrollTimeout;

    const handleWheel = (e) => {
      e.preventDefault();

      // Debounce scroll events
      if (isScrolling) return;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 1000);

      isScrolling = true;

      if (e.deltaY > 0) {
        // Scrolling down
        if (currentSection === "hero") {
          setCurrentSection("projects");
        }
        // Add more sections here as needed
        // else if (currentSection === "projects") {
        //   setCurrentSection("contact");
        // }
      } else if (e.deltaY < 0) {
        // Scrolling up
        if (currentSection === "projects") {
          setCurrentSection("hero");
        }
        // else if (currentSection === "contact") {
        //   setCurrentSection("projects");
        // }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [currentSection]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {currentSection === "hero" && (
          <motion.div
            key="hero"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="absolute inset-0 w-full h-full"
          >
            <Hero />
          </motion.div>
        )}

        {currentSection === "projects" && (
          <motion.div
            key="projects"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="absolute inset-0 w-full h-full"
          >
            <Projects />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Navigation Button - Bottom Center */}
      {/* <AnimatePresence>
        {currentSection === "hero" && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <motion.button
              onClick={navigateToProjects}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 hover:from-purple-600 hover:via-violet-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 sm:gap-3"
            >
              <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
                View Projects
              </span>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <IconChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.div>

              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence> */}

      {/* Back to Top Button - Bottom Right */}
      <AnimatePresence>
        {currentSection === "projects" && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <motion.button
              onClick={navigateToHero}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative p-3 sm:p-4 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 hover:from-purple-600 hover:via-violet-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              title="Back to Home"
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

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300" />
            </motion.button>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Back to Home
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Indicator Dots - Right Side */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-4">
        <motion.button
          onClick={navigateToHero}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="relative group"
          aria-label="Go to Hero section"
        >
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSection === "hero"
                ? "bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 scale-125"
                : "bg-gray-400 hover:bg-gray-300"
            }`}
          />
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Home
          </div>
        </motion.button>

        <motion.button
          onClick={navigateToProjects}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="relative group"
          aria-label="Go to Projects section"
        >
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSection === "projects"
                ? "bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 scale-125"
                : "bg-gray-400 hover:bg-gray-300"
            }`}
          />
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Projects
          </div>
        </motion.button>

        {/* Placeholder for Contact - Easy to activate later */}
        {/* <motion.button
          onClick={() => setCurrentSection("contact")}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="relative group"
          aria-label="Go to Contact section"
        >
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSection === "contact"
                ? "bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 scale-125"
                : "bg-gray-400 hover:bg-gray-300"
            }`}
          />
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Contact
          </div>
        </motion.button> */}
      </div>
    </div>
  );
};

export default Page;
