import { useState, useEffect } from 'react';
import type { AppConfig, TeamMember, Invoice, Flag, BankDetails } from './types';
import { getStorageItem, setStorageItem } from './services/storage';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar, ALL_NAV_TABS } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CheckInView } from './components/CheckInView';
import { ApprovalsView } from './components/ApprovalsView';
import { AuditView } from './components/AuditView';
import { TeamSettingsView } from './components/TeamSettingsView';
import { Modal } from './components/Modal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { BankDetailsModal } from './components/BankDetailsModal';
import { InvoiceTable, formatAmount } from './components/InvoiceTable';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const uid = (prefix: string) => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
};

const MASTER_ADMIN_USERNAME = import.meta.env.VITE_MASTER_ADMIN_USERNAME || 'masteradmin';
const MASTER_ADMIN_PASSWORD = import.meta.env.VITE_MASTER_ADMIN_PASSWORD || 'masteradmin123';

/** Default seed data: 1 Master Admin, 1 Admin, 1 Verifier, 1 User */
const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'mem_master',
    name: 'Master Admin',
    username: MASTER_ADMIN_USERNAME,
    password: MASTER_ADMIN_PASSWORD,
    role: 'Master Admin',
  },
  {
    id: 'mem_admin',
    name: 'Admin',
    username: 'admin',
    password: 'admin123',
    role: 'Admin',
  },
  {
    id: 'mem_verifier',
    name: 'Riya Verma',
    username: 'verifier',
    password: 'verifier123',
    role: 'Verifier',
  },
  {
    id: 'mem_user',
    name: 'Amit Sharma',
    username: 'user',
    password: 'user123',
    role: 'User',
  },
];

export default function App() {
  const [config, setConfig] = useState<AppConfig>({ threshold: 50000, currency: 'INR' });
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sessionUser, setSessionUser] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [lastActionId, setLastActionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [confirmInvoice, setConfirmInvoice] = useState<Invoice | null>(null);
  const [rejectInvoiceId, setRejectInvoiceId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [bankModalInvoice, setBankModalInvoice] = useState<Invoice | null>(null);

  // Initial Load
  useEffect(() => {
    const loadAll = async () => {
      try {
        const storedConfig = await getStorageItem('config');
        if (storedConfig) {
          setConfig(JSON.parse(storedConfig));
        }

        const storedTeam = await getStorageItem('team');
        let parsedTeam: TeamMember[] = [];
        if (storedTeam) {
          parsedTeam = JSON.parse(storedTeam);
        }

        // Seed default team if no team or team lacks credentials
        const hasCredentials = parsedTeam.length > 0 && parsedTeam[0].username;
        if (!hasCredentials) {
          parsedTeam = DEFAULT_TEAM;
        }

        // Always ensure Master Admin account exists and matches .env credentials
        const masterIdx = parsedTeam.findIndex((m) => m.role === 'Master Admin' || m.username === MASTER_ADMIN_USERNAME);
        if (masterIdx === -1) {
          parsedTeam.unshift({
            id: 'mem_master',
            name: 'Master Admin',
            username: MASTER_ADMIN_USERNAME,
            password: MASTER_ADMIN_PASSWORD,
            role: 'Master Admin',
          });
        } else {
          parsedTeam[masterIdx] = {
            ...parsedTeam[masterIdx],
            username: MASTER_ADMIN_USERNAME,
            password: MASTER_ADMIN_PASSWORD,
            role: 'Master Admin',
          };
        }
        await setStorageItem('team', JSON.stringify(parsedTeam));
        setTeam(parsedTeam);

        const storedInvoices = await getStorageItem('invoices');
        if (storedInvoices) {
          setInvoices(JSON.parse(storedInvoices));
        }
      } catch (e) {
        console.error('Failed to load storage data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

  // Save methods
  const saveConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    await setStorageItem('config', JSON.stringify(newConfig));
  };

  const saveTeam = async (newTeam: TeamMember[]) => {
    setTeam(newTeam);
    await setStorageItem('team', JSON.stringify(newTeam));
  };

  const saveInvoices = async (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    await setStorageItem('invoices', JSON.stringify(newInvoices));
  };

  // Fraud-flag logic
  const computeFlags = (inv: Omit<Invoice, 'flags'>, allInvoices: Invoice[]): Flag[] => {
    const flags: Flag[] = [];
    const sameVendor = allInvoices.filter(
      (i) => i.vendor.trim().toLowerCase() === inv.vendor.trim().toLowerCase()
    );

    const exactDup = sameVendor.find(
      (i) => i.invoiceNumber.trim().toLowerCase() === inv.invoiceNumber.trim().toLowerCase()
    );
    if (exactDup) {
      flags.push({
        level: 'high',
        text: 'Same invoice number already exists for this vendor — possible resubmission',
      });
    }

    if (!exactDup) {
      const closeDup = sameVendor.find((i) => {
        return (
          Math.abs(i.amount - inv.amount) < 0.01 &&
          Math.abs(new Date(i.invoiceDate).getTime() - new Date(inv.invoiceDate).getTime()) < 3 * 86400000
        );
      });
      if (closeDup) {
        flags.push({
          level: 'medium',
          text: 'Same vendor billed the same amount within 3 days — check for duplicate payment',
        });
      }
    }

    if (config.threshold > 0 && inv.amount < config.threshold && inv.amount >= config.threshold * 0.9) {
      flags.push({
        level: 'medium',
        text: 'Amount sits just under the second-approval threshold — verify it is not split to dodge review',
      });
    }

    if (inv.amount > 0 && inv.amount % 1000 === 0) {
      flags.push({
        level: 'low',
        text: 'Round-number amount — flagged for awareness only',
      });
    }

    if (sameVendor.length === 0) {
      flags.push({
        level: 'low',
        text: 'First invoice on record from this vendor — confirm vendor details before paying',
      });
    }

    if (inv.bankLast4) {
      const priorWithBank = sameVendor
        .filter((i) => i.bankLast4)
        .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())[0];
      if (priorWithBank && priorWithBank.bankLast4 !== inv.bankLast4) {
        flags.push({
          level: 'high',
          text: "Bank account details differ from this vendor's last invoice — verify directly with the vendor before paying",
        });
      }
    }

    return flags;
  };

  // Actions
  const handleCheckin = async (formData: {
    vendor: string;
    invoiceNumber: string;
    invoiceDate: string;
    taxableAmount: number;
    taxOption: import('./types').TaxOption;
    taxAmount: number;
    amount: number;
    poNumber: string;
    bankLast4: string;
    description: string;
    invoiceImage: string | null;
  }) => {
    if (!sessionUser) return;

    const partialInv = {
      id: uid('inv'),
      vendor: formData.vendor.trim(),
      invoiceNumber: formData.invoiceNumber.trim(),
      invoiceDate: formData.invoiceDate,
      taxableAmount: formData.taxableAmount,
      taxOption: formData.taxOption,
      taxAmount: formData.taxAmount,
      amount: formData.amount,
      poNumber: formData.poNumber.trim(),
      bankLast4: formData.bankLast4.trim(),
      description: formData.description.trim(),
      invoiceImage: formData.invoiceImage,
      enteredBy: sessionUser.id,
      enteredAt: Date.now(),
      status: 'pending_verification' as const,
      approvals: [],
      history: [],
    };

    const calculatedFlags = computeFlags(partialInv, invoices);
    const flagsNote = calculatedFlags.length
      ? `Flags at entry: ${calculatedFlags.map((f) => f.text).join('; ')}`
      : '';

    const newInvoice: Invoice = {
      ...partialInv,
      flags: calculatedFlags,
      history: [
        {
          at: Date.now(),
          actorId: sessionUser.id,
          actorName: sessionUser.name,
          actorRole: sessionUser.role,
          action: 'Checked in',
          note: flagsNote,
        },
      ],
    };

    const updatedInvoices = [...invoices, newInvoice];
    await saveInvoices(updatedInvoices);
    setConfirmInvoice(newInvoice);
    setActiveTab('checkin');
    toast.success(`Invoice ${formData.invoiceNumber} checked in successfully!`, { icon: <span>📄</span> });
  };

  /** Verifier marks invoice as verified, passing it to pending_approval */
  const handleVerify = async (id: string, notes: string) => {
    if (!sessionUser) return;
    const inv = invoices.find((i) => i.id === id);
    if (!inv || inv.status !== 'pending_verification') return;

    const updatedHistory = [...(inv.history || [])];
    updatedHistory.push({
      at: Date.now(),
      actorId: sessionUser.id,
      actorName: sessionUser.name,
      actorRole: sessionUser.role,
      action: 'Verified',
      note: notes || 'Verified with vendor — no issues found.',
    });

    const updatedInvoices = invoices.map((i) =>
      i.id === id
        ? {
            ...i,
            status: 'pending_approval' as const,
            verificationNotes: notes,
            history: updatedHistory,
          }
        : i
    );

    setLastActionId(id);
    await saveInvoices(updatedInvoices);
    toast.success(`Invoice verified successfully`, { icon: <span>✅</span> });
  };

  /** Admin approves an invoice in pending_approval state */
  const handleApprove = async (id: string) => {
    if (!sessionUser) return;
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    if (inv.enteredBy === sessionUser.id) return; // Prevent self-approval
    if (sessionUser.role !== 'Admin') return;

    const updatedApprovals = [...(inv.approvals || [])];
    const updatedHistory = [...(inv.history || [])];

    updatedApprovals.push({ by: sessionUser.id, at: Date.now() });

    updatedHistory.push({
      at: Date.now(),
      actorId: sessionUser.id,
      actorName: sessionUser.name,
      actorRole: sessionUser.role,
      action: 'Approved',
      note: '',
    });

    const updatedInvoices = invoices.map((i) =>
      i.id === id
        ? { ...i, status: 'approved' as const, approvals: updatedApprovals, history: updatedHistory }
        : i
    );

    setLastActionId(id);
    await saveInvoices(updatedInvoices);
    toast.success(`Invoice approved!`, { icon: <span>👍</span> });
  };

  const handleRejectConfirm = async () => {
    if (!sessionUser || !rejectInvoiceId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Please give a reason.');
      return;
    }

    const inv = invoices.find((i) => i.id === rejectInvoiceId);
    if (!inv) return;
    if (inv.status !== 'pending_verification' && inv.status !== 'pending_approval') return;

    const updatedHistory = [...(inv.history || [])];
    updatedHistory.push({
      at: Date.now(),
      actorId: sessionUser.id,
      actorName: sessionUser.name,
      actorRole: sessionUser.role,
      action: 'Rejected',
      note: reason,
    });

    const updatedInvoices = invoices.map((i) =>
      i.id === rejectInvoiceId ? { ...i, status: 'rejected' as const, history: updatedHistory } : i
    );

    setLastActionId(rejectInvoiceId);
    await saveInvoices(updatedInvoices);
    toast.error(`Invoice rejected`, { icon: <span>❌</span> });

    // Reset reject states
    setRejectInvoiceId(null);
    setRejectReason('');
    setRejectError('');
  };

  const handlePay = async (id: string) => {
    if (!sessionUser || sessionUser.role !== 'Admin') return;
    const inv = invoices.find((i) => i.id === id);
    if (!inv || inv.status !== 'approved' || inv.enteredBy === sessionUser.id) return;

    const updatedHistory = [...(inv.history || [])];
    updatedHistory.push({
      at: Date.now(),
      actorId: sessionUser.id,
      actorName: sessionUser.name,
      actorRole: sessionUser.role,
      action: 'Marked as paid',
      note: '',
    });

    const updatedInvoices = invoices.map((i) =>
      i.id === id ? { ...i, status: 'paid' as const, history: updatedHistory } : i
    );

    setLastActionId(id);
    await saveInvoices(updatedInvoices);
    toast.success(`Invoice marked as paid!`, { icon: <span>💵</span> });
  };

  const handleSaveBankDetails = async (
    invoiceId: string,
    bankData: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      ifscCode: string;
    }
  ) => {
    if (!sessionUser) return;
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const bankLast4 = bankData.accountNumber.slice(-4);
    const bankDetails: BankDetails = {
      ...bankData,
      addedAt: Date.now(),
      addedBy: sessionUser.id,
    };

    const updatedHistory = [...(inv.history || [])];
    updatedHistory.push({
      at: Date.now(),
      actorId: sessionUser.id,
      actorName: sessionUser.name,
      actorRole: sessionUser.role,
      action: 'Bank details attached',
      note: `${bankData.bankName} (${bankData.ifscCode}) · Account: **** ${bankLast4}`,
    });

    const updatedInvoices = invoices.map((i) =>
      i.id === invoiceId
        ? {
            ...i,
            bankLast4,
            bankDetails,
            history: updatedHistory,
          }
        : i
    );

    await saveInvoices(updatedInvoices);
    toast.success(`Bank details saved for ${inv.vendor}`, { icon: <span>🏦</span> });
  };

  const handleAddMember = async (name: string, username: string, password: string, role: import('./types').Role) => {
    const newMember: TeamMember = {
      id: uid('mem'),
      name,
      username,
      password,
      role,
    };
    const updatedTeam = [...team, newMember];
    await saveTeam(updatedTeam);
  };

  const handleRemoveMember = async (id: string) => {
    const updatedTeam = team.filter((m) => m.id !== id);
    if (sessionUser?.id === id) {
      setSessionUser(null);
    }
    await saveTeam(updatedTeam);
  };

  const handleEditMember = async (
    id: string,
    name: string,
    username: string,
    password: string,
    role: import('./types').Role
  ) => {
    const updatedTeam = team.map((m) =>
      m.id === id ? { ...m, name, username, password, role } : m
    );
    // If current user edited themselves, sync session
    if (sessionUser?.id === id) {
      const updated = updatedTeam.find((m) => m.id === id);
      if (updated) setSessionUser(updated);
    }
    await saveTeam(updatedTeam);
  };

  const handleSaveSettings = async (currency: AppConfig['currency'], threshold: number) => {
    const updatedConfig = { currency, threshold };
    await saveConfig(updatedConfig);
  };

  const handleLogin = (member: TeamMember) => {
    setSessionUser(member);
    toast.success(`Welcome back, ${member.name}!`, { icon: <span>👋</span> });
    // Set default tab based on role
    if (member.role === 'User') {
      setActiveTab('checkin');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setSessionUser(null);
    setActiveTab('dashboard');
    toast.info('Signed out of session');
  };

  // Rendering loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-slate font-heading font-semibold text-base">
        Loading register…
      </div>
    );
  }

  // Show login screen if no session
  if (!sessionUser) {
    return <LoginScreen team={team} onLogin={handleLogin} />;
  }

  const navTabs = ALL_NAV_TABS.filter((t) => t.roles.includes(sessionUser.role));

  // Ensure active tab is accessible for this role
  const isTabAccessible = navTabs.some((t) => t.id === activeTab);
  const effectiveTab = isTabAccessible ? activeTab : navTabs[0]?.id || 'dashboard';

  // My Invoices = only invoices entered by this user
  const myInvoices = invoices.filter((i) => i.enteredBy === sessionUser.id);

  return (
    <div className="min-h-screen w-full bg-paper flex">
      {/* ── Sidebar ─────────────────────────────────── */}
      <Sidebar
        sessionUser={sessionUser}
        activeTab={effectiveTab}
        navTabs={navTabs}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* ── Main content ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Page title bar — h-16 matches sidebar logo zone */}
        <div className="bg-white border-b border-slate-200/80 px-8 h-16 flex items-center shadow-sm md:pl-8 pl-14">
          <div>
            <h1 className="text-xl font-heading font-bold text-ink-dark leading-tight">
              {navTabs.find((t) => t.id === effectiveTab)?.label ?? 'Dashboard'}
            </h1>
            <p className="text-xs text-slate-600 font-medium tracking-wide mt-0.5">
              M5 Invoice Registration · Internal Use Only
            </p>
          </div>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 p-6 sm:p-8 bg-paper overflow-y-auto">
          {effectiveTab === 'dashboard' && (
            <DashboardView invoices={invoices} team={team} config={config} onInvoiceClick={setSelectedInvoice} />
          )}

          {effectiveTab === 'checkin' && (
            <CheckInView currentUser={sessionUser} config={config} onSubmit={handleCheckin} />
          )}

          {effectiveTab === 'myinvoices' && (
            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-ink-dark">My Invoices</h2>
              <p className="text-xs text-slate">Track the approval status of your submitted invoices.</p>
              {myInvoices.length === 0 ? (
                <p className="text-slate text-xs italic bg-white border border-slate-200/60 rounded-lg p-6 shadow-sm">
                  You haven't submitted any invoices yet.
                </p>
              ) : (
                <InvoiceTable
                  invoices={myInvoices}
                  currentUser={sessionUser}
                  team={team}
                  config={config}
                  lastActionId={null}
                  showActions={false}
                  onVerify={() => {}}
                  onApprove={() => {}}
                  onRejectClick={() => {}}
                  onPay={() => {}}
                  onInvoiceClick={setSelectedInvoice}
                  onAddBankDetails={(inv) => setBankModalInvoice(inv)}
                />
              )}
            </div>
          )}

          {effectiveTab === 'approvals' && (
            <ApprovalsView
              invoices={invoices}
              currentUser={sessionUser}
              team={team}
              config={config}
              lastActionId={lastActionId}
              onVerify={handleVerify}
              onApprove={handleApprove}
              onRejectClick={setRejectInvoiceId}
              onPay={handlePay}
              onInvoiceClick={setSelectedInvoice}
              onAddBankDetails={(inv) => setBankModalInvoice(inv)}
            />
          )}

          {effectiveTab === 'audit' && <AuditView invoices={invoices} />}

          {effectiveTab === 'team' && (
            <TeamSettingsView
              team={team}
              config={config}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onEditMember={handleEditMember}
              onSaveSettings={handleSaveSettings}
              currentUserId={sessionUser?.id ?? null}
              isMasterAdmin={sessionUser?.role === 'Master Admin'}
            />
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmInvoice !== null}
        onClose={() => setConfirmInvoice(null)}
        title="Invoice Checked In"
      >
        {confirmInvoice && (
          <div className="space-y-4">
            <div className="text-xs font-medium text-ink-dark bg-card p-3 rounded border border-ink/10 space-y-1">
              <div>
                <span className="font-semibold">{confirmInvoice.vendor}</span> &middot;{' '}
                <span className="font-mono">{confirmInvoice.invoiceNumber}</span>
              </div>
              <div className="font-mono text-slate-700">
                Taxable: {formatAmount(confirmInvoice.taxableAmount || confirmInvoice.amount / 1.18, config.currency)} &middot; Tax (18% {confirmInvoice.taxOption === 'CGST_SGST' ? 'CGST+SGST' : 'IGST'}): {formatAmount(confirmInvoice.taxAmount || confirmInvoice.amount - (confirmInvoice.amount / 1.18), config.currency)}
              </div>
              <div className="font-mono font-bold text-ink-dark text-sm border-t border-slate-100 pt-1 mt-1">
                Total Amount: {formatAmount(confirmInvoice.amount, config.currency)}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Anomaly Check
              </span>
              {confirmInvoice.flags && confirmInvoice.flags.length > 0 ? (
                <ul className="space-y-2 max-h-[220px] overflow-y-auto">
                  {confirmInvoice.flags.map((f, idx) => {
                    let textClass = '';
                    if (f.level === 'high') textClass = 'text-red bg-red/5 border-red';
                    else if (f.level === 'medium') textClass = 'text-brass bg-brass/5 border-brass';
                    else textClass = 'text-slate bg-slate/5 border-slate';

                    return (
                      <li
                        key={idx}
                        className={`text-xs p-2.5 rounded border border-l-4 ${textClass} leading-relaxed`}
                      >
                        {f.text}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-green bg-green/5 border border-green p-3 rounded">
                  No anomalies detected.
                </p>
              )}
            </div>
            <div className="text-right">
              <button
                onClick={() => setConfirmInvoice(null)}
                className="bg-ink hover:bg-ink-dark text-paper text-xs font-semibold px-4 py-2 rounded shadow transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectInvoiceId !== null}
        onClose={() => {
          setRejectInvoiceId(null);
          setRejectReason('');
          setRejectError('');
        }}
        title="Reject Invoice"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate font-medium">
            Give a short reason — this becomes a permanent part of the audit trail.
          </p>
          <div>
            <textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (e.target.value.trim()) setRejectError('');
              }}
              rows={3}
              placeholder="Reason for rejection..."
              className="w-full bg-white border border-slate-200 rounded p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark resize-y shadow-sm"
            />
            {rejectError && <div className="text-red text-xs mt-1 font-medium">{rejectError}</div>}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setRejectInvoiceId(null);
                setRejectReason('');
                setRejectError('');
              }}
              className="border border-slate-200 text-slate hover:bg-slate-50 text-xs font-semibold px-4 py-2 rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectConfirm}
              className="bg-red hover:bg-red/90 text-white text-xs font-semibold px-4 py-2 rounded shadow transition-colors cursor-pointer"
            >
              Confirm Reject
            </button>
          </div>
        </div>
      </Modal>

      {/* Invoice Records Detail Modal Drawer */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={selectedInvoice !== null}
        onClose={() => setSelectedInvoice(null)}
        currentUser={sessionUser}
        team={team}
        config={config}
        onApprove={handleApprove}
        onRejectClick={(id) => {
          setRejectInvoiceId(id);
          setSelectedInvoice(null);
        }}
        onPay={handlePay}
        onAddBankDetails={(inv) => setBankModalInvoice(inv)}
      />

      {/* Add Bank Details Modal */}
      <BankDetailsModal
        isOpen={bankModalInvoice !== null}
        onClose={() => setBankModalInvoice(null)}
        invoice={bankModalInvoice}
        onSave={handleSaveBankDetails}
      />

      {/* Toast notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
        toastClassName="text-xs font-semibold"
      />
    </div>
  );
}
