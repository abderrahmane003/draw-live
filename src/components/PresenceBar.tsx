import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPresence } from '../types';
import {
  Diamond,
  Plus,
  ArrowRight,
  Copy,
  Users,
  Trash2,
  Download,
  Check,
  Edit2,
  Pencil,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface PresenceBarProps {
  roomId: string;
  activeUsers: UserPresence[];
  isConnected: boolean;
  userName: string;
  userColor: string;
  onUpdateProfile: (name: string, color: string) => void;
  onOpenRoomModal: () => void;
  onCopyLink: () => void;
  onClear: () => void;
  onDownload: () => void;
}

const AVATAR_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
];

export const PresenceBar: React.FC<PresenceBarProps> = ({
  roomId,
  activeUsers,
  isConnected,
  userName,
  userColor,
  onUpdateProfile,
  onOpenRoomModal,
  onCopyLink,
  onClear,
  onDownload,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showDrawersList, setShowDrawersList] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editColor, setEditColor] = useState(userColor);

  const profileRef = useRef<HTMLDivElement>(null);
  const drawersRef = useRef<HTMLDivElement>(null);

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

  const handleCopy = () => {
    onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = () => {
    if (editName.trim()) {
      onUpdateProfile(editName.trim(), editColor);
      setIsEditingProfile(false);
    }
  };

  return (
    <header className="bg-yellow-300 text-slate-900 border-b-3 border-slate-900 px-3 sm:px-5 py-2 flex items-center justify-between gap-2 z-30 select-none font-fun">
      {/* Left Items: Diamond Logo, Plus, Arrow, Copy Link */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Diamond Logo Button */}
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 rounded-xl flex items-center justify-center text-slate-950 font-black shrink-0 cartoon-shadow cartoon-btn cursor-pointer"
          title="Accueil Lets Draw"
        >
          <Diamond className="w-4 h-4 fill-current stroke-[2.5]" />
        </button>

        {/* Plus Button (New / Select Room) */}
        <button
          onClick={onOpenRoomModal}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-pink-400 hover:bg-pink-300 text-slate-950 border-2 border-slate-900 rounded-xl flex items-center justify-center cartoon-shadow cartoon-btn cursor-pointer"
          title="Créer ou ouvrir une room"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Join / Switch Room Button */}
        <button
          onClick={onOpenRoomModal}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-sky-300 hover:bg-sky-200 text-slate-950 border-2 border-slate-900 rounded-xl flex items-center justify-center cartoon-shadow cartoon-btn cursor-pointer"
          title="Rejoindre une autre room"
        >
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-300 hover:bg-purple-200 text-slate-950 border-2 border-slate-900 rounded-xl flex items-center justify-center cartoon-shadow cartoon-btn cursor-pointer"
          title="Copier le lien d'invitation"
        >
          {copied ? (
            <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
          ) : (
            <Copy className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>

        {/* Room Info Badge on larger screens */}
        <div className="hidden md:flex items-center gap-1.5 ml-2 bg-white border-2 border-slate-900 px-2.5 py-1 rounded-xl text-xs font-black text-slate-900 shadow-xs">
          <span className="text-[10px] text-pink-600 font-black uppercase">Room:</span>
          <span className="font-mono text-xs font-black text-slate-900">#{roomId}</span>
        </div>

        {/* Active Drawers Indicator */}
        <div className="relative ml-1" ref={drawersRef}>
          <button
            onClick={() => setShowDrawersList(!showDrawersList)}
            className="flex items-center gap-1.5 bg-white hover:bg-amber-50 text-slate-900 border-2 border-slate-900 px-2.5 py-1 rounded-xl text-xs font-black cartoon-shadow cartoon-btn"
            title="Dessinateurs en ligne"
          >
            <Users className="w-3.5 h-3.5 text-pink-500 stroke-[2.5]" />
            <span className="text-xs font-black">{activeUsers.length}</span>
          </button>

          {/* List of Drawers Popover */}
          {showDrawersList && (
            <div className="absolute left-0 top-full mt-2 p-3.5 bg-white text-slate-900 rounded-2xl border-3 border-slate-900 cartoon-shadow-lg z-50 w-64 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-slate-900">
                <div className="flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-pink-500 stroke-[3]" />
                  <span className="font-black text-xs text-slate-900">Room #{roomId}</span>
                </div>
                <span className="bg-pink-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-slate-900">
                  {activeUsers.length} en ligne
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {activeUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border-2 border-slate-900"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-[10px] text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: user.userColor }}
                      >
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-black text-xs text-slate-900 truncate">
                        {user.userName} {user.userName === userName && '(Toi)'}
                      </span>
                    </div>
                    {user.isDrawing && (
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500 border border-slate-900 animate-bounce" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Items: Profile edit button, Trash Clear button, Green Download button */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Connection status indicator */}
        <div className="flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded-xl bg-white border-2 border-slate-900 text-[10px] sm:text-[11px] text-slate-900 font-black shadow-xs">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span className="hidden sm:inline">En ligne ⚡</span>
              <span className="sm:hidden">⚡</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-500 animate-pulse stroke-[3]" />
              <span className="hidden sm:inline">Hors ligne</span>
              <span className="sm:hidden">⚠️</span>
            </>
          )}
        </div>

        {/* User Profile Editor Pill */}
        <div className="relative" ref={profileRef}>
          {isEditingProfile ? (
            <div className="absolute right-0 top-full mt-2 p-3.5 bg-white text-slate-900 rounded-2xl border-3 border-slate-900 cartoon-shadow-lg z-50 w-64 space-y-3">
              <h4 className="font-black text-xs border-b-2 border-slate-900 pb-2 text-slate-900">
                Modifier Ton Profil 🎨
              </h4>
              <div className="space-y-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-amber-50 border-2 border-slate-900 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none"
                  maxLength={18}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center transition-transform ${
                        editColor === c ? 'scale-125 ring-2 ring-pink-500' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {editColor === c && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-slate-900">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-2.5 py-1 rounded-xl border-2 border-slate-900 bg-slate-100 font-black text-xs cartoon-btn"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-1 rounded-xl bg-pink-500 text-white border-2 border-slate-900 font-black text-xs cartoon-btn"
                >
                  Sauver
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
              className="hidden sm:flex items-center gap-1.5 bg-white hover:bg-pink-50 text-slate-900 border-2 border-slate-900 px-2.5 py-1 rounded-xl text-xs font-black cartoon-shadow cartoon-btn"
              title="Modifier ton profil"
            >
              <div
                className="w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center font-black text-[9px] text-white shrink-0"
                style={{ backgroundColor: userColor }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[80px]">{userName}</span>
              <Edit2 className="w-3 h-3 text-slate-600 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Clear Trash Button */}
        <button
          onClick={onClear}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-rose-400 hover:bg-rose-300 text-slate-950 border-2 border-slate-900 rounded-xl flex items-center justify-center cartoon-shadow cartoon-btn cursor-pointer"
          title="Effacer tout le tableau"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Green Download Button */}
        <button
          onClick={onDownload}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-2 border-slate-900 rounded-xl flex items-center justify-center font-black cartoon-shadow cartoon-btn cursor-pointer"
          title="Télécharger le dessin PNG"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
};
