"use client";

import { useState } from "react";
import { downloadExcel, downloadWord } from "@/lib/api";

interface ExportsTabProps {
  jobId: string | null;
  isRichAnalysisMode: boolean;
  excelSheetNames?: string[];
  hasExcel?: boolean;
  hasWord?: boolean;
}

export default function ExportsTab({
  jobId,
  isRichAnalysisMode,
  excelSheetNames = [],
  hasExcel = false,
  hasWord = false,
}: ExportsTabProps) {
  const [isWordLoading, setIsWordLoading] = useState(false);
  const [isExcelLoading, setIsExcelLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleCreateWordDraft = async () => {
    if (!jobId) return;
    setExportError(null);
    setIsWordLoading(true);
    try {
      await downloadWord(jobId);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Word download failed.",
      );
    } finally {
      setIsWordLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!jobId) return;
    setExportError(null);
    setIsExcelLoading(true);
    try {
      await downloadExcel(jobId);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Excel download failed.",
      );
    } finally {
      setIsExcelLoading(false);
    }
  };

  if (!isRichAnalysisMode) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">Export cards require backend extraction.</p>
      </div>
    );
  }

  const sheets =
    excelSheetNames.length > 0
      ? excelSheetNames
      : [
          "Summary",
          "Past Lost Income",
          "Future Lost Income",
          "Medical Expenses",
          "Future Care Costs",
          "Out of Pocket",
          "Loss of Services",
          "Non Pecuniary",
          "Pre Judgment Interest",
        ];

  return (
    <div className="space-y-6">
      {exportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {exportError}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Word Background Draft
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Formal background section with inline source citations.
            </p>
            <button
              onClick={handleCreateWordDraft}
              disabled={!jobId || !hasWord || isWordLoading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isWordLoading ? "Preparing…" : "Download Word Draft"}
            </button>
            {!hasWord && (
              <p className="text-xs text-slate-500 mt-2">
                Background section not ready yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Excel Damage Schedule
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Damage schedule workbook with category sheets and source columns.
            </p>
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Generated sheets:</p>
              <div className="flex flex-wrap gap-2">
                {sheets.map((sheet) => (
                  <span
                    key={sheet}
                    className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
                  >
                    {sheet}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleDownloadExcel}
              disabled={!jobId || !hasExcel || isExcelLoading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isExcelLoading ? "Downloading…" : "Download Excel Schedule"}
            </button>
            {!hasExcel && (
              <p className="text-xs text-slate-500 mt-2">
                Excel schedule not ready yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
