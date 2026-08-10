import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export const ADMIN_PASSWORD = '03112008';

/**
 * Deletes a room and all its associated strokes and presence records from Firestore.
 */
export async function deleteRoomFromFirestore(roomId: string): Promise<void> {
  // 1. Delete strokes subcollection
  const strokesRef = collection(db, 'rooms', roomId, 'strokes');
  const strokesSnap = await getDocs(strokesRef);
  const strokeDocs = strokesSnap.docs;

  for (let i = 0; i < strokeDocs.length; i += 400) {
    const batch = writeBatch(db);
    const chunk = strokeDocs.slice(i, i + 400);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // 2. Delete presence subcollection
  const presenceRef = collection(db, 'rooms', roomId, 'presence');
  const presenceSnap = await getDocs(presenceRef);
  const presenceDocs = presenceSnap.docs;

  for (let i = 0; i < presenceDocs.length; i += 400) {
    const batch = writeBatch(db);
    const chunk = presenceDocs.slice(i, i + 400);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // 3. Delete room document
  const roomRef = doc(db, 'rooms', roomId);
  await deleteDoc(roomRef);
}

/**
 * Creates a new room in Firestore with optional private settings.
 */
export async function createRoomInFirestore(
  roomId: string,
  options?: { isPrivate?: boolean; password?: string; name?: string }
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const now = Date.now();
  const roomData = {
    id: roomId,
    name: options?.name || `Tableau #${roomId}`,
    createdAt: now,
    lastModified: now,
    clearTimestamp: 0,
    isPrivate: !!options?.isPrivate,
    ...(options?.isPrivate && options?.password ? { password: options.password } : {}),
  };

  await setDoc(roomRef, roomData, { merge: true });
}
