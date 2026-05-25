/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load active session
  // REPLACE your loadSession and useEffect in AuthContext.tsx with this:

  const loadSession = async () => {
    try {
      setLoading(true);
      if (!isSupabaseConfigured || !supabase) {
        setUser(null);
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (session?.user) {
        // FIX: Use a specific "getProfile" by ID instead of "getProfiles" (all)
        // If your databaseService doesn't have getProfileById, use the logic below:
        const { data: profile, error: profileError } = await supabase
          .from('profiles') // or whatever your table name is
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          const parts = (profile.full_name || '').split(' ');

          const mappedProfile: UserProfile = {
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

          setUser(mappedProfile);
        } else {
          // Fallback: create profile if it doesn't exist
          const parts = session.user.email?.split('@') || ['nurse'];
          const newProfile = await databaseService.updateProfile(session.user.id, {
            id: session.user.id,
            email: session.user.email || '',
            username: parts[0] + Math.floor(Math.random() * 1000),
            first_name: 'New',
            last_name: 'Member',
            role: 'nurse',
            specialties: [],
            skills: [],
            availability_status: 'available',
            verification_status: 'unverified',
            profile_theme: 'modern',
            views_count: 0,
            downloads_count: 0,
            search_appearances: 0,
            onboarding_completed: false
          });
          setUser(newProfile);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth Initialization Error:', err);
      setUser(null);
    } finally {
      setLoading(false); // This ensures the loader stops even if there's an error
    }
  };

  useEffect(() => {
    // Run once on mount
    loadSession();

    // Listen for auth changes (sign in / sign out)
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          loadSession(); // Re-run profile fetch on login
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured.');
      }
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('No user returned from sign-in');

      const profiles = await databaseService.getProfiles();
      const p = profiles.find(x => x.email === email);
      if (p) {
        setUser(p);
        return p;
      } else {
        throw new Error('Associated profile not found');
      }
    } finally {
      setLoading(false);
    }
  };

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
          data: { username, first_name: firstName, last_name: lastName }
        }
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
        onboarding_completed: false
      };

      const created = await databaseService.updateProfile(data.user.id, newProfile);
      setUser(created);
      return created;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase!.auth.signOut();
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (user && isSupabaseConfigured) {
      const profiles = await databaseService.getProfiles();
      const updated = profiles.find(p => p.id === user.id);
      if (updated) {
        setUser(updated);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
