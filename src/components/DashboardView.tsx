import React from 'react';
import type { Invoice, AppConfig, TeamMember } from '../types';
import { KPIs } from './KPIs';
import { InvoiceTable } from './InvoiceTable';
import { Shield, Download } from 'lucide-react';
import { formatAmount } from './InvoiceTable';
import { exportInvoicesToCSV } from '../utils/export';

interface DashboardViewProps {
  invoices: Invoice[];
  team: TeamMember[];
  config: AppConfig;
  onInvoiceClick: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  invoices, 
  team, 
  config,
  onInvoiceClick
}) => {
  const pendingVerification = invoices.filter((i) => i.status === 'pending_verification').length;
  const pendingApproval = invoices.filter((i) => i.status === 'pending_approval').length;
  const approved = invoices.filter((i) => i.status === 'approved').length;
  const paid = invoices.filter((i) => i.status === 'paid').length;

  const flaggedList = invoices.filter(
    (i) =>
      i.flags &&
      i.flags.some((f) => f.level === 'high') &&
      i.status !== 'paid' &&
      i.status !== 'rejected'
  );
  
  const flaggedCount = flaggedList.length;

  return (
    <div className="w-full space-y-6">
      <KPIs
        pendingL1={pendingVerification}
        pendingL2={pendingApproval}
        approved={approved}
        paid={paid}
        flagged={flaggedCount}
      />

      <div className="bg-paper rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <h2 className="text-xl font-heading font-bold text-ink-dark flex items-center gap-2">
            Needs Attention
          </h2>
          {flaggedList.length > 0 && (
            <button
              onClick={() => exportInvoicesToCSV(flaggedList, 'Flagged_Invoices')}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Download size={14} /> Export Flagged to CSV
            </button>
          )}
        </div>
        {flaggedList.length === 0 ? (
          <p className="text-slate text-xs italic bg-white border border-slate-300 rounded-lg p-6 shadow-md">
            Nothing flagged right now — the register is clean.
          </p>
        ) : (
          <InvoiceTable
            invoices={flaggedList}
            currentUser={null}
            team={team}
            config={config}
            lastActionId={null}
            showActions={false}
            onVerify={() => {}}
            onApprove={() => {}}
            onRejectClick={() => {}}
            onPay={() => {}}
            onInvoiceClick={onInvoiceClick}
          />
        )}
      </div>

      {/* Audit policy note */}
      <div className="border border-slate-300 border-l-4 border-l-slate-400 bg-white p-5 rounded-lg shadow-md">
        <h3 className="font-heading font-semibold text-sm text-ink-dark uppercase tracking-wider flex items-center gap-2">
          <Shield size={16} className="text-slate-400" />
          Audit Policy
        </h3>
        <ul className="list-disc pl-5 mt-3 space-y-2 text-xs sm:text-sm text-slate font-medium">
          <li>No user may approve or pay an invoice they submitted.</li>
          <li>Invoices of {formatAmount(config.threshold, config.currency)} or more require admin sign-off after verification.</li>
          <li>Every action is timestamped and permanently recorded in the Audit Trail.</li>
          <li>Duplicate invoice numbers, changed bank details, and near-threshold amounts are flagged automatically.</li>
        </ul>
      </div>
    </div>
  );
};
