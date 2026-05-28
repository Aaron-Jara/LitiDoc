interface ExportsTabProps {
  isRichAnalysisMode: boolean;
}

export default function ExportsTab({ isRichAnalysisMode }: ExportsTabProps) {
  const handleCreateWordDraft = () => {
    alert("Word export will be connected to the backend.");
  };

  const handleDownloadExcel = () => {
    alert("Excel export will be connected to the backend.");
  };

  if (!isRichAnalysisMode) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">Export cards require backend extraction.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Word Background Draft</h3>
            <p className="text-sm text-slate-600 mb-4">
              Formal background section with inline source citations.
            </p>
            <button
              onClick={handleCreateWordDraft}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create Word Draft
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Excel Damage Schedule</h3>
            <p className="text-sm text-slate-600 mb-4">
              Damage schedule workbook with category sheets and source columns.
            </p>
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Generated sheets:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Summary",
                  "Wrongful Dismissal Damages",
                  "Constructive Dismissal Damages",
                  "Lost Benefits",
                  "Lost Bonus Compensation",
                  "Disability / Human Rights Damages",
                  "Bad Faith Damages",
                  "ESA Termination / Severance",
                ].map((sheet) => (
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
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Download Excel Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
