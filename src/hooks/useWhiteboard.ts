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
import { Stroke, UserPresence, RoomInfo, Point } from '../types';

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
            color: data.color,
            size: data.size,
            points: data.points || [],
            timestamp: data.timestamp || 0,
            deleted: data.deleted || false,
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
    (cursor: Point | null, isDrawing: boolean) => {
      if (!roomId || !userId) return;

      const now = Date.now();
      // Throttle presence updates to max once per 40ms unless drawing status changes
      if (now - lastPresenceUpdateRef.current < 40 && cursor !== null) {
        return;
      }
      lastPresenceUpdateRef.current = now;

      const userPresenceRef = doc(db, 'rooms', roomId, 'presence', userId);
      setDoc(
        userPresenceRef,
        {
          userId,
          userName,
          userColor,
          cursor,
          isDrawing,
          lastSeen: now,
        },
        { merge: true }
      ).catch(() => {});
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
    if (roomInfo?.clearTimestamp && s.timestamp <= roomInfo.clearTimestamp) {
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
    const timestamp = Date.now();

    const newStroke = {
      ...strokeData,
      id: strokeRef.id,
      timestamp,
      deleted: false,
    };

    await setDoc(strokeRef, newStroke);

    // Update room lastModified
    const roomRef = doc(db, 'rooms', roomId);
    updateDoc(roomRef, { lastModified: timestamp }).catch(() => {});

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
  };
}
