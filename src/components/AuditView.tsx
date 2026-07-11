import React from 'react';
import type { Invoice } from '../types';
import { History, Clock } from 'lucide-react';

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

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-black text-ink-dark flex items-center gap-2">
          <History size={18} className="text-brass" />
          Audit Trail
          <span className="text-xs font-normal text-slate font-sans select-none">— permanent, cannot be edited</span>
        </h2>
        <p className="text-slate text-xs italic bg-white border border-slate-200/60 rounded-lg p-6 shadow-sm">
          No audit logs recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/50 pb-2">
        <h2 className="text-lg font-serif font-black text-ink-dark flex items-center gap-2">
          <History size={18} className="text-brass" />
          System Log Audit Trail
          <span className="text-xs font-normal text-slate font-sans hidden sm:inline select-none">
            — permanent, cannot be edited
          </span>
        </h2>
        <span className="text-[10px] sm:hidden font-mono text-slate italic leading-tight block">
          Permanent ledger, cannot be edited
        </span>
      </div>

      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-3">
        {entries.map((e, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-lg p-4 shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <span className="font-mono text-[10px] text-slate flex items-center gap-1.5">
                <Clock size={11} className="text-slate/60" />
                {new Date(e.at).toLocaleString('en-IN')}
              </span>
              <span className="bg-indigo-50 border border-indigo-100 text-brass text-[9px] font-bold font-mono px-2 py-0.5 rounded">
                {e.action}
              </span>
            </div>
            <div className="text-sm font-bold text-ink-dark">
              {e.vendor} &middot; <span className="font-mono text-xs text-slate-700 font-semibold">{e.invoiceNumber}</span>
            </div>
            <div className="text-xs text-slate">
              Actor: <span className="font-semibold text-ink-dark">{e.actorName}</span> <span className="text-[9px] font-mono">({e.actorRole})</span>
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
              <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[140px]">When</th>
              <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[120px]">Who</th>
              <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[100px]">Action</th>
              <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[150px]">Invoice Parameters</th>
              <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[180px]">Note / Flags metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e, idx) => (
              <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                <td className="px-4 py-3 align-top font-mono text-[11px] text-slate-700">
                  {new Date(e.at).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 align-top text-slate">
                  <div className="font-bold text-ink-dark">{e.actorName}</div>
                  <div className="text-[9px] text-slate font-mono mt-0.5">
                    {e.actorRole}
                  </div>
                </td>
                <td className="px-4 py-3 align-top font-semibold text-ink-dark">
                  <span className="bg-indigo-50 border border-indigo-100/50 text-brass text-[10px] font-bold font-mono px-2 py-0.5 rounded">
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
