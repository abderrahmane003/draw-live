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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-red-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-50 text-red-900 p-5 flex items-center justify-between border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-red-950">
                Avertissement : Effacer tout
              </h3>
              <p className="text-xs text-red-700 font-medium">Action irréversible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-700 p-1.5 rounded-xl transition-colors hover:bg-red-100/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            Êtes-vous absolument sûr de vouloir <strong className="text-red-600 font-bold">supprimer tout le contenu</strong> de ce tableau blanc ?
          </p>
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3.5 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              ⚠️ Attention :
            </p>
            <p className="text-amber-700 leading-normal">
              Tous les traits dessinés seront effacés pour <strong>tous les participants</strong> actuellement connectés à cette room.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all shadow-xs"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-200 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Oui, tout effacer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
