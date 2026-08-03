import React, { useState } from 'react';
import { generateRandomRoomId } from '../lib/utils';
import { Sparkles, ArrowRight, X, Layers } from 'lucide-react';

interface RoomSelectorModalProps {
  currentRoomId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectRoom: (roomId: string) => void;
}

export const RoomSelectorModal: React.FC<RoomSelectorModalProps> = ({
  currentRoomId,
  isOpen,
  onClose,
  onSelectRoom,
}) => {
  const [inputRoom, setInputRoom] = useState('');

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputRoom.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleaned) {
      onSelectRoom(cleaned);
      setInputRoom('');
      onClose();
    }
  };

  const handleCreateNew = () => {
    const newRoomId = generateRandomRoomId();
    onSelectRoom(newRoomId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Rejoindre ou créer un tableau</h2>
              <p className="text-xs text-slate-400">Collaboration en temps réel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Create New Random Room */}
          <div>
            <button
              onClick={handleCreateNew}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.99]"
            >
              <Sparkles className="w-5 h-5" />
              <span>Créer un nouveau tableau blanc</span>
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">
              Un identifiant unique sera généré automatiquement.
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs uppercase tracking-wider font-semibold text-slate-400">
              ou rejoindre par code
            </span>
          </div>

          {/* Enter Room ID */}
          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identifiant de la room
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputRoom}
                  onChange={(e) => setInputRoom(e.target.value)}
                  placeholder="Ex: ABC123"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm uppercase font-bold tracking-wider"
                  maxLength={20}
                />
                <button
                  type="submit"
                  disabled={!inputRoom.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Rejoindre</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {currentRoomId && (
              <p className="text-xs text-slate-500 pt-1">
                Room actuelle : <span className="font-mono font-bold text-slate-800">{currentRoomId}</span>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
