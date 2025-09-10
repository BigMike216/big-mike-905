import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  sessionId: string;
  role: 'student' | 'host';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: 'student' | 'host', name?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate a session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  // Load user from session storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedSessionId = sessionStorage.getItem('sessionId');
        if (storedSessionId) {
          // Check if this session exists in database
          const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .eq('session_id', storedSessionId)
            .single();

          if (data && !error) {
            setUser({
              id: data.id,
              sessionId: data.session_id,
              role: data.role as 'student' | 'host',
              name: data.name || undefined
            });
          } else {
            // Clean up invalid session
            sessionStorage.removeItem('sessionId');
          }
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        sessionStorage.removeItem('sessionId');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (role: 'student' | 'host', name?: string) => {
    try {
      const sessionId = generateSessionId();
      
      // Save to database
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          session_id: sessionId,
          role,
          name: name || null
        })
        .select()
        .single();

      if (error) throw error;

      const newUser: User = {
        id: data.id,
        sessionId: data.session_id,
        role: data.role as 'student' | 'host',
        name: data.name || undefined
      };

      setUser(newUser);
      sessionStorage.setItem('sessionId', sessionId);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('sessionId');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};