import React, { useState, useRef, useEffect } from 'react';
import { UserPresence } from '../types';
import { Users, Wifi, WifiOff, Edit2, Plus, Sparkles, Check, LayoutGrid, ChevronDown, Pencil, Eye } from 'lucide-react';

interface PresenceBarProps {
  roomId: string;
  activeUsers: UserPresence[];
  isConnected: boolean;
  userName: string;
  userColor: string;
  onUpdateProfile: (name: string, color: string) => void;
  onOpenRoomModal: () => void;
}

const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'
];

export const PresenceBar: React.FC<PresenceBarProps> = ({
  roomId,
  activeUsers,
  isConnected,
  userName,
  userColor,
  onUpdateProfile,
  onOpenRoomModal,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showDrawersList, setShowDrawersList] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editColor, setEditColor] = useState(userColor);

  const profileRef = useRef<HTMLDivElement>(null);
  const drawersRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsEditingProfile(false);
      }
      if (drawersRef.current && !drawersRef.current.contains(e.target as Node)) {
        setShowDrawersList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveProfile = () => {
    if (editName.trim()) {
      onUpdateProfile(editName.trim(), editColor);
      setIsEditingProfile(false);
    }
  };

  return (
    <div className="toolbar-blur border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs z-30 select-none">
      {/* Left: Brand Logo & Room Badge */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200/60 shrink-0">
          <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight tracking-tight flex items-center gap-2">
            Flowboard
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Room:
            </span>
            <span className="font-mono text-[11px] sm:text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-md">
              {roomId || '...'}
            </span>
            <button
              onClick={onOpenRoomModal}
              className="flex items-center gap-1 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors"
              title="Changer de room ou voir toutes les rooms ouvertes"
            >
              <Plus className="w-3 h-3 text-blue-600" />
              <span>Rooms ouvertes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center: Live Connection Pill */}
      <div className="hidden md:flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Synchro active</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Reconnexion...</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Drawers List & Profile Switcher */}
      <div className="flex items-center gap-3">
        {/* Drawers / Active Users Dropdown */}
        <div className="relative" ref={drawersRef}>
          <button
            onClick={() => setShowDrawersList(!showDrawersList)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-xs"
            title="Voir les dessinateurs connectés dans cette room"
          >
            <div className="flex items-center -space-x-1.5">
              {activeUsers.slice(0, 3).map((u) => (
                <div
                  key={u.userId}
                  className="w-5 h-5 rounded-full border border-white flex items-center justify-center font-bold text-[8px] text-white shadow-2xs"
                  style={{ backgroundColor: u.userColor }}
                >
                  {u.userName.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-800 text-xs">
                {activeUsers.length} {activeUsers.length > 1 ? 'dessinateurs' : 'dessinateur'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showDrawersList ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* List of Drawers Popover */}
          {showDrawersList && (
            <div className="absolute right-0 top-full mt-2 p-4 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 z-50 w-72 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Pencil className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-xs">
                    Dessinateurs dans la room #{roomId}
                  </h3>
                </div>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeUsers.length} en ligne
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activeUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Aucun autre utilisateur connecté.</p>
                ) : (
                  activeUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: user.userColor }}
                        >
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">
                            {user.userName}
                          </p>
                          <div className="flex items-center gap-1 text-[10px]">
                            {user.isDrawing ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                <Pencil className="w-2.5 h-2.5 animate-bounce" /> Dessine...
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-0.5">
                                <Eye className="w-2.5 h-2.5" /> En ligne
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {user.userName === userName && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                          Vous
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Edit Button */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setEditName(userName);
              setEditColor(userColor);
              setIsEditingProfile(!isEditingProfile);
            }}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-xs"
            title="Modifier votre profil"
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
              style={{ backgroundColor: userColor }}
            />
            <span className="font-semibold text-slate-700 text-xs hidden sm:inline max-w-[90px] truncate">
              {userName}
            </span>
            <Edit2 className="w-3 h-3 text-slate-400" />
          </button>

          {/* User Profile Editing Popover */}
          {isEditingProfile && (
            <div className="absolute right-0 top-full mt-2 p-4 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 z-50 w-64 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" /> Profil d'utilisateur
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Votre nom
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Ex: Artiste 402"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Couleur du pointeur
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`w-7 h-7 rounded-full border border-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs ${
                          editColor === c ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {editColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-200"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


