import { TimelineEvent } from "@/lib/types";

interface TimelineTableProps {
  events: TimelineEvent[];
  isRichAnalysisMode: boolean;
}

const KEY_EVENTS = [
  { date: "Jan 5, 2018", label: "Employment" },
  { date: "Year 3/4", label: "Strong reviews" },
  { date: "Year 5", label: "Holt joins" },
  { date: "Mar 2, 2024", label: "Demotion" },
  { date: "Oct 12, 2024", label: "Complaint" },
  { date: "Nov 5, 2024", label: "Medical leave" },
  { date: "Nov 15, 2024", label: "STD approved" },
  { date: "May 10, 2026", label: "Termination" },
  { date: "Jul 14, 2026", label: "Deposition" },
];

export default function TimelineTable({ events, isRichAnalysisMode }: TimelineTableProps) {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "High":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (!isRichAnalysisMode) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">Backend extraction required to generate sourced timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
        </div>
        <div className="px-6 py-4 overflow-x-auto">
          <div className="relative min-w-max">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 min-w-max"></div>
            <div className="flex justify-between gap-8">
              {KEY_EVENTS.map((event, index) => (
                <div key={index} className="relative flex flex-col items-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full border-2 border-white bg-blue-500 flex-shrink-0"></div>
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-20 text-center">
                    <p className="text-xs font-medium text-slate-900">{event.date}</p>
                    <p className="text-xs text-slate-500">{event.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Detailed Timeline</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '1060px' }}>
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '160px' }}>
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ minWidth: '360px' }}>
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '220px' }}>
                  People
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '180px' }}>
                  Citation
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '120px' }}>
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {events.map((event, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {event.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 leading-relaxed">{event.event}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {event.people}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 rounded">
                      {event.citation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getConfidenceColor(
                        event.confidence
                      )}`}
                    >
                      {event.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Transcript Intelligence</h3>
        <p className="text-sm text-slate-700 mb-2">
          LitiDoc extracted speaker-attributed admissions from the examination transcript and linked them to the chronology and damage categories.
        </p>
        <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
          <li>Prior positive performance history acknowledged</li>
          <li>No formal PIP or documented measurable targets identified</li>
          <li>Demotion and reassignment confirmed</li>
          <li>Termination during medical leave acknowledged</li>
        </ul>
      </div>
    </div>
  );
}
