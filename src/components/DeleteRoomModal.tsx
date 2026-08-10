import React, { useState } from 'react';
import { AlertTriangle, X, Lock, Trash2, Loader2 } from 'lucide-react';
import { ADMIN_PASSWORD, deleteRoomFromFirestore } from '../lib/roomService';

interface DeleteRoomModalProps {
  roomId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteRoomModal: React.FC<DeleteRoomModalProps> = ({
  roomId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !roomId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Verify admin password BEFORE deleting
    if (password !== ADMIN_PASSWORD) {
      setErrorMsg('Mot de passe incorrect.');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteRoomFromFirestore(roomId);
      setIsDeleting(false);
      setPassword('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error deleting room:', err);
      setIsDeleting(false);
      setErrorMsg('Erreur lors de la suppression de la room.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-fun">
      <div className="bg-white rounded-3xl cartoon-shadow-lg border-4 border-slate-900 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-rose-400 text-slate-900 p-4 flex items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center font-black">
              <AlertTriangle className="w-5 h-5 text-rose-600 stroke-[2.5]" />
            </div>
            <h3 className="font-black text-base text-slate-900">
              ⚠️ Supprimer la room ?
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-xl hover:bg-rose-300 text-slate-900 border-2 border-slate-900 cartoon-btn"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-amber-50">
          <div className="text-xs font-extrabold text-slate-700 leading-relaxed bg-white p-3.5 rounded-2xl border-2 border-slate-900">
            <p>Cette action supprimera la room et tous les dessins associés.</p>
            <p className="mt-2 font-mono font-black text-slate-900 bg-amber-200 px-2.5 py-1 rounded-lg border border-slate-900 inline-block">
              ID : {roomId}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
              <span>Mot de passe administrateur :</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Saisis le mot de passe admin..."
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-900 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              autoFocus
              required
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-100 border-2 border-rose-500 rounded-xl text-rose-800 text-xs font-black animate-shake">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 rounded-xl font-black text-xs cartoon-btn"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isDeleting || !password}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white border-2 border-slate-900 rounded-xl font-black text-xs cartoon-shadow cartoon-btn flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Supprimer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
