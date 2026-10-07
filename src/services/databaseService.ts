/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  UserProfile, Experience, Education, Certification,
  ResearchProject, VerificationRequest, VerificationStatus
} from '../types';
import { profilesService } from './profilesService';
import { experienceService } from './experienceService';
import { educationService } from './educationService';
import { certificatesService } from './certificatesService';
import { researchService } from './researchService';
import { analyticsService } from './analyticsService';

// ==========================================
// HELPERS
// ==========================================
function isUUID(s: string | null | undefined): boolean {
  if (!s) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function logSkip(table: string, err: any) {
  const msg = err?.message || String(err);
  // Table-missing errors are expected during migration — keep them quiet
  if (msg.includes('does not exist') || msg.includes('relation')) {
    console.warn(`[db] ${table} skipped (table not present)`);
    return;
  }
  console.warn(`[db] ${table} cleanup failed:`, msg);
}

// ==========================================
// DATABASE ADAPTER
// ==========================================
export const databaseService = {
  // ========================================
  // PROFILES
  // ========================================
  async getProfiles(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured) return [];
    return profilesService.getProfiles();
  },

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured || !username) return null;

    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }
    if (!data) return null;

    return mapProfileRow(data);
  },

  async getProfileById(profileId: string): Promise<any | null> {
    if (!isSupabaseConfigured || !profileId) return null;

    const { data, error } = await supabase!
      .from('profiles')
      .select('id, first_name, last_name, username, avatar_url, qualification, nursing_level')
      .eq('id', profileId)
      .single();

    if (error) return null;
    return data;
  },

  // Update profile — only sends fields that are explicitly provided.
  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    if (!id) throw new Error('Profile id is required.');

    // Build a payload with ONLY the fields that were explicitly provided.
    // `undefined` values are stripped; `null` values are sent (they're meaningful).
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };

    const fieldMap: Record<string, any> = {
      username: updates.username,
      first_name: updates.first_name,
      last_name: updates.last_name,
      email: updates.email,
      qualification: updates.qualification,
      nursing_level: updates.nursing_level,
      bio: updates.bio,
      location: updates.location,
      years_experience: updates.years_experience,
      specialty: updates.specialty,
      avatar_url: updates.avatar_url,
      cover_url: updates.cover_url,
      health_insurance_type: updates.health_insurance_type,
      insurance_number: updates.insurance_number,
      vaccinations: updates.vaccinations,
      last_vaccination_date: updates.last_vaccination_date,
      nursing_council_id: updates.nursing_council_id,
      license_expiry_date: updates.license_expiry_date,
      emergency_contact_name: updates.emergency_contact_name,
      emergency_contact_phone: updates.emergency_contact_phone,
      blood_type: updates.blood_type,
      languages_spoken: updates.languages_spoken,
      available_for_relocation: updates.available_for_relocation,
      preferred_shift: updates.preferred_shift,
      certifications: updates.certifications,
      onboarding_completed: updates.onboarding_completed,
      username_updated_at: updates.username_updated_at,
      role: (updates as any).role,
      verification_status: (updates as any).verification_status,
      open_to_locum: (updates as any).open_to_locum,
      locum_radius_km: (updates as any).locum_radius_km,
      locum_specialties: (updates as any).locum_specialties,
      phone_number: (updates as any).phone_number,
      whatsapp_number: (updates as any).whatsapp_number,
      profile_theme: updates.profile_theme,
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) payload[key] = value;
    }

    const { data, error } = await supabase!
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return mapProfileRow(data);
  },

  // ========================================
  // NURSE SKILLS
  // ========================================
  async getNurseSkills(userId: string) {
    if (!isSupabaseConfigured || !userId) return [];

    const { data, error } = await supabase!
      .from('nurse_skills')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch nurse skills:', error.message);
      return [];
    }
    return data || [];
  },

  // ========================================
  // EXPERIENCES
  // ========================================
  async getExperiences(profileId: string): Promise<Experience[]> {
    if (!isSupabaseConfigured || !profileId) return [];
    return experienceService.getExperiences(profileId);
  },

  async saveExperience(exp: Omit<Experience, 'id'> & { id?: string }): Promise<Experience> {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');
    return experienceService.saveExperience(exp);
  },

  async deleteExperience(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    return experienceService.deleteExperience(id);
  },

  // ========================================
  // EDUCATION
  // ========================================
  async getEducations(profileId: string): Promise<Education[]> {
    if (!isSupabaseConfigured || !profileId) return [];
    return educationService.getEducations(profileId);
  },

  async saveEducation(edu: Omit<Education, 'id'> & { id?: string }): Promise<Education> {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');
    return educationService.saveEducation(edu);
  },

  async deleteEducation(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    return educationService.deleteEducation(id);
  },

  // ========================================
  // CERTIFICATIONS
  // ========================================
  async getCertifications(profileId: string): Promise<Certification[]> {
    if (!isSupabaseConfigured || !profileId) return [];
    return certificatesService.getCertifications(profileId);
  },

  async saveCertification(cert: Omit<Certification, 'id'> & { id?: string }): Promise<Certification> {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');
    return certificatesService.saveCertification(cert);
  },

  async deleteCertification(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    return certificatesService.deleteCertification(id);
  },

  // ========================================
  // RESEARCH PROJECTS
  // ========================================
  async getResearchProjects(profileId: string): Promise<ResearchProject[]> {
    if (!isSupabaseConfigured || !profileId) return [];
    return researchService.getResearchProjects(profileId);
  },

  async saveResearchProject(proj: Omit<ResearchProject, 'id'> & { id?: string }): Promise<ResearchProject> {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');
    return researchService.saveResearchProject(proj);
  },

  async deleteResearchProject(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    return researchService.deleteResearchProject(id);
  },

  // ========================================
  // ANALYTICS — profile views, CV downloads
  // ========================================
  async recordProfileView(profileId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    return analyticsService.recordProfileView(profileId);
  },

  async recordCvDownload(profileId: string, fileUrl: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const viewerId = session?.user?.id || null;

      // Don't count if the owner is checking their own file
      if (viewerId === profileId) return;

      await supabase!.from('cv_downloads').insert({
        profile_id: profileId,
        viewer_id: viewerId,
        file_url: fileUrl,
      });
    } catch (err) {
      console.error('Download tracking error:', err);
    }
  },

  // ========================================
  // CV / UPLOADED DOCUMENTS
  // ========================================
  async getPublicCV(userId: string): Promise<{ file_url: string; is_locked: boolean } | null> {
    if (!isSupabaseConfigured || !userId) return null;

    const { data, error } = await supabase!
      .from('uploaded_documents')
      .select('file_url, is_locked')
      .eq('user_id', userId)
      .eq('document_type', 'cv')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return { file_url: data.file_url, is_locked: data.is_locked ?? true };
  },

  async toggleCvLock(userId: string, newLockStatus: boolean): Promise<boolean> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { error } = await supabase!
      .from('uploaded_documents')
      .update({ is_locked: newLockStatus })
      .eq('user_id', userId)
      .eq('document_type', 'cv');

    if (error) throw error;
    return true;
  },

  async getUserDocuments(userId: string): Promise<any[]> {
    if (!isSupabaseConfigured || !userId) return [];

    const { data, error } = await supabase!
      .from('uploaded_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
    return data || [];
  },

  // ========================================
  // STORAGE — uploads, deletes, public URLs
  // ========================================
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Supabase storage not configured.');

    // Sanitize the filename to prevent path traversal / weird chars
    const safePath = path.replace(/\.\./g, '').replace(/^\/+/, '');

    const { error } = await supabase!.storage
      .from(bucket)
      .upload(safePath, file, { upsert: true });
    if (error) throw error;

    const { data: publicUrlData } = supabase!.storage.from(bucket).getPublicUrl(safePath);
    const publicUrl = publicUrlData.publicUrl;

    // Log the upload so it appears in the user's vault.
    // Best-effort: if this fails, the file is still uploaded.
    try {
      const userId = safePath.split('/')[0];
      if (!userId || !isUUID(userId)) return publicUrl;

      await supabase!.from('uploaded_documents').insert({
        user_id: userId,
        document_type: bucket === 'documents' ? 'cv' : 'verification',
        file_url: publicUrl,
        file_path: safePath,
        name: file.name,
        size_bytes: file.size,
      });
    } catch (logErr) {
      console.warn('[db] upload logging failed:', logErr);
    }

    return publicUrl;
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase storage not configured.');

    const { error } = await supabase!.storage.from(bucket).remove([path]);
    if (error) throw error;

    // Clean up the metadata row.
    try {
      await supabase!
        .from('uploaded_documents')
        .delete()
        .eq('file_path', path);
    } catch (logErr) {
      console.warn('[db] document log cleanup skipped:', logErr);
    }
  },

  async updateAvatar(userId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Supabase storage not configured.');

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase!.storage
      .from('profiles')
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase!.storage.from('profiles').getPublicUrl(filePath);
    const avatarUrl = urlData.publicUrl;

    await profilesService.updateProfile(userId, { avatar_url: avatarUrl });
    return avatarUrl;
  },

  async updateCover(userId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Supabase storage not configured.');

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/cover-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase!.storage
      .from('profiles')
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase!.storage.from('profiles').getPublicUrl(filePath);
    const coverUrl = urlData.publicUrl;

    await profilesService.updateProfile(userId, { cover_url: coverUrl });
    return coverUrl;
  },

  async uploadImage(userId: string, file: File, bucketType: 'avatar' | 'cover') {
    return bucketType === 'avatar'
      ? this.updateAvatar(userId, file)
      : this.updateCover(userId, file);
  },

  async getImageUrl(bucket: string, path: string): Promise<string | null> {
    if (!isSupabaseConfigured) return null;
    const { data } = supabase!.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // ========================================
  // ENDORSEMENTS
  // ========================================
  async getProfileEndorsements(profileId: string): Promise<any[]> {
    if (!isSupabaseConfigured || !profileId) return [];

    // Join to profiles so the caller gets endorser info in one round trip
    const { data, error } = await supabase!
      .from('profile_endorsements')
      .select(`
        id,
        endorser_id,
        profile_id,
        specialty,
        message,
        created_at,
        endorser:profiles!endorser_id (
          id, first_name, last_name, full_name, username,
          avatar_url, qualification, nursing_level
        )
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getProfileEndorsements error:', error);
      return [];
    }
    return data || [];
  },

  async createEndorsement(
    endorserId: string,
    profileId: string,
    specialty?: string,
    message?: string
  ): Promise<any> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase!
      .from('profile_endorsements')
      .upsert(
        {
          endorser_id: endorserId,
          profile_id: profileId,
          specialty: specialty || null,
          message: message || null,
        },
        { onConflict: 'endorser_id,profile_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEndorsement(endorsementId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase!
      .from('profile_endorsements')
      .delete()
      .eq('id', endorsementId);

    if (error) throw error;
  },

  // ========================================
  // VERIFICATION REQUESTS
  // ========================================
  async getVerificationRequests(): Promise<VerificationRequest[]> {
    if (!isSupabaseConfigured) return [];

    // Fetch requests and join profiles in one query
    const { data, error } = await supabase!
      .from('verification_requests')
      .select(`
        *,
        profile:profiles!user_id (
          id, first_name, last_name, full_name, email, username
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => {
      const profile = row.profile;
      const displayName = profile?.full_name
        || (profile?.first_name
          ? `${profile.first_name} ${profile.last_name || ''}`.trim()
          : profile?.username)
        || 'Healthcare Associate';

      return {
        id: row.id,
        profile_id: row.profile_id || row.user_id,
        license_document_url: row.license_url || '',
        student_id_url: row.student_id_url || '',
        status: (row.status as VerificationStatus) || 'pending',
        submitted_at: row.created_at || new Date().toISOString(),
        review_notes: row.admin_note || '',
        // Prefer the dedicated columns if present; fall back to the note
        license_number: row.license_number || '',
        license_type: row.license_type || 'NCK License',
        state_country: row.state_country || 'Kenya',
        nurse_name: row.nurse_name || displayName,
        nurse_email: row.nurse_email || profile?.email || '',
      };
    });
  },

  async submitVerificationRequest(
    req: Omit<VerificationRequest, 'id' | 'status' | 'submitted_at'>
  ): Promise<VerificationRequest> {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');

    const payload: Record<string, any> = {
      user_id: req.profile_id,
      profile_id: req.profile_id,
      license_url: req.license_document_url || null,
      student_id_url: req.student_id_url || null,
      status: 'pending',
      // Dedicated columns (added by the SQL migration)
      license_type: req.license_type || 'NCK License',
      license_number: req.license_number || '',
      state_country: req.state_country || 'Kenya',
      nurse_name: req.nurse_name || '',
      nurse_email: req.nurse_email || '',
    };

    const { data, error } = await supabase!
      .from('verification_requests')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Reset the profile's verified flag until approved
    await supabase!
      .from('profiles')
      .update({ verified: false, verification_status: 'pending' })
      .eq('id', req.profile_id);

    return {
      id: data.id,
      profile_id: data.profile_id || data.user_id,
      license_document_url: data.license_url || '',
      student_id_url: data.student_id_url || '',
      status: (data.status as VerificationStatus) || 'pending',
      submitted_at: data.created_at || new Date().toISOString(),
      review_notes: data.admin_note || '',
      license_number: data.license_number || '',
      license_type: data.license_type || 'NCK License',
      state_country: data.state_country || 'Kenya',
      nurse_name: data.nurse_name || req.nurse_name || '',
      nurse_email: data.nurse_email || req.nurse_email || '',
    };
  },

  async reviewVerificationRequest(
    reqId: string,
    status: VerificationStatus,
    note?: string
  ): Promise<VerificationRequest> {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');

    const { data, error } = await supabase!
      .from('verification_requests')
      .update({ status, admin_note: note || '' })
      .eq('id', reqId)
      .select()
      .single();

    if (error) throw error;

    // Mirror the status onto the profile row
    const profileId = data.profile_id || data.user_id;
    await supabase!
      .from('profiles')
      .update({
        verified: status === 'verified',
        verification_status: status,
      })
      .eq('id', profileId);

    return {
      id: data.id,
      profile_id: profileId,
      license_document_url: data.license_url || '',
      student_id_url: data.student_id_url || '',
      status: (data.status as VerificationStatus) || 'pending',
      submitted_at: data.created_at || new Date().toISOString(),
      review_notes: data.admin_note || '',
      license_number: data.license_number || '',
      license_type: data.license_type || 'NCK License',
      state_country: data.state_country || 'Kenya',
      nurse_name: data.nurse_name || '',
      nurse_email: data.nurse_email || '',
    };
  },

  // ========================================
  // ACCOUNT DELETION
  // ========================================
  async deleteAccount(userId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    if (!userId) throw new Error('A user id is required to delete an account.');

    // Delete child rows first so foreign keys don't block the profile deletion.
    // Each deletion is best-effort — a missing table logs a warning and continues.
    const childDeletions: Array<{ table: string; run: () => Promise<any> }> = [
      { table: 'cv_downloads', run: () => supabase!.from('cv_downloads').delete().or(`profile_id.eq.${userId},viewer_id.eq.${userId}`) },
      { table: 'profile_endorsements', run: () => supabase!.from('profile_endorsements').delete().or(`profile_id.eq.${userId},endorser_id.eq.${userId}`) },
      { table: 'verification_requests', run: () => supabase!.from('verification_requests').delete().or(`user_id.eq.${userId},profile_id.eq.${userId}`) },
      { table: 'uploaded_documents', run: () => supabase!.from('uploaded_documents').delete().eq('user_id', userId) },
      { table: 'nurse_skills', run: () => supabase!.from('nurse_skills').delete().eq('user_id', userId) },
      { table: 'experiences', run: () => supabase!.from('experiences').delete().or(`user_id.eq.${userId},profile_id.eq.${userId}`) },
      { table: 'education', run: () => supabase!.from('education').delete().or(`user_id.eq.${userId},profile_id.eq.${userId}`) },
      { table: 'certifications', run: () => supabase!.from('certifications').delete().or(`user_id.eq.${userId},profile_id.eq.${userId}`) },
      { table: 'research_projects', run: () => supabase!.from('research_projects').delete().or(`user_id.eq.${userId},profile_id.eq.${userId}`) },
      { table: 'clinical_procedures', run: () => supabase!.from('clinical_procedures').delete().eq('user_id', userId) },
      { table: 'user_streaks', run: () => supabase!.from('user_streaks').delete().eq('user_id', userId) },
      { table: 'notifications', run: () => supabase!.from('notifications').delete().or(`user_id.eq.${userId},actor_id.eq.${userId}`) },
      { table: 'profile_views', run: () => supabase!.from('profile_views').delete().or(`profile_id.eq.${userId},viewer_id.eq.${userId}`) },
    ];

    for (const { table, run } of childDeletions) {
      try {
        await run();
      } catch (err) {
        logSkip(table, err);
      }
    }

    // Delete the profile row itself
    const { error: profileError } = await supabase!
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to delete profile row:', profileError);
      throw profileError;
    }

    // Delete stored files under the user's folder (best-effort)
    try {
      const { data: files } = await supabase!.storage.from('profiles').list(userId);
      if (files && files.length > 0) {
        const paths = files.map(f => `${userId}/${f.name}`);
        await supabase!.storage.from('profiles').remove(paths);
      }
    } catch (storageErr) {
      console.warn('[db] storage cleanup skipped:', storageErr);
    }

    // Sign the user out. Deleting the auth.users row requires service_role
    // and must run server-side (Edge Function).
    await supabase!.auth.signOut();
  },
};

// ==========================================
// ROW → TYPED OBJECT MAPPERS
// ==========================================

/**
 * Profiles has the most columns. This mapper keeps the shape consistent with
 * the UserProfile type the UI consumes, regardless of what the DB returns.
 */
function mapProfileRow(row: any): UserProfile {
  const specialties = row.specialty
    ? row.specialty.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  return {
    id: row.id,
    username: row.username,
    email: row.email || '',
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    full_name: row.full_name,
    role: row.role || 'nurse',
    avatar_url: row.avatar_url || '',
    cover_url: row.cover_url || '',
    bio: row.bio ?? null,
    qualification: row.qualification ?? null,
    nursing_level: row.nursing_level ?? null,
    specialties,
    skills: [],
    location: row.location ?? null,
    years_of_experience: row.years_experience ?? null,
    years_experience: row.years_experience ?? null,
    availability_status: row.availability_status || 'available',
    verification_status: row.verification_status || (row.verified ? 'verified' : 'unverified'),
    verified: row.verified ?? false,
    profile_theme: row.profile_theme || row.theme || 'modern',
    theme: row.theme ?? undefined,
    cv_url: row.cv_url ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    username_updated_at: row.username_updated_at ?? null,
    views_count: row.views_count ?? 0,
    downloads_count: row.downloads_count ?? 0,
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