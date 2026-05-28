"use client";

import { useState } from "react";
import Header from "@/components/Header";
import CaseSummary from "@/components/CaseSummary";
import AnalysisAnimation from "@/components/AnalysisAnimation";
import ResultsTabs from "@/components/ResultsTabs";
import UploadCard from "@/components/UploadCard";
import { mockAnalysisData } from "@/lib/mockAnalysis";
import { LitiDocAnalysisResponse } from "@/lib/types";
import { classifyFiles, ClassifiedFile } from "@/lib/fileClassification";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [classifiedFiles, setClassifiedFiles] = useState<ClassifiedFile[]>([]);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [analysisData, setAnalysisData] = useState<LitiDocAnalysisResponse | null>(null);
  const [isRichAnalysisMode, setIsRichAnalysisMode] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    const classification = classifyFiles(files);
    setClassifiedFiles(classification.files);
    setIsRichAnalysisMode(classification.isRichAnalysisMode);
  };

  const handleAnalyzeCase = () => {
    if (selectedFiles.length === 0) return;
    
    setIsAnalysisRunning(true);
    setIsAnalysisComplete(false);
  };

  const handleAnalysisComplete = () => {
    setIsAnalysisRunning(false);
    setIsAnalysisComplete(true);
    
    if (isRichAnalysisMode) {
      setAnalysisData(mockAnalysisData);
    } else {
      setAnalysisData({
        caseName: "Uploaded Case Package",
        parties: {
          plaintiff: "Unknown",
          defendant: "Unknown",
        },
        matterType: "Unknown",
        jurisdiction: "Unknown",
        currentStage: "Analysis complete",
        documentIndex: classifiedFiles.map((file, index) => ({
          ref: file.ref,
          file: file.name,
          type: file.detectedType,
          summary: file.summary || "Backend extraction required for summary.",
          pages: file.pages || 1,
        })),
        timeline: [],
        backgroundDraft: "",
        damageRegister: [],
        extractedEvents: 0,
        damageCategories: 0,
        sourcesCited: 0,
      });
    }
  };

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
                {isRichAnalysisMode && (
                  <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Rich analysis available
                  </div>
                )}
                {!isRichAnalysisMode && (
                  <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Generic intake package detected
                  </div>
                )}
                {!isRichAnalysisMode && (
                  <p className="text-sm text-slate-500 mb-4">Backend extraction required for full analysis</p>
                )}
                <button
                  onClick={handleAnalyzeCase}
                  className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
                >
                  Analyze Case File
                </button>
              </div>
            )}

            {isAnalysisRunning && (
              <div className="mt-6">
                <AnalysisAnimation
                  onComplete={handleAnalysisComplete}
                  isRichAnalysisMode={isRichAnalysisMode}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-[320px] flex-shrink-0 space-y-6">
              <CaseSummary data={analysisData} documentCount={selectedFiles.length} />
              <UploadCard
                onFilesSelected={handleFilesSelected}
                classifiedFiles={classifiedFiles}
                isAnalysisComplete={isAnalysisComplete}
              />
            </div>
            <div className="flex-1 min-w-0">
              <ResultsTabs 
                data={analysisData} 
                isAnalysisComplete={isAnalysisComplete}
                isRichAnalysisMode={isRichAnalysisMode}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
