'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserPublicProfile } from '@/lib/types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserPublicProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginAsDemo: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { success, error, info } = useToast();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        error('Login failed', data.error || 'Please check your credentials');
        return false;
      }

      setUser(data.user);
      success(`Welcome back, ${data.user.name}!`, `Current streak: ${data.user.streakDays} days 🔥`);
      return true;
    } catch {
      error('Connection Error', 'Could not reach the authentication service');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        error('Sign up failed', data.error || 'Could not create account');
        return false;
      }

      setUser(data.user);
      success(`Account created!`, `Welcome to Memorise, ${data.user.name}`);
      return true;
    } catch {
      error('Connection Error', 'Could not reach the authentication service');
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      info('Logged out', 'You have been signed out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const loginAsDemo = async (): Promise<boolean> => {
    return login('demo@memorise.app', 'password123');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginAsDemo, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
