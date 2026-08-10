import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Stroke, StrokeType, UserPresence, RoomInfo, Point } from '../types';
import {
  getCachedStrokes,
  saveCachedStrokes,
  addRoomToCache,
} from '../lib/roomStorage';

export function useWhiteboard(
  roomId: string,
  userId: string | undefined,
  userName: string,
  userColor: string,
  isAuthorized: boolean = true
) {
  // Initialize strokes from local cache first for instant offline/quota resilience
  const [strokes, setStrokes] = useState<Stroke[]>(() => {
    return roomId ? getCachedStrokes(roomId) : [];
  });
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Track browser online / offline state
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync initial strokes state whenever roomId changes
  useEffect(() => {
    if (roomId) {
      const cached = getCachedStrokes(roomId);
      setStrokes(cached);
    } else {
      setStrokes([]);
    }
  }, [roomId]);

  // Undo / Redo history stack for the local user
  const [userUndoStack, setUserUndoStack] = useState<string[]>([]); // Stroke IDs that were undone
  const [myStrokesCount, setMyStrokesCount] = useState<number>(0);

  const lastPresenceUpdateRef = useRef<number>(0);

  // Ensure Room document exists in Firestore and update local cache
  useEffect(() => {
    if (!roomId) return;

    const initialRoomObj: RoomInfo = {
      id: roomId,
      name: `Tableau #${roomId}`,
      createdAt: Date.now(),
      lastModified: Date.now(),
      clearTimestamp: 0,
    };
    addRoomToCache(initialRoomObj);

    const roomRef = doc(db, 'rooms', roomId);
    getDoc(roomRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          setDoc(roomRef, initialRoomObj, { merge: true }).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}`)
          );
        } else {
          const data = snapshot.data() as RoomInfo;
          setRoomInfo(data);
          addRoomToCache(data);
        }
      })
      .catch((err) => handleFirestoreError(err, OperationType.GET, `rooms/${roomId}`));

    // Listen to Room metadata
    const unsubRoom = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as RoomInfo;
          setRoomInfo(data);
          addRoomToCache(data);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `rooms/${roomId}`)
    );

    return () => unsubRoom();
  }, [roomId]);

  const isBlocked = roomInfo?.isPrivate === true && !isAuthorized;

  // Listen to strokes in real-time
  useEffect(() => {
    if (!roomId || isBlocked) return;

    const strokesRef = collection(db, 'rooms', roomId, 'strokes');
    const q = query(strokesRef, orderBy('timestamp', 'asc'));

    console.log(`[Firestore] Stroke listener STARTED for room: ${roomId}`);

    const unsubStrokes = onSnapshot(
      q,
      (snapshot) => {
        setIsConnected(true);
        console.log(`[Firestore] Stroke snapshot RECEIVED for room: ${roomId}`);
        const strokeList: Stroke[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          strokeList.push({
            id: docSnap.id,
            userId: data.userId,
            userName: data.userName,
            type: data.type,
            penType: data.penType,
            color: data.color,
            size: data.size,
            points: data.points || [],
            timestamp: data.timestamp || 0,
            deleted: data.deleted || false,
            ...(data.text ? { text: data.text } : {}),
          });
        });

        console.log(`[Firestore] Number of strokes: ${strokeList.length}`);

        // Synchronize with Firestore list while retaining recent local optimistic strokes
        setStrokes((prev) => {
          const firestoreMap = new Map<string, Stroke>();
          strokeList.forEach((s) => firestoreMap.set(s.id, s));

          // Retain very recent local optimistic strokes (< 8s old) not yet echoed by Firestore
          const now = Date.now();
          prev.forEach((s) => {
            if (!firestoreMap.has(s.id) && now - s.timestamp < 8000) {
              firestoreMap.set(s.id, s);
            }
          });

          const result = Array.from(firestoreMap.values()).sort(
            (a, b) => a.timestamp - b.timestamp
          );
          saveCachedStrokes(roomId, result);
          return result;
        });

        if (userId) {
          const myActive = strokeList.filter(
            (s) => s.userId === userId && !s.deleted
          );
          setMyStrokesCount(myActive.length);
        }
      },
      (error) => {
        console.error(`[Firestore] Stroke listener ERROR for room: ${roomId}`, error);
        setIsConnected(false);
        handleFirestoreError(error, OperationType.LIST, `rooms/${roomId}/strokes`);
      }
    );

    return () => unsubStrokes();
  }, [roomId, userId, isBlocked]);

  // Listen to presences in real-time
  useEffect(() => {
    if (!roomId || isBlocked) return;

    const presenceRef = collection(db, 'rooms', roomId, 'presence');

    const unsubPresence = onSnapshot(
      presenceRef,
      (snapshot) => {
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
      },
      (err) => {
        console.warn('Presence snapshot warning:', err);
      }
    );

    return () => unsubPresence();
  }, [roomId, isBlocked]);

  // Update current user presence (Fast sync when drawing, throttled when moving)
  const updatePresence = useCallback(
    (
      cursor: Point | null,
      isDrawing: boolean,
      drawingDetails?: {
        points?: Point[];
        tool?: StrokeType;
        penType?: string;
        color?: string;
        size?: number;
      }
    ) => {
      if (!roomId || !userId) return;

      const now = Date.now();
      // Throttle: 100ms when drawing for live line preview, 250ms when moving cursor
      const minInterval = isDrawing ? 100 : 250;
      if (now - lastPresenceUpdateRef.current < minInterval) {
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
        payload.drawingPoints = drawingDetails.points.slice(-15); // Send last 15 points for smooth live preview
        payload.drawingTool = drawingDetails.tool || 'pen';
        payload.drawingPenType = (drawingDetails.penType as any) || 'stylo';
        payload.drawingColor = drawingDetails.color || '#000000';
        payload.drawingSize = drawingDetails.size || 6;
      } else {
        payload.drawingPoints = [];
      }

      setDoc(userPresenceRef, payload, { merge: true }).catch(() => {});
    },
    [roomId, userId, userName, userColor]
  );

  // Heartbeat presence update (every 25 seconds)
  useEffect(() => {
    if (!roomId || !userId || isBlocked) return;

    updatePresence(null, false);
    const interval = setInterval(() => {
      updatePresence(null, false);
    }, 25000);

    return () => {
      clearInterval(interval);
      if (roomId && userId) {
        const userPresenceRef = doc(db, 'rooms', roomId, 'presence', userId);
        deleteDoc(userPresenceRef).catch(() => {});
      }
    };
  }, [roomId, userId, isBlocked, updatePresence]);

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

    // Construct clean Firestore payload without undefined values
    const firestorePayload: Record<string, any> = {
      id: strokeRef.id,
      userId: strokeData.userId || '',
      userName: strokeData.userName || 'Anonyme',
      type: strokeData.type || 'pen',
      penType: strokeData.penType || 'stylo',
      color: strokeData.color || '#000000',
      size: strokeData.size || 5,
      points: strokeData.points || [],
      timestamp,
      deleted: false,
    };
    if (strokeData.text !== undefined) {
      firestorePayload.text = strokeData.text;
    }

    // Optimistically update local state & local storage immediately
    setStrokes((prev) => {
      const updated = prev.some((s) => s.id === newStroke.id)
        ? prev
        : [...prev, newStroke];
      saveCachedStrokes(roomId, updated);
      return updated;
    });

    // Update room in local room list cache
    addRoomToCache({
      id: roomId,
      name: roomInfo?.name || `Tableau #${roomId}`,
      createdAt: roomInfo?.createdAt || timestamp,
      lastModified: timestamp,
      clearTimestamp: roomInfo?.clearTimestamp || 0,
      isPrivate: roomInfo?.isPrivate || false,
    });

    try {
      console.log(`[Firestore] Stroke WRITE START - room: ${roomId}, strokeId: ${strokeRef.id}`);
      await setDoc(strokeRef, firestorePayload);
      const roomRef = doc(db, 'rooms', roomId);
      updateDoc(roomRef, { lastModified: timestamp }).catch(() => {});
      console.log(`[Firestore] Stroke WRITE SUCCESS - strokeId: ${strokeRef.id}`);
      setIsConnected(true);
    } catch (err) {
      console.error(`[Firestore] Stroke WRITE ERROR - strokeId: ${strokeRef.id}`, err);
      setIsConnected(false);
      handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}/strokes/${strokeRef.id}`);
      throw err;
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

    // Local state & cache update
    setStrokes((prev) => {
      const updated = prev.map((s) =>
        s.id === lastStroke.id ? { ...s, deleted: true } : s
      );
      saveCachedStrokes(roomId, updated);
      return updated;
    });

    setUserUndoStack((prev) => [...prev, lastStroke.id]);

    try {
      const strokeRef = doc(db, 'rooms', roomId, 'strokes', lastStroke.id);
      await updateDoc(strokeRef, { deleted: true });
    } catch (err) {
      console.warn('Error undoing stroke in Firestore:', err);
    }
  };

  // Redo last undone stroke by this user
  const redoLastStroke = async () => {
    if (!roomId || userUndoStack.length === 0) return;

    const lastUndoneId = userUndoStack[userUndoStack.length - 1];

    // Local state & cache update
    setStrokes((prev) => {
      const updated = prev.map((s) =>
        s.id === lastUndoneId ? { ...s, deleted: false } : s
      );
      saveCachedStrokes(roomId, updated);
      return updated;
    });

    setUserUndoStack((prev) => prev.slice(0, -1));

    try {
      const strokeRef = doc(db, 'rooms', roomId, 'strokes', lastUndoneId);
      await updateDoc(strokeRef, { deleted: false });
    } catch (err) {
      console.warn('Error redoing stroke in Firestore:', err);
    }
  };

  // Clear room canvas
  const clearRoomCanvas = async () => {
    if (!roomId) return;

    const now = Date.now();
    setStrokes([]);
    saveCachedStrokes(roomId, []);

    setUserUndoStack([]);

    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        clearTimestamp: now,
        lastModified: now,
      });
    } catch (err) {
      console.warn('Error clearing room canvas in Firestore:', err);
    }
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

