import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileSpreadsheet,
  BrainCircuit,
  CreditCard,
  LogOut,
  Sun,
  Moon,
  ShieldAlert,
  UserCog,
  HeartPulse,
  FolderLock
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  if (!user) return null;

  // Custom Navigation Links based on active role
  const getNavLinks = () => {
    switch (user.role) {
      case 'admin':
        return [
          { id: 'analytics', label: 'Clinic Analytics', icon: LayoutDashboard },
          { id: 'staff', label: 'Manage Medical Staff', icon: Users },
          { id: 'patients', label: 'Global Patient Registry', icon: FolderLock },
          { id: 'subscriptions', label: 'Clinic Subscriptions', icon: CreditCard },
          { id: 'usage', label: 'System usage logs', icon: ShieldAlert },
        ];
      case 'doctor':
        return [
          { id: 'overview', label: 'Doctor Overview', icon: LayoutDashboard },
          { id: 'queue', label: 'Appointments Queue', icon: CalendarDays },
          { id: 'diagnose', label: 'AI Symptom Diagnostic', icon: BrainCircuit },
          { id: 'prescriptions', label: 'Prescription Records', icon: FileSpreadsheet },
        ];
      case 'receptionist':
        return [
          { id: 'patients', label: 'Register & Manage Patients', icon: Users },
          { id: 'schedule', label: 'Schedule Appointments', icon: CalendarDays },
        ];
      case 'patient':
        return [
          { id: 'my-profile', label: 'My Medical Profile', icon: UserCog },
          { id: 'my-appointments', label: 'Consultations Schedule', icon: CalendarDays },
          { id: 'my-prescriptions', label: 'Prescriptions & AI Advice', icon: FileSpreadsheet },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const roleColors = {
    admin: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    doctor: 'bg-clinical-500/10 text-clinical-600 dark:text-clinical-400 border border-clinical-500/20',
    receptionist: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
    patient: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20',
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      <div>
        {/* MedPulse SaaS Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-clinical-500 shadow-lg pulse-indicator">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-clinical-400 font-sans">
              MEDPULSE AI
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Clinic SaaS Tier</p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-clinical-400 flex items-center justify-center font-bold text-white text-base shadow-inner uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-semibold truncate text-white">{user.name}</h2>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${roleColors[user.role]}`}>
              {user.role}
            </span>

            {user.subscriptionPlan === 'pro' ? (
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner flex items-center gap-1 pulse-indicator animate-pulse">
                ★ PRO PLAN
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                FREE TIER
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Sidebar Links */}
        <nav className="p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600/20 to-clinical-600/10 text-brand-400 border-l-4 border-brand-500'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        {/* Light/Dark Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all"
        >
          <span className="flex items-center gap-2">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Light Theme Mode' : 'Dark Theme Mode'}
          </span>
          <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">
            {darkMode ? 'Light' : 'Dark'}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-950/20 hover:text-rose-400 transition-all border border-transparent hover:border-rose-950/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Terminate Active Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
