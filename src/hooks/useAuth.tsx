
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
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // Prevent infinite loops by checking if the session has actually changed
        const currentSessionStr = JSON.stringify(session);
        const newSessionStr = JSON.stringify(newSession);
        
        if (currentSessionStr !== newSessionStr) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
        
        // Always set loading to false after auth state change
        setIsLoading(false);
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

    // Execute initialization
    initializeAuth();
    checkAdminSession();
    
    // Refresh session on a periodic basis (every 30 minutes instead of 10)
    // This reduces unnecessary API calls
    const refreshInterval = setInterval(() => {
      if (session) {
        refreshSession();
      }
      
      // Also check admin session validity
      checkAdminSession();
    }, 30 * 60 * 1000); 

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Force clear the state after sign out
      setUser(null);
      setSession(null);
      
      // Clear any local storage items that might contain sensitive data
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminAuthExpiry');
      localStorage.removeItem('adminAuthToken');
      localStorage.removeItem('supabase.auth.token');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error; // Re-throw to handle in the component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
