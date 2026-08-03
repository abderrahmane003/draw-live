import { useState, useEffect } from 'react';
import { auth, signInAnonymously, onAuthStateChanged, User } from '../lib/firebase';
import { generateRandomUser } from '../lib/utils';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('whiteboard_username') || '';
  });
  const [userColor, setUserColor] = useState<string>(() => {
    return localStorage.getItem('whiteboard_usercolor') || '';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log('🔑 [Firebase Auth] Authentifié sur Firebase. UID Firebase:', currentUser.uid);
        setUser(currentUser);
        setAuthError(null);
        setLoading(false);
      } else {
        try {
          console.log('🔑 [Firebase Auth] Tentative de connexion anonyme à Firebase...');
          const cred = await signInAnonymously(auth);
          console.log('🔑 [Firebase Auth] Authentification anonyme réussie. UID Firebase:', cred.user.uid);
          setUser(cred.user);
          setAuthError(null);
        } catch (err: any) {
          const errMsg = err?.message || 'Échec de l\'authentification Firebase';
          console.error('❌ [Firebase Auth] Erreur d\'authentification Firebase:', err);
          setAuthError(errMsg);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
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
    userId: user?.uid,
    loading,
    authError,
    userName,
    userColor,
    updateProfile,
  };
}

