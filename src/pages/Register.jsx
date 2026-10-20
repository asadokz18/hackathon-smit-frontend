import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, KeyRound, Mail, AlertTriangle, User, Phone, Info } from 'lucide-react';

const Register = ({ onToggleLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Patients are permitted to self-register
      await register({
        name,
        email,
        password,
        contact,
        role: 'patient', // Enforced role
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 dark:bg-brand-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-clinical-500/10 dark:bg-clinical-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="glass-card p-8 md:p-10 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xl relative fade-in">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-clinical-500 shadow-lg pulse-indicator mb-3">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Register Patient File</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Open a secure portal connection to access prescriptions and diagnostics.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-xs flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Asad Ullah"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Contact Phone</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+92 3xx-xxxxxxx"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Confirm</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Secure staff disclaimer banner */}
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-[10px] text-slate-400 flex gap-2 items-start mt-2">
              <Info className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
              <p>
                <strong>Security Guard:</strong> clinical accounts (Doctors and Receptionists) cannot self-register. Please coordinate with your clinic administrator to provision staff credentials.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-clinical-600 hover:from-brand-700 hover:to-clinical-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 hover:shadow-lg shadow-brand-500/10 active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? 'Registering File...' : 'Create Secure Patient Portal'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <button
                onClick={onToggleLogin}
                className="text-brand-500 font-bold hover:underline"
              >
                Log in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
