import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200">
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : (
        <Info className="w-5 h-5 text-blue-400 shrink-0" />
      )}
      <span className="text-xs sm:text-sm font-medium">{message}</span>
    </div>
  );
};
