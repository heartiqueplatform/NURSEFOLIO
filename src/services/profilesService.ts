import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, VerificationStatus } from '../types';

/**
 * Validate username formats to avoid constraint violations.
 */
export function sanitizeUsername(username: string): string {
  return username
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_.-]/g, '') || `user_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Clean incoming profile updates of illegal null/undefined values for columns with NOT NULL constraints.
 */
export function sanitizeProfileInput(updates: Partial<UserProfile>): any {
  const dbUpdates: any = {};

  if (updates.username !== undefined) {
    dbUpdates.username = sanitizeUsername(updates.username);
  }
  if (updates.email !== undefined) {
    dbUpdates.email = updates.email.trim();
  }

  // Combine names cleanly
  if (updates.first_name !== undefined || updates.last_name !== undefined) {
    const fName = (updates.first_name || '').trim();
    const lName = (updates.last_name || '').trim();
    dbUpdates.full_name = `${fName} ${lName}`.trim() || 'Healthcare Professional';
  }

  if (updates.bio !== undefined) dbUpdates.bio = updates.bio || '';
  // FIXED: Mapping these to match your DB columns exactly
  if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url || '';
  if (updates.cover_url !== undefined) dbUpdates.cover_url = updates.cover_url || '';

  if (updates.qualification !== undefined) dbUpdates.qualification = updates.qualification || '';
  if (updates.nursing_level !== undefined) dbUpdates.nursing_level = updates.nursing_level || '';
  if (updates.location !== undefined) dbUpdates.location = updates.location || '';
  if (updates.years_of_experience !== undefined) dbUpdates.years_experience = Math.max(0, Number(updates.years_of_experience) || 0);
  if (updates.availability_status !== undefined) dbUpdates.availability_status = updates.availability_status || 'available';
  if (updates.profile_theme !== undefined) dbUpdates.theme = updates.profile_theme || 'modern';
  if (updates.verification_status !== undefined) dbUpdates.verified = updates.verification_status === 'verified';
  if (updates.role !== undefined) dbUpdates.role = updates.role || 'nurse';
  if (updates.specialties !== undefined) dbUpdates.specialty = (updates.specialties || []).join(', ');
  if (updates.onboarding_completed !== undefined) dbUpdates.onboarding_completed = updates.onboarding_completed;

  return dbUpdates;
}

export const profilesService = {
  async getProfiles(): Promise<UserProfile[]> {
    try {
      if (!isSupabaseConfigured) {
        return [];
      }

      const { data: profilesData, error: profilesError } = await supabase!
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch skills
      const { data: skillsData } = await supabase!.from('nurse_skills').select('*');
      const skillsMap: Record<string, string[]> = {};
      if (skillsData) {
        skillsData.forEach((s: any) => {
          if (s.user_id) {
            if (!skillsMap[s.user_id]) skillsMap[s.user_id] = [];
            skillsMap[s.user_id].push(s.skill_name);
          }
        });
      }

      // Fetch profile views
      const { data: viewsData } = await supabase!.from('profile_views').select('profile_id');
      const viewsMap: Record<string, number> = {};
      if (viewsData) {
        viewsData.forEach((v: any) => {
          if (v.profile_id) {
            viewsMap[v.profile_id] = (viewsMap[v.profile_id] || 0) + 1;
          }
        });
      }

      // Fetch analytics cv_download count
      const { data: downloadsData } = await supabase!
        .from('analytics')
        .select('profile_id')
        .eq('event_type', 'cv_download');

      const downloadsMap: Record<string, number> = {};
      if (downloadsData) {
        downloadsData.forEach((d: any) => {
          if (d.profile_id) {
            downloadsMap[d.profile_id] = (downloadsMap[d.profile_id] || 0) + 1;
          }
        });
      }

      return (profilesData || []).map((row: any): UserProfile => {
        const parts = (row.full_name || '').split(' ');
        const first_name = parts[0] || '';
        const last_name = parts.slice(1).join(' ') || '';

        return {
          id: row.id,
          username: row.username,
          email: row.email || '',
          first_name,
          last_name,
          role: row.role || 'nurse',
          avatar_url: row.avatar_url || '',
          cover_url: row.cover_url || '',
          bio: row.bio || '',
          qualification: row.qualification || '',
          nursing_level: row.nursing_level || '',
          specialties: row.specialty ? row.specialty.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          skills: skillsMap[row.id] || [],
          location: row.location || '',
          years_of_experience: row.years_experience || 0,
          availability_status: row.availability_status || 'available',
          verification_status: (row.verified ? 'verified' : 'unverified') as VerificationStatus,
          profile_theme: row.theme || 'modern',
          cv_url: '',
          created_at: row.created_at || new Date().toISOString(),
          views_count: viewsMap[row.id] || 0,
          downloads_count: downloadsMap[row.id] || 0,
          search_appearances: 0,
          onboarding_completed: row.onboarding_completed || false
        };
      });
    } catch (err) {
      console.error('profilesService.getProfiles failed:', err);
      return [];
    }
  },

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    try {
      if (!isSupabaseConfigured || !username) {
        return null;
      }

      const cleanUser = sanitizeUsername(username);
      const { data: row, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('username', cleanUser)
        .maybeSingle();

      if (error) throw error;
      if (!row) return null;

      // Fetch skills
      const { data: skillsData } = await supabase!
        .from('nurse_skills')
        .select('skill_name')
        .eq('user_id', row.id);

      const skills = skillsData ? skillsData.map((s: any) => s.skill_name) : [];

      // Fetch views count
      const { count: viewsCount } = await supabase!
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', row.id);

      // Fetch downloads count
      const { count: downloadsCount } = await supabase!
        .from('analytics')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', row.id)
        .eq('event_type', 'cv_download');

      const parts = (row.full_name || '').split(' ');
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';

      return {
        id: row.id,
        username: row.username,
        email: row.email || '',
        first_name,
        last_name,
        role: row.role || 'nurse',
        avatar_url: row.avatar_url || '',
        cover_url: row.cover_url || '',
        bio: row.bio || '',
        qualification: row.qualification || '',
        nursing_level: row.nursing_level || '',
        specialties: row.specialty ? row.specialty.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        skills,
        location: row.location || '',
        years_of_experience: row.years_experience || 0,
        availability_status: row.availability_status || 'available',
        verification_status: (row.verified ? 'verified' : 'unverified') as VerificationStatus,
        profile_theme: row.theme || 'modern',
        cv_url: '',
        created_at: row.created_at || new Date().toISOString(),
        views_count: viewsCount || 0,
        downloads_count: downloadsCount || 0,
        search_appearances: 0,
        onboarding_completed: row.onboarding_completed || false
      };
    } catch (err) {
      console.error('profilesService.getProfileByUsername failed:', err);
      return null;
    }
  },

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!id) throw new Error('Cannot update profile without user ID');

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase client not configured');
      }

      const dbUpdates = sanitizeProfileInput(updates);

      // Ensure we won't hit null constraint for user_id (it is primary key references auth.users)
      dbUpdates.id = id;

      // If username isn't known yet, let's create a safe fallback
      if (dbUpdates.username === undefined) {
        const { data: flag } = await supabase!.from('profiles').select('username').eq('id', id).maybeSingle();
        if (!flag) {
          const emailPrefix = (updates.email || 'nurse').split('@')[0];
          dbUpdates.username = sanitizeUsername(`${emailPrefix}_${id.substring(0, 5)}`);
        }
      }

      // Perform user profile upsert
      const { error: upsertErr } = await supabase!
        .from('profiles')
        .upsert(dbUpdates);

      if (upsertErr) throw upsertErr;

      // Update skills sub-table
      if (updates.skills !== undefined) {
        await supabase!.from('nurse_skills').delete().eq('user_id', id);
        if (updates.skills.length > 0) {
          const skillRows = updates.skills.map(s => ({
            user_id: id,
            skill_name: s.trim(),
            proficiency: 'expert'
          }));
          const { error: skillErr } = await supabase!.from('nurse_skills').insert(skillRows);
          if (skillErr) throw skillErr;
        }
      }

      // Retrieve and return freshly updated object
      const refreshed = await this.getProfileByUsername(updates.username || dbUpdates.username);
      if (refreshed) return refreshed;

      // Final fallback query
      const { data: row } = await supabase!.from('profiles').select('*').eq('id', id).single();
      if (!row) throw new Error('Could not retrieve upserted profile row');

      const parts = (row.full_name || '').split(' ');
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';

      return {
        id: row.id,
        username: row.username,
        email: row.email || '',
        first_name,
        last_name,
        role: row.role || 'nurse',
        avatar_url: row.avatar_url || '',
        cover_url: row.cover_url || '',
        bio: row.bio || '',
        qualification: row.qualification || '',
        nursing_level: row.nursing_level || '',
        specialties: row.specialty ? row.specialty.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        skills: updates.skills || [],
        location: row.location || '',
        years_of_experience: row.years_experience || 0,
        availability_status: row.availability_status || 'available',
        verification_status: (row.verified ? 'verified' : 'unverified') as VerificationStatus,
        profile_theme: row.theme || 'modern',
        cv_url: '',
        created_at: row.created_at || new Date().toISOString(),
        views_count: 0,
        downloads_count: 0,
        search_appearances: 0,
        onboarding_completed: row.onboarding_completed || false
      };
    } catch (err: any) {
      console.error('profilesService.updateProfile failed:', err);
      throw err;
    }
  }
};
