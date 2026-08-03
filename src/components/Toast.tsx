import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-yellow-300 text-slate-900 rounded-2xl cartoon-shadow border-3 border-slate-900 animate-in slide-in-from-bottom-5 duration-200 font-fun">
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 stroke-[2.5]" />
      ) : (
        <Info className="w-5 h-5 text-blue-700 shrink-0 stroke-[2.5]" />
      )}
      <span className="text-xs sm:text-sm font-extrabold">{message}</span>
    </div>
  );
};
