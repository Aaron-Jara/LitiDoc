"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types";
import FadeInSection from "./FadeInSection";
import SectionLabel from "./SectionLabel";

const PROCESSING_STEPS = [
  "Indexing and classifying documents",
  "Extracting timeline events",
  "Drafting background section",
  "Classifying financial damages",
  "Building Excel schedule",
];

const DELIVERABLES = [
  "Timeline Report",
  "Background Draft",
  "Damage Register",
  "Excel Workbook",
];

export type UploadPhase = "idle" | "uploading" | "processing" | "complete" | "error";

interface UploadSectionProps {
  selectedFiles: File[];
  jobId: string | null;
  status: JobStatus | null;
  phase: UploadPhase;
  uploadProgress: number;
  error: string | null;
  onFilesSelected: (files: File[]) => void;
  onRetry: () => void;
}

function getStepState(
  stepIndex: number,
  currentStage: number,
  isComplete: boolean,
): "completed" | "active" | "pending" {
  if (isComplete || currentStage > stepIndex) return "completed";
  if (currentStage === stepIndex) return "active";
  return "pending";
}

export default function UploadSection({
  selectedFiles,
  jobId,
  status,
  phase,
  uploadProgress,
  error,
  onFilesSelected,
  onRetry,
}: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected],
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      event.target.value = "";
    },
    [onFilesSelected],
  );

  const currentStage = status?.current_stage ?? 0;
  const processingProgress = status?.progress ?? 0;
  const isProcessingComplete = status?.status === "complete";

  return (
    <FadeInSection id="upload" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <SectionLabel>Get Started</SectionLabel>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Upload your case files
          </h2>
          <p className="text-lg text-slate-600">
            Drag and drop PDFs or select files from your computer.
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card className="relative overflow-hidden border border-slate-200 bg-white p-8 shadow-sm ring-0">
            {isDragging && phase === "idle" && (
              <BorderBeam
                size={120}
                duration={8}
                borderWidth={2}
                colorFrom="#6366f1"
                colorTo="#818cf8"
              />
            )}

            {phase === "complete" ? (
              <div>
                <div className="flex items-center gap-2">
                  <Check className="size-5 shrink-0 text-green-600" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Analysis Complete
                  </h3>
                </div>
                <div className="my-4 border-b border-slate-200" />
                <p className="text-sm font-medium text-slate-900">
                  Deliverables Ready:
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                  {DELIVERABLES.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant="default"
                  className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Link href={`/results/${jobId}`}>
                    Open Analysis Workspace →
                  </Link>
                </Button>
              </div>
            ) : phase === "error" ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Processing failed. Please try again.</AlertTitle>
                  {error && (
                    <AlertDescription>{error}</AlertDescription>
                  )}
                </Alert>
                <Button
                  type="button"
                  variant="default"
                  onClick={onRetry}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  Retry
                </Button>
              </div>
            ) : phase === "uploading" ? (
              <div>
                <div className="space-y-2">
                  {selectedFiles.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="flex items-center gap-2"
                    >
                      <FileText className="size-4 shrink-0 text-slate-400" />
                      <span className="truncate font-mono text-sm text-slate-700">
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
                <Progress
                  value={uploadProgress}
                  className="mt-6 h-2 bg-slate-200 [&_[data-slot=progress-indicator]]:bg-indigo-600"
                />
                <p className="mt-2 font-mono text-sm text-slate-600">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            ) : phase === "processing" ? (
              <div>
                <Progress
                  value={processingProgress}
                  className="h-2 bg-slate-200 [&_[data-slot=progress-indicator]]:bg-indigo-600"
                />
                <p className="mt-2 font-mono text-sm text-slate-600">
                  {processingProgress}% complete
                </p>
                <div className="mt-6 space-y-3">
                  {PROCESSING_STEPS.map((step, index) => {
                    const stepState = getStepState(
                      index,
                      currentStage,
                      isProcessingComplete,
                    );

                    return (
                      <div key={step} className="flex items-center gap-3">
                        {stepState === "completed" && (
                          <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                        )}
                        {stepState === "active" && (
                          <Loader2 className="size-4 shrink-0 animate-spin text-indigo-600" />
                        )}
                        {stepState === "pending" && (
                          <Circle className="size-4 shrink-0 text-slate-300" />
                        )}
                        <span
                          className={cn(
                            "text-sm",
                            stepState === "active"
                              ? "font-medium text-slate-900"
                              : "text-slate-600",
                          )}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "rounded-lg border-2 border-dashed px-8 py-12 text-center transition-colors",
                  isDragging
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-300",
                )}
              >
                <Upload className="mx-auto size-8 text-slate-400" />
                <p className="mt-4 text-sm font-medium text-slate-700">
                  Drag and drop PDFs here
                </p>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 bg-slate-900 text-white hover:bg-slate-800"
                >
                  Select files
                </Button>
                <p className="mt-2 text-xs text-slate-400">
                  Accepted: PDF only — 500MB max
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </Card>
        </div>
      </div>
    </FadeInSection>
  );
}
