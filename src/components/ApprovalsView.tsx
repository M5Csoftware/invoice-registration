import React from 'react';
import type { Invoice, TeamMember, AppConfig } from '../types';
import { InvoiceTable, formatAmount } from './InvoiceTable';
import { ClipboardCheck } from 'lucide-react';

interface ApprovalsViewProps {
  invoices: Invoice[];
  currentUser: TeamMember | null;
  team: TeamMember[];
  config: AppConfig;
  lastActionId: string | null;
  onVerify: (id: string, notes: string) => void;
  onApprove: (id: string) => void;
  onRejectClick: (id: string) => void;
  onPay: (id: string) => void;
  onInvoiceClick: (invoice: Invoice) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  invoices,
  currentUser,
  team,
  config,
  lastActionId,
  onVerify,
  onApprove,
  onRejectClick,
  onPay,
  onInvoiceClick,
}) => {
  const pendingVerification = invoices.filter((i) => i.status === 'pending_verification');
  const pendingApproval = invoices.filter((i) => i.status === 'pending_approval');
  const approved = invoices.filter((i) => i.status === 'approved');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
        <ClipboardCheck size={20} className="text-brass" />
        <h2 className="text-lg font-serif font-black text-ink-dark">
          Approvals Queue
        </h2>
      </div>

      {/* Step 1: Verifier queue */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate border-l-2 border-l-blue-400 pl-2">
          Awaiting Verification ({pendingVerification.length})
          <span className="text-[10px] text-slate/60 font-normal ml-2">— Verifier reviews invoice with vendor</span>
        </h3>
        <InvoiceTable
          invoices={pendingVerification}
          currentUser={currentUser}
          team={team}
          config={config}
          lastActionId={lastActionId}
          showActions={true}
          onVerify={onVerify}
          onApprove={onApprove}
          onRejectClick={onRejectClick}
          onPay={onPay}
          onInvoiceClick={onInvoiceClick}
        />
      </div>

      {/* Step 2: Admin approval queue */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate border-l-2 border-l-brass pl-2 flex items-center gap-2">
          Awaiting Admin Approval ({pendingApproval.length})
          <span className="text-[10px] text-slate/70 font-normal font-mono">
            (threshold ≥ {formatAmount(config.threshold, config.currency)} requires second sign-off)
          </span>
        </h3>
        <InvoiceTable
          invoices={pendingApproval}
          currentUser={currentUser}
          team={team}
          config={config}
          lastActionId={lastActionId}
          showActions={true}
          onVerify={onVerify}
          onApprove={onApprove}
          onRejectClick={onRejectClick}
          onPay={onPay}
          onInvoiceClick={onInvoiceClick}
        />
      </div>

      {/* Step 3: Pay queue */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate border-l-2 border-l-green pl-2">
          Approved — Ready to Pay ({approved.length})
        </h3>
        <InvoiceTable
          invoices={approved}
          currentUser={currentUser}
          team={team}
          config={config}
          lastActionId={lastActionId}
          showActions={true}
          onVerify={onVerify}
          onApprove={onApprove}
          onRejectClick={onRejectClick}
          onPay={onPay}
          onInvoiceClick={onInvoiceClick}
        />
      </div>
    </div>
  );
};
