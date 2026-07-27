import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  favoriteGenres?: string[];
  notificationPreferences?: {
    borrowAlerts: boolean;
    clubAlerts: boolean;
    returnReminders: boolean;
    weeklyDigest: boolean;
  };
  honestyScore?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  token: string | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserInState: (updated: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  updateUserInState: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      fetchCurrentUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in');
    }
    localStorage.setItem('authToken', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register');
    }
    localStorage.setItem('authToken', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const handleGoogleCallback = async (code?: string) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirectUri: `${window.location.origin}/auth/callback`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google authentication failed');
    }
    localStorage.setItem('authToken', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = async () => {
    try {
      // 1. Try Firebase Auth popup first
      try {
        const result = await signInWithPopup(auth, googleAuthProvider);
        if (result?.user) {
          const idToken = await result.user.getIdToken();
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleToken: idToken,
              email: result.user.email,
              displayName: result.user.displayName || result.user.email?.split('@')[0],
              photoURL: result.user.photoURL,
              googleId: result.user.uid,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Google auth server error');
          localStorage.setItem('authToken', data.token);
          setToken(data.token);
          setUser(data.user);
          return;
        }
      } catch (fbErr: any) {
        console.warn('Firebase popup sign in warning:', fbErr?.code || fbErr?.message);
        // The user aborted deliberately: not an error worth surfacing.
        if (
          fbErr?.code === 'auth/popup-closed-by-user' ||
          fbErr?.code === 'auth/cancelled-popup-request'
        ) {
          return;
        }
        // The browser refused the popup. Silently falling through leaves the
        // user staring at an unchanged page, so surface it instead.
        if (fbErr?.code === 'auth/popup-blocked') {
          throw new Error(
            'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.'
          );
        }
      }

      // 2. Check if server has custom Google OAuth client secret configured
      const urlRes = await fetch('/api/auth/google/url');
      const { url, configured } = await urlRes.json();

      if (configured) {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          url,
          'google_oauth_popup',
          `width=${width},height=${height},top=${top},left=${left}`
        );

        if (popup) {
          await new Promise<void>((resolve, reject) => {
            const handleMessage = async (event: MessageEvent) => {
              if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
                window.removeEventListener('message', handleMessage);
                try {
                  await handleGoogleCallback(event.data.code);
                  resolve();
                } catch (e) {
                  reject(e);
                }
              }
            };

            window.addEventListener('message', handleMessage);

            const checkClosed = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', handleMessage);
                handleGoogleCallback()
                  .then(() => resolve())
                  .catch((err) => reject(err));
              }
            }, 1000);
          });
          return;
        }
      }

      // 3. Fallback: Local Google Authentication
      await handleGoogleCallback();
    } catch (err: any) {
      console.error('Google auth failed:', err);
      // Only fall back to the local stub account when no real Google
      // credentials are configured (local dev without GOOGLE_CLIENT_ID).
      // Once OAuth is configured, a failure must surface to the user rather
      // than silently signing everyone into one shared stub identity.
      let configured = false;
      try {
        const probe = await fetch('/api/auth/google/url');
        configured = (await probe.json())?.configured === true;
      } catch {
        // Treated as unconfigured below.
      }

      if (configured) {
        throw err instanceof Error ? err : new Error('Google sign-in failed. Please try again.');
      }

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleToken: 'ya29.google_oauth_access_token_' + Math.random().toString(36).substring(2),
          email: `dev_google_user_${Math.random().toString(36).substring(2, 10)}@example.com`,
          displayName: 'Google Reader (dev)',
          googleId: 'gid_' + Math.random().toString(36).substring(2),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google auth failed');
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser(data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      await fetchCurrentUser(storedToken);
    }
  };

  const updateUserInState = (updated: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        refreshUser,
        updateUserInState,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
