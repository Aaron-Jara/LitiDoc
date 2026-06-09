import { Fragment } from "react";
import { Card } from "@/components/ui/card";
import FadeInSection from "./FadeInSection";
import SectionLabel from "./SectionLabel";

const workflowSteps = [
  {
    name: "Review Documents",
    time: "3–4 hours",
    painPoint: "Copy-pasting across PDFs",
  },
  {
    name: "Build Timeline",
    time: "2–3 hours",
    painPoint: "Manual Word table, no citation tracking",
  },
  {
    name: "Draft Background",
    time: "4–5 hours",
    painPoint: "Rewriting from scratch each case",
  },
  {
    name: "Classify Damages",
    time: "2–3 hours",
    painPoint: "Subjective categorization, error-prone",
  },
  {
    name: "Build Excel Schedule",
    time: "3–4 hours",
    painPoint: "Manual formulas, no source links",
  },
];

function VerticalConnector() {
  return (
    <div
      className="flex flex-col items-center py-1 @[62rem]:hidden"
      aria-hidden="true"
    >
      <div className="h-4 w-px bg-slate-200" />
      <span className="text-slate-300">↓</span>
      <div className="h-4 w-px bg-slate-200" />
    </div>
  );
}

function HorizontalConnector() {
  return (
    <div
      className="hidden shrink-0 items-center self-center px-1 @[62rem]:flex"
      aria-hidden="true"
    >
      <div className="h-px w-2 bg-slate-200" />
      <span className="px-0.5 text-slate-300">→</span>
      <div className="h-px w-2 bg-slate-200" />
    </div>
  );
}

export default function ProblemSection() {
  return (
    <FadeInSection className="border-b border-slate-200 bg-slate-50 py-20 md:py-28">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>The Problem</SectionLabel>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Litigation consultants spend 2 days on every case
          </h2>
        </div>

        <div className="@container mt-14 w-full min-w-0 overflow-hidden">
          <div className="flex w-full min-w-0 flex-col items-stretch @[62rem]:flex-row @[62rem]:items-stretch @[62rem]:justify-center">
            {workflowSteps.map((step, index) => (
              <Fragment key={step.name}>
                <Card className="min-w-0 w-full border border-slate-200 bg-white p-4 shadow-none ring-0 transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 @[62rem]:basis-0 @[62rem]:flex-1">
                  <p className="font-semibold text-slate-900">{step.name}</p>
                  <p className="mt-2 font-mono text-sm text-indigo-600">
                    {step.time}
                  </p>
                  <p className="mt-1 text-sm break-words text-slate-500">
                    {step.painPoint}
                  </p>
                </Card>
                {index < workflowSteps.length - 1 && (
                  <>
                    <VerticalConnector />
                    <HorizontalConnector />
                  </>
                )}
              </Fragment>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-lg font-semibold text-slate-900">
          48+ hours per case. Manual, error-prone, expensive.
        </p>
      </div>
    </FadeInSection>
  );
}
