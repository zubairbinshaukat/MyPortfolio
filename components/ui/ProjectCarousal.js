"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

// Helper function to determine layout positions based on number of images in src array
const getImagePositions = (totalImages, imageIndex) => {
  if (totalImages === 1) {
    // Single image - centered
    return {
      x: "0%",
      rotate: 0,
      scale: 1,
      zIndex: 1,
    };
  } else if (totalImages === 2) {
    // Two images - left and right (no center)
    const positions = [
      { x: "-20%", rotate: -10, scale: 0.95, zIndex: 1 },
      { x: "20%", rotate: 10, scale: 0.95, zIndex: 1 },
    ];
    return positions[imageIndex];
  } else {
    // Three images - left, center, right
    const positions = [
      { x: "-70%", rotate: -15, scale: 0.90, zIndex: 1 },
      { x: "0%", rotate: 0, scale: 1, zIndex: 2 },
      { x: "70%", rotate: 15, scale: 0.90, zIndex: 1 },
    ];
    return positions[imageIndex];
  }
};

export const ProjectCarousal = ({ testimonials, autoplay = false }) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  const randomRotateY = () => Math.floor(Math.random() * 21) - 10;

  // Get the src array from current active testimonial
  const currentSrcArray = testimonials[active].src;
  const totalImagesInSrc = currentSrcArray.length;

  return (
    <div className="mx-auto max-w-sm px-4 py-6 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12 ">
      <div className="relative grid grid-cols-1 sm:gap-20 gap-6 md:grid-cols-2">
        {/* Left Side - Images */}
        <div>
          <div className="relative h-80 w-full flex items-center justify-center">
            <AnimatePresence mode="sync">
              {currentSrcArray.map((imageSrc, index) => {
                const position = getImagePositions(totalImagesInSrc, index);

                return (
                  <motion.div
                    key={`${imageSrc}-${active}-${index}`}
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                      rotateY: randomRotateY(),
                      y: 50,
                    }}
                    animate={{
                      opacity: 1,
                      scale: position.scale,
                      x: position.x,
                      rotate: position.rotate,
                      rotateY: 0,
                      y: 0,
                      zIndex: position.zIndex,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      rotateY: randomRotateY(),
                      y: -50,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: [0.43, 0.13, 0.23, 0.96],
                    }}
                    className={`absolute ${
                      totalImagesInSrc === 1
                        ? "h-80"
                        : "w-36 h-72"
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <Image
                      src={imageSrc}
                      alt={testimonials[active].name}
                      width={500}
                      height={500}
                      draggable={false}
                      className="h-full w-full rounded-2xl object-cover object-center shadow-2xl"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side - Text */}
        <div className="flex flex-col justify-between py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h3 className="text-2xl font-bold text-black dark:text-white">
                {testimonials[active].name}
              </h3>

              {testimonials[active].link && (
                <a
                  href={testimonials[active].link}
                  className="text-sm text-red-400 line-clamp-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {testimonials[active].link}
                </a>
              )}

              {/* Word-by-word fade-in */}
              <p className="mt-4 sm:mt-8 text-lg text-gray-500 dark:text-neutral-300 line-clamp-3 sm:line-clamp-5">
                {testimonials[active].quote.split(" ").map((word, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 5, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.2,
                      ease: "easeOut",
                      delay: 0.03 * index,
                    }}
                    className="inline-block"
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 md:pt-0">
            <button
              onClick={handlePrev}
              className="group/button flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500"
            >
              <IconArrowLeft className="h-5 w-5 text-white transition-transform duration-300 group-hover/button:rotate-12 " />
            </button>
            <button
              onClick={handleNext}
              className="group/button flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500"
            >
              <IconArrowRight className="h-5 w-5 transition-transform duration-300 group-hover/button:-rotate-12 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
