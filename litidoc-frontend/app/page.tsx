"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Footer from "@/components/marketing/Footer";
import HeroSection from "@/components/marketing/HeroSection";
import MarketingNav from "@/components/marketing/MarketingNav";
import ProblemSection from "@/components/marketing/ProblemSection";
import SolutionSection from "@/components/marketing/SolutionSection";
import UploadSection from "@/components/marketing/UploadSection";
import { fetchJobResults, uploadFiles, usePolling } from "@/lib/api";
import { classifyFiles, ClassifiedFile } from "@/lib/fileClassification";
import { LitiDocAnalysisResponse } from "@/lib/types";

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

  const scrollToUpload = useCallback(() => {
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MarketingNav onStartClick={scrollToUpload} />
      <main>
        <HeroSection onStartClick={scrollToUpload} />
        <ProblemSection />
        <SolutionSection />
        <UploadSection
          classifiedFiles={classifiedFiles}
          isAnalysisRunning={isAnalysisRunning}
          isAnalysisComplete={isAnalysisComplete}
          isLoadingResults={isLoadingResults}
          isRichAnalysisMode={isRichAnalysisMode}
          analysisData={analysisData}
          analysisError={analysisError}
          jobId={jobId}
          status={status}
          pollError={pollError}
          isPolling={isPolling}
          hasExcel={hasExcel}
          hasWord={hasWord}
          onFilesSelected={handleFilesSelected}
          onAnalyzeCase={handleAnalyzeCase}
        />
      </main>
      <Footer />
    </div>
  );
}
