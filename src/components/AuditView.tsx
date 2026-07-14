import React, { useState } from 'react';
import type { Invoice, AppConfig } from '../types';
import { History, Clock, FileSpreadsheet, Download, Eye } from 'lucide-react';
import { Modal } from './Modal';
import { formatAmount } from './InvoiceTable';

interface AuditViewProps {
  invoices: Invoice[];
  config: AppConfig;
}

export const AuditView: React.FC<AuditViewProps> = ({ invoices, config }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const entriesForExport = invoices.flatMap((inv) =>
    (inv.history || []).map((ev) => ({
      ...ev,
      vendor: inv.vendor,
      invoiceNumber: inv.invoiceNumber,
    }))
  );
  entriesForExport.sort((a, b) => b.at - a.at);

  const handleExportExcel = () => {
    if (entriesForExport.length === 0) return;
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Vendor', 'Invoice Number', 'Note / Metadata'];
    const rows = entriesForExport.map((e) => [
      `"${new Date(e.at).toLocaleString('en-IN').replace(/"/g, '""')}"`,
      `"${(e.actorName || '').replace(/"/g, '""')}"`,
      `"${(e.actorRole || '').replace(/"/g, '""')}"`,
      `"${(e.action || '').replace(/"/g, '""')}"`,
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      `"${(e.invoiceNumber || '').replace(/"/g, '""')}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

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

  const displayInvoices = invoices.filter(
    (inv) => inv.status === 'approved' || inv.status === 'paid'
  );
  displayInvoices.sort((a, b) => b.enteredAt - a.enteredAt);

  if (displayInvoices.length === 0) {
    return (
      <div className="w-full space-y-4">
        <h2 className="text-xl font-heading font-bold text-ink-dark flex items-center gap-2">
          <History size={18} className="text-brass" />
          Audit Trail
          <span className="text-xs font-medium text-slate-700 font-sans select-none">— permanent ledger</span>
        </h2>
        <div className="flex flex-col items-center justify-center bg-white border border-slate-300 rounded-lg p-10 shadow-md mt-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <FileSpreadsheet size={32} className="text-slate-400" />
          </div>
          <p className="text-ink-dark font-bold text-sm">No records found</p>
          <p className="text-slate-600 text-xs mt-1 text-center">No approved or paid invoices to display in the audit trail yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-dark">Download Audit Records</h3>
            <p className="text-xs text-slate-700">
              Export all {entriesForExport.length} system audit event logs as a formatted Excel spreadsheet (.csv).
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

      <div className="border-b border-slate-300 pb-2">
        <h2 className="text-xl font-heading font-bold text-ink-dark flex items-center gap-2">
          <History size={18} className="text-brass" />
          Processed Invoices Ledger
        </h2>
        <p className="text-xs font-medium text-slate-700 font-sans select-none mt-0.5">
          Showing 1 row per invoice (Approved and Paid). Click to view full audit logs.
        </p>
      </div>

      <div className="overflow-x-auto w-full border border-slate-300 rounded-lg bg-white shadow-md">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-50/70 select-none">
              <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3">Vendor</th>
              <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3">Invoice #</th>
              <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3">Amount</th>
              <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3">Status</th>
              <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                <td className="px-4 py-3 font-bold text-ink-dark">{inv.vendor}</td>
                <td className="px-4 py-3 font-mono text-slate-700">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 font-mono font-semibold text-ink-dark">
                  {formatAmount(inv.amount, config.currency)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
                    inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {inv.status === 'paid' ? 'PAID' : 'APPROVED'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:border-brass hover:text-brass text-slate-700 px-3 py-1.5 rounded transition-colors text-xs font-semibold"
                  >
                    <Eye size={14} /> Full Log
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Audit Log: ${selectedInvoice.invoiceNumber}` : ''}
      >
        {selectedInvoice && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="bg-slate-50 border border-slate-300 rounded p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Vendor</span>
                  <span className="text-sm font-semibold text-ink-dark">{selectedInvoice.vendor}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Amount</span>
                  <span className="text-sm font-semibold font-mono text-ink-dark">{formatAmount(selectedInvoice.amount, config.currency)}</span>
                </div>
              </div>
            </div>

            <div className="relative pl-4 border-l-2 border-slate-300 space-y-6">
              {[...(selectedInvoice.history || [])].sort((a, b) => b.at - a.at).map((ev, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] mt-0.5 w-2.5 h-2.5 rounded-full bg-brass border-2 border-white ring-2 ring-brass/20"></div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs text-slate-600 flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(ev.at).toLocaleString('en-IN')}
                    </span>
                    <span className="bg-indigo-50 text-brass text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                      {ev.action}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    Actor: <span className="font-semibold text-ink-dark">{ev.actorName}</span> <span className="text-slate-600 font-mono">({ev.actorRole})</span>
                  </div>
                  {ev.note && (
                    <div className="mt-1.5 text-xs bg-white border border-slate-300 p-2.5 rounded text-slate max-w-full break-words leading-relaxed italic shadow-md">
                      {ev.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
