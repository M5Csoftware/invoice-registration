import React, { useState } from 'react';
import type { TeamMember, Role } from '../types';
import {
  Receipt, LogOut, ShieldCheck, User, Eye,
  LayoutDashboard, FilePlus, ClipboardCheck, History, Users, Menu, X,
} from 'lucide-react';

interface SidebarProps {
  sessionUser: TeamMember;
  activeTab: string;
  navTabs: { id: string; label: string; icon: React.ElementType; roles: string[] }[];
  onTabChange: (id: string) => void;
  onLogout: () => void;
}

const roleIcon: Record<string, React.ReactNode> = {
  'Master Admin': <ShieldCheck size={14} className="text-amber-400" />,
  Admin: <ShieldCheck size={14} className="text-brass" />,
  Verifier: <Eye size={14} className="text-blue-400" />,
  User: <User size={14} className="text-slate-300" />,
};

const roleBadge: Record<string, string> = {
  'Master Admin': 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  Admin: 'bg-brass/20 text-brass border-brass/30',
  Verifier: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  User: 'bg-slate-700 text-slate-300 border-slate-600',
};

export const Sidebar: React.FC<SidebarProps> = ({
  sessionUser,
  activeTab,
  navTabs,
  onTabChange,
  onLogout,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo — fixed height matches the main top bar */}
      <div className="px-5 h-16 flex items-center border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brass rounded-lg flex items-center justify-center shadow-md shrink-0">
            <Receipt size={18} className="text-ink-dark" />
          </div>
          <div>
            <p className="text-white font-heading font-bold text-base leading-tight">M5 Invoice</p>
            <p className="text-brass-light text-xs font-medium tracking-wide">Registration System</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold px-2 mb-2">Navigation</p>
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer group ${
                isActive
                  ? 'bg-brass text-ink-dark shadow-md shadow-brass/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Icon
                size={16}
                className={isActive ? 'text-ink-dark' : 'text-slate-400 group-hover:text-slate-200 transition-colors'}
              />
              <span>{tab.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ink-dark opacity-60" />
              )}
            </button>
          );
        })}
      </nav>

        {/* User Profile + Logout */}
        <div className="px-3 pb-4 pt-3 border-t border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-800/60">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600 shrink-0">
              {roleIcon[sessionUser.role] || <User size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{sessionUser.name}</p>
              <p className="text-xs font-mono text-slate-300 truncate">@{sessionUser.username}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${roleBadge[sessionUser.role]}`}>
              {sessionUser.role}
            </span>
          </div>

          {confirmingLogout ? (
            /* Confirmation prompt */
            <div className="rounded-lg bg-red-950/60 border border-red-500/30 px-3 py-2.5 space-y-2">
              <p className="text-xs text-red-200 font-medium leading-snug">
                Sign out of your session?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onLogout}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-1.5 rounded transition-colors cursor-pointer"
                >
                  Yes, sign out
                </button>
                <button
                  onClick={() => setConfirmingLogout(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold py-1.5 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingLogout(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-medium transition-all cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          )}
        </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-ink-dark border-r border-slate-700/50 min-h-screen sticky top-0 h-screen">
        <NavContent />
      </aside>

      {/* ── Mobile: Hamburger button ─────────────────── */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 bg-ink-dark border border-slate-700 rounded-lg flex items-center justify-center text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* ── Mobile: Drawer overlay ───────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`md:hidden fixed top-0 left-0 z-40 w-64 h-full bg-ink-dark border-r border-slate-700/50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
};

// Re-export nav tab config so App.tsx can import it cleanly
export const ALL_NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Master Admin', 'Admin', 'Verifier'] },
  { id: 'checkin',   label: 'Check In',  icon: FilePlus,        roles: ['Master Admin', 'Admin', 'User'] },
  { id: 'myinvoices',label: 'My Invoices',icon: FilePlus,       roles: ['Master Admin', 'User'] },
  { id: 'approvals', label: 'Approvals', icon: ClipboardCheck,  roles: ['Master Admin', 'Admin', 'Verifier'] },
  { id: 'audit',     label: 'Audit Trail',icon: History,        roles: ['Master Admin', 'Admin', 'Verifier'] },
  { id: 'team',      label: 'Team & Settings', icon: Users,     roles: ['Master Admin', 'Admin'] },
];
