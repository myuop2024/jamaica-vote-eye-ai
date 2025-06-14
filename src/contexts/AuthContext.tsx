
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('crm_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Demo login logic - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let mockUser: User;
    if (email === 'admin@jamaicavote.gov' && password === 'admin123') {
      mockUser = {
        id: '1',
        email: 'admin@jamaicavote.gov',
        name: 'Electoral Admin',
        role: 'admin',
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
    } else if (email === 'observer@jamaicavote.gov' && password === 'observer123') {
      mockUser = {
        id: '2',
        email: 'observer@jamaicavote.gov',
        name: 'Field Observer',
        role: 'observer',
        verificationStatus: 'verified',
        assignedStation: 'Kingston Central - Station 15A',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
    } else {
      throw new Error('Invalid credentials');
    }
    
    setUser(mockUser);
    localStorage.setItem('crm_user', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
