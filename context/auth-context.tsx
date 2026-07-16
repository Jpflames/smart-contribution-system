'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isCloudMode, auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDocumentById, setDocument, seedLocalStorage } from '@/hooks/use-firestore';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateProfileState: (updated: Partial<UserProfile>) => void;
  simulateRoleChange: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    seedLocalStorage();

    if (isCloudMode && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const profile = await getDocumentById('users', fbUser.uid);
            if (profile) {
              setUser(profile as UserProfile);
            } else {
              // If Firebase Auth exists but profile doesn't, create basic one
              const newProfile: UserProfile = {
                uid: fbUser.uid,
                email: fbUser.email || '',
                role: 'member',
                name: fbUser.displayName || 'New Member',
                phone: fbUser.phoneNumber || '',
                status: 'pending',
                kycStatus: 'pending',
                coopId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await setDocument('users', fbUser.uid, newProfile);
              setUser(newProfile);
            }
          } catch (err) {
            console.error('Error fetching user profile:', err);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Local Simulation Mode: load from local storage session
      const fetchSession = async () => {
        const storedUser = localStorage.getItem('coopsync_session');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          // Fetch freshest copy from local storage db
          const fresh = await getDocumentById('users', parsed.uid);
          setUser(fresh as UserProfile || parsed);
        } else {
          setUser(null);
        }
        setLoading(false);
      };
      
      fetchSession();
      
      const handleStorageUpdate = () => {
        const storedUser = localStorage.getItem('coopsync_session');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      };

      window.addEventListener('coopsync_session_changed', handleStorageUpdate);
      return () => window.removeEventListener('coopsync_session_changed', handleStorageUpdate);
    }
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      if (isCloudMode && auth) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getDocumentById('users', credential.user.uid);
        if (!profile) throw new Error('User profile record not found');
        setUser(profile as UserProfile);
        return profile as UserProfile;
      } else {
        // Simulation Mode login
        // Find seeded user matching email
        const storedUsers = localStorage.getItem('coopsync_db_users');
        const dbUsers: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
        const matched = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!matched) {
          throw new Error('Invalid email or password. Hint: Try admin@coopsync.com, coop@coopsync.com, treasurer@coopsync.com, or member1@coopsync.com with any password.');
        }

        if (matched.status === 'suspended') {
          throw new Error('This account has been suspended. Please contact your cooperative administrator.');
        }

        localStorage.setItem('coopsync_session', JSON.stringify(matched));
        setUser(matched);
        window.dispatchEvent(new Event('coopsync_session_changed'));
        return matched;
      }
    } catch (err: any) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isCloudMode && auth) {
        await signOut(auth);
      } else {
        localStorage.removeItem('coopsync_session');
        setUser(null);
        window.dispatchEvent(new Event('coopsync_session_changed'));
      }
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileState = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
    if (!isCloudMode) {
      localStorage.setItem('coopsync_session', JSON.stringify(newProfile));
      window.dispatchEvent(new Event('coopsync_session_changed'));
    }
  };

  // Convenience function for testing: quickly jump roles
  const simulateRoleChange = (role: UserRole) => {
    if (isCloudMode) return;
    const storedUsers = localStorage.getItem('coopsync_db_users');
    const dbUsers: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
    const matched = dbUsers.find(u => u.role === role);
    if (matched) {
      localStorage.setItem('coopsync_session', JSON.stringify(matched));
      setUser(matched);
      window.dispatchEvent(new Event('coopsync_session_changed'));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfileState, simulateRoleChange }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
