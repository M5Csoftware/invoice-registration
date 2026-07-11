import React, { useState } from 'react';
import type { Invoice, TeamMember, AppConfig } from '../types';
import { Search, Eye } from 'lucide-react';

interface InvoiceTableProps {
  invoices: Invoice[];
  currentUser: TeamMember | null;
  team: TeamMember[];
  config: AppConfig;
  lastActionId: string | null;
  showActions: boolean;
  onVerify: (id: string, notes: string) => void;
  onApprove: (id: string) => void;
  onRejectClick: (id: string) => void;
  onPay: (id: string) => void;
  onInvoiceClick: (invoice: Invoice) => void;
}

export const formatAmount = (amount: number, currency: 'INR' | 'USD' | 'EUR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€' };
  return (
    (symbols[currency] || '') +
    Number(amount || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })
  );
};

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  currentUser,
  team,
  config,
  lastActionId,
  showActions,
  onVerify,
  onApprove,
  onRejectClick,
  onPay,
  onInvoiceClick,
}) => {
  const [verifyNotes, setVerifyNotes] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');

  const getMemberName = (id: string) => {
    const member = team.find((t) => t.id === id);
    return member ? member.name : '(removed team member)';
  };

  const getMemberRole = (id: string) => {
    const member = team.find((t) => t.id === id);
    return member ? member.role : '';
  };

  const getStatusLabel = (status: Invoice['status']) => {
    const map: Record<Invoice['status'], string> = {
      pending_verification: 'Awaiting Verification',
      pending_approval: 'Awaiting Approval',
      approved: 'Approved',
      paid: 'Paid',
      rejected: 'Rejected',
    };
    return map[status] || status;
  };

  // Filter computations
  const allCount = invoices.length;
  const pendingCount = invoices.filter(
    (i) => i.status === 'pending_verification' || i.status === 'pending_approval'
  ).length;
  const approvedCount = invoices.filter((i) => i.status === 'approved').length;
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const rejectedCount = invoices.filter((i) => i.status === 'rejected').length;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'pending' &&
        (inv.status === 'pending_verification' || inv.status === 'pending_approval')) ||
      (statusFilter === 'approved' && inv.status === 'approved') ||
      (statusFilter === 'paid' && inv.status === 'paid') ||
      (statusFilter === 'rejected' && inv.status === 'rejected');

    return matchesSearch && matchesFilter;
  });

  // Small inline stepper: Verify → Approve → Pay
  const renderInlineProgress = (inv: Invoice) => {
    const isRejected = inv.status === 'rejected';

    let s1 = 'bg-slate-200'; // Verification
    let s2 = 'bg-slate-200'; // Approval
    let s3 = 'bg-slate-200'; // Payment

    // Verification dot
    if (inv.status === 'pending_verification') s1 = 'bg-blue-400 animate-pulse';
    else if (isRejected) s1 = 'bg-red';
    else s1 = 'bg-green';

    // Approval dot
    if (inv.status === 'pending_approval') s2 = 'bg-brass/80 animate-pulse';
    else if (isRejected) s2 = 'bg-slate-200';
    else if (inv.status === 'approved' || inv.status === 'paid') s2 = 'bg-green';

    // Payment dot
    if (inv.status === 'approved') s3 = 'bg-brass/80 animate-pulse';
    else if (inv.status === 'paid') s3 = 'bg-green';

    return (
      <div className="flex items-center gap-1.5 mt-1.5" title={`Workflow: ${getStatusLabel(inv.status)}`}>
        <span className={`w-2 h-2 rounded-full ${s1}`} title="Verify" />
        <span className={`w-2 h-2 rounded-full ${s2}`} title="Approve" />
        <span className={`w-2 h-2 rounded-full ${s3}`} title="Pay" />
      </div>
    );
  };

  const renderActionButtons = (inv: Invoice) => {
    if (!currentUser) {
      return <span className="text-[11px] text-slate/75 italic">Not logged in</span>;
    }

    const isOwnEntry = inv.enteredBy === currentUser.id;

    // Step 1: Verifier verifies the invoice
    if (inv.status === 'pending_verification') {
      if (currentUser.role !== 'Verifier' && currentUser.role !== 'Admin') {
        return <span className="text-[11px] text-slate/70">Awaiting verifier</span>;
      }
      const noteKey = inv.id;
      return (
        <div className="flex flex-col gap-1.5 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
          <textarea
            rows={2}
            placeholder="Verification notes…"
            value={verifyNotes[noteKey] || ''}
            onChange={(e) =>
              setVerifyNotes((prev) => ({ ...prev, [noteKey]: e.target.value }))
            }
            className="w-full border border-slate-200 rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none text-ink-dark"
          />
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVerify(inv.id, verifyNotes[noteKey] || '');
                setVerifyNotes((prev) => ({ ...prev, [noteKey]: '' }));
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-[10px] px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Mark Verified
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRejectClick(inv.id);
              }}
              className="bg-red hover:bg-red/90 text-white font-bold text-[10px] px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      );
    }

    // Step 2: Admin approves after verification
    if (inv.status === 'pending_approval') {
      if (currentUser.role !== 'Admin') {
        return <span className="text-[11px] text-slate/70">Awaiting admin</span>;
      }
      if (isOwnEntry) {
        return (
          <span className="text-[10px] text-red font-semibold leading-tight block max-w-[130px]">
            Own entry blocked
          </span>
        );
      }
      return (
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApprove(inv.id);
            }}
            className="bg-green hover:bg-green/90 text-white font-bold text-[10px] px-2 py-1 rounded transition-colors cursor-pointer"
          >
            Approve
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRejectClick(inv.id);
            }}
            className="bg-red hover:bg-red/90 text-white font-bold text-[10px] px-2 py-1 rounded transition-colors cursor-pointer"
          >
            Reject
          </button>
        </div>
      );
    }

    // Step 3: Admin pays after approval
    if (inv.status === 'approved') {
      if (currentUser.role !== 'Admin') {
        return <span className="text-[11px] text-slate/75 italic">Awaiting payment</span>;
      }
      if (isOwnEntry) {
        return (
          <span className="text-[10px] text-red font-semibold leading-tight block max-w-[130px]">
            Release authorization required
          </span>
        );
      }
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPay(inv.id);
          }}
          className="bg-brass hover:bg-brass-light text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors cursor-pointer"
        >
          Pay Release
        </button>
      );
    }

    return <span className="text-slate/60">—</span>;
  };

  const filterTabs = [
    { id: 'all' as const, label: 'All', count: allCount },
    { id: 'pending' as const, label: 'Pending', count: pendingCount },
    { id: 'approved' as const, label: 'Approved', count: approvedCount },
    { id: 'paid' as const, label: 'Paid', count: paidCount },
    { id: 'rejected' as const, label: 'Rejected', count: rejectedCount }
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filters bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search vendor or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200/80 rounded px-8 py-1.5 text-xs text-ink-dark focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass transition-all shadow-sm"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap bg-slate-100 p-0.5 rounded-lg border border-slate-200/40 w-full md:w-auto overflow-x-auto select-none no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-ink-dark shadow-sm'
                  : 'text-slate hover:text-ink-dark'
              }`}
            >
              {tab.label}
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                statusFilter === tab.id ? 'bg-indigo-50 text-brass' : 'bg-slate-200 text-slate'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <p className="text-slate text-xs italic bg-white border border-slate-200/40 rounded p-6 shadow-sm text-center">
          No records match your query parameters.
        </p>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-3">
            {filteredInvoices.map((inv) => {
              const isNewAction = lastActionId === inv.id;

              return (
                <div
                  key={inv.id}
                  onClick={() => onInvoiceClick(inv)}
                  className={`bg-white border border-slate-200/80 rounded-lg p-4 shadow-sm relative space-y-3 cursor-pointer hover:border-brass/30 transition-all ${
                    isNewAction ? 'ring-1 ring-brass' : ''
                  }`}
                  title="Click to view full records"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-ink-dark flex items-center gap-1.5">
                        {inv.vendor}
                        <Eye size={12} className="text-slate/60 hover:text-brass transition-colors" />
                      </div>
                      {inv.poNumber && (
                        <div className="text-[10px] text-slate font-mono mt-0.5">
                          PO {inv.poNumber}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-ink-dark text-sm">
                        {formatAmount(inv.amount, config.currency)}
                      </div>
                      <div className="text-[9px] text-slate font-mono mt-0.5">
                        {inv.invoiceDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate">
                      Actor: <span className="font-medium text-ink-dark">{getMemberName(inv.enteredBy)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      {(inv.status === 'pending_verification' || inv.status === 'pending_approval') ? (
                        <span className="font-semibold text-brass text-[11px] bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded">
                          {getStatusLabel(inv.status)}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 items-center">
                          {(inv.status === 'approved' || inv.status === 'paid') && (
                            <span className="text-green text-[10px] font-bold bg-green/5 border border-green/10 px-2 py-0.5 rounded">
                              Approved
                            </span>
                          )}
                          {inv.status === 'rejected' && (
                            <span className="text-red text-[10px] font-bold bg-red/5 border border-red/10 px-2 py-0.5 rounded">
                              Rejected
                            </span>
                          )}
                          {inv.status === 'paid' && (
                            <span className="text-brass text-[10px] font-bold bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded ml-1">
                              Paid
                            </span>
                          )}
                        </div>
                      )}
                      {renderInlineProgress(inv)}
                    </div>
                  </div>

                  {inv.flags && inv.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100/50">
                      {inv.flags.map((flag, idx) => {
                        let colorClass = '';
                        if (flag.level === 'high') {
                          colorClass = 'bg-red/5 text-red border border-red/10';
                        } else if (flag.level === 'medium') {
                          colorClass = 'bg-brass/5 text-brass border border-brass/10';
                        } else {
                          colorClass = 'bg-slate/5 text-slate border border-slate/10';
                        }

                        return (
                          <span
                            key={idx}
                            title={flag.text}
                            className={`inline-block text-[9px] font-medium px-2.5 py-0.5 rounded select-none ${colorClass}`}
                          >
                            {flag.text.length > 25 ? flag.text.substring(0, 25) + '…' : flag.text}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {showActions && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end" onClick={(e) => e.stopPropagation()}>
                      {renderActionButtons(inv)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto w-full border border-slate-200/60 rounded-lg bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 select-none">
                  <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[130px]">Vendor</th>
                  <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[90px]">Invoice #</th>
                  <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[90px]">Date</th>
                  <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[100px]">Amount</th>
                  <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[110px]">Entered By</th>
                  <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[130px]">Workflow Status</th>
                  <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[150px]">Flags</th>
                  {showActions && (
                    <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 min-w-[140px]">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isNewAction = lastActionId === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onInvoiceClick(inv)}
                      className={`hover:bg-slate-50/50 cursor-pointer transition-colors group ${
                        isNewAction ? 'bg-indigo-50/15' : ''
                      }`}
                      title="Click to view full records"
                    >
                      <td className="px-4 py-3.5 align-top">
                        <div className="font-bold text-ink-dark flex items-center gap-1.5">
                          {inv.vendor}
                          <Eye size={12} className="opacity-0 group-hover:opacity-100 text-slate/50 hover:text-brass transition-all" />
                        </div>
                        {inv.poNumber && (
                          <div className="text-[10px] text-slate font-mono mt-0.5">
                            PO {inv.poNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top font-mono font-medium text-ink-dark">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5 align-top font-mono text-slate">
                        {inv.invoiceDate}
                      </td>
                      <td className="px-4 py-3.5 align-top font-mono font-bold text-ink-dark">
                        {formatAmount(inv.amount, config.currency)}
                      </td>
                      <td className="px-4 py-3.5 align-top text-slate">
                        <div className="font-medium text-ink-dark">{getMemberName(inv.enteredBy)}</div>
                        <div className="text-[9px] text-slate font-mono">{getMemberRole(inv.enteredBy)}</div>
                      </td>
                      <td className="px-4 py-3.5 align-top relative">
                        <div className="flex flex-col gap-0.5 items-start">
                          {(inv.status === 'pending_verification' || inv.status === 'pending_approval') ? (
                            <span className="font-semibold text-brass text-[11px] bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded">
                              {getStatusLabel(inv.status)}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1 items-center select-none font-mono">
                              {(inv.status === 'approved' || inv.status === 'paid') && (
                                <span className="text-green text-[10px] font-bold bg-green/5 border border-green/10 px-2 py-0.5 rounded">
                                  APPROVED
                                </span>
                              )}
                              {inv.status === 'rejected' && (
                                <span className="text-red text-[10px] font-bold bg-red/5 border border-red/10 px-2 py-0.5 rounded">
                                  REJECTED
                                </span>
                              )}
                              {inv.status === 'paid' && (
                                <span className="text-brass text-[10px] font-bold bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded ml-1">
                                  PAID
                                </span>
                              )}
                            </div>
                          )}
                          {renderInlineProgress(inv)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        {inv.flags && inv.flags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {inv.flags.map((flag, idx) => {
                              const trimmedLabel =
                                flag.text.length > 25
                                  ? flag.text.substring(0, 25) + '…'
                                  : flag.text;

                              let colorClass = '';
                              if (flag.level === 'high') {
                                colorClass = 'bg-red/5 text-red border border-red/10';
                              } else if (flag.level === 'medium') {
                                colorClass = 'bg-brass/5 text-brass border border-brass/10';
                              } else {
                                colorClass = 'bg-slate/5 text-slate border border-slate/10';
                              }

                              return (
                                <span
                                  key={idx}
                                  title={flag.text}
                                  className={`inline-block text-[9px] font-medium px-2.5 py-0.5 rounded select-none cursor-help transition-all ${colorClass}`}
                                >
                                  {trimmedLabel}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">—</span>
                        )}
                      </td>
                      {showActions && (
                        <td className="px-4 py-3.5 align-top min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                          {renderActionButtons(inv)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
