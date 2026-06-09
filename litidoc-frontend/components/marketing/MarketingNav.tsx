"use client";

interface MarketingNavProps {
  onStartClick: () => void;
}

export default function MarketingNav({ onStartClick }: MarketingNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white">LitiDoc</span>
          <span className="hidden rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-semibold text-white sm:inline">
            Source-linked outputs
          </span>
        </div>
        <button
          type="button"
          onClick={onStartClick}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
        >
          Start Processing
        </button>
      </div>
    </header>
  );
}
