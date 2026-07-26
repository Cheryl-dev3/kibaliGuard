import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('kibaliUser');
    const storedToken = localStorage.getItem('kibaliToken');
    const storedDark = localStorage.getItem('kibaliDarkMode');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    if (storedDark) {
      setDarkMode(storedDark === 'true');
    }
    setLoading(false);
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('kibaliUser', JSON.stringify(userData));
    localStorage.setItem('kibaliToken', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kibaliUser');
    localStorage.removeItem('kibaliToken');
  };

  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('kibaliDarkMode', next.toString());
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, darkMode, toggleDark }}>
      {children}
    </AuthContext.Provider>
  );
};
