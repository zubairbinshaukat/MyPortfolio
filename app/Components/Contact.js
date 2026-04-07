"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandTwitter,
  IconSend,
  IconTerminal2,
  IconArrowUpRight,
} from "@tabler/icons-react";

const CONTACT_INFO = [
  {
    icon: IconMail,
    label: "Email",
    value: "zubairbinshaukat4455@gmail.com",
    href: "mailto:zubairbinshaukat4455@gmail.com",
    accent: "#A78BFA",
  },
  {
    icon: IconPhone,
    label: "Phone",
    value: "+92 314 87 97 500",
    href: "tel:+923148797500",
    accent: "#EC4899",
  },
  {
    icon: IconMapPin,
    label: "Location",
    value: "Lahore, Pakistan",
    href: "https://www.google.com/maps/place/Lahore,+Pakistan/",
    accent: "#F97316",
  },
];

const SOCIALS = [
  { icon: IconBrandGithub, label: "GitHub", href: "https://github.com/zubairbinshaukat", accent: "#fff" },
  { icon: IconBrandLinkedin, label: "LinkedIn", href: "https://linkedin.com/in/zubairbinshaukat", accent: "#0A66C2" },
  { icon: IconBrandInstagram, label: "Instagram", href: "https://instagram.com/zubairbinshaukat", accent: "#E1306C" },
  { icon: IconBrandFacebook, label: "Facebook", href: "https://facebook.com/zubairbinshaukat1", accent: "#1877F2" },
  { icon: IconBrandTwitter, label: "Twitter", href: "https://twitter.com/zubairbinshaukt", accent: "#1DA1F2" },
];

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setFormData({ name: "", email: "", message: "" });
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

  const inputBase =
    "w-full rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none transition-all duration-200 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20";

  const inputBg = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
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

      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 w-[500px] h-[500px] z-[2]"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -top-20 -right-20 w-[400px] h-[400px] z-[2]"
        style={{ background: "radial-gradient(circle, rgba(97,218,251,0.04) 0%, transparent 70%)" }}
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
        }}
        className="relative z-10 w-full max-w-5xl flex justify-center px-5 sm:px-8 gap-8 lg:gap-14 items-center"
      >
        {/* ═══════ Left: Info ═══════ */}
        <div className="flex flex-col max-w-[420px]">
          {/* Tag */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 mb-4">
            <IconTerminal2 className="w-4 h-4" style={{ color: "#A855F7" }} stroke={2} />
            <span
              className="text-[11px] tracking-[0.25em] uppercase font-semibold"
              style={{ color: "rgba(168,85,247,0.7)", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
            >
              get in touch
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={fadeUp}
            className="text-[clamp(1.8rem,5vw,3.2rem)] font-extrabold leading-[1.1] tracking-tight text-white/90 mb-3"
            style={{ fontFamily: "'Outfit', 'Sora', sans-serif" }}
          >
            Let&apos;s build
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #F97316 100%)" }}
            >
              something great
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="text-white/30 text-sm leading-[1.7] mb-6 max-w-md"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Got a project in mind or want to explore working together? Drop me a
            message and I&apos;ll get back to you within 24 hours.
          </motion.p>

          {/* ── Contact Info Rows ── */}
          <motion.div variants={fadeUp} className="flex flex-col gap-2.5 mb-6">
            {CONTACT_INFO.map((item, i) => (
              <a
                key={i}
                href={item.href}
                target={item.label === "Location" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.accent}12` }}
                >
                  <item.icon className="w-4 h-4" style={{ color: item.accent }} stroke={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[10px] font-semibold text-white/20 uppercase tracking-wider mb-0.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-sm text-white/50 group-hover:text-white/70 transition-colors truncate"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item.value}
                  </p>
                </div>
                <IconArrowUpRight
                  className="w-3.5 h-3.5 text-white/10 group-hover:text-white/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0"
                  stroke={2}
                />
              </a>
            ))}
          </motion.div>

          {/* ── Social Icons ── */}
          <motion.div variants={fadeUp} className="flex items-center gap-2">
            {SOCIALS.map((social, i) => (
              <motion.a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3, scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                title={social.label}
              >
                <social.icon
                  className="w-4 h-4 text-white/30 transition-colors duration-200"
                  stroke={1.5}
                  onMouseEnter={(e) => (e.currentTarget.style.color = social.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                />
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* ═══════ Right: Form Card ═══════ */}
        
      </motion.div>
    </section>
  );
};

export default Contact;