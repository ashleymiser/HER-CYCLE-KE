 import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hercycle_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('hercycle_token') || null);

  // If token and user exist in storage, initialize as non-blocking
  const [loading, setLoading] = useState(() => {
    const hasToken = localStorage.getItem('hercycle_token');
    const hasUser = localStorage.getItem('hercycle_user');
    return !(hasToken && hasUser);
  });

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hercycle_user');
    localStorage.removeItem('hercycle_token');
    localStorage.removeItem('hercycle_last_assessment');
  }, []);

  // Background verification on app mount
  useEffect(() => {
    let isMounted = true;

    async function verifyAndSyncSession() {
      const activeToken = localStorage.getItem('hercycle_token');
      if (!activeToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        if (isMounted && data && data.user) {
          const syncedUser = {
            ...data.user,
            latestAssessment: data.latestAssessment || null,
          };
          setUser(syncedUser);
          localStorage.setItem('hercycle_user', JSON.stringify(syncedUser));
        }
      } catch (err) {
        console.warn('Session background sync notice:', err.message);
        if (
          err.message?.includes('401') ||
          err.message?.includes('403') ||
          err.message?.includes('unauthorized')
        ) {
          if (isMounted) logout();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifyAndSyncSession();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  const saveAuth = useCallback((newUser, newToken, latestAssessment = null) => {
    const fullUser = {
      ...newUser,
      latestAssessment: latestAssessment || newUser?.latestAssessment || null,
    };

    setUser(fullUser);
    setToken(newToken);

    if (fullUser) {
      localStorage.setItem('hercycle_user', JSON.stringify(fullUser));
    }
    if (newToken) {
      localStorage.setItem('hercycle_token', newToken);
    }
    if (latestAssessment) {
      localStorage.setItem('hercycle_last_assessment', JSON.stringify(latestAssessment));
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      saveAuth,
      logout,
      isAuthenticated: Boolean(token && user),
    }),
    [user, token, loading, saveAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};