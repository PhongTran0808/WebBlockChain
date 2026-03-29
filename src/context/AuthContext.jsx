import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { parseJwt } from '../utils/jwtHelper';

const AuthContext = createContext(null);

function buildUser(payload) {
  if (!payload) return null;
  return {
    userId: payload.userId,
    role: payload.role,
    walletAddress: payload.walletAddress,
    fullName: payload.fullName || '',
    username: payload.username || '',
    province: payload.province || '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const payload = parseJwt(savedToken);
        if (payload && payload.exp * 1000 > Date.now()) {
          setToken(savedToken);
          setUser(buildUser(payload));
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (newToken) => {
    const payload = parseJwt(newToken);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(buildUser(payload));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ 
    user, 
    token, 
    login, 
    logout 
  }), [user, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
