'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

interface User {
  id: string;
  email: string;
  name?: string | null;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [registerError, setRegisterError] = useState<string | null>(null);

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const user = session?.user as User | null;
  const isAdmin = user?.role === 'admin';

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: '/' });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setRegisterError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        const errorMessage = result.error?.message || 'Registration failed';
        setRegisterError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Auto-login after successful registration
      const loginResult = await login(data.email, data.password);
      return loginResult;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = 'An unexpected error occurred during registration';
      setRegisterError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [login]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        login,
        logout,
        register,
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

// Hook for checking if user has specific role
export function useRequireAuth(requiredRole?: 'customer' | 'admin') {
  const { user, isAuthenticated, isLoading } = useAuth();

  const hasRequiredRole = !requiredRole || user?.role === requiredRole;
  const isAuthorized = isAuthenticated && hasRequiredRole;

  return {
    isAuthorized,
    isLoading,
    user,
  };
}

// Hook for redirect if not authenticated
export function useAuthRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  return {
    shouldRedirect: !isLoading && !isAuthenticated,
    isLoading,
  };
}
