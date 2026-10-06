/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { databaseService } from '../services/databaseService';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (
    email: string,
    password: string,
    username: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (id: string, updates: any) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ------------------------------------------------------------------
// Auth cache — hydrated synchronously on mount so the loader never
// flashes on reload / tab-return for an already-logged-in user.
// ------------------------------------------------------------------
const AUTH_CACHE_KEY = 'auth_user_cache_v1';

interface CachedUser {
  user: UserProfile;
  cachedAt: number;
}

function readAuthCache(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedUser = JSON.parse(raw);
    if (!parsed || !parsed.user || !parsed.user.id) return null;
    return parsed.user;
  } catch {
    return null;
  }
}

function writeAuthCache(user: UserProfile | null) {
  try {
    if (user) {
      const payload: CachedUser = { user, cachedAt: Date.now() };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(payload));
    } else {
      localStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch {
    /* quota exceeded — ignore */
  }
}

// Helper: map raw Supabase profile row → UserProfile
function mapProfile(profile: any): UserProfile {
  const parts = (profile.full_name || '').split(' ');
  return {
    ...profile,
    first_name: profile.first_name || parts[0] || '',
    last_name: profile.last_name || parts.slice(1).join(' ') || '',
    profile_picture: profile.avatar_url || '',
    cover_photo: profile.cover_url || '',
    years_of_experience: profile.years_experience || 0,
    specialties: profile.specialty
      ? profile.specialty.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [],
    skills: [],
    verification_status: profile.verified ? 'verified' : 'unverified',
    profile_theme: profile.profile_theme || profile.theme || 'modern',
    views_count: profile.views_count || 0,
    downloads_count: profile.downloads_count || 0,
    search_appearances: profile.search_appearances || 0,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ------------------------------------------------------------------
  // INITIAL STATE — read cache synchronously.
  // If a cached user exists, `loading` starts as `false` and the app
  // renders the dashboard immediately. The network revalidation runs
  // silently in the background.
  // ------------------------------------------------------------------
  const initialCache = (() => {
    try {
      return readAuthCache();
    } catch {
      return null;
    }
  })();

  const [user, setUser] = useState<UserProfile | null>(initialCache);
  const [loading, setLoading] = useState<boolean>(initialCache === null);

  // Guards against concurrent loadSession calls (React 18 StrictMode double-invoke,
  // onAuthStateChange firing during initial load, etc.)
  const isBootstrapping = useRef(false);
  const hasBootstrapped = useRef(false);

  // Keep cache in sync whenever user changes
  useEffect(() => {
    writeAuthCache(user);
  }, [user]);

  // ------------------------------------------------------------------
  // Background revalidation.
  // silent = true means: do NOT flip `loading` to true if we already
  // have a user. This is what stops the loader from flashing on every
  // reload / tab return for logged-in users.
  // ------------------------------------------------------------------
  const loadSession = async (opts: { silent?: boolean } = {}) => {
    const silent = opts.silent === true || user !== null;

    try {
      if (!silent) setLoading(true);

      if (!isSupabaseConfigured || !supabase) {
        setUser(null);
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.user) {
        // No active session — clear everything.
        setUser(null);
        writeAuthCache(null);
        return;
      }

      // ------------------------------------------------------------------
      // Fast path: we have a cached user for this same Supabase session.
      // Skip the DB roundtrip entirely. This is the key egress saver.
      // ------------------------------------------------------------------
      const cached = readAuthCache();
      if (cached && cached.id === session.user.id) {
        if (!silent) setUser(cached); // only if we had nothing before
        // otherwise keep the in-memory user (identical)
        return;
      }

      // ------------------------------------------------------------------
      // Slow path: we don't have a cached user for this session.
      // Fetch the profile once.
      // ------------------------------------------------------------------
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUser(mapProfile(profile));
        return;
      }

      // No profile row exists yet — handle Google vs. manual signup.
      const isGoogle = session.user.app_metadata?.provider === 'google';

      if (isGoogle) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          onboarding_completed: false,
          role: 'nurse',
        } as UserProfile);
      } else {
        const parts = session.user.email?.split('@') || ['nurse'];
        const newProfile = await databaseService.updateProfile(session.user.id, {
          id: session.user.id,
          email: session.user.email || '',
          username: parts[0] + Math.floor(Math.random() * 1000),
          role: 'nurse',
          onboarding_completed: false,
        });
        setUser(newProfile);
      }
    } catch (err) {
      console.error('Auth Initialization Error:', err);
      // Only nuke the user if we had nothing to begin with.
      if (!user) setUser(null);
    } finally {
      // If we started with a cached user, `loading` was already false.
      // Only flip it off here — never flip it on spuriously.
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Boot — run once on mount.
  // If we have a cached user, this is a silent background refresh.
  // If not, this is the normal "loading" flow.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (isBootstrapping.current) return;
    isBootstrapping.current = true;

    // First boot ever (no cached user) → show loader.
    // Returning user (cached) → silent background revalidate.
    if (!hasBootstrapped.current) {
      hasBootstrapped.current = true;
      loadSession({ silent: initialCache !== null });
    }

    let subscription: { unsubscribe: () => void } | undefined;

    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Skip redundant re-fetch if the identity is unchanged.
          // This prevents egress burn on TOKEN_REFRESHED / tab focus.
          if (user?.id === session.user.id) return;
          await loadSession({ silent: true });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          writeAuthCache(null);
          setLoading(false);
        }
        // Ignore: TOKEN_REFRESHED, INITIAL_SESSION, USER_UPDATED, etc.
      });
      subscription = data.subscription;
    }

    return () => {
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Login
  // ------------------------------------------------------------------
  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured.');
      }
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('No user returned from sign-in');

      // Fetch only this user's profile (was: getProfiles() — full table scan!)
      const { data: profile } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profile) throw new Error('Associated profile not found');

      const mapped = mapProfile(profile);
      setUser(mapped);
      writeAuthCache(mapped);
      return mapped;
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Register
  // ------------------------------------------------------------------
  const register = async (
    email: string,
    password: string,
    username: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured.');
      }

      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: { username, first_name: firstName, last_name: lastName },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Signup failed');

      const newProfile: UserProfile = {
        id: data.user.id,
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        specialties: [],
        skills: [],
        availability_status: 'available',
        verification_status: 'unverified',
        profile_theme: 'modern',
        created_at: new Date().toISOString(),
        views_count: 0,
        downloads_count: 0,
        search_appearances: 0,
        onboarding_completed: false,
      };

      const created = await databaseService.updateProfile(data.user.id, newProfile);
      setUser(created);
      writeAuthCache(created);
      return created;
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------------
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase!.auth.signOut();
      }
      setUser(null);
      writeAuthCache(null);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Google OAuth
  // ------------------------------------------------------------------
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase not configured');

      const { error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/register',
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error('Google Auth Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Update profile
  // ------------------------------------------------------------------
  const updateProfile = async (id: string, updates: any): Promise<UserProfile> => {
    try {
      const updated = await databaseService.updateProfile(id, updates);
      setUser(updated);
      writeAuthCache(updated);
      return updated;
    } catch (err) {
      console.error('Update Profile Error:', err);
      throw err;
    }
  };

  // ------------------------------------------------------------------
  // Refresh user — used after editing profile elsewhere
  // ------------------------------------------------------------------
  const refreshUser = async () => {
    if (!user || !isSupabaseConfigured) return;
    const { data: updated } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (updated) {
      const mapped = mapProfile(updated);
      setUser(mapped);
      writeAuthCache(mapped);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        signInWithGoogle,
        updateProfile,
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