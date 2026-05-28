"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import CaseSummary from "@/components/CaseSummary";
import AnalysisAnimation from "@/components/AnalysisAnimation";
import ResultsTabs from "@/components/ResultsTabs";
import UploadCard from "@/components/UploadCard";
import { fetchJobResults, uploadFiles, usePolling } from "@/lib/api";
import { LitiDocAnalysisResponse } from "@/lib/types";
import { classifyFiles, ClassifiedFile } from "@/lib/fileClassification";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [classifiedFiles, setClassifiedFiles] = useState<ClassifiedFile[]>([]);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [analysisData, setAnalysisData] = useState<LitiDocAnalysisResponse | null>(
    null,
  );
  const [isRichAnalysisMode, setIsRichAnalysisMode] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const loadedJobIdRef = useRef<string | null>(null);

  const { status, loading: isPolling, error: pollError } = usePolling(jobId);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    const classification = classifyFiles(files);
    setClassifiedFiles(classification.files);
    setIsRichAnalysisMode(false);
    setIsAnalysisComplete(false);
    setAnalysisData(null);
    setJobId(null);
    setAnalysisError(null);
    loadedJobIdRef.current = null;
    setIsLoadingResults(false);
  };

  const handleAnalyzeCase = async () => {
    if (selectedFiles.length === 0) return;

    setAnalysisError(null);
    setIsAnalysisRunning(true);
    setIsAnalysisComplete(false);
    setAnalysisData(null);
    setJobId(null);
    loadedJobIdRef.current = null;
    setIsLoadingResults(false);

    try {
      const newJobId = await uploadFiles(selectedFiles);
      setJobId(newJobId);
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Failed to start analysis.",
      );
      setIsAnalysisRunning(false);
    }
  };

  useEffect(() => {
    if (!jobId || !status) {
      return;
    }

    if (status.status === "error") {
      setAnalysisError(status.error || status.message || "Processing failed.");
      setIsAnalysisRunning(false);
      setIsLoadingResults(false);
      return;
    }

    if (status.status !== "complete") {
      return;
    }

    if (loadedJobIdRef.current === jobId) {
      return;
    }

    let cancelled = false;
    setIsLoadingResults(true);
    setAnalysisError(null);

    (async () => {
      try {
        const data = await fetchJobResults(jobId);
        if (cancelled) return;

        loadedJobIdRef.current = jobId;
        setAnalysisData(data);
        setIsRichAnalysisMode(true);
        setIsAnalysisComplete(true);
        setIsAnalysisRunning(false);
        setIsLoadingResults(false);
      } catch (error) {
        if (cancelled) return;
        setAnalysisError(
          error instanceof Error
            ? error.message
            : "Failed to load analysis results.",
        );
        setIsAnalysisRunning(false);
        setIsLoadingResults(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, status?.status]);

  const hasExcel = Boolean(status?.download_url);
  const hasWord = Boolean(status?.word_download_url ?? status?.background_word_count);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        hasFiles={selectedFiles.length > 0}
        isAnalysisRunning={isAnalysisRunning}
        isAnalysisComplete={isAnalysisComplete}
      />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!isAnalysisComplete ? (
          <div className="max-w-3xl mx-auto">
            <UploadCard
              onFilesSelected={handleFilesSelected}
              classifiedFiles={classifiedFiles}
              isAnalysisComplete={isAnalysisComplete}
            />

            {classifiedFiles.length > 0 && !isAnalysisRunning && (
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 mb-4">
                  {selectedFiles.length} file(s) ready for backend analysis
                </p>
                <button
                  onClick={handleAnalyzeCase}
                  className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
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

            {(isAnalysisRunning || isLoadingResults) && (
              <div className="mt-6">
                <AnalysisAnimation
                  status={status}
                  pollError={pollError}
                  loading={isPolling || isLoadingResults}
                  isLoadingResults={isLoadingResults}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-[320px] flex-shrink-0 space-y-6">
              <CaseSummary
                data={analysisData}
                documentCount={
                  analysisData?.documentIndex.length ?? selectedFiles.length
                }
              />
              <UploadCard
                onFilesSelected={handleFilesSelected}
                classifiedFiles={classifiedFiles}
                isAnalysisComplete={isAnalysisComplete}
              />
            </div>
            <div className="flex-1 min-w-0">
              <ResultsTabs
                data={analysisData}
                jobId={jobId}
                isAnalysisComplete={isAnalysisComplete}
                isRichAnalysisMode={isRichAnalysisMode}
                hasExcel={hasExcel}
                hasWord={hasWord}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
