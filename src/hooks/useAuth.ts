import { useState, useEffect } from 'react';
import { auth, signInAnonymously, onAuthStateChanged, User } from '../lib/firebase';
import { generateRandomUser } from '../lib/utils';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackUserId] = useState<string>(() => {
    let id = localStorage.getItem('whiteboard_anon_uid');
    if (!id) {
      id = 'anon_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('whiteboard_anon_uid', id);
    }
    return id;
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('whiteboard_username') || '';
  });
  const [userColor, setUserColor] = useState<string>(() => {
    return localStorage.getItem('whiteboard_usercolor') || '';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          setUser(cred.user);
        } catch (_err) {
          // Anonymous auth is restricted in this project configuration; fallbackUserId is used instead.
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userName || !userColor) {
      const randomUser = generateRandomUser();
      const finalName = userName || randomUser.name;
      const finalColor = userColor || randomUser.color;

      setUserName(finalName);
      setUserColor(finalColor);
      localStorage.setItem('whiteboard_username', finalName);
      localStorage.setItem('whiteboard_usercolor', finalColor);
    }
  }, [userName, userColor]);

  const updateProfile = (name: string, color: string) => {
    setUserName(name);
    setUserColor(color);
    localStorage.setItem('whiteboard_username', name);
    localStorage.setItem('whiteboard_usercolor', color);
  };

  return {
    user,
    userId: user?.uid || fallbackUserId,
    loading,
    userName,
    userColor,
    updateProfile,
  };
}
