import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService, AuthResponse } from '../services/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  toggleRole?: () => void; // Development-only function to toggle role
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const token = authService.getToken();
        
        // Only verify token if we have both user and token
        if (storedUser && token) {
          setUser(storedUser);
          // Verify token is still valid by calling /auth/me
          try {
            const currentUser = await authService.getCurrentUser();
            // Update user data in case it changed
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          } catch (error: any) {
            // Token is invalid or expired - clear auth state
            console.log('Token validation failed, clearing auth state:', error.response?.status);
            authService.logout();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        authService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('AuthContext.login called with:', { email });
    try {
      console.log('Calling authService.login...');
      const response = await authService.login({ email, password });
      console.log('authService.login succeeded:', response);
      // ✅ Only mutate auth state on SUCCESS
      setUser(response.user);
      return response;
    } catch (err) {
      console.error('AuthContext.login error:', err);
      // ❌ Do NOT touch auth state here
      // ❌ Do NOT logout
      // ❌ Do NOT clear storage
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authService.register({ name, email, password });
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Development-only: Toggle role between 'admin' and 'user'
  const toggleRole = () => {
    if (import.meta.env.MODE !== 'development') {
      return;
    }
    
    if (user) {
      const newRole: User['role'] = user.role === 'admin' ? 'user' : 'admin';
      const updatedUser: User = {
        ...user,
        role: newRole,
      };
      setUser(updatedUser);
      // Update localStorage to persist the change
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log(`[DEV] Role toggled to: ${newRole}`);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        isLoading,
        toggleRole: import.meta.env.MODE === 'development' ? toggleRole : undefined
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
