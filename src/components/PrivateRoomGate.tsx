import React, { useState } from 'react';
import { Lock, Key, ShieldAlert } from 'lucide-react';
import { RoomInfo } from '../types';

interface PrivateRoomGateProps {
  roomId: string;
  roomInfo: RoomInfo | null;
  isAuthorized: boolean;
  onAuthorize: () => void;
  children: React.ReactNode;
}

export const PrivateRoomGate: React.FC<PrivateRoomGateProps> = ({
  roomId,
  roomInfo,
  isAuthorized,
  onAuthorize,
  children,
}) => {
  const [inputPass, setInputPass] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If the room is not private or already authorized, render the children (the whiteboard canvas and tools)
  if (!roomInfo?.isPrivate || isAuthorized) {
    return <>{children}</>;
  }

  const handleCheckPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (inputPass === roomInfo.password) {
      onAuthorize();
    } else {
      setErrorMsg('Mot de passe incorrect.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FFFBEB] flex items-center justify-center p-4 font-fun animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-4 border-slate-900 cartoon-shadow-lg p-6 sm:p-8 max-w-md w-full space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-purple-200 border-3 border-slate-900 rounded-3xl flex items-center justify-center mx-auto cartoon-shadow text-slate-900">
          <Lock className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900">🔒 Room privée</h2>
          <p className="text-xs font-extrabold text-slate-700 mt-1">
            Cette room est protégée par un mot de passe.
          </p>
          <div className="mt-2.5">
            <span className="font-mono text-xs font-black text-slate-900 bg-amber-200 px-3 py-1 rounded-xl border-2 border-slate-900 inline-block shadow-2xs">
              #{roomId}
            </span>
          </div>
        </div>

        <form onSubmit={handleCheckPassword} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-900">
              Mot de passe :
            </label>
            <input
              type="password"
              value={inputPass}
              onChange={(e) => {
                setInputPass(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Entre le mot de passe secret..."
              className="w-full px-4 py-3 rounded-2xl border-3 border-slate-900 bg-amber-50 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-pink-300"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-100 border-2 border-rose-500 rounded-xl text-rose-800 text-xs font-black flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-pink-500 hover:bg-pink-400 text-white font-black text-sm rounded-2xl border-3 border-slate-900 cartoon-shadow cartoon-btn flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4 stroke-[3]" />
            <span>Entrer dans la room</span>
          </button>
        </form>
      </div>
    </div>
  );
};
