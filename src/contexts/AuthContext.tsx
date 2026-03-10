import React, { useEffect, useState, createContext, useContext } from 'react';
import { User } from '../types';
import { dbUsers, initDb } from '../lib/mockDb';
interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (email: string, name: string) => Promise<void>;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    initDb();
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      const foundUser = dbUsers.getById(storedUserId);
      if (foundUser) {
        setUser(foundUser);
      } else {
        localStorage.removeItem('currentUserId');
      }
    }
    setLoading(false);
  }, []);
  const loginWithGoogle = async (email: string, name: string) => {
    setLoading(true);
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      let existingUser = dbUsers.getByEmail(email);
      if (!existingUser) {
        // First time login, create as 'user' role unless it's the super admin email
        // (which should already be created by initDb, but just in case)
        const role =
        email === 'ravishkapravinsika99@gmail.com' ? 'super-admin' : 'user';
        existingUser = dbUsers.create({
          email,
          name,
          role,
          assignedStores: []
        });
      }
      setUser(existingUser);
      localStorage.setItem('currentUserId', existingUser.uid);
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUserId');
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        logout
      }}>

      {children}
    </AuthContext.Provider>);

};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};