import { RoomInfo, Stroke } from '../types';

const ROOMS_CACHE_KEY = 'tableau_rooms_cache_v1';
const STROKES_CACHE_PREFIX = 'tableau_strokes_cache_';

export function getCachedRooms(): RoomInfo[] {
  try {
    const raw = localStorage.getItem(ROOMS_CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RoomInfo[];
  } catch (err) {
    console.warn('Error reading cached rooms:', err);
    return [];
  }
}

export function saveCachedRooms(rooms: RoomInfo[]): void {
  try {
    localStorage.setItem(ROOMS_CACHE_KEY, JSON.stringify(rooms));
  } catch (err) {
    console.warn('Error saving cached rooms:', err);
  }
}

export function addRoomToCache(room: RoomInfo): void {
  try {
    const existing = getCachedRooms();
    const index = existing.findIndex((r) => r.id === room.id);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...room };
    } else {
      existing.unshift(room);
    }
    // Sort descending by lastModified / createdAt
    existing.sort((a, b) => (b.lastModified || b.createdAt || 0) - (a.lastModified || a.createdAt || 0));
    saveCachedRooms(existing);
  } catch (err) {
    console.warn('Error adding room to cache:', err);
  }
}

export function removeRoomFromCache(roomId: string): void {
  try {
    const existing = getCachedRooms();
    const filtered = existing.filter((r) => r.id !== roomId);
    saveCachedRooms(filtered);
    localStorage.removeItem(STROKES_CACHE_PREFIX + roomId);
  } catch (err) {
    console.warn('Error removing room from cache:', err);
  }
}

export function getCachedStrokes(roomId: string): Stroke[] {
  try {
    const raw = localStorage.getItem(STROKES_CACHE_PREFIX + roomId);
    if (!raw) return [];
    return JSON.parse(raw) as Stroke[];
  } catch (err) {
    console.warn(`Error reading cached strokes for room ${roomId}:`, err);
    return [];
  }
}

export function saveCachedStrokes(roomId: string, strokes: Stroke[]): void {
  try {
    localStorage.setItem(STROKES_CACHE_PREFIX + roomId, JSON.stringify(strokes));
  } catch (err) {
    console.warn(`Error saving cached strokes for room ${roomId}:`, err);
  }
}
