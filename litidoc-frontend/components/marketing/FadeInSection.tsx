"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface FadeInSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}

export default function FadeInSection({
  children,
  className = "",
  delay = 0,
  id,
}: FadeInSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
