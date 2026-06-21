import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  plan: 'free' | 'basic' | 'pro';
  isVerified?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresVerification?: boolean; userId?: string; email?: string; message?: string; debugOtp?: string; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; requiresVerification?: boolean; userId?: string; email?: string; message?: string; debugOtp?: string; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
        api.logout();
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
      if (res.requiresVerification) {
        return { success: true, requiresVerification: true, userId: res.userId, email: res.email, message: res.message, debugOtp: res.debugOtp };
      }
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Something went wrong.' };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await api.register(username, email, password);
      if (res.requiresVerification) {
        return { success: true, requiresVerification: true, userId: res.user?.id || res.userId, email: res.user?.email || res.email, message: res.message, debugOtp: res.debugOtp };
      }
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Registration failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Something went wrong.' };
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
