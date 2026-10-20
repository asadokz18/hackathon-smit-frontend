import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Sparkles, AlertCircle, PhoneCall, Gift, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const Header = ({ title }) => {
  const { user, upgradePlan } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  // In-App & WhatsApp/SMS simulated reminders list
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'sms', text: 'WhatsApp Alert: Confirmed SMS reminder successfully sent to Patient Bruce Wayne.', time: 'Just now', icon: PhoneCall, color: 'text-emerald-500' },
    { id: 2, type: 'ai', text: 'AI Alert: High Risk detected for Patient John Doe (Hypertensive Cardiovascular strain).', time: '10m ago', icon: AlertCircle, color: 'text-amber-500' },
    { id: 3, type: 'system', text: 'System: Clinic database auto-seeding successfully completed.', time: '1h ago', icon: CheckCircle, color: 'text-brand-500' },
  ]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await upgradePlan('pro');
      // Fire confetti bursts!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      // Append a billing notification
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'billing',
          text: 'Billing: SaaS Premium Pro subscription activated successfully! AI features and advanced analytics unlocked.',
          time: 'Just now',
          icon: Gift,
          color: 'text-amber-500'
        },
        ...prev
      ]);
    } catch (err) {
      alert('Subscription upgrade simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/60 h-20 px-8 flex items-center justify-between sticky top-0 backdrop-blur-md z-40">
      {/* Dynamic Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white capitalize font-sans">
          {title.replace('-', ' ')}
        </h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        
        {/* Free Plan Upgrade Callout */}
        {user && user.subscriptionPlan === 'free' && (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-brand-600 hover:from-amber-600 hover:to-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 pulse-indicator hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'Upgrading...' : 'Upgrade Clinic to Pro'}</span>
          </button>
        )}

        {/* Pro Status indicator */}
        {user && user.subscriptionPlan === 'pro' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold select-none">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pro Clinic Tier</span>
          </div>
        )}

        {/* Alert/Notification Center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-2 fade-in">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Clinical Notifications</span>
                <button
                  onClick={() => setNotifications([])}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No active notifications or logs
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const NotifIcon = notif.icon;
                    return (
                      <div key={notif.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/30 flex gap-3 items-start transition-all">
                        <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 ${notif.color}`}>
                          <NotifIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">{notif.text}</p>
                          <span className="text-[9px] text-slate-400 mt-1 block">{notif.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
