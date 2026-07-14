import { useState } from 'react';
import type { TeamMember } from '../types';
import { LogIn, FileText, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  team: TeamMember[];
  onLogin: (member: TeamMember) => void;
}

export function LoginScreen({ team, onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate slight async delay for UX
    await new Promise((r) => setTimeout(r, 400));

    const member = team.find(
      (m) =>
        m.username.toLowerCase() === username.trim().toLowerCase() &&
        m.password === password
    );

    if (!member) {
      setError('Invalid username or password. Please try again.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onLogin(member);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-paper">
      {/* Left branding panel */}
      <div className="hidden md:flex flex-col justify-between bg-ink-dark text-paper w-[420px] shrink-0 p-10">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-brass rounded-lg flex items-center justify-center shadow-md">
              <FileText size={22} className="text-ink-dark" />
            </div>
            <span className="text-base font-heading font-bold tracking-tight text-white">M5 Invoice Registration</span>
          </div>
          <h1 className="text-3xl font-heading font-bold leading-tight text-white mb-4">
            M5 Invoice<br />Registration
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Internal invoice submission and approval system. All entries are logged and auditable.
          </p>
        </div>

        {/* Process steps */}
        <div className="space-y-4">
          {[
            { step: '01', label: 'Submit Invoice', desc: 'Upload invoice with details' },
            { step: '02', label: 'Verifier Reviews', desc: 'Confirms details with vendor' },
            { step: '03', label: 'Admin Approves', desc: 'Final sign-off and payment' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flex items-start gap-4">
              <span className="text-xs font-mono text-brass font-semibold mt-0.5">{step}</span>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-brass-light">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 md:hidden">
          <div className="w-9 h-9 bg-ink-dark rounded-lg flex items-center justify-center">
            <FileText size={18} className="text-brass" />
          </div>
          <span className="text-base font-heading font-bold text-ink-dark">M5 Invoice Registration</span>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-2xl font-heading font-bold text-ink-dark mb-1">Sign in</h2>
          <p className="text-sm text-slate mb-8">Enter your credentials to access the system.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-ink-dark uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="e.g. admin"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white text-ink-dark placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass shadow-md transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-dark uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-11 text-sm bg-white text-ink-dark placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass shadow-md transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate hover:text-ink-dark transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red/5 border border-red/30 rounded-lg px-3 py-2.5 text-red text-xs font-medium">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full flex items-center justify-center gap-2 bg-ink-dark hover:bg-ink text-paper font-semibold text-sm rounded-lg py-3 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="animate-pulse">Signing in…</span>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Dynamic credentials hint */}
          <div className="mt-8 p-4 bg-card border border-ink/10 rounded-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Available Accounts
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {team.slice(0, 8).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setUsername(m.username);
                    setPassword(m.password);
                    setError('');
                  }}
                  className="w-full flex justify-between items-center text-xs px-3 py-1.5 rounded hover:bg-brass/10 text-ink-dark transition cursor-pointer"
                >
                  <span className="font-semibold truncate max-w-[110px]">{m.name}</span>
                  <span className="font-mono text-slate-700 text-xs ml-2 font-medium">
                    {m.username} · {m.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
