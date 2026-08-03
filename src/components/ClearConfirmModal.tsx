import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-fun">
      <div className="bg-white rounded-3xl cartoon-shadow-lg border-4 border-slate-900 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-400 text-slate-900 p-5 flex items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-red-600 border-3 border-slate-900 flex items-center justify-center font-black shadow-xs">
              <AlertTriangle className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-tight">
                Attention ! Effacer Tout ? 🗑️
              </h3>
              <p className="text-xs text-slate-900 font-extrabold">Cette action est définitive !</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-900 hover:bg-red-300 p-1.5 rounded-xl border-2 border-slate-900 transition-all cartoon-btn"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-900 leading-relaxed font-extrabold">
            Es-tu vraiment sûr(e) de vouloir <strong className="text-red-600 font-black">tout supprimer</strong> sur ce tableau blanc ?
          </p>
          <div className="bg-amber-100 border-3 border-slate-900 text-slate-900 rounded-2xl p-4 text-xs space-y-1">
            <p className="font-black text-slate-900 flex items-center gap-1.5">
              ⚠️ Attention :
            </p>
            <p className="font-bold text-slate-800 leading-normal">
              Tous les dessins seront effacés instantanément pour <strong>tous les dessinateurs</strong> de cette room.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-amber-50 p-4 border-t-4 border-slate-900 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border-3 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs cartoon-shadow cartoon-btn"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-xs border-3 border-slate-900 cartoon-shadow cartoon-btn flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4 stroke-[3]" />
            <span>Oui, Tout Effacer !</span>
          </button>
        </div>
      </div>
    </div>
  );
};
