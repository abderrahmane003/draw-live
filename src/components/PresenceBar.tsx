import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPresence } from '../types';
import { Users, Wifi, WifiOff, Edit2, Plus, Home, Pencil, ChevronDown, Check } from 'lucide-react';

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
  const navigate = useNavigate();
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
    <div className="bg-amber-300 border-b-2 sm:border-b-4 border-slate-900 px-2 sm:px-6 py-1 sm:py-2 flex items-center justify-between gap-2 text-xs z-30 select-none font-fun overflow-x-auto no-scrollbar shrink-0 whitespace-nowrap">
      {/* Left: Brand Logo & Room Badge */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="w-7 h-7 sm:w-10 sm:h-10 bg-pink-500 hover:bg-pink-400 border-2 sm:border-3 border-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white cartoon-shadow cartoon-btn shrink-0 cursor-pointer"
          title="Retour à l'accueil"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>
        <div>
          <h1 className="font-black text-slate-900 text-xs sm:text-lg leading-tight tracking-wide flex items-center gap-1 capitalize">
            drawing live 🎨
          </h1>
          <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5">
            <span className="font-mono text-[10px] sm:text-xs font-black text-slate-900 bg-white border sm:border-2 border-slate-900 px-1 sm:px-2 py-0.5 rounded-lg sm:rounded-xl shadow-xs">
              #{roomId || '...'}
            </span>
            <button
              onClick={onOpenRoomModal}
              className="flex items-center gap-0.5 sm:gap-1.5 text-slate-900 bg-yellow-400 hover:bg-yellow-300 border sm:border-2 border-slate-900 px-1.5 sm:px-2.5 py-0.5 rounded-lg sm:rounded-xl font-extrabold text-[10px] sm:text-xs cartoon-btn shrink-0 cursor-pointer"
              title="Changer de room ou voir toutes les rooms ouvertes"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
              <span className="hidden xs:inline">Rooms</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center: Live Connection Pill */}
      <div className="hidden md:flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border-2 border-slate-900 shadow-xs ${
            isConnected
              ? 'bg-emerald-300 text-slate-900'
              : 'bg-orange-300 text-slate-900'
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-slate-900 stroke-[2.5]" />
              <span>Synchro active ⚡</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-slate-900 animate-pulse stroke-[2.5]" />
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
            className="flex items-center gap-2 bg-white hover:bg-pink-50 border-3 border-slate-900 px-3.5 py-1.5 rounded-2xl cartoon-shadow cartoon-btn"
            title="Voir les dessinateurs connectés dans cette room"
          >
            <div className="flex items-center -space-x-2">
              {activeUsers.slice(0, 3).map((u) => (
                <div
                  key={u.userId}
                  className="w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-[9px] text-white shadow-xs"
                  style={{ backgroundColor: u.userColor }}
                >
                  {u.userName.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-900 stroke-[2.5]" />
              <span className="font-black text-slate-900 text-xs">
                {activeUsers.length} {activeUsers.length > 1 ? 'dessinateurs' : 'dessinateur'}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-900 stroke-[2.5] transition-transform ${showDrawersList ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* List of Drawers Popover */}
          {showDrawersList && (
            <div className="absolute right-0 top-full mt-3 p-4 bg-white text-slate-900 rounded-3xl cartoon-shadow-lg border-3 border-slate-900 z-50 w-72 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-900">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-pink-600 stroke-[3]" />
                  <h3 className="font-black text-slate-900 text-xs">
                    Dessinateurs #{roomId}
                  </h3>
                </div>
                <span className="bg-pink-400 text-white border-2 border-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {activeUsers.length} en ligne
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activeUsers.length === 0 ? (
                  <p className="text-xs text-slate-500 font-bold text-center py-2">Aucun autre dessinateur connecté.</p>
                ) : (
                  activeUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50 border-2 border-slate-900"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: user.userColor }}
                        >
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs text-slate-900 truncate">
                            {user.userName} {user.userName === userName && '(Toi)'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500">
                            {user.isDrawing ? '🎨 Dessine...' : '👁️ Regarde'}
                          </p>
                        </div>
                      </div>

                      {user.isDrawing && (
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500 border border-slate-900 animate-bounce" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Editor Pill */}
        <div className="relative" ref={profileRef}>
          {isEditingProfile ? (
            <div className="absolute right-0 top-full mt-3 p-4 bg-white rounded-3xl cartoon-shadow-lg border-3 border-slate-900 z-50 w-72 space-y-3">
              <h4 className="font-black text-slate-900 text-xs border-b-2 border-slate-900 pb-2">
                Ton Profil de Dessinateur 🎨
              </h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Ton Pseudo :</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-amber-50 border-2 border-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                  maxLength={18}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Ta couleur :</label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center transition-transform ${
                        editColor === c ? 'scale-125 ring-2 ring-pink-500' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {editColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-slate-900">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-slate-100 font-bold text-xs cartoon-btn"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white border-2 border-slate-900 font-black text-xs cartoon-btn"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditName(userName);
                setEditColor(userColor);
                setIsEditingProfile(true);
              }}
              className="flex items-center gap-2 bg-white hover:bg-pink-50 border-3 border-slate-900 px-3.5 py-1.5 rounded-2xl cartoon-shadow cartoon-btn font-black text-xs text-slate-900"
              title="Modifier ton profil"
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-[10px] text-white shrink-0"
                style={{ backgroundColor: userColor }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[100px]">{userName}</span>
              <Edit2 className="w-3.5 h-3.5 text-slate-600 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
