
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

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  // Function to check admin session validity
  const checkAdminSession = () => {
    const adminAuth = localStorage.getItem('adminAuth');
    const adminAuthExpiry = localStorage.getItem('adminAuthExpiry');
    
    if (adminAuth && adminAuthExpiry) {
      const expiryTime = parseInt(adminAuthExpiry, 10);
      
      // If expired, clear admin auth data
      if (Date.now() > expiryTime) {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminAuthExpiry');
        localStorage.removeItem('adminAuthToken');
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Make sure we're not in an infinite loop by checking if the session has actually changed
        if (JSON.stringify(newSession) !== JSON.stringify(session)) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    checkAdminSession();
    
    // Setup session refresh interval
    const refreshInterval = setInterval(() => {
      if (session) {
        refreshSession();
      }
      
      // Also check admin session validity
      checkAdminSession();
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Force clear the state after sign out
      setUser(null);
      setSession(null);
      
      // Clear any local storage items that might contain sensitive data
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminAuthExpiry');
      localStorage.removeItem('adminAuthToken');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error; // Re-throw to handle in the component
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
