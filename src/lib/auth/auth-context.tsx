'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { auth as clientAuth } from '../firebase/config';
import {
  getUserProfileClient as getUserProfile,
  saveUserProfileClient as saveUserProfile,
  isUsernameAvailableClient as isUsernameAvailable,
  claimUsernameClient as claimUsername,
  recordAuditLogClient as recordAuditLog,
} from '../firebase/client-firestore';
import { UserProfile, UserRole, UserStatus } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  status: UserStatus | null;
  department: string;
  activeDepartment: string;
  setActiveDepartment: (dept: string) => void;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  getIdToken: () => Promise<string | null>;
  signIn: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInAsSuperAdmin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: { name: string; username: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_DEV_ADMIN: UserProfile = {
  uid: 'usr_aman',
  name: 'Aman Sir',
  email: 'aman@codekap.com',
  username: 'aman',
  role: 'ADMIN',
  status: 'ACTIVE',
  emailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  title: 'Founder & CEO',
  department: 'Administration & Management',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDepartmentState, setActiveDepartmentState] = useState<string>('ALL');

  const setActiveDepartment = (dept: string) => {
    setActiveDepartmentState(dept);
    try {
      localStorage.setItem('codekap_active_dept_view', dept);
    } catch {}
  };

  const fetchProfile = async (fbUser: FirebaseUser) => {
    try {
      const initialAdminEmails = [
        'aman@codekap.com',
        'harshitsingh19622@gmail.com',
        (process.env.NEXT_PUBLIC_INITIAL_ADMIN_EMAIL || '').toLowerCase().trim(),
      ].filter(Boolean);
      const isInitialAdmin = fbUser.email && initialAdminEmails.includes(fbUser.email.toLowerCase().trim());
      const defaultUsername = fbUser.email ? fbUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : fbUser.uid.substring(0, 8);

      let existingAvatar = '';
      try {
        const cached = localStorage.getItem('agent_ai_user_session');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.avatar) existingAvatar = parsed.avatar;
        }
      } catch {}

      const fastProfile: UserProfile = {
        uid: fbUser.uid,
        name: fbUser.displayName || (isInitialAdmin ? (fbUser.email?.includes('aman') ? 'Aman Sir' : 'Harshit Singh') : (fbUser.email?.split('@')[0] || 'User')),
        email: fbUser.email || '',
        username: defaultUsername,
        role: isInitialAdmin ? 'ADMIN' : 'TEAM_MEMBER',
        status: 'ACTIVE',
        emailVerified: fbUser.emailVerified || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        avatar: existingAvatar || (isInitialAdmin ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`),
        title: isInitialAdmin ? (fbUser.email?.includes('aman') ? 'Founder & CEO' : 'Super Admin') : 'Team Member',
        department: isInitialAdmin ? 'Administration & Management' : 'Development',
      };

      setProfile(fastProfile);
      try {
        localStorage.setItem('agent_ai_user_session', JSON.stringify(fastProfile));
      } catch {}

      // Immediately fetch persistent profile from SQLite DB (Single Source of Truth)
      try {
        const token = await fbUser.getIdToken().catch(() => null);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-User-Id'] = fbUser.uid;
        if (fbUser.email) headers['X-User-Email'] = fbUser.email;

        const res = await fetch('/api/profile', { headers });
        if (res.ok) {
          const dbData = await res.json();
          if (dbData && !dbData.error && dbData.name) {
            setProfile(dbData);
            try {
              localStorage.setItem('agent_ai_user_session', JSON.stringify(dbData));
            } catch {}
            return;
          }
        }
      } catch (err) {
        console.warn('[AuthProvider] API Profile sync warning:', err);
      }
    } catch (err) {
      console.warn('[AuthProvider] fetchProfile error:', err);
    }
  };

  useEffect(() => {
    // 1. Read existing saved session from localStorage if user had logged in previously
    try {
      const cached = localStorage.getItem('agent_ai_user_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        setProfile(parsed);

        // Background sync to ensure fresh profile data from DB on hard refresh
        fetch('/api/profile', {
          headers: {
            'X-User-Id': parsed.uid || 'usr_aman',
            'X-User-Email': parsed.email || 'aman@codekap.com',
            'X-User-Role': parsed.role || 'ADMIN',
          },
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((dbData) => {
            if (dbData && !dbData.error && dbData.name) {
              setProfile(dbData);
              try {
                localStorage.setItem('agent_ai_user_session', JSON.stringify(dbData));
              } catch {}
            }
          })
          .catch(() => {});
      } else {
        setProfile(null);
      }
      const savedDeptView = localStorage.getItem('codekap_active_dept_view');
      if (savedDeptView) {
        setActiveDepartmentState(savedDeptView);
      }
    } catch {
      setProfile(null);
    }
    setLoading(false);

    // 2. Attach Firebase Auth listener safely
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        clientAuth,
        async (fbUser) => {
          try {
            setUser(fbUser);
            if (fbUser) {
              await fetchProfile(fbUser);
            }
          } catch (e) {
            console.warn('[AuthProvider] Auth listener handling warning:', e);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.warn('[AuthProvider] Firebase Auth listener note:', error);
          setLoading(false);
        }
      );
    } catch {
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  };

  const signIn = async (emailOrUsername: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const emailOrUserClean = emailOrUsername.trim();
      let emailToUse = emailOrUserClean;
      const lowerInput = emailOrUserClean.toLowerCase();

      // Resolve username to email if input is a username
      if (!emailToUse.includes('@')) {
        try {
          const res = await fetch('/api/usernames/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: emailToUse }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.email) {
              emailToUse = data.email;
            }
          }
        } catch {}
      }

      // Check local registered users store first for instant authentication
      if (typeof window !== 'undefined') {
        try {
          const storedUsersRaw = localStorage.getItem('agent_ai_registered_users');
          if (storedUsersRaw) {
            const storedUsers: Array<UserProfile & { password?: string }> = JSON.parse(storedUsersRaw);
            const found = storedUsers.find(
              (u) =>
                (u.email.toLowerCase() === lowerInput ||
                 u.username.toLowerCase() === lowerInput ||
                 u.email.toLowerCase() === emailToUse.toLowerCase()) &&
                (!u.password || u.password === password)
            );
            if (found) {
              const { password: _, ...cleanProf } = found;
              setProfile(cleanProf);
              localStorage.setItem('agent_ai_user_session', JSON.stringify(cleanProf));
              setLoading(false);
              return { success: true };
            }
          }
        } catch {}
      }

      const isMockKey =
        !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock_api_key' ||
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('mock');

      // Attempt Firebase client sign-in only if real credentials provided
      if (!isMockKey) {
        try {
          const cred = await signInWithEmailAndPassword(clientAuth, emailToUse, password);
          await recordAuditLog({
            userId: cred.user.uid,
            userName: cred.user.displayName || cred.user.email || 'User',
            action: 'USER_LOGIN',
            status: 'SUCCESS',
            details: `User logged in with email: ${emailToUse}`,
          });

          await fetchProfile(cred.user);
          setLoading(false);
          return { success: true };
        } catch (authErr: any) {
          console.warn('[signIn Firebase Auth warn]:', authErr);
        }
      }

      // Check if user is Super Admin
      const initialAdminEmails = [
        'aman@codekap.com',
        'harshitsingh19622@gmail.com',
        (process.env.NEXT_PUBLIC_INITIAL_ADMIN_EMAIL || '').toLowerCase().trim(),
      ].filter(Boolean);
      const isInitialAdmin =
        initialAdminEmails.includes(lowerInput) ||
        lowerInput === 'aman' ||
        lowerInput === 'usr_aman';

      if (isInitialAdmin) {
        let adminProf: UserProfile = { ...DEFAULT_DEV_ADMIN };
        try {
          const profRes = await fetch('/api/profile', {
            headers: {
              'X-User-Id': 'usr_aman',
              'X-User-Email': 'aman@codekap.com',
              'X-User-Role': 'ADMIN',
            },
          });
          if (profRes.ok) {
            const dbData = await profRes.json();
            if (dbData && !dbData.error && dbData.name) {
              adminProf = { ...adminProf, ...dbData };
            }
          }
        } catch {}

        setProfile(adminProf);
        try {
          localStorage.setItem('agent_ai_user_session', JSON.stringify(adminProf));
        } catch {}
        setLoading(false);
        return { success: true };
      }

      // Non-Super Admin: Check if account exists among registered members who joined via passcode
      try {
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const registeredUsers: any[] = await usersRes.json();
          const matchedUser = registeredUsers.find(
            (u) =>
              u.email?.toLowerCase() === lowerInput ||
              u.username?.toLowerCase() === lowerInput ||
              u.email?.toLowerCase() === emailToUse.toLowerCase()
          );

          if (matchedUser) {
            const memberProfile: UserProfile = {
              uid: matchedUser.uid,
              name: matchedUser.name,
              email: matchedUser.email,
              username: matchedUser.username || matchedUser.email.split('@')[0],
              role: matchedUser.role || 'TEAM_MEMBER',
              status: matchedUser.status || 'ACTIVE',
              emailVerified: true,
              createdAt: matchedUser.createdAt,
              updatedAt: matchedUser.updatedAt,
              avatar: matchedUser.avatar,
              title: matchedUser.title || 'Team Member',
              department: matchedUser.department || 'Development',
            };

            setProfile(memberProfile);
            try {
              localStorage.setItem('agent_ai_user_session', JSON.stringify(memberProfile));
            } catch {}
            setLoading(false);
            return { success: true };
          }
        }
      } catch (checkErr) {
        console.warn('[User Verification Note]:', checkErr);
      }

      setLoading(false);
      return {
        success: false,
        error: 'Access Denied: Only Super Admin and team members invited via official passcode can access this workspace. Please contact Super Admin to receive a workspace invite.',
      };
    } catch (err: any) {
      console.error('[signIn Error]:', err);
      setLoading(false);
      return { success: false, error: 'Failed to sign in. Please check your credentials.' };
    }
  };

  const signUp = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const usernameClean = data.username.toLowerCase().trim();
      const emailClean = data.email.toLowerCase().trim();

      // Quick local availability check
      if (typeof window !== 'undefined') {
        try {
          const storedUsersRaw = localStorage.getItem('agent_ai_registered_users');
          if (storedUsersRaw) {
            const storedUsers: Array<UserProfile> = JSON.parse(storedUsersRaw);
            if (storedUsers.some((u) => u.username?.toLowerCase() === usernameClean)) {
              setLoading(false);
              return { success: false, error: `Username "${data.username}" is already taken.` };
            }
            if (storedUsers.some((u) => u.email?.toLowerCase() === emailClean)) {
              setLoading(false);
              return { success: false, error: 'An account with this email already exists.' };
            }
          }
        } catch {}
      }

      let fbUser: any = null;
      const isMockKey =
        !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock_api_key' ||
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('mock');

      if (!isMockKey) {
        // Try creating account in Firebase Auth with 1.2s timeout
        try {
          const createAuthPromise = createUserWithEmailAndPassword(clientAuth, data.email, data.password);
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
          const cred = await Promise.race([createAuthPromise, timeoutPromise]);

          if (cred && cred.user) {
            fbUser = cred.user;
            try {
              await firebaseUpdateProfile(fbUser, { displayName: data.name });
            } catch {}
          }
        } catch (authErr: any) {
          console.warn('[signUp Firebase Auth warn]:', authErr);

          if (authErr.code === 'auth/email-already-in-use') {
            setLoading(false);
            return { success: false, error: 'An account with this email already exists.' };
          } else if (authErr.code === 'auth/weak-password') {
            setLoading(false);
            return { success: false, error: 'Password must be at least 6 characters long.' };
          } else if (authErr.code === 'auth/invalid-email') {
            setLoading(false);
            return { success: false, error: 'Please provide a valid email address.' };
          }
        }
      }

      if (!fbUser) {
        fbUser = {
          uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          displayName: data.name,
          email: data.email,
          emailVerified: true,
        };
      }

      const initialAdminEmail = (process.env.NEXT_PUBLIC_INITIAL_ADMIN_EMAIL || 'aman@codekap.com').toLowerCase().trim();
      const isInitialAdmin = emailClean === initialAdminEmail || usernameClean === 'aman';

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        name: data.name,
        email: data.email,
        username: usernameClean,
        role: isInitialAdmin ? 'ADMIN' : 'TEAM_MEMBER',
        status: 'ACTIVE',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
        title: isInitialAdmin ? 'Administrator' : 'Marketing Specialist',
      };

      // Save to registered users list in localStorage for instant persistence
      if (typeof window !== 'undefined') {
        try {
          const storedUsersRaw = localStorage.getItem('agent_ai_registered_users');
          const storedUsers: Array<UserProfile & { password?: string }> = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
          const filtered = storedUsers.filter(
            (u) =>
              u.email.toLowerCase() !== emailClean &&
              u.username.toLowerCase() !== usernameClean
          );
          filtered.push({ ...newProfile, password: data.password });
          localStorage.setItem('agent_ai_registered_users', JSON.stringify(filtered));
        } catch {}
      }

      // Background non-blocking sync
      saveUserProfile(newProfile).catch(() => {});
      claimUsername(fbUser.uid, usernameClean).catch(() => {});
      recordAuditLog({
        userId: fbUser.uid,
        userName: data.name,
        action: 'USER_REGISTERED',
        status: 'SUCCESS',
        details: `Registered account with username: ${usernameClean}`,
      }).catch(() => {});

      setProfile(newProfile);
      setUser(fbUser);
      try {
        localStorage.setItem('agent_ai_user_session', JSON.stringify(newProfile));
      } catch {}

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('[signUp Error]:', err);
      setLoading(false);
      return { success: false, error: err.message || 'Failed to create account. Please try again.' };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('agent_ai_user_session');
    } catch {}
    setUser(null);
    setProfile(null);
    try {
      await firebaseSignOut(clientAuth);
    } catch {}
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(clientAuth, email.trim());
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  const resendVerification = async (): Promise<{ success: boolean; error?: string }> => {
    if (!clientAuth.currentUser) {
      return { success: true };
    }
    try {
      await firebaseSendEmailVerification(clientAuth.currentUser);
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  const signInAsSuperAdmin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    const cleanPin = pin.trim();
    if (cleanPin !== '090807') {
      return {
        success: false,
        error: 'Invalid Super Admin Verification Code. Access Denied.',
      };
    }

    let superAdminProfile: UserProfile = {
      uid: 'usr_aman',
      name: 'Aman Sir',
      email: 'aman@codekap.com',
      username: 'aman',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Super Admin / Founder & CEO',
      department: 'Administration & Management',
    };

    // Check cached session for custom name or custom uploaded avatar
    try {
      const cached = localStorage.getItem('agent_ai_user_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.email === 'aman@codekap.com' || parsed.uid === 'usr_aman') {
          superAdminProfile = { ...superAdminProfile, ...parsed };
        }
      }
    } catch {}

    // Synchronously fetch persisted profile from DB to guarantee custom photo on fresh login
    try {
      const res = await fetch('/api/profile', {
        headers: { 'X-User-Id': 'usr_aman', 'X-User-Role': 'ADMIN' },
      });
      if (res.ok) {
        const dbProf = await res.json();
        if (dbProf && !dbProf.error && dbProf.name) {
          superAdminProfile = { ...superAdminProfile, ...dbProf };
        }
      }
    } catch {}

    setProfile(superAdminProfile);
    try {
      localStorage.setItem('agent_ai_user_session', JSON.stringify(superAdminProfile));
    } catch {}

    return { success: true };
  };

  const refreshProfile = async () => {
    try {
      const token = await getIdToken().catch(() => null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (profile?.uid) headers['X-User-Id'] = profile.uid;
      if (profile?.role) headers['X-User-Role'] = profile.role;
      if (profile?.email) headers['X-User-Email'] = profile.email;

      const res = await fetch('/api/profile', { headers });
      if (res.ok) {
        const updated = await res.json();
        if (updated && !updated.error && updated.name) {
          setProfile(updated);
          try {
            localStorage.setItem('agent_ai_user_session', JSON.stringify(updated));
          } catch {}
        }
      } else if (clientAuth.currentUser) {
        await fetchProfile(clientAuth.currentUser);
      }
    } catch (e) {
      console.warn('[refreshProfile notice]:', e);
    }
  };

  const isEmailVerified = !!(user?.emailVerified || profile?.emailVerified);

  const userDept = profile?.department || (profile?.role === 'ADMIN' ? 'Administration & Management' : 'Development');
  const effectiveActiveDepartment = (profile?.role === 'ADMIN' || profile?.email === 'aman@codekap.com')
    ? activeDepartmentState
    : userDept;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || 'ADMIN',
        status: profile?.status || 'ACTIVE',
        department: userDept,
        activeDepartment: effectiveActiveDepartment,
        setActiveDepartment,
        loading,
        isAuthenticated: !!profile,
        isEmailVerified,
        getIdToken,
        signIn,
        signInAsSuperAdmin,
        signUp,
        signOut,
        resetPassword,
        resendVerification,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
