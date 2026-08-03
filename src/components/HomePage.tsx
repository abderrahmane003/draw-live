import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RoomInfo } from '../types';
import { generateRandomRoomId } from '../lib/utils';
import {
  Sparkles,
  ArrowRight,
  Globe,
  Clock,
  Users,
  LayoutGrid,
  Plus,
  Pencil,
  Layers,
  Search,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface RoomWithPresence extends RoomInfo {
  activeUsersCount: number;
}

export function HomePage() {
  const navigate = useNavigate();
  const { userName, userColor, updateProfile } = useAuth();

  const [inputRoomCode, setInputRoomCode] = useState('');
  const [rooms, setRooms] = useState<RoomWithPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(userName);

  // Subscribe to rooms in Firestore
  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('lastModified', 'desc'), limit(30));

    const unsubRooms = onSnapshot(
      q,
      (snapshot) => {
        const fetchedRooms: RoomInfo[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedRooms.push({
            id: docSnap.id,
            name: data.name || `Tableau #${docSnap.id}`,
            createdAt: data.createdAt || Date.now(),
            lastModified: data.lastModified || Date.now(),
            clearTimestamp: data.clearTimestamp || 0,
          });
        });

        // For each room, listen to active presence
        if (fetchedRooms.length === 0) {
          setRooms([]);
          setLoading(false);
          return;
        }

        const roomPresenceMap: Record<string, number> = {};
        let activeListeners = 0;

        fetchedRooms.forEach((room) => {
          const presenceRef = collection(db, 'rooms', room.id, 'presence');
          onSnapshot(presenceRef, (presenceSnap) => {
            const now = Date.now();
            let count = 0;
            presenceSnap.forEach((pDoc) => {
              const pData = pDoc.data();
              if (now - (pData.lastSeen || 0) < 25000) {
                count++;
              }
            });
            roomPresenceMap[room.id] = count;

            setRooms(
              fetchedRooms.map((r) => ({
                ...r,
                activeUsersCount: roomPresenceMap[r.id] || 0,
              }))
            );
            setLoading(false);
          });
        });
      },
      (err) => {
        console.error('Error fetching rooms:', err);
        setLoading(false);
      }
    );

    return () => unsubRooms();
  }, []);

  const handleCreateNewRoom = () => {
    const newId = generateRandomRoomId();
    navigate(`/room/${newId}`);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomCode.trim()) return;
    const clean = inputRoomCode.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    navigate(`/room/${clean}`);
  };

  const handleSaveProfile = () => {
    if (editName.trim()) {
      updateProfile(editName.trim(), userColor);
      setIsEditingName(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 15) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff}s`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-lg tracking-tight leading-none flex items-center gap-2">
              Flowboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Tableaux blancs collaboratifs en ligne
            </p>
          </div>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3">
          {isEditingName ? (
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-medium"
                maxLength={20}
                autoFocus
              />
              <button
                onClick={handleSaveProfile}
                className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditName(userName);
                setIsEditingName(true);
              }}
              className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold text-slate-200 shadow-sm"
              title="Modifier votre nom d'utilisateur"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0"
                style={{ backgroundColor: userColor }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[120px]">{userName}</span>
              <Pencil className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">
        {/* Hero Banner Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 p-6 sm:p-10 overflow-hidden shadow-2xl">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Espace de dessin collaboratif sans limites</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Créez, partagez & dessinez en temps réel.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Toutes vos rooms sont conservées en ligne et synchronisées instantanément entre tous les participants. Rejoignez une room existante ou démarrez un nouveau tableau en un clic.
            </p>

            {/* Actions Grid */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleCreateNewRoom}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2.5 active:scale-98"
              >
                <Plus className="w-5 h-5" />
                <span>Nouveau Tableau Blanc</span>
              </button>

              <form onSubmit={handleJoinByCode} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value)}
                  placeholder="Code de room (ex: DESIGN123)..."
                  className="flex-1 bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 text-white text-xs sm:text-sm px-4 py-3 rounded-2xl font-mono uppercase font-bold tracking-wider placeholder:normal-case placeholder:font-normal placeholder:text-slate-500 focus:outline-none"
                  maxLength={20}
                />
                <button
                  type="submit"
                  disabled={!inputRoomCode.trim()}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shrink-0 border border-slate-700"
                >
                  <span>Rejoindre</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Rooms Listing Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-blue-400" />
              <h3 className="font-extrabold text-white text-xl tracking-tight">
                Tableaux blancs enregistrés
              </h3>
              <span className="bg-slate-800 text-slate-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-slate-700">
                {filteredRooms.length}
              </span>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une room..."
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* Rooms Grid */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-400">
                Chargement des tableaux en ligne...
              </p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">Aucun tableau blanc trouvé</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Aucune room ne correspond à votre recherche.'
                    : 'Créez le tout premier tableau blanc pour démarrer la collaboration !'}
                </p>
              </div>
              <button
                onClick={handleCreateNewRoom}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une room maintenant</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => navigate(`/room/${room.id}`)}
                  className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                          #{room.id}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-100 text-sm truncate group-hover:text-blue-400 transition-colors pt-1">
                        {room.name}
                      </h4>
                    </div>

                    {/* Online Drawer Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                        room.activeUsersCount > 0
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          room.activeUsersCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`}
                      />
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {room.activeUsersCount} {room.activeUsersCount === 1 ? 'personne' : 'personnes'}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Metadata */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Dernier dessin : {formatTimeAgo(room.lastModified)}</span>
                    </div>

                    <span className="font-bold text-blue-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 text-xs">
                      Ouvrir <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Flowboard — Tableau Blanc Collaboratif Multi-Utilisateurs en Temps Réel</p>
      </footer>
    </div>
  );
}
