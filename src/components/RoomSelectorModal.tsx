import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateRandomRoomId, formatTimeAgo } from '../lib/utils';
import {
  X,
  Plus,
  ArrowRight,
  Globe,
  Clock,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react';

interface RoomSelectorModalProps {
  currentRoomId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectRoom: (roomId: string) => void;
}

interface OpenRoomInfo {
  id: string;
  name: string;
  lastModified: number;
}

export const RoomSelectorModal: React.FC<RoomSelectorModalProps> = ({
  currentRoomId,
  isOpen,
  onClose,
  onSelectRoom,
}) => {
  const [openRooms, setOpenRooms] = useState<OpenRoomInfo[]>([]);
  const [inputRoom, setInputRoom] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Sync open rooms from Firestore
  useEffect(() => {
    if (!isOpen) return;

    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('lastModified', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: OpenRoomInfo[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || `Tableau #${docSnap.id}`,
            lastModified: data.lastModified || data.createdAt || Date.now(),
          });
        });
        setOpenRooms(list);
        setLoadingRooms(false);
      },
      (err) => {
        console.error('Error fetching rooms for modal:', err);
        setLoadingRooms(false);
      }
    );

    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRoom.trim()) {
      onSelectRoom(inputRoom.trim());
      setInputRoom('');
      onClose();
    }
  };

  const handleCreateNew = () => {
    const newId = generateRandomRoomId();
    onSelectRoom(newId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-fun">
      <div className="bg-white rounded-3xl cartoon-shadow-lg border-4 border-slate-900 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-amber-300 text-slate-900 p-5 flex items-center justify-between shrink-0 border-b-4 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white border-3 border-slate-900 flex items-center justify-center font-black shadow-xs">
              <Layers className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h2 className="font-black text-lg">Rooms & Tableaux 🎨</h2>
              <p className="text-xs text-slate-800 font-bold">Choisis ton espace de dessin</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-900 hover:bg-amber-400 p-1.5 rounded-xl border-2 border-slate-900 transition-all cartoon-btn cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-amber-50">
          {/* Create New Random Room */}
          <div>
            <button
              onClick={handleCreateNew}
              className="w-full py-3.5 px-4 bg-pink-500 hover:bg-pink-400 text-white font-black rounded-2xl border-3 border-slate-900 cartoon-shadow cartoon-btn flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
              <span>Créer une nouvelle room magique ✨</span>
            </button>
          </div>

          {/* Join with Code */}
          <form onSubmit={handleJoin} className="space-y-2 bg-white p-4 rounded-2xl border-3 border-slate-900 cartoon-shadow">
            <label className="block text-xs font-black text-slate-900">
              Rejoindre avec un code secret :
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value)}
                placeholder="Ex: ABC123"
                className="flex-1 px-3.5 py-2 rounded-xl border-2 border-slate-900 focus:outline-none font-mono text-xs uppercase font-black bg-amber-50 text-slate-900"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={!inputRoom.trim()}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-slate-900 font-black rounded-xl border-2 border-slate-900 transition-all flex items-center gap-1.5 cartoon-btn text-xs cursor-pointer"
              >
                <span>Rejoindre</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </form>

          {/* List of Open Rooms */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
                <Globe className="w-4 h-4 text-pink-600 stroke-[2.5]" />
                <span>Rooms ouvertes</span>
              </div>
              <span className="text-xs font-black text-slate-600 bg-white border border-slate-900 px-2 py-0.5 rounded-full">
                {openRooms.length} disponible{openRooms.length > 1 ? 's' : ''}
              </span>
            </div>

            {loadingRooms ? (
              <div className="py-6 text-center text-xs text-slate-600 font-bold">
                Recherche des rooms magiques...
              </div>
            ) : openRooms.length === 0 ? (
              <div className="py-6 text-center text-xs font-bold text-slate-600 bg-white rounded-2xl border-3 border-dashed border-slate-900 p-4">
                Aucune room ouverte pour le moment. Crée-en une ! 🎨
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {openRooms.map((room) => {
                  const isCurrent = room.id === currentRoomId;
                  return (
                    <div
                      key={room.id}
                      className={`p-3.5 rounded-2xl border-3 border-slate-900 transition-all flex items-center justify-between gap-2 cartoon-shadow ${
                        isCurrent
                          ? 'bg-yellow-300'
                          : 'bg-white hover:bg-yellow-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded-lg border-2 border-slate-900">
                            #{room.id}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-black text-slate-900 bg-emerald-300 px-2 py-0.5 rounded-full border border-slate-900 flex items-center gap-0.5">
                              <Check className="w-3 h-3 stroke-[3]" /> En cours
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1 mt-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-600 stroke-[2.5]" />
                          <span>{formatTimeAgo(room.lastModified)}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onSelectRoom(room.id);
                          onClose();
                        }}
                        disabled={isCurrent}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 border-2 border-slate-900 cartoon-btn ${
                          isCurrent
                            ? 'bg-emerald-400 text-slate-900 cursor-default'
                            : 'bg-pink-500 text-white hover:bg-pink-400 cursor-pointer'
                        }`}
                      >
                        {isCurrent ? 'Actif' : 'Entrer'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
