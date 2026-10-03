/**
 * AuthContext
 *
 * Manages Firebase Auth state for the MoonTales app.
 * Uses expo-secure-store to cache the Firebase ID token so it can be
 * injected into MoontalesApiService without prop-drilling.
 *
 * NOTE: This context uses the Firebase REST API (no native SDK needed for Expo
 * Go). Swap to @react-native-firebase/auth if you eject to bare workflow.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { setTokenProvider } from '../services/api/MoontalesApiService';

// ── Firebase REST config ───────────────────────────────────────────────────────
// These values come from your Firebase project's web app config.
// Add them to .env as EXPO_PUBLIC_FIREBASE_* variables.
const FIREBASE_API_KEY  = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';
const FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

const SECURE_STORE_TOKEN_KEY    = 'moontales_firebase_token';
const SECURE_STORE_REFRESH_KEY  = 'moontales_firebase_refresh';
const SECURE_STORE_UID_KEY      = 'moontales_firebase_uid';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function firebaseRestCall(endpoint: string, body: object): Promise<any> {
  const res = await fetch(`${FIREBASE_AUTH_URL}:${endpoint}?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message ?? `Firebase error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function refreshIdToken(refreshToken: string): Promise<{
  idToken: string;
  userId: string;
  newRefreshToken: string;
}> {
  const res = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Token refresh failed');
  return {
    idToken: data.id_token,
    userId: data.user_id,
    newRefreshToken: data.refresh_token,
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string>('');

  // Register the token provider with the API service once on mount.
  useEffect(() => {
    setTokenProvider(async () => {
      // Re-use cached token; refresh if empty (e.g. cold start).
      if (tokenRef.current) return tokenRef.current;
      const refresh = await SecureStore.getItemAsync(SECURE_STORE_REFRESH_KEY);
      if (!refresh) throw new Error('Not signed in.');
      const { idToken, userId, newRefreshToken } = await refreshIdToken(refresh);
      tokenRef.current = idToken;
      await SecureStore.setItemAsync(SECURE_STORE_TOKEN_KEY, idToken);
      await SecureStore.setItemAsync(SECURE_STORE_REFRESH_KEY, newRefreshToken);
      await SecureStore.setItemAsync(SECURE_STORE_UID_KEY, userId);
      return idToken;
    });
  }, []);

  // Restore session from SecureStore on cold start.
  useEffect(() => {
    (async () => {
      try {
        const refresh = await SecureStore.getItemAsync(SECURE_STORE_REFRESH_KEY);
        const uid     = await SecureStore.getItemAsync(SECURE_STORE_UID_KEY);
        if (refresh && uid) {
          const { idToken, newRefreshToken } = await refreshIdToken(refresh);
          tokenRef.current = idToken;
          await SecureStore.setItemAsync(SECURE_STORE_TOKEN_KEY, idToken);
          await SecureStore.setItemAsync(SECURE_STORE_REFRESH_KEY, newRefreshToken);
          setUser({ uid, email: null, displayName: null });
        }
      } catch {
        // Expired / invalid — user must sign in again.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = async (data: any) => {
    const idToken      = data.idToken as string;
    const refreshToken = data.refreshToken as string;
    const uid          = (data.localId ?? data.userId) as string;
    tokenRef.current   = idToken;
    await SecureStore.setItemAsync(SECURE_STORE_TOKEN_KEY, idToken);
    await SecureStore.setItemAsync(SECURE_STORE_REFRESH_KEY, refreshToken);
    await SecureStore.setItemAsync(SECURE_STORE_UID_KEY, uid);
    setUser({
      uid,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const data = await firebaseRestCall('signInWithPassword', {
      email,
      password,
      returnSecureToken: true,
    });
    await persist(data);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const data = await firebaseRestCall('signUp', {
      email,
      password,
      returnSecureToken: true,
    });
    await persist(data);
  };

  const signInAsGuest = async () => {
    const guestUser: AuthUser = {
      uid: 'dev-user',
      email: 'dev@moontales.local',
      displayName: 'Bedtime Explorer',
    };
    tokenRef.current = 'dev-token';
    setUser(guestUser);
  };

  const signOut = async () => {
    tokenRef.current = '';
    await SecureStore.deleteItemAsync(SECURE_STORE_TOKEN_KEY);
    await SecureStore.deleteItemAsync(SECURE_STORE_REFRESH_KEY);
    await SecureStore.deleteItemAsync(SECURE_STORE_UID_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithEmail, signUpWithEmail, signOut, signInAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
