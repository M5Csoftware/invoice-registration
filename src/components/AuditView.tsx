import React from 'react';
import type { Invoice } from '../types';
import { History, Clock, FileSpreadsheet, Download } from 'lucide-react';

interface AuditViewProps {
  invoices: Invoice[];
}

export const AuditView: React.FC<AuditViewProps> = ({ invoices }) => {
  const entries = invoices.flatMap((inv) =>
    (inv.history || []).map((ev) => ({
      ...ev,
      vendor: inv.vendor,
      invoiceNumber: inv.invoiceNumber,
    }))
  );

  entries.sort((a, b) => b.at - a.at);

  const handleExportExcel = () => {
    if (entries.length === 0) return;
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Vendor', 'Invoice Number', 'Note / Metadata'];
    const rows = entries.map((e) => [
      `"${new Date(e.at).toLocaleString('en-IN').replace(/"/g, '""')}"`,
      `"${(e.actorName || '').replace(/"/g, '""')}"`,
      `"${(e.actorRole || '').replace(/"/g, '""')}"`,
      `"${(e.action || '').replace(/"/g, '""')}"`,
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      `"${(e.invoiceNumber || '').replace(/"/g, '""')}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    // Prepend UTF-8 BOM so Microsoft Excel opens it with full UTF-8 encoding support & proper column separation
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-ink-dark flex items-center gap-2">
          <History size={18} className="text-brass" />
          Audit Trail
          <span className="text-xs font-medium text-slate-600 font-sans select-none">— permanent ledger, cannot be edited</span>
        </h2>
        <p className="text-slate text-xs italic bg-white border border-slate-200/60 rounded-lg p-6 shadow-sm">
          No audit logs recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dedicated Top Action & Export Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-dark">Download Audit Records</h3>
            <p className="text-xs text-slate-600">
              Export all {entries.length} system audit event logs as a formatted Excel spreadsheet (.csv).
            </p>
          </div>
        </div>
        <button
          onClick={handleExportExcel}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow transition-all cursor-pointer shrink-0"
        >
          <Download size={15} />
          Export Excel File
        </button>
      </div>

      <div className="border-b border-slate-200/50 pb-2">
        <h2 className="text-xl font-heading font-bold text-ink-dark flex items-center gap-2">
          <History size={18} className="text-brass" />
          System Log Audit Trail
        </h2>
        <p className="text-xs font-medium text-slate-600 font-sans select-none mt-0.5">
          Permanent ledger · Cannot be modified or deleted
        </p>
      </div>

      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-3">
        {entries.map((e, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-lg p-4 shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-slate-600 flex items-center gap-1.5">
                <Clock size={12} className="text-slate-500" />
                {new Date(e.at).toLocaleString('en-IN')}
              </span>
              <span className="bg-indigo-50 border border-indigo-100 text-brass text-xs font-bold font-mono px-2 py-0.5 rounded">
                {e.action}
              </span>
            </div>
            <div className="text-sm font-bold text-ink-dark">
              {e.vendor} &middot; <span className="font-mono text-xs text-slate-700 font-semibold">{e.invoiceNumber}</span>
            </div>
            <div className="text-xs text-slate-700">
              Actor: <span className="font-semibold text-ink-dark">{e.actorName}</span> <span className="text-xs font-mono text-slate-500">({e.actorRole})</span>
            </div>
            {e.note && (
              <div className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded text-slate max-w-full break-words leading-relaxed italic">
                {e.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto w-full border border-slate-200/60 rounded-lg bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 select-none">
              <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3 min-w-[140px]">When</th>
              <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3 min-w-[120px]">Who</th>
              <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3 min-w-[100px]">Action</th>
              <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3 min-w-[150px]">Invoice Parameters</th>
              <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3 min-w-[180px]">Note / Flags metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e, idx) => (
              <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                <td className="px-4 py-3 align-top font-mono text-xs text-slate-700">
                  {new Date(e.at).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 align-top text-slate-700">
                  <div className="font-bold text-ink-dark">{e.actorName}</div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">
                    {e.actorRole}
                  </div>
                </td>
                <td className="px-4 py-3 align-top font-semibold text-ink-dark">
                  <span className="bg-indigo-50 border border-indigo-100/50 text-brass text-xs font-bold font-mono px-2 py-0.5 rounded">
                    {e.action}
                  </span>
                </td>
                <td className="px-4 py-3 align-top font-mono text-ink-dark">
                  <span className="font-bold">{e.vendor}</span>
                  <span className="text-slate/75 mx-1">&middot;</span>
                  <span>{e.invoiceNumber}</span>
                </td>
                <td className="px-4 py-3 align-top text-slate text-xs max-w-[250px] break-words leading-relaxed italic">
                  {e.note || <span className="text-slate/30 font-light">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
