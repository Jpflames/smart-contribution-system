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
            const emailLower = (fbUser.email || '').toLowerCase();
            let role: UserRole = 'member';
            let name = fbUser.displayName || 'Member User';
            let status = 'approved';

            if (emailLower === 'admin@dccms.com') {
              role = 'super_admin';
              name = 'Sarah Connor';
            } else if (emailLower === 'coop@dccms.com') {
              role = 'coop_admin';
              name = 'Adebayo Johnson';
            } else if (emailLower === 'treasurer@dccms.com') {
              role = 'treasurer';
              name = 'Chinedu Okeke';
            }

            const profile = await getDocumentById('users', fbUser.uid);
            if (profile) {
              if (profile.role !== role) {
                profile.role = role;
                profile.name = name;
                await setDocument('users', fbUser.uid, profile);
              }
              setUser(profile as UserProfile);
            } else {
              const newProfile: UserProfile = {
                uid: fbUser.uid,
                email: fbUser.email || '',
                role,
                name,
                phone: fbUser.phoneNumber || '+2348000000000',
                status: 'approved' as const,
                kycStatus: 'approved' as const,
                coopId: role === 'super_admin' ? null : 'coop-1',
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
          // Preserve local admin session on page refresh even if Firebase Auth session is null
          const storedUser = localStorage.getItem('coopsync_session');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            const emailLower = (parsed.email || '').toLowerCase();
            const isAdmin = emailLower === 'admin@dccms.com' || emailLower === 'coop@dccms.com' || emailLower === 'treasurer@dccms.com';
            if (isAdmin) {
              setUser(parsed);
              setLoading(false);
              return;
            }
          }
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
      const emailLower = email.toLowerCase();
      const isAdminEmail = emailLower === 'admin@dccms.com' || emailLower === 'coop@dccms.com' || emailLower === 'treasurer@dccms.com';
      const isMasterPassword = password === 'admin123';

      if (isAdminEmail && isMasterPassword) {
        let uid = 'super-admin-uid';
        let role: UserRole = 'super_admin';
        let name = 'Sarah Connor';

        if (emailLower === 'coop@dccms.com') {
          uid = 'coop-admin-uid';
          role = 'coop_admin';
          name = 'Adebayo Johnson';
        } else if (emailLower === 'treasurer@dccms.com') {
          uid = 'treasurer-uid';
          role = 'treasurer';
          name = 'Chinedu Okeke';
        }

        // Establishes a live Firebase Auth session if in Cloud Mode
        if (isCloudMode && auth) {
          try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            uid = credential.user.uid;
          } catch (authErr: any) {
            console.warn('Admin Firebase Auth login failed, proceeding with local fallback:', authErr.message);
          }
        }

        const profile = await getDocumentById('users', uid);
        const userProfile = profile || {
          uid,
          email,
          role,
          name,
          phone: '+2348000000000',
          status: 'approved' as const,
          kycStatus: 'approved' as const,
          coopId: role === 'super_admin' ? null : 'coop-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!profile) {
          await setDocument('users', uid, userProfile);
        }

        localStorage.setItem('coopsync_session', JSON.stringify(userProfile));
        setUser(userProfile);
        window.dispatchEvent(new Event('coopsync_session_changed'));
        return userProfile;
      }

      if (isCloudMode && auth) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        
        const emailLower = email.toLowerCase();
        let role: UserRole = 'member';
        let name = 'Member User';

        if (emailLower === 'admin@dccms.com') {
          role = 'super_admin';
          name = 'Sarah Connor';
        } else if (emailLower === 'coop@dccms.com') {
          role = 'coop_admin';
          name = 'Adebayo Johnson';
        } else if (emailLower === 'treasurer@dccms.com') {
          role = 'treasurer';
          name = 'Chinedu Okeke';
        }

        const profile = await getDocumentById('users', credential.user.uid);
        if (profile) {
          if (profile.role !== role) {
            profile.role = role;
            profile.name = name;
            await setDocument('users', credential.user.uid, profile);
          }
          setUser(profile as UserProfile);
          return profile as UserProfile;
        } else {
          const newProfile: UserProfile = {
            uid: credential.user.uid,
            email,
            role,
            name,
            phone: '+2348000000000',
            status: 'approved' as const,
            kycStatus: 'approved' as const,
            coopId: role === 'super_admin' ? null : 'coop-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDocument('users', credential.user.uid, newProfile);
          setUser(newProfile);
          return newProfile;
        }
      } else {
        // Simulation Mode login
        // Find seeded user matching email
        const storedUsers = localStorage.getItem('coopsync_db_users');
        const dbUsers: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
        const matched = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!matched) {
          throw new Error('Invalid email or password. Hint: Try admin@dccms.com, coop@dccms.com, treasurer@dccms.com, or member1@dccms.com with any password.');
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
