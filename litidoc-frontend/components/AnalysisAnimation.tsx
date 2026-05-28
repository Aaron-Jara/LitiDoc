"use client";

import type { JobStatus } from "@/types";

interface AnalysisAnimationProps {
  status: JobStatus | null;
  pollError: string | null;
  loading: boolean;
  isLoadingResults?: boolean;
}

const STAGE_LABELS: Record<number, string> = {
  0: "Indexing and classifying documents",
  1: "Extracting timeline and key events",
  2: "Drafting background section",
  3: "Classifying financial damages",
  4: "Building Excel schedule",
};

const STAGE_ORDER = [0, 1, 2, 3, 4];

export default function AnalysisAnimation({
  status,
  pollError,
  loading,
  isLoadingResults = false,
}: AnalysisAnimationProps) {
  const currentStage = status?.current_stage ?? 0;
  const progress = status?.progress ?? 0;
  const message = status?.message ?? "Starting analysis…";
  const highlights = status?.timeline_highlights_preview ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Analyzing case documents
        </h3>
        <p className="text-sm text-slate-600">{message}</p>
        {loading && (
          <p className="text-xs text-slate-400 mt-1">
            {isLoadingResults
              ? "Loading results dashboard…"
              : "Refreshing status…"}
          </p>
        )}
      </div>

      <div className="mb-4">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
      </div>

      <div className="space-y-3 mb-6">
        {STAGE_ORDER.map((stage) => {
          const label = STAGE_LABELS[stage];
          const isDone = currentStage > stage;
          const isActive = currentStage === stage;

          return (
            <div key={stage} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isDone ? "✓" : stage + 1}
              </div>
              <span
                className={`text-sm ${
                  isActive ? "text-slate-900 font-medium" : "text-slate-600"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {highlights.length > 0 && (
        <div className="border-t border-slate-200 pt-6">
          <h4 className="text-sm font-medium text-slate-700 mb-4">
            Key events ({highlights.length})
          </h4>
          <div className="relative overflow-x-auto pb-16">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 min-w-max" />
            <div className="flex justify-between gap-6 min-w-max px-2">
              {highlights.map((event) => (
                <div
                  key={event.source_event_id}
                  className="relative flex flex-col items-center flex-shrink-0 w-28"
                >
                  <div className="w-3 h-3 rounded-full border-2 border-white bg-blue-500" />
                  <div className="absolute top-8 text-center">
                    <p className="text-xs font-medium text-slate-900 line-clamp-2">
                      {event.date_text || event.date}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-3 mt-1">
                      {event.brief_explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {pollError && (
        <div
          className={`border-t border-slate-200 pt-4 mt-4 text-sm ${
            pollError.toLowerCase().includes("reconnecting")
              ? "text-slate-600"
              : "text-red-600"
          }`}
        >
          {pollError}
        </div>
      )}

      {status?.warnings && status.warnings.length > 0 && (
        <div className="border-t border-slate-200 pt-4 mt-4 text-sm text-amber-700">
          Completed with {status.warnings.length} warning(s). Some stages used
          fallback data.
        </div>
      )}

      {status?.status === "error" && (
        <div className="border-t border-slate-200 pt-4 mt-4 text-sm text-red-600">
          {status.error || "Processing failed."}
        </div>
      )}
    </div>
  );
}
