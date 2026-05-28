"use client";

import { useState } from "react";
import { downloadWord } from "@/lib/api";

interface BackgroundDraftProps {
  draft: string;
  jobId: string | null;
  hasWord?: boolean;
  isRichAnalysisMode: boolean;
}

export default function BackgroundDraft({
  draft,
  jobId,
  hasWord = false,
  isRichAnalysisMode,
}: BackgroundDraftProps) {
  const [isWordLoading, setIsWordLoading] = useState(false);
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

  if (!isRichAnalysisMode) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">
          Upload processed. Connect the backend extraction service to draft a
          source-linked background section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {exportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {exportError}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Background Draft</h2>
          <button
            onClick={handleCreateWordDraft}
            disabled={!jobId || !hasWord || isWordLoading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isWordLoading ? "Preparing…" : "Create Word Draft"}
          </button>
        </div>
        {!hasWord && (
          <p className="px-6 pt-3 text-xs text-slate-500">
            Background section not ready yet.
          </p>
        )}
        <div className="px-6 py-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {draft}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
