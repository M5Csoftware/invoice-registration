import { useState, useEffect } from 'react';
import type { AppConfig, TeamMember, Invoice, Flag } from './types';
import { getStorageItem, setStorageItem } from './services/storage';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CheckInView } from './components/CheckInView';
import { ApprovalsView } from './components/ApprovalsView';
import { AuditView } from './components/AuditView';
import { TeamSettingsView } from './components/TeamSettingsView';
import { Modal } from './components/Modal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { formatAmount } from './components/InvoiceTable';
import { LayoutDashboard, FilePlus, ClipboardCheck, History, Users } from 'lucide-react';

const uid = (prefix: string) => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
};

/** Default seed data: 1 Admin, 1 Verifier, 1 User */
const DEFAULT_TEAM: TeamMember[] = [
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

        // Seed default team if no team or team lacks credentials (migration)
        const hasCredentials = parsedTeam.length > 0 && parsedTeam[0].username;
        if (!hasCredentials) {
          parsedTeam = DEFAULT_TEAM;
          await setStorageItem('team', JSON.stringify(parsedTeam));
        }
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

  const handleSaveSettings = async (currency: AppConfig['currency'], threshold: number) => {
    const updatedConfig = { currency, threshold };
    await saveConfig(updatedConfig);
  };

  const handleLogin = (member: TeamMember) => {
    setSessionUser(member);
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
  };

  // Rendering loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-slate font-serif font-black text-lg">
        Loading register…
      </div>
    );
  }

  // Show login screen if no session
  if (!sessionUser) {
    return <LoginScreen team={team} onLogin={handleLogin} />;
  }

  // Navigation items - RBAC restricted
  const allNavTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Verifier'] },
    { id: 'checkin', label: 'Check In', icon: FilePlus, roles: ['Admin', 'User'] },
    { id: 'myinvoices', label: 'My Invoices', icon: FilePlus, roles: ['User'] },
    { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, roles: ['Admin', 'Verifier'] },
    { id: 'audit', label: 'Audit Trail', icon: History, roles: ['Admin', 'Verifier'] },
    { id: 'team', label: 'Team & Settings', icon: Users, roles: ['Admin'] },
  ];

  const navTabs = allNavTabs.filter((t) => t.roles.includes(sessionUser.role));

  // Ensure active tab is accessible for this role
  const isTabAccessible = navTabs.some((t) => t.id === activeTab);
  const effectiveTab = isTabAccessible ? activeTab : navTabs[0]?.id || 'dashboard';

  // My Invoices = only invoices entered by this user
  const myInvoices = invoices.filter((i) => i.enteredBy === sessionUser.id);

  return (
    <div className="min-h-screen w-full bg-paper flex flex-col">
      {/* Header */}
      <Header
        team={team}
        currentUserId={sessionUser.id}
        onUserChange={() => {}}
        sessionUser={sessionUser}
        onLogout={handleLogout}
      />

      {/* Tabs Bar */}
      <div className="flex bg-ink-dark border-b border-ink/20 px-6 overflow-x-auto select-none no-scrollbar">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = effectiveTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all duration-150 border-t-3 border-transparent cursor-pointer ${
                isActive
                  ? 'bg-paper text-ink-dark border-t-brass shadow-sm'
                  : 'text-brass-light hover:text-white hover:bg-ink'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-brass' : 'text-brass-light'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <main className="flex-grow p-6 sm:p-8 bg-paper relative">
        {effectiveTab === 'dashboard' && (
          <DashboardView invoices={invoices} team={team} config={config} onInvoiceClick={setSelectedInvoice} />
        )}

        {effectiveTab === 'checkin' && (
          <CheckInView currentUser={sessionUser} config={config} onSubmit={handleCheckin} />
        )}

        {effectiveTab === 'myinvoices' && (
          <div className="space-y-4">
            <h2 className="text-lg font-serif font-black text-ink-dark">My Invoices</h2>
            <p className="text-xs text-slate">Track the approval status of your submitted invoices.</p>
            {/* Reuse InvoiceTable but show only user's invoices without action buttons */}
            <DashboardView
              invoices={myInvoices}
              team={team}
              config={config}
              onInvoiceClick={setSelectedInvoice}
            />
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
          />
        )}

        {effectiveTab === 'audit' && <AuditView invoices={invoices} />}

        {effectiveTab === 'team' && (
          <TeamSettingsView
            team={team}
            config={config}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onSaveSettings={handleSaveSettings}
            currentUserId={sessionUser.id}
          />
        )}
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmInvoice !== null}
        onClose={() => setConfirmInvoice(null)}
        title="Invoice Checked In"
      >
        {confirmInvoice && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-ink-dark bg-card p-3 rounded border border-ink/10">
              <span className="font-semibold">{confirmInvoice.vendor}</span> &middot;{' '}
              <span className="font-mono">{confirmInvoice.invoiceNumber}</span> &middot;{' '}
              <span className="font-mono">{formatAmount(confirmInvoice.amount, config.currency)}</span>
            </p>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate block mb-1">
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
      />
    </div>
  );
}
