import React, { useState } from 'react';
import { X, Sparkles, Lock, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import { createRoomInFirestore } from '../lib/roomService';
import { generateRandomRoomId } from '../lib/utils';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
}) => {
  const [customName, setCustomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isPrivate && !roomPassword.trim()) {
      setErrorMsg('Veuillez saisir un mot de passe pour la room privée.');
      return;
    }

    try {
      setLoading(true);
      const newRoomId = generateRandomRoomId();
      await createRoomInFirestore(newRoomId, {
        name: customName.trim() || `Tableau #${newRoomId}`,
        isPrivate,
        password: isPrivate ? roomPassword.trim() : undefined,
      });

      setLoading(false);
      setCustomName('');
      setIsPrivate(false);
      setRoomPassword('');
      onRoomCreated(newRoomId);
      onClose();
    } catch (err) {
      console.error('Error creating room:', err);
      setLoading(false);
      setErrorMsg('Impossible de créer la room pour le moment.');
    }
  };

  const handleClose = () => {
    setCustomName('');
    setIsPrivate(false);
    setRoomPassword('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-fun">
      <div className="bg-white rounded-3xl cartoon-shadow-lg border-4 border-slate-900 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-pink-400 text-slate-900 p-4 flex items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5 text-pink-600 stroke-[2.5]" />
            </div>
            <h3 className="font-black text-base text-slate-900">
              Créer un nouveau tableau 🎨
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-xl hover:bg-pink-300 text-slate-900 border-2 border-slate-900 cartoon-btn"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-amber-50">
          {/* Room Name Optional */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-900">
              Nom du tableau (optionnel) :
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ex: Dessins de Julie"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-900 bg-white text-slate-900 font-bold text-sm focus:outline-none"
              maxLength={30}
            />
          </div>

          {/* Private Room Checkbox */}
          <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-900 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-5 h-5 rounded-lg border-2 border-slate-900 accent-pink-500 cursor-pointer"
              />
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-purple-600 stroke-[2.5]" />
                <span>🔒 Room privée</span>
              </span>
            </label>

            {/* Room Password Input if Checked */}
            {isPrivate && (
              <div className="pt-2 border-t-2 border-slate-900 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                <label className="block text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-pink-600 stroke-[2.5]" />
                  <span>Mot de passe de la room :</span>
                </label>
                <input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Saisis un mot de passe secret..."
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-900 bg-amber-50 text-slate-900 font-bold text-xs focus:outline-none"
                  required={isPrivate}
                />
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-100 border-2 border-rose-500 rounded-xl text-rose-800 text-xs font-black">
              {errorMsg}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 rounded-xl font-black text-xs cartoon-btn"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-pink-500 hover:bg-pink-400 text-white border-2 border-slate-900 rounded-xl font-black text-xs cartoon-shadow cartoon-btn flex items-center gap-2"
            >
              <span>Créer la room</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
