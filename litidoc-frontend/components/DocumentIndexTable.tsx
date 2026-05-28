import { DocumentIndexItem } from "@/lib/types";

interface DocumentIndexTableProps {
  documents: DocumentIndexItem[];
}

export default function DocumentIndexTable({ documents }: DocumentIndexTableProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Document Index</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: '1000px' }}>
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '80px' }}>
                Ref
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ minWidth: '280px' }}>
                File
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '180px' }}>
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ minWidth: '320px' }}>
                Summary
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '140px' }}>
                Pages / Records
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {documents.map((doc, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {doc.ref}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {doc.file}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {doc.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700 leading-relaxed">{doc.summary}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{doc.pages}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
