import React, { useState } from 'react';
import type { TeamMember, AppConfig, Role } from '../types';
import { Users, Trash2, Settings, UserPlus, Info, ShieldCheck, User, Eye, EyeOff } from 'lucide-react';

interface TeamSettingsViewProps {
  team: TeamMember[];
  config: AppConfig;
  onAddMember: (name: string, username: string, password: string, role: Role) => void;
  onRemoveMember: (id: string) => void;
  onSaveSettings: (currency: AppConfig['currency'], threshold: number) => void;
  currentUserId: string | null;
}

const roleColors: Record<Role, string> = {
  Admin: 'bg-brass/10 text-brass border border-brass/20',
  Verifier: 'bg-blue-50 text-blue-700 border border-blue-200',
  User: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const roleIcons: Record<Role, React.ReactNode> = {
  Admin: <ShieldCheck size={11} />,
  Verifier: <Eye size={11} />,
  User: <User size={11} />,
};

export const TeamSettingsView: React.FC<TeamSettingsViewProps> = ({
  team,
  config,
  onAddMember,
  onRemoveMember,
  onSaveSettings,
  currentUserId,
}) => {
  const [memberName, setMemberName] = useState('');
  const [memberUsername, setMemberUsername] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberRole, setMemberRole] = useState<Role>('User');
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');

  const [currency, setCurrency] = useState<AppConfig['currency']>(config.currency);
  const [threshold, setThreshold] = useState<string>(config.threshold.toString());

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!memberName.trim()) return setFormError('Name is required.');
    if (!memberUsername.trim()) return setFormError('Username is required.');
    if (memberPassword.length < 6) return setFormError('Password must be at least 6 characters.');
    // Prevent duplicate username
    if (team.some((m) => m.username.toLowerCase() === memberUsername.trim().toLowerCase())) {
      return setFormError('Username already taken.');
    }
    // Prevent creating another Admin
    if (memberRole === 'Admin') {
      return setFormError('Only one Admin is allowed. You cannot add another Admin.');
    }
    onAddMember(memberName.trim(), memberUsername.trim(), memberPassword, memberRole);
    setMemberName('');
    setMemberUsername('');
    setMemberPassword('');
    setMemberRole('User');
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const thresholdNum = parseFloat(threshold);
    onSaveSettings(currency, isNaN(thresholdNum) ? 0 : thresholdNum);
  };

  return (
    <div className="space-y-8">
      {/* Team Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
          <Users size={18} className="text-brass" />
          <h2 className="text-lg font-serif font-black text-ink-dark">
            Team Member Accounts
          </h2>
        </div>

        {/* Mobile Team List */}
        <div className="block sm:hidden space-y-2">
          {team.map((m) => (
            <div key={m.id} className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-sm flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-ink-dark">{m.name}</div>
                <div className="text-[10px] text-slate font-mono mt-0.5">@{m.username}</div>
                <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded mt-1 ${roleColors[m.role]}`}>
                  {roleIcons[m.role]} {m.role}
                </span>
              </div>
              {m.id !== currentUserId && m.role !== 'Admin' && (
                <button
                  onClick={() => onRemoveMember(m.id)}
                  className="text-red hover:text-red/80 hover:bg-red/10 p-2 rounded transition-colors cursor-pointer"
                  title="Remove team member"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Team Table */}
        <div className="hidden sm:block overflow-x-auto border border-slate-200/60 rounded-lg bg-white shadow-sm max-w-3xl">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 select-none">
                <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3">Name</th>
                <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3">Username</th>
                <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3">Role</th>
                <th className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate px-4 py-3 w-[80px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {team.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-ink-dark">{m.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-500">@{m.username}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${roleColors[m.role]}`}>
                      {roleIcons[m.role]} {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.id !== currentUserId && m.role !== 'Admin' ? (
                      <button
                        onClick={() => onRemoveMember(m.id)}
                        className="text-red hover:text-red/80 hover:bg-red/10 p-1.5 rounded transition-colors cursor-pointer"
                        title="Remove team member"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate/40 italic px-2">
                        {m.id === currentUserId ? 'You' : 'Protected'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Team Member Form */}
        <form
          onSubmit={handleAddMemberSubmit}
          className="max-w-md bg-white border border-slate-200/60 rounded-lg p-5 shadow-sm space-y-4"
        >
          <h3 className="font-bold text-xs uppercase tracking-wider text-ink-dark flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <UserPlus size={14} className="text-brass" /> Add New Account
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate mb-1 block">
                Full Name
              </label>
              <input
                type="text"
                required
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark shadow-sm"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate mb-1 block">
                Username
              </label>
              <input
                type="text"
                required
                value={memberUsername}
                onChange={(e) => setMemberUsername(e.target.value)}
                placeholder="e.g. johndoe"
                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark shadow-sm"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate mb-1 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-slate hover:text-ink-dark transition"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate mb-1 block">
                Role
              </label>
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value as Role)}
                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark cursor-pointer shadow-sm"
              >
                <option value="User">User (submits invoices)</option>
                <option value="Verifier">Verifier (verifies with vendors)</option>
              </select>
            </div>
          </div>
          {formError && (
            <p className="text-red text-[11px] font-medium">{formError}</p>
          )}
          <button
            type="submit"
            className="bg-brass hover:bg-brass-light text-white font-semibold text-[11px] px-3.5 py-2 rounded shadow-sm transition-colors cursor-pointer"
          >
            Create Account
          </button>
        </form>
      </div>

      {/* Settings Section */}
      <div className="space-y-4 pt-6 border-t border-slate-200/60">
        <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
          <Settings size={18} className="text-brass" />
          <h2 className="text-lg font-serif font-black text-ink-dark">
            System Control Settings
          </h2>
        </div>

        <form
          onSubmit={handleSettingsSubmit}
          className="max-w-md bg-white border border-slate-200/60 rounded-lg p-5 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate mb-1 block">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as AppConfig['currency'])}
                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark cursor-pointer shadow-sm"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate mb-1 block">
                Second-Approval Threshold
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark shadow-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-brass hover:bg-brass-light text-white font-semibold text-[11px] px-4 py-2 rounded shadow-sm transition-colors cursor-pointer"
          >
            Save Settings
          </button>
        </form>
      </div>

      {/* Info Callout */}
      <div className="border border-slate-200 border-l-4 border-l-brass bg-white p-4 rounded-lg text-xs text-slate font-medium max-w-2xl flex items-start gap-2.5 shadow-sm">
        <Info size={16} className="text-brass flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed text-slate">
          <strong>Role Access Summary:</strong> <strong>Admin</strong> has full access and creates accounts.{' '}
          <strong>Verifier</strong> can verify invoices and add notes but cannot submit invoices.{' '}
          <strong>User</strong> can only check in invoices and view their own submissions.
        </p>
      </div>
    </div>
  );
};
