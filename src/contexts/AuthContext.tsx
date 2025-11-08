import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, User, LoginRequest } from '../types';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on app load
    const storedToken = authService.getStoredToken();
    const storedUser = authService.getStoredUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);
      const { token: newToken, user: newUser } = response;
      
      setToken(newToken);
      setUser(newUser);
      authService.setStoredAuth(newToken, newUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    authService.logout();
  };

  const updateUser = async () => {
    try {
      const profileResponse = await authService.getProfile();
      const updatedUser = profileResponse.user;
      setUser(updatedUser);
      authService.setStoredAuth(token!, updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const hasRole = (roleName: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(roleName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user || !user.roles) return false;
    return roleNames.some(role => user.roles?.includes(role));
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
    isLoading,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
