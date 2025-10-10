"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  IconDeviceMobile,
  IconBrandNextjs,
  IconDatabase,
  IconBrandTailwind,
} from "@tabler/icons-react";

const About = () => {
  const skills = [
    {
      icon: IconBrandNextjs,
      name: "Next.js",
      color: "from-gray-700 to-gray-900",
    },
    {
      icon: IconDeviceMobile,
      name: "React Native",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: IconDatabase,
      name: "Backend",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: IconBrandTailwind,
      name: "Tailwind",
      color: "from-sky-400 to-cyan-500",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="relative w-screen h-dvh  flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 py-12"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-4">
            About{" "}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Me
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 mx-auto rounded-full" />
        </motion.div>

        {/* Content Grid */}
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Text Content */}
          <motion.div variants={itemVariants} className="flex">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl w-full h-full flex flex-col justify-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Full Stack Developer
              </h3>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4">
                I&apos;m a passionate Full Stack Developer from Lahore,
                Pakistan. I specialize in crafting fast, responsive web
                applications using Next.js and TypeScript.
              </p>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                While also building smooth mobile apps with React Native. On the
                backend, I work with AdonisJS and Node.js to create secure,
                scalable APIs. My goal is to build clean, maintainable, and
                modern digital products that make a real impact.
              </p>
            </div>
          </motion.div>

          {/* Skills Grid */}
          <motion.div variants={itemVariants} className="flex">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl w-full h-full grid grid-cols-2 gap-4 items-stretch">
              {skills.map((skill, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="group relative bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${skill.color} rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />
                  <skill.icon className="w-12 h-12 text-white mb-3 mx-auto" />
                  <p className="text-white font-semibold text-center">
                    {skill.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
