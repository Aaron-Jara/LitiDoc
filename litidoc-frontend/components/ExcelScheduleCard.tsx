"use client";

import { useState } from "react";

export default function ExcelScheduleCard() {
  const [showToast, setShowToast] = useState(false);

  const handleDownload = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const sheets = [
    "Summary",
    "Past Lost Income",
    "Medical Expenses",
    "Future Care Costs",
    "Out-of-Pocket Expenses",
    "Non-Pecuniary Damages",
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Excel Schedule</h2>
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-slate-700 font-medium">Damage schedule skeleton generated.</p>
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Generated Sheets:</h3>
          <div className="flex flex-wrap gap-2">
            {sheets.map((sheet, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full"
              >
                {sheet}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Excel Schedule
        </button>
      </div>
      {showToast && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Backend Excel generation will be connected here.
          </p>
        </div>
      )}
    </div>
  );
}
