import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { generateRandomRoomId, formatTimeAgo } from '../lib/utils';
import {
  Paintbrush,
  Plus,
  ArrowRight,
  Globe,
  Clock,
  Users,
  Search,
  Sparkles,
  Star,
  Palette,
  Smile,
  Pencil,
  Check,
  Wand2,
  RefreshCw,
} from 'lucide-react';

interface RoomSummary {
  id: string;
  name: string;
  lastModified: number;
  activeUsersCount: number;
}

const CARD_COLORS = [
  'bg-pink-100 border-pink-500 text-pink-900',
  'bg-amber-100 border-amber-500 text-amber-900',
  'bg-sky-100 border-sky-500 text-sky-900',
  'bg-emerald-100 border-emerald-500 text-emerald-900',
  'bg-purple-100 border-purple-500 text-purple-900',
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { userName, userColor, updateProfile } = useAuth();

  const [inputRoomCode, setInputRoomCode] = useState('');
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(userName);

  // Real-time sync of available rooms
  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('lastModified', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: RoomSummary[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || `Tableau #${docSnap.id}`,
            lastModified: data.lastModified || data.createdAt || Date.now(),
            activeUsersCount: 0,
          });
        });
        setRooms(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching rooms:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCreateNewRoom = () => {
    const newCode = generateRandomRoomId();
    navigate(`/room/${newCode}`);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRoomCode.trim()) {
      const cleanCode = inputRoomCode
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '');
      navigate(`/room/${cleanCode}`);
    }
  };

  const handleSaveProfile = () => {
    if (editName.trim()) {
      updateProfile(editName.trim(), userColor);
      setIsEditingName(false);
    }
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-slate-900 flex flex-col font-fun selection:bg-pink-400 selection:text-white relative overflow-x-hidden">
      {/* Playful Floating Doodles in Background */}
      <div className="absolute top-12 left-6 text-pink-300 opacity-60 pointer-events-none transform -rotate-12 animate-pulse">
        <Sparkles className="w-16 h-16" />
      </div>
      <div className="absolute top-36 right-10 text-amber-300 opacity-60 pointer-events-none transform rotate-12">
        <Star className="w-20 h-20" />
      </div>
      <div className="absolute bottom-20 left-12 text-sky-300 opacity-50 pointer-events-none transform rotate-45">
        <Palette className="w-24 h-24" />
      </div>

      {/* Fun Playful Navbar */}
      <header className="border-b-4 border-slate-900 bg-amber-300 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-500 border-3 border-slate-900 flex items-center justify-center text-white font-extrabold cartoon-shadow transform -rotate-3">
            <Paintbrush className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-xl sm:text-2xl tracking-wide flex items-center gap-2 capitalize">
              drawing live 🎨
            </h1>
            <p className="text-xs font-bold text-slate-800">
              Le tableau blanc rigolo & magique !
            </p>
          </div>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3">
          {isEditingName ? (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-3 border-slate-900 cartoon-shadow">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-amber-50 text-slate-900 text-sm font-bold px-3 py-1 rounded-xl border-2 border-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                maxLength={20}
                autoFocus
              />
              <button
                onClick={handleSaveProfile}
                className="p-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-xl border-2 border-slate-900 cartoon-btn"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditName(userName);
                setIsEditingName(true);
              }}
              className="flex items-center gap-2.5 bg-white hover:bg-pink-50 border-3 border-slate-900 px-4 py-2 rounded-2xl cartoon-shadow cartoon-btn font-bold text-xs sm:text-sm text-slate-900"
              title="Modifier ton pseudo rigolo"
            >
              <div
                className="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-sm"
                style={{ backgroundColor: userColor }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[130px]">{userName}</span>
              <Pencil className="w-3.5 h-3.5 text-slate-600" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10 z-10">
        {/* Playful Hero Banner Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-sky-200 via-indigo-100 to-pink-200 border-4 border-slate-900 p-6 sm:p-10 overflow-hidden cartoon-shadow-lg">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-300 border-2 border-slate-900 text-slate-900 text-xs font-extrabold shadow-xs">
              <Smile className="w-4 h-4 text-pink-600" />
              <span>Dessine en direct avec tes copains !</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Bienvenue dans ton Studio de Dessin ! 🎨🎨
            </h2>
            <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed">
              Toutes les rooms restent enregistrées. Dès que tu dessines, tes amis voient tes traits apparaître en temps réel sur leur écran !
            </p>

            {/* Actions Grid */}
            <div className="pt-2 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <button
                onClick={handleCreateNewRoom}
                className="px-6 py-4 rounded-2xl bg-pink-500 hover:bg-pink-400 text-white font-extrabold text-base transition-all border-3 border-slate-900 cartoon-shadow cartoon-btn flex items-center justify-center gap-3 cursor-pointer"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
                <span>Nouveau Tableau Blanc 🚀</span>
              </button>

              <form onSubmit={handleJoinByCode} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value)}
                  placeholder="Code de room (ex: DESSIN1)..."
                  className="flex-1 bg-white border-3 border-slate-900 focus:ring-4 focus:ring-yellow-300 text-slate-900 text-xs sm:text-sm px-4 py-3.5 rounded-2xl font-mono uppercase font-black tracking-wider placeholder:normal-case placeholder:font-bold placeholder:text-slate-400 focus:outline-none shadow-inner"
                  maxLength={20}
                />
                <button
                  type="submit"
                  disabled={!inputRoomCode.trim()}
                  className="px-5 py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-900 font-extrabold text-xs sm:text-sm border-3 border-slate-900 cartoon-shadow cartoon-btn flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>Entrer</span>
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Rooms Listing Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-300 border-2 border-slate-900 flex items-center justify-center text-slate-900 font-extrabold cartoon-shadow">
                <Globe className="w-5 h-5 text-slate-900" />
              </div>
              <h3 className="font-black text-slate-900 text-2xl tracking-wide">
                Rooms Ouvertes & Sauvegardées 🎨
              </h3>
              <span className="bg-pink-400 text-white font-black text-sm px-3 py-0.5 rounded-full border-2 border-slate-900 cartoon-shadow">
                {filteredRooms.length}
              </span>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-72">
              <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chercher un tableau..."
                className="w-full bg-white border-3 border-slate-900 text-slate-900 font-bold text-xs pl-10 pr-4 py-2.5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-300 shadow-xs"
              />
            </div>
          </div>

          {/* Rooms Grid */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-10 h-10 text-pink-500 animate-spin mx-auto stroke-[3]" />
              <p className="text-sm font-black text-slate-600">
                Chargement des supers tableaux... 🎨
              </p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border-4 border-dashed border-slate-900 p-8 space-y-4 cartoon-shadow">
              <div className="w-16 h-16 rounded-3xl bg-amber-200 border-3 border-slate-900 text-slate-900 flex items-center justify-center mx-auto cartoon-shadow">
                <Wand2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xl">Aucune room trouvée !</h4>
                <p className="text-xs font-bold text-slate-600 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Aucun tableau ne correspond à ce nom.'
                    : 'Crée la toute première room et invite tes amis à dessiner !'}
                </p>
              </div>
              <button
                onClick={handleCreateNewRoom}
                className="px-6 py-3 rounded-2xl bg-pink-500 hover:bg-pink-400 text-white font-black text-sm border-3 border-slate-900 cartoon-shadow cartoon-btn inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>Créer une room rigolote</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room, idx) => {
                const colorStyle = CARD_COLORS[idx % CARD_COLORS.length];
                return (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/room/${room.id}`)}
                    className="group bg-white hover:bg-amber-50 border-3 border-slate-900 rounded-3xl p-5 transition-all duration-150 cursor-pointer cartoon-shadow cartoon-btn flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    {/* Top Header of Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-black text-xs px-2.5 py-1 rounded-xl border-2 border-slate-900 shadow-2xs ${colorStyle}`}>
                            #{room.id}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-base truncate pt-1 group-hover:text-pink-600 transition-colors">
                          {room.name}
                        </h4>
                      </div>

                      {/* Online Drawer Badge */}
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border-2 border-slate-900 shrink-0 ${
                          room.activeUsersCount > 0
                            ? 'bg-emerald-300 text-slate-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full border border-slate-900 ${
                            room.activeUsersCount > 0 ? 'bg-emerald-600 animate-ping' : 'bg-slate-400'
                          }`}
                        />
                        <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>
                          {room.activeUsersCount} {room.activeUsersCount === 1 ? 'dessinateur' : 'dessinateurs'}
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom Metadata */}
                    <div className="pt-3 border-t-2 border-slate-900 flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>{formatTimeAgo(room.lastModified)}</span>
                      </div>

                      <span className="font-black text-pink-600 bg-pink-100 px-3 py-1 rounded-xl border-2 border-slate-900 inline-flex items-center gap-1 text-xs group-hover:bg-pink-500 group-hover:text-white transition-all">
                        Dessiner <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Playful Footer */}
      <footer className="border-t-4 border-slate-900 bg-amber-300 py-6 text-center text-xs font-black text-slate-900">
        <p className="flex items-center justify-center gap-2">
          <span>drawing live ✨ — Le tableau blanc en ligne 100% collaboratif & rigolo !</span>
        </p>
      </footer>
    </div>
  );
};
