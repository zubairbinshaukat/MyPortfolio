"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconChevronLeft,
  IconChevronRight,
  IconStar,
  IconQuote,
} from "@tabler/icons-react";

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const testimonials = [
    {
      name: "Uzair Khan",
      role: "CO-Founder at Devsmat",
      image:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Amaya&accessories[]&eyebrows=defaultNatural,flatNatural,default&eyes=default,happy,side&mouth=default&style=default,circle",
      content:
        "Always brings smart ideas and clean code to every project.Super reliable and easy to work with.",
      rating: 5,
      company: "Devsmat Inc.",
    },
    {
      name: "Faraz Ahmad",
      role: "Co-Founder at Indepth Solutions",
      image:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Amaya&accessories[]&eyebrows=defaultNatural,flatNatural,default&eyes=default,happy,side&mouth=default&style=default,circle",
      content:
        "Zubair is not a person but a legend. Working alongside him was never less than a suspense movie where you must expect the unexpected. Doesn't matter what you expect from him he always somehow finds a way to exceed your expectations. Truly an inspiration and motivation.",
      rating: 5,
      company: "Indepth Solution Inc.",
    },
    {
      name: "Qamar Bin Hanif",
      role: "CO-Founder at Devsmat",
      image:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Amaya&accessories[]&eyebrows=defaultNatural,flatNatural,default&eyes=default,happy,side&mouth=default&style=default,circle",
      content:
        "Quick learner with a real passion for coding.Turns tricky tasks into smooth solutions every time.",
      rating: 5,
      company: "Devsmat Inc.",
    },
  ];

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      nextTestimonial();
    }, 10000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.43, 0.13, 0.23, 0.96],
      },
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.5,
        ease: [0.43, 0.13, 0.23, 0.96],
      },
    }),
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-10">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
            className="absolute w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
            style={{
              left: `${20 + i * 30}%`,
              top: `${20 + i * 20}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 w-full">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-4">
            Client{" "}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Testimonials
            </span>
          </h2>
          <p className="text-gray-300 text-lg">What people say about my work</p>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 mx-auto rounded-full mt-4" />
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Main Testimonial Card */}
          <div className="relative h-[400px] sm:h-[350px] flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute w-full"
              >
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl max-w-4xl mx-auto">
                  {/* Quote Icon */}
                  <IconQuote className="w-12 h-12 text-purple-400 mb-6" />

                  {/* Content */}
                  <p className="text-white text-lg sm:text-xl leading-relaxed mb-8 min-h-[120px]">
                    {testimonials[currentIndex].content}
                  </p>

                  {/* Rating */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonials[currentIndex].rating)].map(
                      (_, i) => (
                        <IconStar
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      )
                    )}
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center gap-4">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      src={testimonials[currentIndex].image}
                      alt={testimonials[currentIndex].name}
                      className="w-16 h-16 rounded-full border-2 border-purple-400"
                    />
                    <div>
                      <h4 className="text-white font-bold text-lg">
                        {testimonials[currentIndex].name}
                      </h4>
                      <p className="text-purple-300 text-sm">
                        {testimonials[currentIndex].role}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {testimonials[currentIndex].company}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevTestimonial}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full border border-white/20 transition-all duration-300 group"
            >
              <IconChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextTestimonial}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full border border-white/20 transition-all duration-300 group"
            >
              <IconChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500"
                    : "w-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
