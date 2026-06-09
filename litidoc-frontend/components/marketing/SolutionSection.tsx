import { Check } from "lucide-react";
import { BentoGrid } from "@/components/ui/bento-grid";
import { Card } from "@/components/ui/card";
import FadeInSection from "./FadeInSection";
import ParallelAgentsProgress from "./ParallelAgentsProgress";
import SectionLabel from "./SectionLabel";

const timelineEvents = [
  {
    date: "Jan 4, 2024",
    event: "Email sent to plaintiff re: termination",
    citation: "Smith_Deposition.pdf p.12 l.4–9",
  },
  {
    date: "Jan 7, 2024",
    event: "Termination notice formally issued",
    citation: "Exhibit_B.pdf p.4",
  },
  {
    date: "Jan 12, 2024",
    event: "Plaintiff's counsel retained",
    citation: "Email_Chain.pdf p.2",
  },
];

const damageRows = [
  { category: "Wage Loss", amount: "$48,200" },
  { category: "Medical Expenses", amount: "$12,000" },
  { category: "Pension Loss", amount: "$8,500" },
  { category: "Pain & Suffering", amount: "$25,000" },
];

const excelRows = [
  {
    date: "Jan 4 2024",
    event: "Email sent",
    source: "Dep p.12",
  },
  {
    date: "Jan 7 2024",
    event: "Notice issued",
    source: "Ex B p.4",
  },
];

const sourceDocuments = [
  { file: "Smith_Deposition.pdf", reference: "p.12 lines 4–9" },
  { file: "Email_Chain.pdf", reference: "p.4" },
];

const excelTabs = ["Timeline", "Background", "Damages", "Index"];

function PreviewLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      {children}
    </p>
  );
}

function PreviewDivider() {
  return <div className="my-3 border-b border-slate-200" />;
}

export default function SolutionSection() {
  return (
    <FadeInSection className="border-b border-slate-200 bg-white py-20 md:py-28">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>The Solution</SectionLabel>
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            LitiDoc automates the grunt work
          </h2>
          <p className="text-lg text-slate-600">
            Parallel Claude AI agents generate court-ready deliverables with
            complete source traceability.
          </p>
        </div>

        <BentoGrid className="mt-14 grid-cols-1 auto-rows-auto md:grid-cols-3">
          <Card className="col-span-1 min-w-0 border border-slate-200 bg-white p-4 shadow-sm ring-0 transition-colors duration-200 hover:bg-slate-50 md:col-span-2">
            <PreviewLabel>Timeline Report</PreviewLabel>
            <PreviewDivider />
            <div className="space-y-3">
              {timelineEvents.map((item) => (
                <div
                  key={item.date}
                  className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {item.date}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{item.event}</p>
                  <p className="mt-1 font-mono text-xs text-indigo-600">
                    [{item.citation}]
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="col-span-1 min-w-0 border border-slate-200 bg-white p-4 shadow-sm ring-0 transition-colors duration-200 hover:bg-slate-50">
            <PreviewLabel>Damage Schedule</PreviewLabel>
            <PreviewDivider />
            <table className="w-full text-sm">
              <tbody>
                {damageRows.map((row, index) => (
                  <tr
                    key={row.category}
                    className={index % 2 === 0 ? "bg-slate-50" : "bg-white"}
                  >
                    <td className="px-2 py-1.5 text-slate-700">{row.category}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-slate-900">
                      {row.amount}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-slate-300 font-semibold">
                  <td className="px-2 py-2 text-slate-900">TOTAL</td>
                  <td className="px-2 py-2 text-right font-mono text-slate-900">
                    $93,700
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          <Card className="col-span-1 min-w-0 border border-slate-200 bg-white p-4 shadow-sm ring-0 transition-colors duration-200 hover:bg-slate-50 md:col-span-2">
            <PreviewLabel>Background Draft</PreviewLabel>
            <PreviewDivider />
            <div className="border-l-2 border-indigo-200 pl-4">
              <p className="text-sm leading-relaxed text-slate-700">
                Mr. Smith was employed by ABC Corp beginning in January 2021,
                reporting directly to the VP of Operations.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                During the review period, performance evaluations were conducted
                quarterly.
              </p>
              <p className="mt-3 font-mono text-xs text-slate-400">
                ¹ Smith_Deposition.pdf p.18 l.12–16
              </p>
            </div>
          </Card>

          <Card className="col-span-1 min-w-0 overflow-hidden border border-slate-200 bg-white p-0 shadow-sm ring-0 transition-colors duration-200 hover:bg-slate-50">
            <div className="border-b border-slate-200 bg-slate-100 px-2 pt-2">
              <div className="flex gap-1 overflow-x-auto">
                {excelTabs.map((tab, index) => (
                  <span
                    key={tab}
                    className={
                      index === 0
                        ? "shrink-0 rounded-t border border-b-0 border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-900"
                        : "shrink-0 px-2 py-1 font-mono text-xs text-slate-500"
                    }
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4">
              <PreviewLabel>Excel Workbook</PreviewLabel>
              <PreviewDivider />
              <table className="w-full table-fixed text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left font-semibold text-slate-500">
                    <th className="border-r border-slate-200 py-1 pr-2">Date</th>
                    <th className="border-r border-slate-200 py-1 pr-2">Event</th>
                    <th className="py-1">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {excelRows.map((row) => (
                    <tr key={row.date} className="border-b border-slate-100">
                      <td className="border-r border-slate-200 py-1.5 pr-2 font-mono text-slate-700">
                        {row.date}
                      </td>
                      <td className="border-r border-slate-200 py-1.5 pr-2 text-slate-700">
                        {row.event}
                      </td>
                      <td className="py-1.5 font-mono text-slate-700">
                        {row.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="col-span-1 min-w-0 border border-slate-200 bg-white p-4 shadow-sm ring-0 transition-colors duration-200 hover:bg-slate-50">
            <PreviewLabel>Source Verification</PreviewLabel>
            <PreviewDivider />
            <p className="text-sm font-medium text-slate-900">
              Event: Termination Notice
            </p>
            <div className="mt-3 space-y-3">
              {sourceDocuments.map((doc) => (
                <div key={doc.file}>
                  <p className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Check className="size-3.5 shrink-0 text-green-600" />
                    {doc.file}
                  </p>
                  <p className="mt-0.5 pl-5 font-mono text-xs text-slate-500">
                    {doc.reference}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm">
              <span className="text-slate-600">Confidence: </span>
              <span className="font-semibold text-indigo-600">98%</span>
            </p>
          </Card>

          <Card className="col-span-1 min-w-0 border border-slate-200 bg-white p-4 shadow-sm ring-0 transition-colors duration-200 hover:bg-slate-50 md:col-span-2">
            <PreviewLabel>Parallel AI Agents</PreviewLabel>
            <PreviewDivider />
            <ParallelAgentsProgress />
          </Card>
        </BentoGrid>
      </div>
    </FadeInSection>
  );
}
