interface AnalysisProgressProps {
  isRunning: boolean;
  currentStep: number;
}

const steps = [
  "Classifying documents",
  "Extracting sourced timeline",
  "Drafting background section",
  "Classifying damages",
  "Building Excel schedule",
];

export default function AnalysisProgress({ isRunning, currentStep }: AnalysisProgressProps) {
  if (!isRunning) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Analysis Progress</h2>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                index < currentStep
                  ? "bg-green-500 text-white"
                  : index === currentStep
                  ? "bg-blue-500 text-white animate-pulse"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {index < currentStep ? "✓" : index + 1}
            </div>
            <span
              className={`text-sm ${
                index === currentStep ? "text-slate-900 font-medium" : "text-slate-600"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
