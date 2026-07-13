import React from 'react';
import type { TeamMember } from '../types';
import { Receipt, LogOut, ShieldCheck, User, Eye } from 'lucide-react';

interface HeaderProps {
  team: TeamMember[];
  currentUserId: string | null;
  onUserChange: (userId: string | null) => void;
  sessionUser: TeamMember | null;
  onLogout: () => void;
}

const roleIcon: Record<string, React.ReactNode> = {
  Admin: <ShieldCheck size={13} className="text-brass" />,
  Verifier: <Eye size={13} className="text-blue-400" />,
  User: <User size={13} className="text-slate-300" />,
};

export const Header: React.FC<HeaderProps> = ({ sessionUser, onLogout }) => {
  return (
    <header className="bg-ink border-b border-slate-800 px-6 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm text-white">
      <div className="flex items-center gap-3">
        <div className="bg-brass p-2 rounded-lg text-white shadow-sm flex items-center justify-center">
          <Receipt size={20} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-white text-xl sm:text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
            M5 Invoice Registration
          </h1>
          <p className="text-[10px] text-slate mt-0.5 font-medium tracking-wide">
            Internal Use Only
          </p>
        </div>
      </div>

      {sessionUser && (
        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* User info */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2">
            <div className="w-7 h-7 bg-ink-dark rounded-full flex items-center justify-center border border-slate-700 shrink-0">
              {roleIcon[sessionUser.role] || <User size={13} />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">{sessionUser.name}</span>
              <span className="text-[10px] font-mono text-slate">@{sessionUser.username} · {sessionUser.role}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Sign out"
            className="flex items-center gap-1.5 text-slate-400 hover:text-red/80 hover:bg-red/10 border border-slate-700/50 hover:border-red/20 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};
