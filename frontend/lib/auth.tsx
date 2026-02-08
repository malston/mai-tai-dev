'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { signOut } from 'next-auth/react';
import { getMe, getMeIAP, User, UserSettings } from './api';

const useIAP = process.env.NEXT_PUBLIC_USE_IAP === 'true';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  formatTime: (date: Date | string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Define all callbacks BEFORE any conditional returns (React hooks rules)
  const refreshUser = useCallback(async () => {
    if (useIAP) {
      const userData = await getMeIAP();
      setUser(userData);
    } else {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        const userData = await getMe(storedToken);
        setUser(userData);
      }
    }
  }, []);

  const formatTime = useCallback(
    (date: Date | string): string => {
      // Parse the date - if it's a string without timezone info, treat it as UTC
      let d: Date;
      if (typeof date === 'string') {
        // If the string doesn't have timezone info (no Z or +/-), append Z to treat as UTC
        const hasTimezone = date.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(date);
        d = new Date(hasTimezone ? date : date + 'Z');
      } else {
        d = date;
      }

      const settings = user?.settings;
      const timezone = settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const hour12 = settings?.time_format !== '24h';

      return d.toLocaleString(undefined, {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12,
      });
    },
    [user?.settings]
  );

  const login = useCallback((accessToken: string, refreshToken: string) => {
    if (useIAP) {
      // In IAP mode, login is handled by Google - just refresh user
      getMeIAP().then(setUser);
      setToken('iap');
    } else {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      setToken(accessToken);
      getMe(accessToken).then(setUser);
    }
  }, []);

  const logout = useCallback(() => {
    if (useIAP) {
      // IAP logout: clear state and redirect to Google logout
      setToken(null);
      setUser(null);
      // Redirect to IAP logout endpoint (clears IAP session)
      window.location.href = '/.auth/logout';
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      setUser(null);
      // Sign out of NextAuth session (for OAuth users)
      signOut({ callbackUrl: '/login' });
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    if (useIAP) {
      // IAP mode: just call /api/v1/auth/me - IAP cookie handles auth
      getMeIAP()
        .then((userData) => {
          setUser(userData);
          setToken('iap'); // Placeholder - not used for API calls in IAP mode
        })
        .catch(() => {
          // Not authenticated - IAP will handle redirect
          setUser(null);
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      // Local mode: use stored JWT token
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        // Validate token before setting it - prevents flash of authenticated UI with invalid token
        getMe(storedToken)
          .then((userData) => {
            setToken(storedToken);
            setUser(userData);
          })
          .catch(() => {
            // Token invalid/expired - clear it
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setToken(null);
            setUser(null);
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // Don't render children until mounted (avoids hydration mismatch)
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser, formatTime }}>
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

