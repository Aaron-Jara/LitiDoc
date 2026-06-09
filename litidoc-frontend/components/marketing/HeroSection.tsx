"use client";

import AnimatedGrid from "./AnimatedGrid";
import FadeInSection from "./FadeInSection";

interface HeroSectionProps {
  onStartClick: () => void;
}

const stats = [
  { value: "400+", label: "pages processed" },
  { value: "45 seconds", label: "typical runtime" },
  { value: "100%", label: "sourced citations" },
];

export default function HeroSection({ onStartClick }: HeroSectionProps) {
  return (
    <FadeInSection className="relative overflow-hidden border-b border-slate-200 bg-white">
      <AnimatedGrid />
      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-600">
            AI-Powered Legal Document Processing
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
            <span className="text-primary-700">2 Days</span>
            <span className="mx-3 font-light text-slate-400">→</span>
            <span className="text-primary-700">2 Minutes</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
            Upload your case files. Get a sourced timeline, background section, and
            Excel damage schedule — powered by parallel Claude AI agents.
          </p>

          <button
            type="button"
            onClick={onStartClick}
            className="inline-flex items-center rounded-lg bg-slate-900 px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-slate-800"
          >
            Start Processing
          </button>

          <div className="mt-14 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-0">
            {stats.map((stat, index) => (
              <div key={stat.label} className="flex items-center">
                {index > 0 && (
                  <div className="mx-8 hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />
                )}
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FadeInSection>
  );
}
