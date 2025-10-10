"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconSend,
  IconBrandInstagram,
  IconBrandFacebook,
} from "@tabler/icons-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isFocused, setIsFocused] = useState({
    name: false,
    email: false,
    subject: false,
    message: false,
  });

  const contactInfo = [
    {
      icon: IconMail,
      label: "Email",
      value: "zubairbinshaukat4455@gmail.com",
      link: "mailto:zubairbinshaukat4455@gmail.com",
      color: "from-purple-500 to-violet-500",
    },
    {
      icon: IconPhone,
      label: "Phone",
      value: "+92 314 87 97 500",
      link: "tel:+923148797500",
      color: "from-violet-500 to-pink-500",
    },
    {
      icon: IconMapPin,
      label: "Location",
      value: "Lahore, Pakistan",
      link: "https://www.google.com/maps/place/Lahore,+Pakistan/",
      color: "from-pink-500 to-purple-500",
    },
  ];

  const socialLinks = [
    {
      icon: IconBrandInstagram,
      label: "Instagram",
      link: "https://instagram.com/zubairbinshaukat",
      color: "hover:text-pink-400",
    },
    {
      icon: IconBrandGithub,
      label: "GitHub",
      link: "https://github.com/zubairbinshaukat",
      color: "hover:text-purple-400",
    },
    {
      icon: IconBrandLinkedin,
      label: "LinkedIn",
      link: "https://linkedin.com/in/zubairbinshaukat",
      color: "hover:text-violet-400",
    },
    {
      icon: IconBrandFacebook,
      label: "Facebook",
      link: "https://facebook.com/zubairbinshaukat1",
      color: "hover:text-pink-400",
    },
    {
      icon: IconBrandTwitter,
      label: "Twitter",
      link: "https://twitter.com/zubairbinshaukt",
      color: "hover:text-pink-400",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-10">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-2xl mx-auto px-6 sm:px-12 py-8 w-full"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-4">
            Get In{" "}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Touch
            </span>
          </h2>
          <p className="text-gray-300 text-lg">
            {"Let's work together on your next project"}
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 mx-auto rounded-full mt-4" />
        </motion.div>

        <div className="flex items-center justify-center">
          {/* Contact Info */}
          <motion.div variants={itemVariants} className="space-y-6 w-full">
            {/* Contact Cards */}
            {contactInfo.map((info, index) => (
              <motion.a
                key={index}
                href={info.link}
                whileHover={{ scale: 1.02, x: 10 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 group"
              >
                <div
                  className={`p-4 bg-gradient-to-r ${info.color} rounded-xl group-hover:scale-110 transition-transform duration-300`}
                >
                  <info.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{info.label}</p>
                  <p className="text-white font-semibold sm:text-lg text-sm text-wrap">
                    {info.value}
                  </p>
                </div>
              </motion.a>
            ))}

            {/* Social Links */}
            <motion.div
              variants={itemVariants}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-white font-semibold text-xl mb-4">
                Follow Me
              </h3>
              <div className="flex justify-center gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-3 bg-white/10 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 ${social.color}`}
                  >
                    <social.icon className="w-6 h-6 text-white" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          {/* <motion.div variants={itemVariants}>
            <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setIsFocused({ ...isFocused, name: true })}
                  onBlur={() => setIsFocused({ ...isFocused, name: false })}
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-all duration-300"
                  placeholder="Your Name"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isFocused.name ? "100%" : 0 }}
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-full"
                />
              </div>

              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setIsFocused({ ...isFocused, email: true })}
                  onBlur={() => setIsFocused({ ...isFocused, email: false })}
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-all duration-300"
                  placeholder="Your Email"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isFocused.email ? "100%" : 0 }}
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-full"
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  onFocus={() => setIsFocused({ ...isFocused, subject: true })}
                  onBlur={() => setIsFocused({ ...isFocused, subject: false })}
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-all duration-300"
                  placeholder="Subject"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isFocused.subject ? "100%" : 0 }}
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-full"
                />
              </div>

              <div className="relative">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => setIsFocused({ ...isFocused, message: true })}
                  onBlur={() => setIsFocused({ ...isFocused, message: false })}
                  required
                  rows={4}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-all duration-300 resize-none"
                  placeholder="Your Message"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isFocused.message ? "100%" : 0 }}
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-full"
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 hover:from-purple-600 hover:via-violet-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <span>Send Message</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <IconSend className="w-5 h-5" />
                </motion.div>
              </motion.button>
            </form>
          </motion.div> */}
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;
