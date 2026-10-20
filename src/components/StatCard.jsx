import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, trend, color = 'brand' }) => {
  const colorMap = {
    brand: {
      bg: 'from-brand-500/10 to-brand-600/5',
      border: 'border-brand-500/20 dark:border-brand-500/10',
      iconBg: 'bg-brand-500/20 text-brand-600 dark:text-brand-400',
      glow: 'shadow-brand-500/5'
    },
    clinical: {
      bg: 'from-clinical-500/10 to-clinical-600/5',
      border: 'border-clinical-500/20 dark:border-clinical-500/10',
      iconBg: 'bg-clinical-500/20 text-clinical-600 dark:text-clinical-400',
      glow: 'shadow-clinical-500/5'
    },
    emerald: {
      bg: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-500/20 dark:border-emerald-500/10',
      iconBg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      glow: 'shadow-emerald-500/5'
    },
    violet: {
      bg: 'from-violet-500/10 to-violet-600/5',
      border: 'border-violet-500/20 dark:border-violet-500/10',
      iconBg: 'bg-violet-500/20 text-violet-600 dark:text-violet-400',
      glow: 'shadow-violet-500/5'
    },
    rose: {
      bg: 'from-rose-500/10 to-rose-600/5',
      border: 'border-rose-500/20 dark:border-rose-500/10',
      iconBg: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
      glow: 'shadow-rose-500/5'
    }
  };

  const current = colorMap[color] || colorMap.brand;

  return (
    <div className={`glass-card p-6 flex flex-col justify-between border bg-gradient-to-br ${current.bg} ${current.border} ${current.glow} hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 group`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white font-sans group-hover:text-clinical-500 dark:group-hover:text-clinical-400 transition-colors duration-200">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl transition-all duration-300 ${current.iconBg} group-hover:rotate-12`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {description && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
          {trend && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.type === 'up' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
