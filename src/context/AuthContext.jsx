import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(isSupabaseConfigured);
  // Remember WHICH user the admin check was for, so a new login never briefly looks "not admin".
  const [adminState, setAdminState] = useState({ userId: null, value: false });

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => {})
      .finally(() => active && setInitializing(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!supabase || !userId) return undefined;
    let active = true;
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active) setAdminState({ userId, value: !error && Boolean(data) });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const checkingAdmin = Boolean(userId) && adminState.userId !== userId;

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAdmin: Boolean(userId) && adminState.userId === userId && adminState.value,
      loading: initializing || checkingAdmin,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, userId, adminState, initializing, checkingAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
