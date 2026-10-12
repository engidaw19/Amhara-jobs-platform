import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('ajp_token');
    const storedUser = localStorage.getItem('ajp_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('ajp_token');
        localStorage.removeItem('ajp_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, jwt) => {
    setToken(jwt);
    setUser(userData);
    localStorage.setItem('ajp_token', jwt);
    localStorage.setItem('ajp_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ajp_token');
    localStorage.removeItem('ajp_user');
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('ajp_user', JSON.stringify(merged));
  };

  const role = user?.role || '';
  const isAdmin = role === 'super_admin' || role === 'regional_admin';
  const isBureau = role === 'bureau_admin' || role === 'bureau_staff';
  const isSeeker = role === 'job_seeker';
  const isStaff = isAdmin || isBureau;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAdmin, isBureau, isSeeker, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
