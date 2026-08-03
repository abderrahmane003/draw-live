const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'
];

const ANIMAL_NAMES = [
  'Panda', 'Renard', 'Aigle', 'Dauphin', 'Koala',
  'Tigre', 'Chouette', 'Loup', 'Cerf', 'Lynx',
  'Artiste', 'Créateur', 'Dessinateur', 'Peintre'
];

export function generateRandomRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomUser() {
  const nameIndex = Math.floor(Math.random() * ANIMAL_NAMES.length);
  const num = Math.floor(100 + Math.random() * 900);
  const colorIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
  
  return {
    name: `${ANIMAL_NAMES[nameIndex]} ${num}`,
    color: AVATAR_COLORS[colorIndex],
  };
}

export function getRoomIdFromUrl(): string {
  // Check path like /room/ABC123 or hash #room=ABC123 or search ?room=ABC123
  const pathname = window.location.pathname;
  const match = pathname.match(/\/room\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }

  const hashMatch = window.location.hash.match(/room=([a-zA-Z0-9_-]+)/);
  if (hashMatch && hashMatch[1]) {
    return hashMatch[1].toUpperCase();
  }

  const searchParams = new URLSearchParams(window.location.search);
  const roomParam = searchParams.get('room');
  if (roomParam) {
    return roomParam.toUpperCase();
  }

  return '';
}

export function setRoomUrl(roomId: string) {
  const newPath = `/room/${roomId}`;
  if (window.location.pathname !== newPath) {
    window.history.pushState({ roomId }, '', newPath);
  }
}

export function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Récemment';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "À l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `Il y a ${diffHour}h`;
  const diffDays = Math.floor(diffHour / 24);
  return `Il y a ${diffDays}j`;
}
