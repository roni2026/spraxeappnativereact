import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchOrCreateProfile } from '../data/auth';
import { Profile } from '../types/models';

interface AuthContextValue {
  session: Session | null;
  userId: string | null;
  /** True when the current session is an anonymous "guest" session (no real login yet). */
  isAnonymous: boolean;
  profile: Profile | null;
  initializing: boolean;
  refreshProfile: () => Promise<void>;
  setProfile: (p: Profile | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await fetchOrCreateProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Silently create an anonymous "guest" session when there is no session,
    // so the entire app (browsing, cart, checkout, orders) works WITHOUT ever
    // showing a login screen. Guests transparently get a real Supabase user id,
    // which the cart_items / orders tables require. Users can still choose to
    // log in or create a real account later from the Profile tab.
    const ensureSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session) {
          setSession(data.session);
        } else if (isSupabaseConfigured) {
          const { data: anon } = await supabase.auth.signInAnonymously();
          if (!mounted) return;
          setSession(anon.session ?? null);
        }
      } catch {
        /* ignore — the app still renders; network calls fail softly */
      } finally {
        if (mounted) setInitializing(false);
      }
    };
    ensureSession();

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        // When a logged-in user signs out, drop back to a guest session instead
        // of forcing them to a login screen (login is optional in this app).
        if (isSupabaseConfigured && event === 'SIGNED_OUT') {
          supabase.auth.signInAnonymously().catch(() => {});
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      refreshProfile();
    }
  }, [session?.user?.id, refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      userId: session?.user?.id ?? null,
      isAnonymous: session?.user?.is_anonymous ?? false,
      profile,
      initializing,
      refreshProfile,
      setProfile,
    }),
    [session, profile, initializing, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
