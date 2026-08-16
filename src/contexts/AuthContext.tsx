import React, { useEffect, useState, createContext, useContext } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { dbUsers, seedInitialData, SUPER_ADMIN_EMAIL } from '../lib/db';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithMockCredentials: (email: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile with Firebase Realtime Database
  const syncUserProfile = async (fbUser: {
    uid: string;
    email: string | null;
    displayName?: string | null;
  }): Promise<User> => {
    const userEmail = (fbUser.email || '').toLowerCase().trim();
    const isSuperAdminEmail = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();

    // Check existing in DB
    const existingDbUser = await dbUsers.getById(fbUser.uid);

    let finalRole: Role = 'user';
    if (isSuperAdminEmail) {
      finalRole = 'super-admin';
    } else if (existingDbUser?.role) {
      finalRole = existingDbUser.role;
    }

    const userData: User = {
      uid: fbUser.uid,
      email: fbUser.email || 'no-email@storesync.io',
      name: fbUser.displayName || existingDbUser?.name || userEmail.split('@')[0] || 'Store User',
      role: finalRole,
      createdAt: existingDbUser?.createdAt || Date.now(),
      assignedStores: existingDbUser?.assignedStores || []
    };

    const savedUser = await dbUsers.saveUser(userData);
    setUser(savedUser);
    localStorage.setItem('storesync_currentUserId', savedUser.uid);
    return savedUser;
  };

  useEffect(() => {
    // Seed initial data if DB is empty
    seedInitialData();

    // Subscribe to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          await syncUserProfile(fbUser);
        } catch (err) {
          console.error('Error syncing user profile on auth change:', err);
        }
      } else {
        // Check for local session
        const storedUid = localStorage.getItem('storesync_currentUserId');
        if (storedUid) {
          const localUser = await dbUsers.getById(storedUid);
          if (localUser) {
            setUser(localUser);
          } else {
            setUser(null);
            localStorage.removeItem('storesync_currentUserId');
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // 1. Google Sign-In
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
    } catch (err: any) {
      console.warn('Firebase Popup sign-in error or cancelled:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 2. Email & Password Login
  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserProfile(result.user);
    } catch (err: any) {
      console.warn('Email login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. Email & Password Register
  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await updateProfile(result.user, { displayName: name });
      }
      await syncUserProfile({
        uid: result.user.uid,
        email: result.user.email,
        displayName: name
      });
    } catch (err: any) {
      console.warn('Email register error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. Quick Mock Login (for offline or instant test accounts)
  const loginWithMockCredentials = async (email: string, name: string) => {
    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const mockUid = `user-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`;
      await syncUserProfile({
        uid: mockUid,
        email: cleanEmail,
        displayName: name
      });
    } finally {
      setLoading(false);
    }
  };

  // 5. Logout
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('SignOut error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('storesync_currentUserId');
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginWithMockCredentials,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};