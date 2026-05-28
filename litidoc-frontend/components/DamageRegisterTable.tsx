import { DamageItem } from "@/lib/types";

interface DamageRegisterTableProps {
  damages: DamageItem[];
  isRichAnalysisMode: boolean;
}

export default function DamageRegisterTable({ damages, isRichAnalysisMode }: DamageRegisterTableProps) {
  if (!isRichAnalysisMode) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">Damage classification requires backend content extraction.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Damage Register</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: '1420px' }}>
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '260px' }}>
                Damage Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '300px' }}>
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '360px' }}>
                Extracted Support
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '220px' }}>
                Citation
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '280px' }}>
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {damages.map((damage, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {damage.category}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700 leading-relaxed">
                  {damage.description}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700 leading-relaxed">
                  {damage.extractedSupport}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 rounded">
                    {damage.citation}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 leading-relaxed">
                  {damage.notes || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
