import React, { useState } from 'react';
import type { TeamMember } from '../types';
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
  'Master Admin': <ShieldCheck size={14} className="text-primary" />,
  Admin: <ShieldCheck size={14} className="text-primary" />,
  Verifier: <Eye size={14} className="text-blue-500" />,
  User: <User size={14} className="text-muted-foreground" />,
};

const roleBadge: Record<string, string> = {
  'Master Admin': 'bg-primary/15 text-primary border-primary/30',
  Admin: 'bg-primary/10 text-primary border-primary/20',
  Verifier: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  User: 'bg-accent text-muted-foreground border-border',
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
      <div className="px-5 h-16 flex items-center border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <Receipt size={18} />
          </div>
          <div>
            <p className="text-foreground font-heading font-bold text-base leading-tight">M5 Invoice</p>
            <p className="text-muted-foreground text-xs font-medium tracking-wide">Registration System</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto hide-scrollbar">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold px-2 mb-2">Navigation</p>
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer group ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon
                size={16}
                className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground transition-colors'}
              />
              <span>{tab.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

        {/* User Profile + Logout */}
        <div className="px-3 pb-4 pt-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-accent/40 border border-border/50">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center border border-border shrink-0 text-foreground">
              {roleIcon[sessionUser.role] || <User size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{sessionUser.name}</p>
              <p className="text-xs font-mono text-muted-foreground truncate">@{sessionUser.username}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${roleBadge[sessionUser.role]}`}>
              {sessionUser.role}
            </span>
          </div>

          {confirmingLogout ? (
            /* Confirmation prompt */
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5 space-y-2">
              <p className="text-xs text-destructive font-medium leading-snug">
                Sign out of your session?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onLogout}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold py-1.5 rounded transition-colors cursor-pointer"
                >
                  Yes, sign out
                </button>
                <button
                  onClick={() => setConfirmingLogout(false)}
                  className="flex-1 bg-accent hover:bg-accent/80 text-accent-foreground text-xs font-semibold py-1.5 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingLogout(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 text-xs font-medium transition-all cursor-pointer"
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
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-background/50 backdrop-blur-xl border-r border-border min-h-screen sticky top-0 h-screen">
        <NavContent />
      </aside>

      {/* ── Mobile: Hamburger button ─────────────────── */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 bg-background border border-border rounded-lg flex items-center justify-center text-foreground hover:bg-accent transition shadow-lg cursor-pointer"
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
        className={`md:hidden fixed top-0 left-0 z-40 w-64 h-full bg-background/95 backdrop-blur-xl border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out ${
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
