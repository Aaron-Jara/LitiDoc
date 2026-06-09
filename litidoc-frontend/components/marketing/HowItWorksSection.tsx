"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import FadeInSection from "./FadeInSection";
import ParallelAgentsProgress from "./ParallelAgentsProgress";
import SectionLabel from "./SectionLabel";

const STEPS = [
  {
    title: "Upload Documents",
    description:
      "Drag and drop your case files — depositions, financial records, emails. Supports PDFs up to 500MB total.",
  },
  {
    title: "Document Classification",
    description:
      "Each document is automatically identified by type, broken into sections, and prepared for parallel processing.",
  },
  {
    title: "Parallel AI Agents",
    description:
      "Four specialized agents run simultaneously — one per deliverable — so processing time stays flat regardless of document count.",
  },
  {
    title: "Source Verification",
    description:
      "Every extracted fact, date, and figure is traced back to its exact source: document name, page number, and line.",
  },
  {
    title: "Generate Deliverables",
    description:
      "A sourced timeline, background draft, damage register, and formatted Excel workbook are packaged and ready to download.",
  },
];

const uploadedFiles = [
  { name: "Smith_Deposition.pdf", size: "4.2MB" },
  { name: "Financial_Records.pdf", size: "2.8MB" },
  { name: "Email_Chain.pdf", size: "1.1MB" },
];

const classifiedDocuments = [
  { name: "Smith_Deposition.pdf", type: "Deposition", pages: 142 },
  { name: "Financial_Records.pdf", type: "Financial", pages: 89 },
  { name: "Email_Chain.pdf", type: "Correspondence", pages: 34 },
];

const deliverables = [
  {
    name: "Timeline Report",
    detail: "47 events · fully sourced",
  },
  {
    name: "Background Draft",
    detail: "8 pages · inline citations",
  },
  {
    name: "Damage Register",
    detail: "$266,840 across 6 categories",
  },
  {
    name: "Excel Workbook",
    detail: "4 sheets · formulas included",
  },
];

function PreviewLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      {children}
    </p>
  );
}

function PreviewDivider() {
  return <div className="my-3 border-b border-slate-200" />;
}

function StepPreview({ step }: { step: number }) {
  switch (step) {
    case 0:
      return (
        <>
          <PreviewLabel>Uploaded Files</PreviewLabel>
          <PreviewDivider />
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-slate-400" />
                  <span className="truncate font-mono text-sm text-slate-700">
                    {file.name}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-xs text-slate-500">
                  {file.size}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-xs text-slate-500">
            Total: 3 files · 8.1MB
          </p>
        </>
      );
    case 1:
      return (
        <>
          <PreviewLabel>Document Index</PreviewLabel>
          <PreviewDivider />
          <div className="space-y-4">
            {classifiedDocuments.map((doc) => (
              <div key={doc.name}>
                <p className="font-mono text-sm text-slate-900">{doc.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Type: {doc.type} · {doc.pages} pages
                </p>
              </div>
            ))}
          </div>
        </>
      );
    case 2:
      return (
        <>
          <PreviewLabel>Parallel AI Agents</PreviewLabel>
          <PreviewDivider />
          <ParallelAgentsProgress />
        </>
      );
    case 3:
      return (
        <>
          <PreviewLabel>Source Verification</PreviewLabel>
          <PreviewDivider />
          <p className="text-sm font-medium text-slate-900">
            Event: Termination Notice
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-slate-700">
                <Check className="size-3.5 shrink-0 text-green-600" />
                Smith_Deposition.pdf
              </p>
              <p className="mt-0.5 pl-5 font-mono text-xs text-slate-500">
                p.12 lines 4–9
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm text-slate-700">
                <Check className="size-3.5 shrink-0 text-green-600" />
                Email_Chain.pdf
              </p>
              <p className="mt-0.5 pl-5 font-mono text-xs text-slate-500">
                p.4
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm">
            <span className="text-slate-600">Confidence: </span>
            <span className="font-semibold text-indigo-600">98%</span>
          </p>
        </>
      );
    case 4:
      return (
        <>
          <PreviewLabel>Deliverables Ready</PreviewLabel>
          <PreviewDivider />
          <div className="space-y-4">
            {deliverables.map((item) => (
              <div key={item.name}>
                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  <Check className="size-3.5 shrink-0 text-green-600" />
                  {item.name}
                </p>
                <p className="mt-1 pl-5 font-mono text-xs text-slate-500">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </>
      );
    default:
      return null;
  }
}

const stepListVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const stepItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function HowItWorksSection() {
  const prefersReducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setActiveStep((current) => (current + 1) % STEPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [paused, prefersReducedMotion]);

  return (
    <FadeInSection className="border-b border-slate-200 bg-slate-50 py-20 md:py-28">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            From upload to deliverables in under 3 minutes
          </h2>
        </div>

        <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-10 lg:flex-row lg:gap-12">
          <motion.ol
            className="w-full min-w-0 lg:w-2/5"
            initial={prefersReducedMotion ? false : "hidden"}
            whileInView={prefersReducedMotion ? undefined : "visible"}
            viewport={{ once: true, margin: "-80px" }}
            variants={stepListVariants}
          >
            {STEPS.map((step, index) => {
              const isActive = activeStep === index;

              return (
                <motion.li
                  key={step.title}
                  variants={stepItemVariants}
                  className="relative flex gap-4 pb-10 last:pb-0"
                  onMouseEnter={() => {
                    setPaused(true);
                    setActiveStep(index);
                  }}
                  onMouseLeave={() => setPaused(false)}
                >
                  {index < STEPS.length - 1 && (
                    <div
                      aria-hidden="true"
                      className={cn(
                        "absolute left-4 top-8 h-[calc(100%-0.5rem)] w-0 border-l-2",
                        activeStep >= index
                          ? "border-indigo-200"
                          : "border-slate-200",
                      )}
                    />
                  )}

                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <h3
                      className={cn(
                        "text-base font-semibold",
                        isActive ? "text-indigo-600" : "text-slate-900",
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </motion.ol>

          <div className="w-full min-w-0 lg:w-3/5">
            <Card className="min-h-[320px] border border-slate-200 bg-white p-6 shadow-sm ring-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <StepPreview step={activeStep} />
                </motion.div>
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </FadeInSection>
  );
}
