import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService, type User } from '../services/authService';
import { apiClient } from '../services/apiClient';

export type UserRole = 'Citizen' | 'Lawyer' | 'Judge' | 'Admin';

export type { User };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string, role: UserRole, phone?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (): Promise<User | null> => {
    try {
      const { user } = await authService.getMe();
      return user;
    } catch {
      // If profile fetch fails, clear invalid tokens silently
      apiClient.setToken(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (authService.isLoggedIn()) {
        const u = await fetchProfile();
        if (mounted) setUser(u);
      }
      if (mounted) setLoading(false);
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    try {
      const response = await authService.login(email, password, rememberMe);
      setUser(response.user);
      return {};
    } catch (error: any) {
      return { error: error.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: UserRole, phone?: string) => {
    try {
      const response = await authService.register({ email, password, name, role, phone });
      setUser(response.user);
      return {};
    } catch (error: any) {
      return { error: error.message || 'Registration failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const u = await fetchProfile();
    setUser(u);
  }, [fetchProfile]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await authService.forgotPassword(email);
      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to send reset email' };
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      const token = new URLSearchParams(window.location.search).get('token');
      if (token) {
        await authService.resetPassword(token, password);
        return {};
      }
      return { error: 'No reset token found' };
    } catch (error: any) {
      return { error: error.message || 'Failed to reset password' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile, forgotPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
