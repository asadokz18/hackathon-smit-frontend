import React from 'react';

const Loading = ({ message = 'Fetching clinical datasets...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-6">
      <div className="glass-card p-8 flex flex-col items-center max-w-sm text-center">
        {/* Animated Clinical Pulse Spinner */}
        <div className="relative flex items-center justify-center w-16 h-16 mb-4">
          <div className="absolute w-full h-full rounded-full border-4 border-clinical-500 border-t-transparent animate-spin"></div>
          <div className="absolute w-8 h-8 rounded-full bg-clinical-500/20 pulse-indicator flex items-center justify-center">
            <svg className="w-5 h-5 text-clinical-600 dark:text-clinical-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 font-medium">{message}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Connecting securely to medical core API...</p>
      </div>
    </div>
  );
};

export default Loading;
