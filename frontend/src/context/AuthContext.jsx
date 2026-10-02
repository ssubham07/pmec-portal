import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pmec_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pmec_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        if (res.data) {
          setUser(res.data);
          localStorage.setItem('pmec_user', JSON.stringify(res.data));
        }
      })
      .catch((err) => {
        // Clear token only if server explicitly rejected auth (401)
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('pmec_token');
          localStorage.removeItem('pmec_user');
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData) {
    localStorage.setItem('pmec_token', token);
    localStorage.setItem('pmec_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('pmec_token');
    localStorage.removeItem('pmec_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
