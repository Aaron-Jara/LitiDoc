const timelineRows = [
  {
    date: "2019-03-14",
    event: "Plaintiff terminated following restructuring announcement",
    citation: "Smith_Deposition.pdf p. 42, ln. 8",
  },
  {
    date: "2019-04-02",
    event: "HR notified plaintiff of severance package terms",
    citation: "Email_Chain.pdf p. 3, ln. 14",
  },
  {
    date: "2020-01-15",
    event: "Financial records show YTD income reduction of $47,200",
    citation: "Financial_Records.pdf p. 12",
  },
];

const damageRows = [
  {
    category: "Past Lost Income",
    amount: "$142,500.00",
    citation: "Financial_Records.pdf p. 12",
  },
  {
    category: "Medical Expenses",
    amount: "$28,340.00",
    citation: "Financial_Records.pdf p. 18",
  },
  {
    category: "Future Care Costs",
    amount: "$96,000.00",
    citation: "Smith_Deposition.pdf p. 87, ln. 3",
  },
];

export default function HeroOutputPreview() {
  return (
    <div className="mx-auto mt-10 w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <p className="text-sm font-semibold text-slate-900">
          Smith v. Meridian Corp
        </p>
        <p className="font-mono text-xs text-slate-500">Job LD-2847</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="min-w-0 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Detailed Timeline
          </p>
          <div className="mt-3 min-w-0">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[37%]" />
                <col className="w-[35%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-2">Date</th>
                  <th className="pb-2 pr-2">Event</th>
                  <th className="pb-2">Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timelineRows.map((row) => (
                  <tr key={row.date}>
                    <td className="py-2 pr-2 align-top font-mono text-xs text-slate-900">
                      {row.date}
                    </td>
                    <td className="py-2 pr-2 align-top text-xs leading-relaxed break-words text-slate-700">
                      {row.event}
                    </td>
                    <td className="py-2 align-top font-mono text-xs break-all text-indigo-600">
                      {row.citation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-w-0 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Background Draft
          </p>
          <div className="mt-3 min-w-0 space-y-3 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-700">
            <p>
              On March 14, 2019, plaintiff J. Smith was notified of termination
              following a company-wide restructuring. Smith had been employed as
              Senior Operations Manager since 2014, with consistently positive
              performance reviews through Q4 2018.
            </p>
            <p>
              Post-termination financial records indicate a reduction in annual
              income of{" "}
              <span className="font-mono text-slate-900">$47,200</span> compared
              to the prior fiscal year{" "}
              <span className="font-mono text-indigo-600">
                (Financial_Records.pdf p. 12)
              </span>
              . Severance terms were communicated via email on April 2, 2019{" "}
              <span className="font-mono text-indigo-600">
                (Email_Chain.pdf p. 3, ln. 14)
              </span>
              .
            </p>
          </div>
        </div>

        <div className="min-w-0 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Damage Schedule
          </p>
          <div className="mt-3 min-w-0">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[35%]" />
                <col className="w-[25%]" />
                <col className="w-[40%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-2">Category</th>
                  <th className="pb-2 pr-2">Amount</th>
                  <th className="pb-2">Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {damageRows.map((row) => (
                  <tr key={row.category}>
                    <td className="py-2 pr-2 align-top text-xs break-words text-slate-700">
                      {row.category}
                    </td>
                    <td className="py-2 pr-2 align-top font-mono text-xs font-medium text-slate-900">
                      {row.amount}
                    </td>
                    <td className="py-2 align-top font-mono text-xs break-all text-indigo-600">
                      {row.citation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-xs font-semibold text-slate-900">Total</span>
            <span className="font-mono text-xs font-semibold text-slate-900">
              $266,840.00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
