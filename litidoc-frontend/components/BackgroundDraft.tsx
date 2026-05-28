interface BackgroundDraftProps {
  draft: string;
  isRichAnalysisMode: boolean;
}

export default function BackgroundDraft({ draft, isRichAnalysisMode }: BackgroundDraftProps) {
  const handleCreateWordDraft = () => {
    alert("Word export will be connected to the backend.");
  };

  if (!isRichAnalysisMode) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">Upload processed. Connect the backend extraction service to draft a source-linked background section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Background Draft</h2>
          <button
            onClick={handleCreateWordDraft}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Word Draft
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{draft}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
