import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user session on application mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('medpulse_token');
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          if (res.success) {
            setUser(res.user);
          } else {
            localStorage.removeItem('medpulse_token');
          }
        } catch (error) {
          console.error('[Session Restore Error]', error.message);
          localStorage.removeItem('medpulse_token');
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // Handle Login
  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.success) {
        localStorage.setItem('medpulse_token', res.token);
        setUser(res.user);
        return res.user;
      }
    } catch (error) {
      throw error;
    }
  };

  // Handle Register
  const register = async (userData) => {
    try {
      const res = await api.post('/api/auth/register', userData);
      if (res.success) {
        localStorage.setItem('medpulse_token', res.token);
        setUser(res.user);
        return res.user;
      }
    } catch (error) {
      throw error;
    }
  };

  // Handle Logout
  const logout = () => {
    localStorage.removeItem('medpulse_token');
    setUser(null);
  };

  // Interactive Live Upgrade
  const upgradePlan = async (newPlan) => {
    if (!user) return;
    try {
      const res = await api.put(`/api/users/${user._id}/subscription`, { plan: newPlan });
      if (res.success) {
        setUser(prev => ({
          ...prev,
          subscriptionPlan: newPlan
        }));
        return res;
      }
    } catch (error) {
      console.error('[Upgrade Error]', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, upgradePlan, setUser }}>
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
