import React, { useState, useEffect } from 'react';
import { generateRandomRoomId } from '../lib/utils';
import { Sparkles, ArrowRight, X, Layers, Globe, Clock, Check } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RoomInfo } from '../types';

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
  const [openRooms, setOpenRooms] = useState<RoomInfo[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Subscribe to open rooms from Firestore
  useEffect(() => {
    if (!isOpen) return;

    setLoadingRooms(true);
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('lastModified', 'desc'), limit(12));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const rooms: RoomInfo[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          rooms.push({
            id: docSnap.id,
            name: data.name || `Tableau #${docSnap.id}`,
            createdAt: data.createdAt || Date.now(),
            lastModified: data.lastModified || Date.now(),
            clearTimestamp: data.clearTimestamp || 0,
          });
        });
        setOpenRooms(rooms);
        setLoadingRooms(false);
      },
      (err) => {
        console.error('Error fetching open rooms:', err);
        setLoadingRooms(false);
      }
    );

    return () => unsub();
  }, [isOpen]);

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

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 10) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} sec`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    return `Il y a ${hours} h`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Rooms & Tableaux Blancs</h2>
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

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Create New Random Room */}
          <div>
            <button
              onClick={handleCreateNew}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.99]"
            >
              <Sparkles className="w-5 h-5" />
              <span>Créer un nouveau tableau blanc</span>
            </button>
          </div>

          {/* Join By Room Code */}
          <form onSubmit={handleJoin} className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700">
              Rejoindre une room par son code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value)}
                placeholder="Ex: ABC123"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs uppercase font-bold tracking-wider bg-white"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={!inputRoom.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-xs text-xs"
              >
                <span>Rejoindre</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* List of Open Rooms */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Rooms ouvertes récemment</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {openRooms.length} disponible{openRooms.length > 1 ? 's' : ''}
              </span>
            </div>

            {loadingRooms ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Chargement des rooms ouvertes...
              </div>
            ) : openRooms.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Aucune room ouverte enregistrée. Créez-en une nouvelle !
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {openRooms.map((room) => {
                  const isCurrent = room.id === currentRoomId;
                  return (
                    <div
                      key={room.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-blue-50/80 border-blue-200 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-100">
                            #{room.id}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Actif
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatTimeAgo(room.lastModified)}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onSelectRoom(room.id);
                          onClose();
                        }}
                        disabled={isCurrent}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                          isCurrent
                            ? 'bg-blue-600 text-white cursor-default'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs'
                        }`}
                      >
                        {isCurrent ? 'Ouvert' : 'Entrer'}
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

