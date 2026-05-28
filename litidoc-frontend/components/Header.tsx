"use client";

interface HeaderProps {
  hasFiles: boolean;
  isAnalysisRunning: boolean;
  isAnalysisComplete: boolean;
}

export default function Header({
  hasFiles,
  isAnalysisRunning,
  isAnalysisComplete,
}: HeaderProps) {
  return (
    <div className="bg-slate-900 text-white border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">LitiDoc</h1>
          <span className="px-2 py-1 bg-blue-600 text-xs font-semibold rounded-full">
            Source-linked outputs
          </span>
        </div>
      </div>
    </div>
  );
}
