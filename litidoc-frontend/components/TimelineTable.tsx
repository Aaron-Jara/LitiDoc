import { TimelineEvent, TimelineHighlight } from "@/lib/types";

interface TimelineTableProps {
  events: TimelineEvent[];
  highlights?: TimelineHighlight[];
  isRichAnalysisMode: boolean;
}

export default function TimelineTable({
  events,
  highlights = [],
  isRichAnalysisMode,
}: TimelineTableProps) {
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
        <p className="text-slate-500">
          Backend extraction required to generate sourced timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {highlights.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Key Events ({highlights.length})
            </h2>
          </div>
          <div className="px-6 py-4 overflow-x-auto">
            <div className="relative min-w-max pb-12">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 min-w-max" />
              <div className="flex justify-between gap-8">
                {[...highlights]
                  .sort((a, b) => a.rank - b.rank)
                  .map((event) => (
                  <div
                    key={event.rank}
                    className="relative flex flex-col items-center flex-shrink-0 w-28"
                  >
                    <div className="w-3 h-3 rounded-full border-2 border-white bg-blue-500 flex-shrink-0" />
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-28 text-center">
                      <p className="text-xs font-medium text-slate-900">
                        {event.date}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-3">
                        {event.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Detailed Timeline ({events.length} events)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "1060px" }}>
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  style={{ width: "160px" }}
                >
                  Date
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  style={{ minWidth: "360px" }}
                >
                  Event
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  style={{ width: "180px" }}
                >
                  Citation
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  style={{ width: "120px" }}
                >
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
                  <td className="px-6 py-4 text-sm text-slate-700 leading-relaxed">
                    {event.event}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {event.citation ? (
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 rounded">
                        {event.citation}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getConfidenceColor(
                        event.confidence,
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
    </div>
  );
}
