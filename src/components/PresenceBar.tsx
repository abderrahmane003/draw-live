import React, { useState } from 'react';
import { UserPresence } from '../types';
import { Users, Wifi, WifiOff, Edit2, Plus, Sparkles, Check, LayoutGrid } from 'lucide-react';

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
  const [editName, setEditName] = useState(userName);
  const [editColor, setEditColor] = useState(userColor);

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
          <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight tracking-tight">
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
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
              title="Changer de room"
            >
              <Plus className="w-3.5 h-3.5" />
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

      {/* Right: Active Users Stack & Profile Switcher */}
      <div className="flex items-center gap-3">
        {/* Avatars Stack */}
        <div className="flex items-center -space-x-2 overflow-hidden">
          {activeUsers.slice(0, 4).map((user) => (
            <div
              key={user.userId}
              title={user.userName}
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-bold text-[10px] text-white shadow-xs"
              style={{ backgroundColor: user.userColor }}
            >
              {user.userName.charAt(0).toUpperCase()}
            </div>
          ))}

          {activeUsers.length > 4 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shadow-xs">
              +{activeUsers.length - 4}
            </div>
          )}
        </div>

        {/* Profile Edit Button */}
        <div className="relative">
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

