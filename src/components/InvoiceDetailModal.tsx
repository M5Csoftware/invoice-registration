import React from 'react';
import type { Invoice, TeamMember, AppConfig } from '../types';
import { Modal } from './Modal';
import { formatAmount } from './InvoiceTable';
import { 
  Calendar, 
  FileText, 
  User, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  Ban,
  Wallet
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: TeamMember | null;
  team: TeamMember[];
  config: AppConfig;
  onApprove: (id: string) => void;
  onRejectClick: (id: string) => void;
  onPay: (id: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose,
  currentUser,
  team,
  config,
  onApprove,
  onRejectClick,
  onPay,
}) => {
  if (!invoice) return null;

  const getMemberName = (id: string) => {
    const member = team.find((t) => t.id === id);
    return member ? member.name : '(removed team member)';
  };

  const getMemberRole = (id: string) => {
    const member = team.find((t) => t.id === id);
    return member ? member.role : '';
  };

  // Determine Stepper status — 3-step workflow: Verify → Approve → Pay
  const isRejected = invoice.status === 'rejected';

  const getStepStatus = (stepIndex: number): 'success' | 'current' | 'failed' | 'skipped' | 'pending' => {
    if (stepIndex === 1) return 'success'; // Checked in is always success

    if (stepIndex === 2) {
      // Verification step
      if (invoice.status === 'pending_verification') return 'current';
      if (isRejected && (invoice.approvals?.length || 0) === 0) return 'failed';
      return 'success';
    }

    if (stepIndex === 3) {
      // Approval step
      if (invoice.status === 'pending_approval') return 'current';
      if (isRejected) return 'failed';
      if (invoice.status === 'approved' || invoice.status === 'paid') return 'success';
      return 'pending';
    }

    if (stepIndex === 4) {
      // Payment step
      if (invoice.status === 'paid') return 'success';
      if (invoice.status === 'approved') return 'current';
      return 'pending';
    }

    return 'pending';
  };

  const renderStepIcon = (status: 'success' | 'current' | 'failed' | 'skipped' | 'pending', num: number) => {
    const base = "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold select-none border-2 font-mono";
    if (status === 'success') {
      return (
        <div className={`${base} bg-green-50 text-green border-green`}>
          ✓
        </div>
      );
    }
    if (status === 'current') {
      return (
        <div className={`${base} bg-indigo-50 text-brass border-brass animate-pulse`}>
          ●
        </div>
      );
    }
    if (status === 'failed') {
      return (
        <div className={`${base} bg-red-50 text-red border-red`}>
          ✕
        </div>
      );
    }
    if (status === 'skipped') {
      return (
        <div className={`${base} bg-slate-50 text-slate-400 border-slate-200 line-through`} title="Skipped (under threshold)">
          —
        </div>
      );
    }
    return (
      <div className={`${base} bg-white text-slate-400 border-slate-200`}>
        {num}
      </div>
    );
  };

  const steps = [
    { label: 'Checked In', status: getStepStatus(1), desc: 'Invoice submitted to registry' },
    { label: 'Verified', status: getStepStatus(2), desc: 'Verifier confirmed with vendor' },
    { label: 'Approved', status: getStepStatus(3), desc: 'Admin sign-off granted' },
    { label: 'Payment Released', status: getStepStatus(4), desc: 'Finance disbursements' }
  ];

  // Action authorizations checks
  const isOwnEntry = invoice.enteredBy === currentUser?.id;
  const isPendingVerification = invoice.status === 'pending_verification';
  const isPendingApproval = invoice.status === 'pending_approval';
  const isApproved = invoice.status === 'approved';

  const canUserAct = (): boolean => {
    if (!currentUser || isOwnEntry) return false;

    if (isPendingVerification) {
      return currentUser.role === 'Verifier' || currentUser.role === 'Admin';
    }
    if (isPendingApproval) {
      return currentUser.role === 'Admin';
    }
    if (isApproved) {
      return currentUser.role === 'Admin';
    }
    return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Details">
      <div className="space-y-6 text-ink-dark max-h-[78vh] overflow-y-auto pr-1 no-scrollbar">
        
        {/* Title and Amount */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-lg font-bold text-ink-dark">{invoice.vendor}</h4>
            <p className="text-xs text-slate mt-0.5 flex items-center gap-1 font-mono">
              Invoice Ref: <span className="font-semibold text-ink">{invoice.invoiceNumber}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-mono font-black text-ink">
              {formatAmount(invoice.amount, config.currency)}
            </span>
            {isRejected && (
              <span className="text-[10px] font-bold text-red bg-red/10 border border-red/20 px-2.5 py-0.5 rounded-full block mt-1.5 font-mono select-none">
                REJECTED
              </span>
            )}
          </div>
        </div>

        {/* Visual Lifecycle Stepper */}
        <div className="bg-slate-50/50 border border-slate-200/50 p-4 rounded-lg">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate mb-4">
            Approval Status
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {steps.map((step, idx) => {
              const statusClass = step.status === 'success' 
                ? 'text-slate-800 font-semibold' 
                : step.status === 'current' 
                ? 'text-brass font-bold' 
                : step.status === 'failed' 
                ? 'text-red font-semibold' 
                : step.status === 'skipped'
                ? 'text-slate-400 font-normal italic'
                : 'text-slate-400 font-normal';

              return (
                <div key={idx} className="flex sm:flex-col items-start gap-3 sm:gap-2 relative z-10">
                  <div className="flex items-center sm:w-full">
                    {renderStepIcon(step.status, idx + 1)}
                    {idx < 3 && (
                      <div className={`hidden sm:block flex-grow h-0.5 ml-2 mr-2 ${
                        step.status === 'success' ? 'bg-green' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-xs ${statusClass}`}>{step.label}</span>
                    <span className="text-[9px] text-slate mt-0.5 leading-tight">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Details Grid */}
        <div className="grid grid-cols-2 gap-4 bg-white border border-slate-200/60 p-4 rounded-lg shadow-sm text-xs">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate block mb-1">Invoice Date</span>
            <div className="flex items-center gap-1.5 font-medium text-ink-dark">
              <Calendar size={13} className="text-slate/75" />
              {invoice.invoiceDate}
            </div>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate block mb-1">PO Number</span>
            <div className="flex items-center gap-1.5 font-medium text-ink-dark">
              <FileText size={13} className="text-slate/75" />
              {invoice.poNumber || <span className="text-slate/40 italic">Not Linked</span>}
            </div>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate block mb-1">Audit Creator</span>
            <div className="flex items-center gap-1.5 font-medium text-ink-dark">
              <User size={13} className="text-slate/75" />
              <div>
                <div>{getMemberName(invoice.enteredBy)}</div>
                <div className="text-[9px] text-slate font-mono font-normal">
                  {getMemberRole(invoice.enteredBy)}
                </div>
              </div>
            </div>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate block mb-1">Account details</span>
            <div className="flex items-center gap-1.5 font-medium text-ink-dark">
              <CreditCard size={13} className="text-slate/75" />
              {invoice.bankLast4 ? (
                <span className="font-mono">Bank last 4: **** {invoice.bankLast4}</span>
              ) : (
                <span className="text-slate/40 italic">Not Supplied</span>
              )}
            </div>
          </div>
          {invoice.description && (
            <div className="col-span-2 pt-2 border-t border-slate-100">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate block mb-1">Description</span>
              <p className="text-slate font-medium leading-relaxed italic">{invoice.description}</p>
            </div>
          )}
        </div>

        {/* Anomaly Check Flags */}
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate block mb-2">
            Flags ({invoice.flags?.length || 0})
          </span>
          {invoice.flags && invoice.flags.length > 0 ? (
            <div className="space-y-2">
              {invoice.flags.map((flag, idx) => {
                let badgeClass = '';
                if (flag.level === 'high') {
                  badgeClass = 'bg-red/5 border-red/20 text-red border-l-4 border-l-red';
                } else if (flag.level === 'medium') {
                  badgeClass = 'bg-brass/5 border-brass/25 text-brass border-l-4 border-l-brass';
                } else {
                  badgeClass = 'bg-slate/5 border-slate-200 text-slate border-l-4 border-l-slate';
                }

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 p-3 rounded border text-xs leading-relaxed ${badgeClass}`}
                  >
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                    <span>{flag.text}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-green-50/50 border border-green/20 rounded text-xs text-green font-medium">
              <CheckCircle2 size={15} />
              <span>No flags detected.</span>
            </div>
          )}
        </div>

        {/* History Timelines log */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate block mb-3">
            Audit Trail
          </span>
          <div className="space-y-4">
            {invoice.history?.map((h, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <div className="relative flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate flex-shrink-0">
                    <Clock size={10} />
                  </div>
                  {idx < (invoice.history.length - 1) && (
                    <div className="w-0.5 bg-slate-200 h-8 mt-1" />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-ink-dark">{h.action}</span>
                    <span className="font-mono text-[10px] text-slate">
                      {new Date(h.at).toLocaleDateString('en-IN')} {new Date(h.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate text-[11px] mt-0.5">
                    Authorized actor: <span className="font-medium text-ink">{h.actorName}</span> <span className="text-[10px] font-mono">({h.actorRole})</span>
                  </div>
                  {h.note && (
                    <p className="mt-1 bg-slate-50 border border-slate-100 p-2 rounded text-[11px] text-slate italic max-w-full break-words">
                      {h.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Authorized Modal Actions */}
        {canUserAct() && (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
            {(isPendingVerification || isPendingApproval) && (
              <>
                <button
                  onClick={() => {
                    onApprove(invoice.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 bg-green hover:bg-green/90 text-white font-semibold text-xs px-4 py-2.5 rounded shadow-sm transition-colors cursor-pointer"
                >
                  <ShieldCheck size={14} /> {isPendingApproval ? 'Final Approve' : 'Mark Verified'}
                </button>
                <button
                  onClick={() => {
                    onRejectClick(invoice.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 bg-red hover:bg-red/90 text-white font-semibold text-xs px-4 py-2.5 rounded shadow-sm transition-colors cursor-pointer"
                >
                  <Ban size={14} /> Reject
                </button>
              </>
            )}
            {isApproved && (
              <button
                onClick={() => {
                  onPay(invoice.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-brass hover:bg-brass-light text-ink-dark font-bold text-xs px-4 py-2.5 rounded shadow-sm transition-colors cursor-pointer"
              >
                <Wallet size={14} /> Release Payment
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
