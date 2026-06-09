import FadeInSection from "./FadeInSection";
import SectionLabel from "./SectionLabel";

const painPoints = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Manual document review",
    description: "Consultants read hundreds of pages across depositions, emails, and financial records by hand.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "48+ hours per case",
    description: "Building timelines, background sections, and damage schedules consumes two full working days.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    title: "Citation errors",
    description: "Manual cross-referencing leads to missed sources, inconsistent citations, and rework.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Expensive deliverables",
    description: "Every case ties up senior consultants on repetitive extraction instead of strategy.",
  },
];

export default function ProblemSection() {
  return (
    <FadeInSection className="border-b border-slate-200 bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>The Problem</SectionLabel>
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Litigation consultants spend 2 days on every case
          </h2>
          <p className="text-lg leading-relaxed text-slate-600">
            When a new matter arrives, consultants manually sift through depositions,
            financial records, and email chains. They build timelines in Word, draft
            background sections from scratch, classify damages into legal categories,
            and assemble Excel schedules — all by hand, with every fact requiring
            manual source verification.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                {point.icon}
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">{point.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </FadeInSection>
  );
}
