"use client";

import { useState } from "react";
import UploadCard from "@/components/UploadCard";
import AnalysisAnimation from "@/components/AnalysisAnimation";
import TimelineTable from "@/components/TimelineTable";
import { downloadExcel, downloadWord } from "@/lib/api";
import type { ClassifiedFile } from "@/lib/fileClassification";
import type { LitiDocAnalysisResponse } from "@/lib/types";
import type { JobStatus } from "@/types";
import FadeInSection from "./FadeInSection";
import SectionLabel from "./SectionLabel";

interface UploadSectionProps {
  classifiedFiles: ClassifiedFile[];
  isAnalysisRunning: boolean;
  isAnalysisComplete: boolean;
  isLoadingResults: boolean;
  isRichAnalysisMode: boolean;
  analysisData: LitiDocAnalysisResponse | null;
  analysisError: string | null;
  jobId: string | null;
  status: JobStatus | null;
  pollError: string | null;
  isPolling: boolean;
  hasExcel: boolean;
  hasWord: boolean;
  onFilesSelected: (files: File[]) => void;
  onAnalyzeCase: () => void;
}

export default function UploadSection({
  classifiedFiles,
  isAnalysisRunning,
  isAnalysisComplete,
  isLoadingResults,
  isRichAnalysisMode,
  analysisData,
  analysisError,
  jobId,
  status,
  pollError,
  isPolling,
  hasExcel,
  hasWord,
  onFilesSelected,
  onAnalyzeCase,
}: UploadSectionProps) {
  const [isExcelLoading, setIsExcelLoading] = useState(false);
  const [isWordLoading, setIsWordLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadExcel = async () => {
    if (!jobId) return;
    setDownloadError(null);
    setIsExcelLoading(true);
    try {
      await downloadExcel(jobId);
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Excel download failed.",
      );
    } finally {
      setIsExcelLoading(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!jobId) return;
    setDownloadError(null);
    setIsWordLoading(true);
    try {
      await downloadWord(jobId);
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Word download failed.",
      );
    } finally {
      setIsWordLoading(false);
    }
  };

  return (
    <FadeInSection id="upload" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <SectionLabel>Get Started</SectionLabel>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Upload your case files
          </h2>
          <p className="text-lg text-slate-600">
            Drag and drop PDFs or select files from your computer
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <UploadCard
              compact
              onFilesSelected={onFilesSelected}
              classifiedFiles={classifiedFiles}
              isAnalysisComplete={isAnalysisComplete}
            />

            <p className="mt-4 text-center text-xs text-slate-500">
              Accepted: PDF (max 500MB total)
            </p>

            {classifiedFiles.length > 0 && !isAnalysisRunning && !isAnalysisComplete && (
              <div className="mt-6 text-center">
                <p className="mb-4 text-sm text-slate-500">
                  {classifiedFiles.length} file(s) ready for analysis
                </p>
                <button
                  type="button"
                  onClick={onAnalyzeCase}
                  className="rounded-lg bg-slate-900 px-8 py-3 font-medium text-white transition-colors hover:bg-slate-800"
                >
                  Analyze Case File
                </button>
              </div>
            )}

            {analysisError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {analysisError}
              </div>
            )}
          </div>

          {(isAnalysisRunning || isLoadingResults) && (
            <div className="mt-8">
              <AnalysisAnimation
                status={status}
                pollError={pollError}
                loading={isPolling || isLoadingResults}
                isLoadingResults={isLoadingResults}
              />
            </div>
          )}

          {isAnalysisComplete && analysisData && (
            <div className="mt-8 space-y-8">
              <TimelineTable
                events={analysisData.timeline}
                highlights={analysisData.timelineHighlights}
                isRichAnalysisMode={isRichAnalysisMode}
              />

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={!jobId || !hasExcel || isExcelLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {isExcelLoading ? "Downloading…" : "Download Excel Schedule"}
                </button>
                {hasWord && (
                  <button
                    type="button"
                    onClick={handleDownloadWord}
                    disabled={!jobId || isWordLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isWordLoading ? "Preparing…" : "Download Word Draft"}
                  </button>
                )}
              </div>

              {downloadError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                  {downloadError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </FadeInSection>
  );
}
