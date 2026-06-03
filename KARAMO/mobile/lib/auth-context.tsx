import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  initials: string;
};

type AuthError = 'cancelled' | 'failed';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  authReady: boolean;
  signingIn: boolean;
  lastError: AuthError | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = '@coach-ai/auth-user';

const AuthContext = createContext<AuthContextValue | null>(null);

function computeInitials(input: string): string {
  const cleaned = (input || '').trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [lastError, setLastError] = useState<AuthError | null>(null);

  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    webClientId: clientId,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw) as AuthUser);
      } catch {
        // ignore corrupted storage
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success' && response.authentication?.accessToken) {
      const accessToken = response.authentication.accessToken;
      (async () => {
        try {
          const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) throw new Error(`userinfo ${res.status}`);
          const data = await res.json();
          const name: string = data.name || data.given_name || data.email || 'Utilisateur';
          const newUser: AuthUser = {
            id: String(data.id ?? data.sub ?? data.email),
            email: data.email,
            name,
            givenName: data.given_name,
            familyName: data.family_name,
            picture: data.picture,
            initials: computeInitials(name || data.email),
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
          setUser(newUser);
          setLastError(null);
        } catch {
          setLastError('failed');
        } finally {
          setSigningIn(false);
        }
      })();
    } else if (response.type === 'error') {
      setLastError('failed');
      setSigningIn(false);
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      setLastError('cancelled');
      setSigningIn(false);
    }
  }, [response]);

  const signInWithGoogle = useCallback(async () => {
    if (!request) return;
    setLastError(null);
    setSigningIn(true);
    try {
      await promptAsync();
    } catch {
      setLastError('failed');
      setSigningIn(false);
    }
  }, [request, promptAsync]);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setLastError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authReady: !!request,
        signingIn,
        lastError,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
