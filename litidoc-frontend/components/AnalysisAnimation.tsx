"use client";

import { useState, useEffect } from "react";

interface AnalysisAnimationProps {
  onComplete: () => void;
  isRichAnalysisMode: boolean;
}

const STEPS = [
  "Classifying documents",
  "Parsing examination transcript and speaker-attributed Q&A",
  "Normalizing source citations",
  "Extracting dated events",
  "Building chronology",
  "Drafting background section",
  "Classifying heads of damage",
  "Preparing exports",
];

const STATUS_MESSAGES = [
  "Reading uploaded case package…",
  "Identifying pleadings, HR records, benefits records, transcripts, and financial records…",
  "Parsing examination transcript and speaker-attributed Q&A…",
  "Normalizing citations across source documents…",
  "Extracting dated events with source references…",
  "Building litigation chronology…",
  "Classifying damages by head of loss…",
  "Preparing Word and Excel deliverables…",
];

const TIMELINE_EVENTS = [
  { date: "Jan 5, 2018", label: "Employment agreement" },
  { date: "Year 3/4", label: "Strong performance reviews" },
  { date: "Year 5", label: "Holt joins as Director" },
  { date: "Mar 2, 2024", label: "Demotion memo" },
  { date: "Oct 12, 2024", label: "Internal complaint" },
  { date: "Nov 5, 2024", label: "Medical leave" },
  { date: "Nov 15, 2024", label: "STD benefits approved" },
  { date: "May 10, 2026", label: "Terminated during leave" },
  { date: "Jul 14, 2026", label: "Director deposition" },
];

export default function AnalysisAnimation({ onComplete, isRichAnalysisMode }: AnalysisAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => {
        if (prev < STATUS_MESSAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    const timelineInterval = setInterval(() => {
      setTimelineIndex((prev) => {
        if (isRichAnalysisMode && prev < TIMELINE_EVENTS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    const completionTimeout = setTimeout(() => {
      setIsComplete(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 5500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(messageInterval);
      clearInterval(timelineInterval);
      clearTimeout(completionTimeout);
    };
  }, [onComplete, isRichAnalysisMode]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Analyzing case documents</h3>
        <p className="text-sm text-slate-600">{STATUS_MESSAGES[currentMessage]}</p>
      </div>

      <div className="space-y-3 mb-6">
        {STEPS.map((step, index) => {
          let statusColor = "bg-slate-200";
          let statusIcon = null;
          let textColor = "text-slate-400";

          if (index < currentStep) {
            statusColor = "bg-emerald-500";
            statusIcon = (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            );
            textColor = "text-slate-900";
          } else if (index === currentStep) {
            statusColor = "bg-blue-500";
            textColor = "text-slate-900 font-medium";
          }

          return (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${statusColor} transition-colors`}>
                {statusIcon}
              </div>
              <span className={`text-sm ${textColor} transition-colors`}>{step}</span>
            </div>
          );
        })}
      </div>

      {isRichAnalysisMode && (
        <div className="border-t border-slate-200 pt-6">
          <h4 className="text-sm font-medium text-slate-700 mb-4">Building timeline</h4>
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200"></div>
            <div className="flex justify-between">
              {TIMELINE_EVENTS.map((event, index) => {
                const isVisible = index <= timelineIndex;
                const isActive = index === timelineIndex;

                return (
                  <div key={index} className="relative flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full border-2 border-white transition-all duration-300 ${
                        isVisible
                          ? isActive
                            ? "bg-blue-500 scale-125"
                            : "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    ></div>
                    {isVisible && (
                      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 text-center">
                        <p className="text-xs font-medium text-slate-900">{event.date}</p>
                        <p className="text-xs text-slate-500">{event.label}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="border-t border-slate-200 pt-6 mt-6">
          <div className="flex items-center gap-2 text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Analysis complete</span>
          </div>
        </div>
      )}
    </div>
  );
}
