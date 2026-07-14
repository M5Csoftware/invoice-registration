import React, { useState } from 'react';
import type { TeamMember, AppConfig, Role } from '../types';
import {
  Users, Trash2, Settings, UserPlus, Info, ShieldCheck,
  User, Eye, EyeOff, Pencil, X, Check,
} from 'lucide-react';
import { toast } from 'react-toastify';

interface TeamSettingsViewProps {
  team: TeamMember[];
  config: AppConfig;
  onAddMember: (name: string, username: string, password: string, role: Role) => void;
  onRemoveMember: (id: string) => void;
  onEditMember: (id: string, name: string, username: string, password: string, role: Role) => void;
  onSaveSettings: (currency: AppConfig['currency'], threshold: number) => void;
  currentUserId: string | null;
  isMasterAdmin?: boolean;
}

const roleColors: Record<Role, string> = {
  'Master Admin': 'bg-amber-50 text-amber-800 border border-amber-300 font-bold',
  Admin: 'bg-brass/10 text-brass border border-brass/20',
  Verifier: 'bg-blue-50 text-blue-700 border border-blue-200',
  User: 'bg-slate-100 text-slate-700 border border-slate-300',
};

const roleIcons: Record<Role, React.ReactNode> = {
  'Master Admin': <ShieldCheck size={11} className="text-amber-600" />,
  Admin: <ShieldCheck size={11} />,
  Verifier: <Eye size={11} />,
  User: <User size={11} />,
};

export const TeamSettingsView: React.FC<TeamSettingsViewProps> = ({
  team,
  config,
  onAddMember,
  onRemoveMember,
  onEditMember,
  onSaveSettings,
  currentUserId,
  isMasterAdmin = false,
}) => {
  // --- Add member state ---
  const [memberName, setMemberName] = useState('');
  const [memberUsername, setMemberUsername] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberRole, setMemberRole] = useState<Role>('User');
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');

  // --- Edit member state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<Role>('User');
  const [showEditPw, setShowEditPw] = useState(false);
  const [editError, setEditError] = useState('');

  // --- Settings state ---
  const [currency, setCurrency] = useState<AppConfig['currency']>(config.currency);
  const [threshold, setThreshold] = useState<string>(config.threshold.toString());

  const openEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditUsername(m.username);
    setEditPassword('');
    setEditRole(m.role === 'Admin' ? 'Admin' : m.role);
    setEditError('');
    setShowEditPw(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError('');
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!memberName.trim()) return setFormError('Name is required.');
    if (!memberUsername.trim()) return setFormError('Username is required.');
    if (memberPassword.length < 6) return setFormError('Password must be at least 6 characters.');
    if (team.some((m) => m.username.toLowerCase() === memberUsername.trim().toLowerCase())) {
      return setFormError('Username already taken.');
    }
    onAddMember(memberName.trim(), memberUsername.trim(), memberPassword, memberRole);
    toast.success(`Account created for ${memberName.trim()} (@${memberUsername.trim()}) as ${memberRole}`, {
      icon: <span>🎉</span>,
    });
    setMemberName('');
    setMemberUsername('');
    setMemberPassword('');
    setMemberRole('User');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    if (!editName.trim()) return setEditError('Name is required.');
    if (!editUsername.trim()) return setEditError('Username is required.');
    if (editPassword && editPassword.length < 6) return setEditError('Password must be at least 6 characters.');

    // Check duplicate username (exclude the member being edited)
    if (
      team.some(
        (m) =>
          m.id !== editingId &&
          m.username.toLowerCase() === editUsername.trim().toLowerCase()
      )
    ) {
      return setEditError('Username already taken by another member.');
    }

    const member = team.find((m) => m.id === editingId)!;
    const finalPassword = editPassword.trim() ? editPassword : member.password;
    const finalRole = member.role === 'Admin' ? 'Admin' : editRole;

    onEditMember(editingId!, editName.trim(), editUsername.trim(), finalPassword, finalRole);

    const passwordChanged = editPassword.trim().length > 0;
    toast.success(
      `Updated ${editName.trim()}${passwordChanged ? ' · password reset' : ''}`,
      { icon: <span>✏️</span> }
    );
    cancelEdit();
  };

  const handleRemove = (m: TeamMember) => {
    onRemoveMember(m.id);
    toast.info(`Removed ${m.name} from the team`, { icon: <span>🗑️</span> });
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const thresholdNum = parseFloat(threshold);
    onSaveSettings(currency, isNaN(thresholdNum) ? 0 : thresholdNum);
    toast.success('Settings saved', { icon: <span>⚙️</span> });
  };

  const inputCls =
    'w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark shadow-md';
  const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 block';

  return (
    <div className="w-full space-y-8">
      {/* ── Team Section ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-300 pb-2">
          <Users size={18} className="text-brass" />
          <h2 className="text-xl font-heading font-bold text-ink-dark">Team Member Accounts</h2>
        </div>

        {/* ── Mobile list ── */}
        <div className="block sm:hidden space-y-2">
          {team.map((m) => (
            <div key={m.id}>
              <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-md flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-ink-dark">{m.name}</div>
                  <div className="text-xs text-slate-700 font-mono mt-0.5">@{m.username}</div>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded mt-1 ${roleColors[m.role]}`}>
                    {roleIcons[m.role]} {m.role}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {m.id !== currentUserId && m.role !== 'Admin' && (
                    <>
                      <button
                        onClick={() => openEdit(m)}
                        className="text-slate hover:text-brass hover:bg-brass/10 p-2 rounded transition-colors cursor-pointer"
                        title="Edit member"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleRemove(m)}
                        className="text-red hover:text-red/80 hover:bg-red/10 p-2 rounded transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Inline edit panel (mobile) */}
              {editingId === m.id && (
                <div className="mt-1 border border-brass/30 bg-brass/5 rounded-lg p-4 shadow-md">
                  <EditForm
                    editName={editName} setEditName={setEditName}
                    editUsername={editUsername} setEditUsername={setEditUsername}
                    editPassword={editPassword} setEditPassword={setEditPassword}
                    editRole={editRole} setEditRole={setEditRole}
                    showEditPw={showEditPw} setShowEditPw={setShowEditPw}
                    editError={editError}
                    isAdmin={m.role === 'Admin'}
                    isMasterAdmin={isMasterAdmin}
                    onSubmit={handleEditSubmit}
                    onCancel={cancelEdit}
                    inputCls={inputCls}
                    labelCls={labelCls}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden sm:block overflow-x-auto border border-slate-300 rounded-lg bg-white shadow-md w-full">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50/70 select-none">
                <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3">Name</th>
                <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3">Username</th>
                <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3">Role</th>
                <th className="font-sans text-xs uppercase font-bold tracking-wider text-slate-700 px-4 py-3 w-[100px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {team.map((m) => (
                <React.Fragment key={m.id}>
                  <tr className={`transition-colors ${editingId === m.id ? 'bg-brass/5' : 'hover:bg-slate-50/40'}`}>
                    <td className="px-4 py-3 font-semibold text-ink-dark">{m.name}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-600">@{m.username}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${roleColors[m.role]}`}>
                        {roleIcons[m.role]} {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.id !== currentUserId && (m.role !== 'Admin' || isMasterAdmin) && m.role !== 'Master Admin' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => editingId === m.id ? cancelEdit() : openEdit(m)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${editingId === m.id ? 'text-brass bg-brass/10' : 'text-slate hover:text-brass hover:bg-brass/10'}`}
                            title={editingId === m.id ? 'Cancel edit' : 'Edit member'}
                          >
                            {editingId === m.id ? <X size={13} /> : <Pencil size={13} />}
                          </button>
                          <button
                            onClick={() => handleRemove(m)}
                            className="text-red hover:text-red/80 hover:bg-red/10 p-1.5 rounded transition-colors cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic px-2">
                          {m.id === currentUserId ? 'You' : 'Protected'}
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Inline edit row (desktop) */}
                  {editingId === m.id && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 bg-brass/5 border-b border-brass/20">
                        <EditForm
                          editName={editName} setEditName={setEditName}
                          editUsername={editUsername} setEditUsername={setEditUsername}
                          editPassword={editPassword} setEditPassword={setEditPassword}
                          editRole={editRole} setEditRole={setEditRole}
                          showEditPw={showEditPw} setShowEditPw={setShowEditPw}
                          editError={editError}
                          isAdmin={m.role === 'Admin'}
                          isMasterAdmin={isMasterAdmin}
                          onSubmit={handleEditSubmit}
                          onCancel={cancelEdit}
                          inputCls={inputCls}
                          labelCls={labelCls}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Add member form ── */}
        <form
          onSubmit={handleAddMemberSubmit}
          className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-lg p-6 shadow-md space-y-4"
        >
          <h3 className="font-bold text-xs uppercase tracking-wider text-ink-dark flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <UserPlus size={14} className="text-brass" /> Add New Account
          </h3>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Full Name</label>
              <input
                type="text"
                required
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="e.g. John Doe"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Username</label>
              <input
                type="text"
                required
                value={memberUsername}
                onChange={(e) => setMemberUsername(e.target.value)}
                placeholder="e.g. johndoe"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={`${inputCls} pr-8`}
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
              <label className={labelCls}>Role</label>
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value as Role)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="User">User (submits invoices)</option>
                <option value="Verifier">Verifier (verifies with vendors)</option>
                {isMasterAdmin && (
                  <option value="Admin">Admin (approval authority & system config)</option>
                )}
              </select>
              {!isMasterAdmin && (
                <p className="text-[11px] text-slate-600 mt-1 italic">
                  Note: Only Master Admin can create Admin accounts.
                </p>
              )}
            </div>
          </div>
          {formError && <p className="text-red text-xs font-semibold">{formError}</p>}
          <button
            type="submit"
            className="bg-brass hover:bg-brass-light text-white font-semibold text-xs px-4 py-2.5 rounded shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus size={14} /> Create Account
          </button>
        </form>
      </div>

      {/* ── Settings Section ──────────────────────────────────────── */}
      <div className="space-y-4 pt-6 border-t border-slate-300">
        <div className="flex items-center gap-2 border-b border-slate-300 pb-2">
          <Settings size={18} className="text-brass" />
          <h2 className="text-xl font-heading font-bold text-ink-dark">System Control Settings</h2>
        </div>
        <form
          onSubmit={handleSettingsSubmit}
          className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-lg p-6 shadow-md space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as AppConfig['currency'])}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Second-Approval Threshold</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-brass hover:bg-brass-light text-white font-semibold text-xs px-4 py-2 rounded shadow-md transition-colors cursor-pointer"
          >
            Save Settings
          </button>
        </form>
      </div>

      {/* ── Info Callout ───────────────────────────────────────────── */}
      <div className="border border-slate-300 border-l-4 border-l-brass bg-white p-4 rounded-lg text-xs text-slate font-medium w-full flex items-start gap-2.5 shadow-md">
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

/* ─── Reusable inline edit form ─────────────────────────────────────────── */
interface EditFormProps {
  editName: string; setEditName: (v: string) => void;
  editUsername: string; setEditUsername: (v: string) => void;
  editPassword: string; setEditPassword: (v: string) => void;
  editRole: Role; setEditRole: (v: Role) => void;
  showEditPw: boolean; setShowEditPw: (v: boolean) => void;
  editError: string;
  isAdmin: boolean;
  isMasterAdmin?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  inputCls: string;
  labelCls: string;
}

const EditForm: React.FC<EditFormProps> = ({
  editName, setEditName,
  editUsername, setEditUsername,
  editPassword, setEditPassword,
  editRole, setEditRole,
  showEditPw, setShowEditPw,
  editError,
  isAdmin,
  isMasterAdmin = false,
  onSubmit,
  onCancel,
  inputCls,
  labelCls,
}) => (
  <form onSubmit={onSubmit} className="space-y-3">
    <p className="text-xs font-bold uppercase tracking-wider text-brass flex items-center gap-1">
      <Pencil size={12} /> Editing Member
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={labelCls}>Full Name</label>
        <input
          type="text" required value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Full name"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Username</label>
        <input
          type="text" required value={editUsername}
          onChange={(e) => setEditUsername(e.target.value)}
          placeholder="Username"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>New Password <span className="text-slate-700 normal-case font-normal">(leave blank to keep)</span></label>
        <div className="relative">
          <input
            type={showEditPw ? 'text' : 'password'}
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="Leave blank to keep current"
            className={`${inputCls} pr-8`}
          />
          <button
            type="button"
            onClick={() => setShowEditPw(!showEditPw)}
            className="absolute inset-y-0 right-2 flex items-center text-slate hover:text-ink-dark transition"
            tabIndex={-1}
          >
            {showEditPw ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </div>
      {!isAdmin && (
        <div>
          <label className={labelCls}>Role</label>
          <select
            value={editRole}
            onChange={(e) => setEditRole(e.target.value as Role)}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="User">User</option>
            <option value="Verifier">Verifier</option>
            {isMasterAdmin && <option value="Admin">Admin</option>}
          </select>
        </div>
      )}
    </div>
    {editError && <p className="text-red text-xs font-semibold">{editError}</p>}
    <div className="flex items-center gap-2">
      <button
        type="submit"
        className="flex items-center gap-1.5 bg-brass hover:bg-brass-light text-white font-semibold text-xs px-3.5 py-2 rounded shadow-md transition-colors cursor-pointer"
      >
        <Check size={13} /> Save Changes
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3.5 py-2 rounded transition-colors cursor-pointer"
      >
        <X size={13} /> Cancel
      </button>
    </div>
  </form>
);
