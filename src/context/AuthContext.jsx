import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  changePassword as changePasswordRequest,
  getMe,
  login as loginRequest,
  register as registerRequest,
  updateMe,
} from '../api/auth.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'senafood-token';
const USER_KEY = 'senafood-user';

const loadStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState(() => loadStoredUser());
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(USER_KEY);
      }
      return;
    }

    let isActive = true;
    setIsLoading(true);
    getMe(token)
      .then((data) => {
        if (!isActive) return;
        setUser(data);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(USER_KEY, JSON.stringify(data));
        }
      })
      .catch(() => {
        if (!isActive) return;
        setToken(null);
        setUser(null);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(TOKEN_KEY);
          window.localStorage.removeItem(USER_KEY);
        }
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    const nextToken = data.access_token;
    setToken(nextToken);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, nextToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  };

  const register = async (payload) => {
    await registerRequest(payload);
    return login(payload.email, payload.password);
  };

  const updateProfile = async (payload) => {
    if (!token) {
      throw new Error('Debes iniciar sesión.');
    }
    const updated = await updateMe(token, payload);
    setUser(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
    return updated;
  };

  const changePassword = async (payload) => {
    if (!token) {
      throw new Error('Debes iniciar sesión.');
    }
    return changePasswordRequest(token, payload);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      register,
      updateProfile,
      changePassword,
      logout,
    }),
    [token, user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
