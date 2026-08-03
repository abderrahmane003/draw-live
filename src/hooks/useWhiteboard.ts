import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Stroke, StrokeType, UserPresence, RoomInfo, Point } from '../types';

export function useWhiteboard(
  roomId: string,
  userId: string | undefined,
  userName: string,
  userColor: string
) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Undo / Redo history stack for the local user
  const [userUndoStack, setUserUndoStack] = useState<string[]>([]); // Stroke IDs that were undone
  const [myStrokesCount, setMyStrokesCount] = useState<number>(0);

  const lastPresenceUpdateRef = useRef<number>(0);

  // Ensure Room document exists in Firestore
  useEffect(() => {
    if (!roomId) return;
    console.log(`🚪 [Room] Room ouverte: #${roomId}`);

    const roomRef = doc(db, 'rooms', roomId);
    getDoc(roomRef).then((snapshot) => {
      if (!snapshot.exists()) {
        const newRoom = {
          id: roomId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          clearTimestamp: 0,
          name: `Tableau #${roomId}`,
        };
        setDoc(roomRef, newRoom).catch((err) =>
          console.error('❌ [Room] Erreur création room doc:', err)
        );
      } else {
        console.log(`📄 [Document reçu] Room metadata chargée pour #${roomId}`);
      }
    });

    // Listen to Room metadata
    const unsubRoom = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoomInfo(snapshot.data() as RoomInfo);
      }
    });

    return () => unsubRoom();
  }, [roomId]);

  // Listen to strokes in real-time
  useEffect(() => {
    if (!roomId) return;
    console.log(`🎧 [Listener créé] Ecouteur de traits activé pour la room #${roomId}`);

    const strokesRef = collection(db, 'rooms', roomId, 'strokes');
    const q = query(strokesRef, orderBy('timestamp', 'asc'));

    const unsubStrokes = onSnapshot(
      q,
      (snapshot) => {
        setIsConnected(true);
        console.log('📡 [Firestore Sync] Connexion Firestore réussie. Réception d\'une mise à jour temps réel.');
        const strokeList: Stroke[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          strokeList.push({
            id: docSnap.id,
            userId: data.userId,
            userName: data.userName,
            type: data.type,
            color: data.color,
            size: data.size,
            points: data.points || [],
            timestamp: data.timestamp || 0,
            deleted: data.deleted || false,
          });
        });
        console.log(`📡 [Firestore Sync] Document reçu. Nombre de traits reçus: ${strokeList.length}`);
        setStrokes(strokeList);

        if (userId) {
          const myActive = strokeList.filter(
            (s) => s.userId === userId && !s.deleted
          );
          setMyStrokesCount(myActive.length);
        }
      },
      (error) => {
        console.error('❌ [Firestore Sync] Erreur de connexion aux traits:', error);
        setIsConnected(false);
      }
    );

    return () => {
      console.log(`🛑 [Listener détruit] Ecouteur de traits désactivé pour #${roomId}`);
      unsubStrokes();
    };
  }, [roomId, userId]);

  // Listen to presences in real-time
  useEffect(() => {
    if (!roomId) return;

    const presenceRef = collection(db, 'rooms', roomId, 'presence');

    const unsubPresence = onSnapshot(presenceRef, (snapshot) => {
      const now = Date.now();
      const list: UserPresence[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserPresence;
        // Filter out users inactive for > 20 seconds
        if (now - (data.lastSeen || 0) < 20000) {
          list.push(data);
        }
      });
      setPresences(list);
    });

    return () => unsubPresence();
  }, [roomId]);

  // Update current user presence
  const updatePresence = useCallback(
    (
      cursor: Point | null,
      isDrawing: boolean,
      drawingDetails?: {
        points?: Point[];
        tool?: StrokeType;
        color?: string;
        size?: number;
      }
    ) => {
      if (!roomId || !userId) return;

      const now = Date.now();
      // Throttle presence updates: 60ms for cursor move, 80ms while drawing to avoid flooding Firestore writes
      const minInterval = isDrawing ? 80 : 60;
      if (now - lastPresenceUpdateRef.current < minInterval && cursor !== null) {
        return;
      }
      lastPresenceUpdateRef.current = now;

      const userPresenceRef = doc(db, 'rooms', roomId, 'presence', userId);
      const payload: Partial<UserPresence> = {
        userId,
        userName,
        userColor,
        cursor,
        isDrawing,
        lastSeen: now,
      };

      if (isDrawing && drawingDetails?.points?.length) {
        const pts = drawingDetails.points;
        // Keep live drawing preview points bounded to avoid large payload writes
        payload.drawingPoints = pts.length > 40 ? pts.slice(-40) : pts;
        payload.drawingTool = drawingDetails.tool || 'pen';
        payload.drawingColor = drawingDetails.color || '#000000';
        payload.drawingSize = drawingDetails.size || 6;
      } else {
        payload.drawingPoints = [];
      }

      setDoc(userPresenceRef, payload, { merge: true }).catch((err) => {
        console.warn('Presence update error:', err);
      });
    },
    [roomId, userId, userName, userColor]
  );

  // Heartbeat presence update
  useEffect(() => {
    if (!roomId || !userId) return;

    updatePresence(null, false);
    const interval = setInterval(() => {
      updatePresence(null, false);
    }, 8000);

    return () => {
      clearInterval(interval);
      // Clean up presence on unmount
      if (roomId && userId) {
        const userPresenceRef = doc(db, 'rooms', roomId, 'presence', userId);
        deleteDoc(userPresenceRef).catch(() => {});
      }
    };
  }, [roomId, userId, updatePresence]);

  // Filter valid strokes taking room clearTimestamp into account
  const validStrokes = strokes.filter((s) => {
    if (s.deleted) return false;
    if (roomInfo?.clearTimestamp && s.timestamp < roomInfo.clearTimestamp) {
      return false;
    }
    return true;
  });

  // Add stroke
  const addStroke = async (
    strokeData: Omit<Stroke, 'id' | 'timestamp'>
  ): Promise<string> => {
    if (!roomId) throw new Error('No room selected');

    const strokeRef = doc(collection(db, 'rooms', roomId, 'strokes'));
    const minTimestamp = (roomInfo?.clearTimestamp || 0) + 1;
    const timestamp = Math.max(Date.now(), minTimestamp);

    const newStroke: Stroke = {
      ...strokeData,
      id: strokeRef.id,
      timestamp,
      deleted: false,
    };

    // Optimistically add to local state immediately so line never disappears
    setStrokes((prev) => {
      if (prev.some((s) => s.id === newStroke.id)) return prev;
      return [...prev, newStroke];
    });

    try {
      console.log('✍️ [Firestore Write] Trait enregistré dans Firestore:', newStroke.id);
      await setDoc(strokeRef, newStroke);
      const roomRef = doc(db, 'rooms', roomId);
      setDoc(
        roomRef,
        {
          id: roomId,
          name: roomInfo?.name || `Tableau #${roomId}`,
          lastModified: timestamp,
        },
        { merge: true }
      ).catch(() => {});
    } catch (err) {
      console.error('❌ [Firestore Write] Erreur écriture trait dans Firestore:', err);
    }

    // Clear local redo stack when drawing a new stroke
    setUserUndoStack([]);

    return strokeRef.id;
  };

  // Undo last stroke by this user
  const undoLastStroke = async () => {
    if (!roomId || !userId) return;

    const myStrokes = validStrokes.filter((s) => s.userId === userId);
    if (myStrokes.length === 0) return;

    const lastStroke = myStrokes[myStrokes.length - 1];
    const strokeRef = doc(db, 'rooms', roomId, 'strokes', lastStroke.id);

    await updateDoc(strokeRef, { deleted: true });
    setUserUndoStack((prev) => [...prev, lastStroke.id]);
  };

  // Redo last undone stroke by this user
  const redoLastStroke = async () => {
    if (!roomId || userUndoStack.length === 0) return;

    const lastUndoneId = userUndoStack[userUndoStack.length - 1];
    const strokeRef = doc(db, 'rooms', roomId, 'strokes', lastUndoneId);

    await updateDoc(strokeRef, { deleted: false });
    setUserUndoStack((prev) => prev.slice(0, -1));
  };

  // Clear room canvas
  const clearRoomCanvas = async () => {
    if (!roomId) return;

    const now = Date.now();
    const roomRef = doc(db, 'rooms', roomId);

    await setDoc(
      roomRef,
      {
        id: roomId,
        clearTimestamp: now,
        lastModified: now,
      },
      { merge: true }
    );

    setUserUndoStack([]);
  };

  return {
    strokes: validStrokes,
    activeUsers: presences,
    addStroke,
    undoLastStroke,
    redoLastStroke,
    clearRoomCanvas,
    updatePresence,
    canUndo: myStrokesCount > 0,
    canRedo: userUndoStack.length > 0,
    roomInfo,
    isConnected,
  };
}
