"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GridBackground } from "@/components/ui/grid-background";
import HeroOutputPreview from "./HeroOutputPreview";

interface HeroSectionProps {
  onStartClick: () => void;
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function HeroSection({ onStartClick }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const motionProps = prefersReducedMotion
    ? { initial: false, animate: undefined }
    : { initial: "hidden", animate: "visible" };

  return (
    <section className="relative border-b border-slate-200">
      <GridBackground>
        <div className="mx-auto px-6 pb-20 pt-16 md:pb-28 md:pt-24">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            variants={containerVariants}
            {...motionProps}
          >
            <motion.div variants={itemVariants}>
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 text-slate-500"
              >
                AI-Powered Legal Document Processing
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 text-5xl font-bold tracking-tight md:text-7xl"
            >
              <span className="text-slate-900">2 Days</span>
              <span className="mx-3 text-slate-300">→</span>
              <span className="text-slate-900">2 Minutes</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mx-auto mt-4 max-w-2xl text-lg text-slate-500 md:text-xl"
            >
              Upload your case files. Get a sourced timeline, background section,
              and Excel damage schedule — powered by parallel Claude AI agents.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8">
              <Button
                variant="default"
                onClick={onStartClick}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                Start Processing →
              </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <HeroOutputPreview />
            </motion.div>
          </motion.div>
        </div>
      </GridBackground>
    </section>
  );
}
