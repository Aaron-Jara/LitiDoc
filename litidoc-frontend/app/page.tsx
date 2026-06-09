"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Footer from "@/components/marketing/Footer";
import HeroSection from "@/components/marketing/HeroSection";
import HowItWorksSection from "@/components/marketing/HowItWorksSection";
import MarketingNav from "@/components/marketing/MarketingNav";
import MetricsStrip from "@/components/marketing/MetricsStrip";
import ProblemSection from "@/components/marketing/ProblemSection";
import SolutionSection from "@/components/marketing/SolutionSection";
import UploadSection, {
  type UploadPhase,
} from "@/components/marketing/UploadSection";
import { uploadFiles, usePolling } from "@/lib/api";

const MAX_TOTAL_BYTES = 500 * 1024 * 1024;

function validatePdfFiles(files: File[]): string | null {
  const pdfs = files.filter(
    (file) =>
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
  );

  if (pdfs.length === 0) {
    return "Please upload at least one PDF file.";
  }

  if (pdfs.length !== files.length) {
    return "Only PDF files are accepted.";
  }

  const totalSize = pdfs.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_BYTES) {
    return "Total upload size must be 500MB or less.";
  }

  return null;
}

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { status } = usePolling(jobId);

  const scrollToUpload = useCallback(() => {
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const resetUpload = useCallback(() => {
    clearProgressInterval();
    setSelectedFiles([]);
    setJobId(null);
    setPhase("idle");
    setUploadProgress(0);
    setError(null);
  }, []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const validationError = validatePdfFiles(files);
    if (validationError) {
      setError(validationError);
      setPhase("error");
      return;
    }

    clearProgressInterval();
    setSelectedFiles(files);
    setError(null);
    setJobId(null);
    setPhase("uploading");
    setUploadProgress(0);

    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((current) => Math.min(current + 4, 90));
    }, 180);

    try {
      const newJobId = await uploadFiles(files);
      clearProgressInterval();
      setUploadProgress(100);
      setJobId(newJobId);
      setPhase("processing");
    } catch (uploadError) {
      clearProgressInterval();
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload files.",
      );
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (!status) return;

    if (status.status === "complete") {
      setPhase("complete");
      setError(null);
      return;
    }

    if (status.status === "error") {
      setError(status.error || status.message || "Processing failed.");
      setPhase("error");
    }
  }, [status?.status, status?.error, status?.message]);

  useEffect(() => {
    return () => clearProgressInterval();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MarketingNav onStartClick={scrollToUpload} />
      <main>
        <HeroSection onStartClick={scrollToUpload} />
        <MetricsStrip />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <UploadSection
          selectedFiles={selectedFiles}
          jobId={jobId}
          status={status}
          phase={phase}
          uploadProgress={uploadProgress}
          error={error}
          onFilesSelected={handleFilesSelected}
          onRetry={resetUpload}
        />
      </main>
      <Footer />
    </div>
  );
}
