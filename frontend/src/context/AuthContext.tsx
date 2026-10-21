import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, api, setTokens, clearTokens, getAccessToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (email: string) => Promise<void>;
  recordStudyMinutes: (minutes: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      if (getAccessToken()) {
        const profile = await api.getProfile();
        setUser(profile);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      refreshProfile();
    } else {
      // Auto login as demo student Alex Chen on first visit for zero-friction exploration
      quickDemoLogin('alex@stanford.edu').catch(() => setLoading(false));
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setTokens(data.access, data.refresh);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any) => {
    setLoading(true);
    try {
      const data = await api.register(payload);
      setTokens(data.access, data.refresh);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (email: string) => {
    setLoading(true);
    try {
      const data = await api.login(email, 'password123');
      setTokens(data.access, data.refresh);
      setUser(data.user);
    } catch (e) {
      console.error('Demo login error', e);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const recordStudyMinutes = async (minutes: number) => {
    if (!user) return;
    try {
      const res = await api.recordStudySession(minutes);
      setUser((prev) => (prev ? { ...prev, total_study_minutes: res.total_study_minutes } : null));
    } catch (err) {
      console.error('Failed to record session:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        quickDemoLogin,
        recordStudyMinutes,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
