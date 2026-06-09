"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ResultsTabs from "@/components/ResultsTabs";
import { fetchJobResults, usePolling } from "@/lib/api";
import type { LitiDocAnalysisResponse } from "@/lib/types";

export default function ResultsPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const [analysisData, setAnalysisData] = useState<LitiDocAnalysisResponse | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const loadedJobIdRef = useRef<string | null>(null);

  const { status } = usePolling(jobId);

  useEffect(() => {
    if (!jobId || status?.status !== "complete") {
      return;
    }

    if (loadedJobIdRef.current === jobId) {
      return;
    }

    let cancelled = false;
    setIsLoadingResults(true);
    setLoadError(null);

    (async () => {
      try {
        const data = await fetchJobResults(jobId);
        if (cancelled) return;
        loadedJobIdRef.current = jobId;
        setAnalysisData(data);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load analysis results.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingResults(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, status?.status]);

  const hasExcel = Boolean(status?.download_url);
  const hasWord = Boolean(status?.word_download_url ?? status?.background_word_count);
  const isComplete = status?.status === "complete";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-semibold text-slate-900">LitiDoc</p>
            <p className="font-mono text-xs text-slate-500">Job {jobId}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {status?.status === "processing" && (
          <p className="mb-6 text-sm text-slate-600">
            Analysis still in progress…
          </p>
        )}

        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {isLoadingResults && (
          <p className="mb-6 text-sm text-slate-600">Loading results…</p>
        )}

        <ResultsTabs
          data={analysisData}
          jobId={jobId}
          isAnalysisComplete={isComplete && Boolean(analysisData)}
          isRichAnalysisMode={Boolean(analysisData)}
          hasExcel={hasExcel}
          hasWord={hasWord}
        />
      </main>
    </div>
  );
}
