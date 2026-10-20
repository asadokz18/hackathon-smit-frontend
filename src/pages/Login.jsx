import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, KeyRound, Mail, AlertTriangle, ShieldCheck, User, Users, ClipboardCheck } from 'lucide-react';

const Login = ({ onToggleRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide all credentials');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo seeder helper: Instant login
  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      setError(`Quick Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 dark:bg-brand-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-clinical-500/10 dark:bg-clinical-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
        
        {/* Marketing/Banner Panel */}
        <div className="hidden md:flex flex-col justify-center pr-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-clinical-500 shadow-lg pulse-indicator">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-clinical-400">
              MedPulse AI
            </h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white leading-tight">
              Smart Diagnosis & SaaS Clinic Infrastructure
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Integrate Google Gemini AI tools to automate patient intake analysis, track diagnostic logs, analyze chronic risk factors, and translate clinical prescriptions in dual languages.
            </p>
          </div>

          {/* Security Compliance Badges */}
          <div className="glass-card p-6 border border-slate-200/50 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Secure Infrastructure Credentials Check
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This clinical EHR system enforces strict role-based access control (RBAC) and data encryption protocols. Unauthorized administrative access attempts are audited and logged immediately.
            </p>
            <div className="flex gap-4 items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">HIPAA Compliant</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded border border-brand-500/20">SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Login Form Panel */}
        <div className="glass-card p-8 md:p-10 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xl relative fade-in">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Welcome Back</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs">Enter your medical credentials to access your secure workspace.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-xs flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="enter your email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Password</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-clinical-600 hover:from-brand-700 hover:to-clinical-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 hover:shadow-lg shadow-brand-500/10 active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? 'Authenticating Workspace...' : 'Secure Authorization Sign-In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              Don't have a secure patient account?{' '}
              <button
                onClick={onToggleRegister}
                className="text-brand-500 font-bold hover:underline"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
