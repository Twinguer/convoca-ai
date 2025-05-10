
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      console.log('[useAuth] Refreshing session...');
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[useAuth] Error refreshing session:', error);
        throw error;
      }
      console.log('[useAuth] Session refreshed:', newSession ? 'Valid session' : 'No session');
      setSession(newSession);
      setUser(newSession?.user ?? null);
    } catch (error) {
      console.error('[useAuth] Failed to refresh session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[useAuth] Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('[useAuth] Auth state changed:', event);
        // Only update if the session has actually changed
        if (JSON.stringify(newSession) !== JSON.stringify(session)) {
          console.log('[useAuth] Updating session state');
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    // Initial session check
    refreshSession();

    return () => {
      console.log('[useAuth] Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('[useAuth] Signing out...');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      console.log('[useAuth] Sign out successful');
    } catch (error) {
      console.error('[useAuth] Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
