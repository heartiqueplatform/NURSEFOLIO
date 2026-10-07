/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, VerificationStatus } from '../types';

// ==========================================================
// VALIDATION / SANITIZATION
// ==========================================================
export function sanitizeUsername(username: string): string {
  const clean = username
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_.-]/g, '')
    .replace(/^[._-]+/, '')
    .replace(/[._-]+$/, '');
  return clean || `user_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Maps a partial UserProfile update to columns that actually exist on the
 * `profiles` table. Only fields that are explicitly present are included —
 * `undefined` is skipped so we don't null-out existing data.
 */
function buildUpdatePayload(updates: Partial<UserProfile>): Record<string, any> {
  const payload: Record<string, any> = {};

  // Identity
  if (updates.username !== undefined) payload.username = sanitizeUsername(updates.username);
  if (updates.email !== undefined) payload.email = updates.email?.trim() || null;
  if (updates.first_name !== undefined || updates.last_name !== undefined) {
    const f = (updates.first_name || '').trim();
    const l = (updates.last_name || '').trim();
    payload.full_name = `${f} ${l}`.trim() || 'Healthcare Professional';
    payload.first_name = f || null;
    payload.last_name = l || null;
  }

  // Core profile fields
  if (updates.bio !== undefined) payload.bio = updates.bio?.trim() || null;
  if (updates.qualification !== undefined) payload.qualification = updates.qualification?.trim() || null;
  if (updates.nursing_level !== undefined) payload.nursing_level = updates.nursing_level?.trim() || null;
  if (updates.location !== undefined) payload.location = updates.location?.trim() || null;
  if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url || null;
  if (updates.cover_url !== undefined) payload.cover_url = updates.cover_url || null;
  if (updates.years_of_experience !== undefined || (updates as any).years_experience !== undefined) {
    const raw = (updates as any).years_experience ?? updates.years_of_experience ?? 0;
    payload.years_experience = Math.max(0, Number(raw) || 0);
  }

  // Status / preferences
  if (updates.availability_status !== undefined) {
    payload.availability_status = updates.availability_status || 'available';
  }
  if (updates.profile_theme !== undefined) {
    payload.profile_theme = updates.profile_theme || 'modern';
    // Keep the legacy `theme` column in sync during the migration window
    payload.theme = updates.profile_theme || 'modern';
  }
  if (updates.verification_status !== undefined) {
    payload.verification_status = updates.verification_status;
    payload.verified = updates.verification_status === 'verified';
  }
  if (updates.role !== undefined) payload.role = updates.role || 'nurse';
  if (updates.specialties !== undefined) {
    payload.specialty = Array.isArray(updates.specialties)
      ? updates.specialties.filter(Boolean).join(', ')
      : null;
  }
  if (updates.onboarding_completed !== undefined) {
    payload.onboarding_completed = updates.onboarding_completed;
  }

  // Extended fields — only set if explicitly provided
  const extended: Record<string, any> = {
    health_insurance_type: (updates as any).health_insurance_type,
    insurance_number: (updates as any).insurance_number,
    vaccinations: (updates as any).vaccinations,
    last_vaccination_date: (updates as any).last_vaccination_date,
    nursing_council_id: (updates as any).nursing_council_id,
    license_expiry_date: (updates as any).license_expiry_date,
    emergency_contact_name: (updates as any).emergency_contact_name,
    emergency_contact_phone: (updates as any).emergency_contact_phone,
    blood_type: (updates as any).blood_type,
    languages_spoken: (updates as any).languages_spoken,
    available_for_relocation: (updates as any).available_for_relocation,
    preferred_shift: (updates as any).preferred_shift,
    certifications: (updates as any).certifications,
    open_to_locum: (updates as any).open_to_locum,
    locum_radius_km: (updates as any).locum_radius_km,
    locum_specialties: (updates as any).locum_specialties,
    phone_number: (updates as any).phone_number,
    whatsapp_number: (updates as any).whatsapp_number,
    username_updated_at: (updates as any).username_updated_at,
  };

  for (const [key, value] of Object.entries(extended)) {
    if (value !== undefined) payload[key] = value;
  }

  return payload;
}

// ==========================================================
// ROW → TYPED OBJECT
// ==========================================================
function mapProfileRow(
  row: any,
  extras?: { skills?: string[]; views?: number; downloads?: number }
): UserProfile {
  const fullName = row.full_name || '';
  const parts = fullName.split(' ').filter(Boolean);
  const first_name = row.first_name || parts[0] || '';
  const last_name = row.last_name || parts.slice(1).join(' ') || '';

  const specialties = row.specialty
    ? row.specialty.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  return {
    id: row.id,
    username: row.username,
    email: row.email || '',
    first_name,
    last_name,
    full_name: fullName || undefined,
    role: row.role || 'nurse',
    avatar_url: row.avatar_url || '',
    cover_url: row.cover_url || '',
    bio: row.bio ?? null,
    qualification: row.qualification ?? null,
    nursing_level: row.nursing_level ?? null,
    specialties,
    skills: extras?.skills || [],
    location: row.location ?? null,
    years_of_experience: row.years_experience ?? null,
    years_experience: row.years_experience ?? null,
    availability_status: row.availability_status || 'available',
    verification_status: (row.verification_status
      || (row.verified ? 'verified' : 'unverified')) as VerificationStatus,
    verified: row.verified ?? false,
    profile_theme: row.profile_theme || row.theme || 'modern',
    theme: row.theme ?? undefined,
    cv_url: row.cv_url ?? null,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at,
    username_updated_at: row.username_updated_at ?? null,
    views_count: extras?.views ?? row.views_count ?? 0,
    downloads_count: extras?.downloads ?? row.downloads_count ?? 0,
    search_appearances: row.search_appearances ?? 0,
    onboarding_completed: row.onboarding_completed ?? false,
    health_insurance_type: row.health_insurance_type ?? null,
    insurance_number: row.insurance_number ?? null,
    vaccinations: row.vaccinations ?? null,
    last_vaccination_date: row.last_vaccination_date ?? null,
    nursing_council_id: row.nursing_council_id ?? null,
    license_expiry_date: row.license_expiry_date ?? null,
    emergency_contact_name: row.emergency_contact_name ?? null,
    emergency_contact_phone: row.emergency_contact_phone ?? null,
    blood_type: row.blood_type ?? null,
    languages_spoken: row.languages_spoken ?? null,
    available_for_relocation: row.available_for_relocation ?? false,
    preferred_shift: row.preferred_shift ?? null,
    certifications: row.certifications ?? null,
    specialty: row.specialty ?? null,
    open_to_locum: row.open_to_locum ?? false,
    locum_radius_km: row.locum_radius_km ?? 20,
    locum_specialties: row.locum_specialties ?? null,
    phone_number: row.phone_number ?? null,
    whatsapp_number: row.whatsapp_number ?? null,
  } as UserProfile;
}

// ==========================================================
// SERVICE
// ==========================================================
export const profilesService = {
  // ----------------------------------------------------------
  // Fetch all profiles (used by Explore, Landing, Admin)
  // ----------------------------------------------------------
  async getProfiles(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data: profilesData, error } = await supabase!
        .from('profiles')
        .select('*');

      if (error) throw error;
      if (!profilesData || profilesData.length === 0) return [];

      const userIds = profilesData.map(p => p.id);

      // Batch-fetch skills, views, downloads for ALL users in 3 queries
      // instead of one-per-user. This is the fix for the N+1 problem.
      const [skillsRes, viewsRes, downloadsRes] = await Promise.all([
        supabase!
          .from('nurse_skills')
          .select('user_id, skill_name')
          .in('user_id', userIds),
        supabase!
          .from('profile_views')
          .select('profile_id')
          .in('profile_id', userIds),
        supabase!
          .from('cv_downloads')
          .select('profile_id')
          .in('profile_id', userIds),
      ]);

      // Group by user
      const skillsMap: Record<string, string[]> = {};
      skillsRes.data?.forEach((s: any) => {
        if (!s.user_id) return;
        (skillsMap[s.user_id] ||= []).push(s.skill_name);
      });

      const viewsMap: Record<string, number> = {};
      viewsRes.data?.forEach((v: any) => {
        if (!v.profile_id) return;
        viewsMap[v.profile_id] = (viewsMap[v.profile_id] || 0) + 1;
      });

      const downloadsMap: Record<string, number> = {};
      downloadsRes.data?.forEach((d: any) => {
        if (!d.profile_id) return;
        downloadsMap[d.profile_id] = (downloadsMap[d.profile_id] || 0) + 1;
      });

      return profilesData.map(row =>
        mapProfileRow(row, {
          skills: skillsMap[row.id] || [],
          views: viewsMap[row.id] || 0,
          downloads: downloadsMap[row.id] || 0,
        })
      );
    } catch (err) {
      console.error('[profilesService.getProfiles] failed:', err);
      return [];
    }
  },

  // ----------------------------------------------------------
  // Fetch a single profile by username (public view)
  // ----------------------------------------------------------
  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured || !username) return null;

    try {
      const cleanUser = sanitizeUsername(username);

      const { data: row, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('username', cleanUser)
        .maybeSingle();

      if (error) throw error;
      if (!row) return null;

      // Fetch skills, views, downloads in parallel (not sequential)
      const [skillsRes, viewsRes, downloadsRes] = await Promise.all([
        supabase!
          .from('nurse_skills')
          .select('skill_name, proficiency')
          .eq('user_id', row.id)
          .order('created_at', { ascending: false }),
        supabase!
          .from('profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', row.id),
        supabase!
          .from('cv_downloads')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', row.id),
      ]);

      const skills = (skillsRes.data || []).map((s: any) => s.skill_name);

      return mapProfileRow(row, {
        skills,
        views: viewsRes.count || 0,
        downloads: downloadsRes.count || 0,
      });
    } catch (err) {
      console.error('[profilesService.getProfileByUsername] failed:', err);
      return null;
    }
  },

  // ----------------------------------------------------------
  // Fetch a single profile by ID
  // ----------------------------------------------------------
  async getProfileById(id: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured || !id) return null;

    try {
      const { data: row, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!row) return null;

      const { data: skillsData } = await supabase!
        .from('nurse_skills')
        .select('skill_name')
        .eq('user_id', row.id);

      const skills = (skillsData || []).map((s: any) => s.skill_name);

      return mapProfileRow(row, { skills });
    } catch (err) {
      console.error('[profilesService.getProfileById] failed:', err);
      return null;
    }
  },

  // ----------------------------------------------------------
  // Update a profile — the big one
  // ----------------------------------------------------------
  async updateProfile(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    if (!id) throw new Error('Cannot update profile without user ID');
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured');
    }

    try {
      // ---------------------------------------------------------
      // Step 1: Check if the profile row exists.
      // WHY: `upsert` needs a full row to satisfy NOT NULL constraints,
      // and passing a partial row with upsert can null-out fields that
      // weren't provided. We use insert vs update explicitly.
      // ---------------------------------------------------------
      const { data: existing, error: checkErr } = await supabase!
        .from('profiles')
        .select('id, username')
        .eq('id', id)
        .maybeSingle();

      if (checkErr) throw checkErr;

      const payload = buildUpdatePayload(updates);

      if (!existing) {
        // ---------------------------------------------------------
        // INSERT — brand-new profile
        // ---------------------------------------------------------
        // Ensure the fields the DB requires are set with safe defaults.
        const insertPayload: Record<string, any> = {
          id,
          username: payload.username
            || sanitizeUsername((updates.email || 'nurse').split('@')[0]),
          email: payload.email || updates.email || '',
          full_name: payload.full_name || 'Healthcare Professional',
          role: payload.role || 'nurse',
          availability_status: payload.availability_status || 'available',
          onboarding_completed: payload.onboarding_completed ?? false,
          verification_status: payload.verification_status || 'unverified',
          verified: payload.verified ?? false,
          profile_theme: payload.profile_theme || 'modern',
          theme: payload.theme || 'modern',
          ...payload,
        };

        const { data, error } = await supabase!
          .from('profiles')
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;

        // Sync skills if provided
        if (updates.skills !== undefined) {
          await this.syncSkills(id, updates.skills);
        }

        return mapProfileRow(data, { skills: updates.skills || [] });
      }

      // ---------------------------------------------------------
      // UPDATE — existing profile. Only touch fields provided.
      // ---------------------------------------------------------
      if (Object.keys(payload).length === 0) {
        // Nothing to update, just return the current row
        const { data } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        return mapProfileRow(data);
      }

      // Track username change timestamp for rate-limiting if caller didn't
      if (payload.username && payload.username !== existing.username) {
        payload.username_updated_at = new Date().toISOString();
      }

      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase!
        .from('profiles')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Sync skills if provided
      if (updates.skills !== undefined) {
        await this.syncSkills(id, updates.skills);
      }

      // Fetch skills to include in the returned object
      const { data: skillsData } = await supabase!
        .from('nurse_skills')
        .select('skill_name')
        .eq('user_id', id);

      const skills = (skillsData || []).map((s: any) => s.skill_name);

      return mapProfileRow(data, { skills });
    } catch (err: any) {
      console.error('[profilesService.updateProfile] failed:', err);
      throw err;
    }
  },

  // ----------------------------------------------------------
  // Internal helper: replace a user's skills atomically
  // ----------------------------------------------------------
  async syncSkills(userId: string, skills: string[]): Promise<void> {
    // Delete all existing
    const { error: delErr } = await supabase!
      .from('nurse_skills')
      .delete()
      .eq('user_id', userId);
    if (delErr) throw delErr;

    // Insert new list
    const rows = skills
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({
        user_id: userId,
        skill_name: name,
        proficiency: 'expert',
      }));

    if (rows.length > 0) {
      const { error: insErr } = await supabase!
        .from('nurse_skills')
        .insert(rows);
      if (insErr) throw insErr;
    }
  },
};