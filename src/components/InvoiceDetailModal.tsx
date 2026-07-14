import React, { useState } from 'react';
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
  Wallet,
  Landmark,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Download,
  Maximize,
  X,
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
  onAddBankDetails?: (invoice: Invoice) => void;
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
  onAddBankDetails,
}) => {
  const [showImage, setShowImage] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(false);

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
        <div className={`${base} bg-slate-50 text-slate-400 border-slate-300 line-through`} title="Skipped (under threshold)">
          —
        </div>
      );
    }
    return (
      <div className={`${base} bg-white text-slate-400 border-slate-300`}>
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
      return currentUser.role === 'Verifier' || currentUser.role === 'Admin' || currentUser.role === 'Master Admin';
    }
    if (isPendingApproval || isApproved) {
      return currentUser.role === 'Admin' || currentUser.role === 'Master Admin';
    }
    return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Details">
      <div className="space-y-6 text-ink-dark max-h-[78vh] overflow-y-auto pr-1 no-scrollbar">
        
        {/* Title and Amount */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-heading font-semibold text-ink-dark">{invoice.vendor}</h4>
            <p className="text-xs text-slate mt-0.5 flex items-center gap-1 font-mono">
              Invoice Ref: <span className="font-semibold text-ink">{invoice.invoiceNumber}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-mono font-bold text-ink">
              {formatAmount(invoice.amount, config.currency)}
            </span>
            {isRejected && (
              <span className="text-xs font-bold text-red bg-red/10 border border-red/20 px-2.5 py-0.5 rounded-full block mt-1.5 font-mono select-none">
                REJECTED
              </span>
            )}
          </div>
        </div>

        {/* Visual Lifecycle Stepper */}
        <div className="bg-slate-50/50 border border-slate-300 p-4 rounded-lg">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
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
                    <span className="text-xs text-slate-700 mt-0.5 leading-tight">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Details Grid */}
        <div className="grid grid-cols-2 gap-4 bg-white border border-slate-300 p-4 rounded-lg shadow-md text-xs">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-700 block mb-1">Taxable Amount</span>
            <div className="font-mono font-semibold text-ink-dark">
              {formatAmount(invoice.taxableAmount || (invoice.amount / 1.18), config.currency)}
            </div>
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-700 block mb-1">Tax Breakdown</span>
            <div className="font-mono text-ink-dark">
              {invoice.taxOption === 'CGST_SGST' ? (
                <span>
                  CGST (9%): {formatAmount((invoice.taxAmount || (invoice.amount - invoice.amount / 1.18)) / 2, config.currency)}
                  <br />
                  SGST (9%): {formatAmount((invoice.taxAmount || (invoice.amount - invoice.amount / 1.18)) / 2, config.currency)}
                </span>
              ) : (
                <span>
                  IGST (18%): {formatAmount(invoice.taxAmount || (invoice.amount - invoice.amount / 1.18), config.currency)}
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-700 block mb-1">Invoice Date</span>
            <div className="flex items-center gap-1.5 font-medium text-ink-dark">
              <Calendar size={13} className="text-slate-600" />
              {invoice.invoiceDate}
            </div>
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-700 block mb-1">PO Number</span>
            <div className="flex items-center gap-1.5 font-medium text-ink-dark">
              <FileText size={13} className="text-slate-600" />
              {invoice.poNumber || <span className="text-slate-600 italic">Not Linked</span>}
            </div>
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-700 block mb-1">Audit Creator</span>
            <div className="flex items-center gap-1.5 font-medium text-ink-dark">
              <User size={13} className="text-slate-600" />
              <div>
                <div>{getMemberName(invoice.enteredBy)}</div>
                <div className="text-xs text-slate-700 font-mono font-normal">
                  {getMemberRole(invoice.enteredBy)}
                </div>
              </div>
            </div>
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-700 block mb-1">Account details</span>
            <div className="flex items-start gap-1.5 font-medium text-ink-dark">
              <CreditCard size={13} className="text-slate-600 mt-0.5" />
              {invoice.bankDetails ? (
                <div className="font-mono text-xs space-y-0.5">
                  <div className="font-semibold">{invoice.bankDetails.bankName}</div>
                  <div className="text-slate-700">Holder: {invoice.bankDetails.accountName}</div>
                  <div className="text-slate-700">A/C: {invoice.bankDetails.accountNumber}</div>
                  <div className="text-slate-700">IFSC: {invoice.bankDetails.ifscCode}</div>
                </div>
              ) : invoice.bankLast4 ? (
                <span className="font-mono">Bank last 4: **** {invoice.bankLast4}</span>
              ) : (
                <span className="text-slate-600 italic">Not Supplied</span>
              )}
            </div>
          </div>
          {invoice.description && (
            <div className="col-span-2 pt-2 border-t border-slate-100">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-700 block mb-1">Description</span>
              <p className="text-slate-800 font-medium leading-relaxed italic">{invoice.description}</p>
            </div>
          )}
        </div>

        {/* Anomaly Check Flags */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
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
                  badgeClass = 'bg-slate-100 border-slate-300 text-slate-800 border-l-4 border-l-slate-500';
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
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
            Audit Trail
          </span>
          <div className="space-y-4">
            {invoice.history?.map((h, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <div className="relative flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs text-slate-700 flex-shrink-0">
                    <Clock size={11} />
                  </div>
                  {idx < (invoice.history.length - 1) && (
                    <div className="w-0.5 bg-slate-200 h-8 mt-1" />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-ink-dark">{h.action}</span>
                    <span className="font-mono text-xs text-slate-700">
                      {new Date(h.at).toLocaleDateString('en-IN')} {new Date(h.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-700 text-xs mt-0.5">
                    Authorized actor: <span className="font-semibold text-ink-dark">{h.actorName}</span> <span className="text-xs font-mono text-slate-700">({h.actorRole})</span>
                  </div>
                  {h.note && (
                    <p className="mt-1 bg-slate-50 border border-slate-100 p-2.5 rounded text-xs text-slate-800 italic max-w-full break-words leading-relaxed">
                      {h.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uploaded Document Viewer */}
        {invoice.invoiceImage && (
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowImage(!showImage)}
              className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-dark">
                <ImageIcon size={18} className="text-brass" />
                Uploaded Invoice Document
              </div>
              {showImage ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showImage && (
              <div className="mt-3 relative border border-slate-300 rounded-lg overflow-hidden bg-slate-100 flex justify-center p-2 group">
                <img 
                  src={invoice.invoiceImage} 
                  alt="Invoice Document" 
                  className="max-w-full h-auto rounded shadow-md cursor-zoom-in"
                  style={{ maxHeight: '600px' }}
                  onClick={() => setFullScreenImage(true)}
                />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={invoice.invoiceImage}
                    download={`Invoice_${invoice.invoiceNumber}.png`}
                    className="bg-white text-slate-800 p-2 rounded shadow-md hover:bg-slate-50 transition-colors"
                    title="Download Image"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={() => setFullScreenImage(true)}
                    className="bg-white text-slate-800 p-2 rounded shadow-md hover:bg-slate-50 transition-colors"
                    title="Open Full Size"
                  >
                    <Maximize size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Screen Image Overlay */}
        {fullScreenImage && invoice.invoiceImage && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm">
             <img 
               src={invoice.invoiceImage} 
               alt="Full Size Invoice Document"
               className="max-w-full max-h-full object-contain rounded shadow-2xl border border-slate-700" 
             />
             <div className="absolute top-6 right-6 flex gap-3">
                 <a 
                   href={invoice.invoiceImage} 
                   download={`Invoice_${invoice.invoiceNumber}.png`} 
                   className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all shadow-lg"
                   title="Download"
                 >
                    <Download size={22} />
                 </a>
                 <button 
                   onClick={() => setFullScreenImage(false)} 
                   className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all shadow-lg cursor-pointer"
                   title="Close"
                 >
                    <X size={22} />
                 </button>
             </div>
          </div>
        )}

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
                  className="flex items-center gap-1.5 bg-green hover:bg-green/90 text-white font-semibold text-xs px-4 py-2.5 rounded shadow-md transition-colors cursor-pointer"
                >
                  <ShieldCheck size={14} /> {isPendingApproval ? 'Final Approve' : 'Mark Verified'}
                </button>
                <button
                  onClick={() => {
                    onRejectClick(invoice.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 bg-red hover:bg-red/90 text-white font-semibold text-xs px-4 py-2.5 rounded shadow-md transition-colors cursor-pointer"
                >
                  <Ban size={14} /> Reject
                </button>
              </>
            )}
            {isApproved && (
              <>
                {onAddBankDetails && (
                  <button
                    onClick={() => {
                      onAddBankDetails(invoice);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded shadow-md transition-colors cursor-pointer"
                  >
                    <Landmark size={14} /> {invoice.bankDetails ? 'Edit Bank Details' : '+ Add Bank Details'}
                  </button>
                )}
                <button
                  onClick={() => {
                    onPay(invoice.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 bg-brass hover:bg-brass-light text-ink-dark font-bold text-xs px-4 py-2.5 rounded shadow-md transition-colors cursor-pointer"
                >
                  <Wallet size={14} /> Release Payment
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
