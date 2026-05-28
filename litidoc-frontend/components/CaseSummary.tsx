import { LitiDocAnalysisResponse } from "@/lib/types";

interface CaseSummaryProps {
  data: LitiDocAnalysisResponse | null;
  documentCount?: number;
}

export default function CaseSummary({ data, documentCount }: CaseSummaryProps) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-slate-400 text-sm">Load a case to view summary</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Case Summary</h2>
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <div className="text-sm text-slate-600">Case Name</div>
        <div className="text-sm font-semibold text-slate-900">{data.caseName}</div>
        
        <div className="text-sm text-slate-600">Plaintiff</div>
        <div className="text-sm font-semibold text-slate-900">{data.parties.plaintiff}</div>
        
        <div className="text-sm text-slate-600">Defendant</div>
        <div className="text-sm font-semibold text-slate-900">{data.parties.defendant}</div>
        
        <div className="text-sm text-slate-600">Matter Type</div>
        <div className="text-sm font-semibold text-slate-900">{data.matterType}</div>
        
        <div className="text-sm text-slate-600">Jurisdiction</div>
        <div className="text-sm font-semibold text-slate-900">{data.jurisdiction}</div>
        
        <div className="text-sm text-slate-600">Documents</div>
        <div className="text-sm font-semibold text-slate-900">{documentCount || data.documentIndex.length}</div>
        
        <div className="text-sm text-slate-600">Status</div>
        <div className="text-sm font-semibold text-slate-900">{data.currentStage}</div>
        
        {data.nameInconsistencyNote && (
          <div className="col-span-2 mt-2">
            <p className="text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded leading-relaxed">
              {data.nameInconsistencyNote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
