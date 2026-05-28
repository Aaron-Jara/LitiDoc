"use client";

import { useState } from "react";
import { TabType, LitiDocAnalysisResponse } from "@/lib/types";
import DocumentIndexTable from "./DocumentIndexTable";
import TimelineTable from "./TimelineTable";
import BackgroundDraft from "./BackgroundDraft";
import DamageRegisterTable from "./DamageRegisterTable";
import ExportsTab from "./ExportsTab";

interface ResultsTabsProps {
  data: LitiDocAnalysisResponse | null;
  isAnalysisComplete: boolean;
  isRichAnalysisMode: boolean;
}

const tabs: { id: TabType; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "background", label: "Background" },
  { id: "documents", label: "Document Index" },
  { id: "damages", label: "Damages" },
  { id: "exports", label: "Exports" },
];

export default function ResultsTabs({ data, isAnalysisComplete, isRichAnalysisMode }: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("timeline");

  if (!isAnalysisComplete) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-slate-400 text-sm">Run analysis to view results</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-slate-400 text-sm">No data available</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "documents":
        return <DocumentIndexTable documents={data.documentIndex} />;
      case "timeline":
        return <TimelineTable events={data.timeline} isRichAnalysisMode={isRichAnalysisMode} />;
      case "background":
        return <BackgroundDraft draft={data.backgroundDraft} isRichAnalysisMode={isRichAnalysisMode} />;
      case "damages":
        return <DamageRegisterTable damages={data.damageRegister} isRichAnalysisMode={isRichAnalysisMode} />;
      case "exports":
        return <ExportsTab isRichAnalysisMode={isRichAnalysisMode} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200">
        <nav className="flex space-x-0" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6">{renderTabContent()}</div>
    </div>
  );
}
