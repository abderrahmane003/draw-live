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
  getDocFromServer,
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
  userColor: string,
  isAuthorized: boolean = true
) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  const retryConnection = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsConnected(false);
      return;
    }
    try {
      if (roomId) {
        const roomRef = doc(db, 'rooms', roomId);
        await getDocFromServer(roomRef);
        setIsConnected(true);
      }
    } catch (err) {
      console.warn('Firestore server ping check:', err);
      // Trigger snapshot listener re-subscription
      setRetryTrigger((prev) => prev + 1);
    }
  }, [roomId]);

  // Periodic auto-retry ping when offline
  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(() => {
      retryConnection();
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected, retryConnection]);

  // Track browser online / offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      retryConnection();
    };
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryConnection]);

  // Undo / Redo history stack for the local user
  const [userUndoStack, setUserUndoStack] = useState<string[]>([]); // Stroke IDs that were undone
  const [myStrokesCount, setMyStrokesCount] = useState<number>(0);

  const lastPresenceUpdateRef = useRef<number>(0);

  // Ensure Room document exists in Firestore
  useEffect(() => {
    if (!roomId) return;

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
          console.error('Error creating room doc:', err)
        );
      }
    }).catch((err) => {
      console.warn('Error reading room doc:', err);
    });

    // Listen to Room metadata
    const unsubRoom = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRoomInfo(snapshot.data() as RoomInfo);
          setIsConnected(true);
        }
      },
      (error) => {
        console.warn('Room snapshot warning:', error);
      }
    );

    return () => unsubRoom();
  }, [roomId, retryTrigger]);

  const isBlocked = roomInfo?.isPrivate === true && !isAuthorized;

  // Listen to strokes in real-time
  useEffect(() => {
    if (!roomId || isBlocked) return;

    const strokesRef = collection(db, 'rooms', roomId, 'strokes');
    const q = query(strokesRef, orderBy('timestamp', 'asc'));

    const unsubStrokes = onSnapshot(
      q,
      (snapshot) => {
        setIsConnected(true);
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
        setStrokes(strokeList);

        if (userId) {
          const myActive = strokeList.filter(
            (s) => s.userId === userId && !s.deleted
          );
          setMyStrokesCount(myActive.length);
        }
      },
      (error) => {
        console.error('Error listening to strokes:', error);
        setIsConnected(false);
      }
    );

    return () => unsubStrokes();
  }, [roomId, userId, isBlocked, retryTrigger]);

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
      (error) => {
        console.warn('Presence snapshot warning:', error);
      }
    );

    return () => unsubPresence();
  }, [roomId, isBlocked, retryTrigger]);

  // Update current user presence
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
      // Throttle presence updates to max once per 30ms unless drawing
      if (now - lastPresenceUpdateRef.current < 30 && cursor !== null && !isDrawing) {
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
        payload.drawingPoints = drawingDetails.points;
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

  // Heartbeat presence update
  useEffect(() => {
    if (!roomId || !userId || isBlocked) return;

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

    // Optimistically add to local state immediately so line never disappears
    setStrokes((prev) => {
      if (prev.some((s) => s.id === newStroke.id)) return prev;
      return [...prev, newStroke];
    });

    try {
      await setDoc(strokeRef, firestorePayload);
      const roomRef = doc(db, 'rooms', roomId);
      updateDoc(roomRef, { lastModified: timestamp }).catch(() => {});
    } catch (err) {
      console.error('Error saving stroke to Firestore:', err);
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

    await updateDoc(roomRef, {
      clearTimestamp: now,
      lastModified: now,
    });

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
    retryConnection,
  };
}
