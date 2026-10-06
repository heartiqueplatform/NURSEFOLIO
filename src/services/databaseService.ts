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
// DATABASE ADAPTER IMPLEMENTATION
// ==========================================

export const databaseService = {
  // Profiles CRUD
  async getProfiles(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables.');
      return [];
    }
    return profilesService.getProfiles();
  },

  // GET NURSE SKILLS
  async getNurseSkills(userId: string) {
    try {
      if (!isSupabaseConfigured || !userId) return [];

      const { data, error } = await supabase
        .from('nurse_skills')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Could not fetch nurse skills:', err);
      return [];
    }
  },

  // Get profile by username (for public portfolio pages)
  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables.');
      return null;
    }

    const { data, error } = await supabase!
      .from('profiles')
      .select(`
        id,
        username,
        email,
        first_name,
        last_name,
        role,
        avatar_url,
        cover_url,
        bio,
        qualification,
        nursing_level,
        specialty,
        location,
        years_experience,
        availability_status,
        verification_status,
        profile_theme,
        created_at,
        views_count,
        downloads_count,
        search_appearances,
        onboarding_completed,
        health_insurance_type,
        insurance_number,
        vaccinations,
        last_vaccination_date,
        nursing_council_id,
        license_expiry_date,
        emergency_contact_name,
        emergency_contact_phone,
        blood_type,
        languages_spoken,
        available_for_relocation,
        preferred_shift,
        certifications,
        theme,
        verified,
        updated_at,
        username_updated_at
      `)
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }

    if (!data) {
      console.warn('No profile found for username:', username);
      return null;
    }

    return {
      id: data.id,
      username: data.username,
      email: data.email || '',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      role: data.role || 'nurse',
      avatar_url: data.avatar_url || '',
      cover_url: data.cover_url || '',
      bio: data.bio,
      qualification: data.qualification,
      nursing_level: data.nursing_level,
      specialties: data.specialty ? [data.specialty] : [],
      skills: [],
      location: data.location,
      years_of_experience: data.years_experience,
      availability_status: data.availability_status || 'available',
      verification_status: data.verification_status || 'unverified',
      profile_theme: data.profile_theme || 'modern',
      cv_url: null,
      created_at: data.created_at,
      views_count: data.views_count || 0,
      downloads_count: data.downloads_count || 0,
      search_appearances: data.search_appearances || 0,
      onboarding_completed: data.onboarding_completed,
      health_insurance_type: data.health_insurance_type,
      insurance_number: data.insurance_number,
      vaccinations: data.vaccinations,
      last_vaccination_date: data.last_vaccination_date,
      nursing_council_id: data.nursing_council_id,
      license_expiry_date: data.license_expiry_date,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      blood_type: data.blood_type,
      languages_spoken: data.languages_spoken,
      available_for_relocation: data.available_for_relocation,
      preferred_shift: data.preferred_shift,
      certifications: data.certifications,
      years_experience: data.years_experience,
      specialty: data.specialty,
      theme: data.theme,
      verified: data.verified,
      updated_at: data.updated_at,
      username_updated_at: data.username_updated_at
    };
  },

  // Update profile — FIXED: only sends fields that are actually provided
  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Setup environment keys to use live updates.');
    }

    // Build a payload with ONLY the fields that were explicitly provided.
    // Without this filter, any field listed as `undefined` would be written as NULL.
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

    return data as UserProfile;
  },

  async recordProfileView(profileId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    return analyticsService.recordProfileView(profileId);
  },

  // Record CV download with the specific file URL
  async recordCvDownload(profileId: string, fileUrl: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const viewerId = session?.user?.id || null;

      // Don't count if the owner is just checking their own file
      if (viewerId === profileId) return;

      await supabase!
        .from('cv_downloads')
        .insert({
          profile_id: profileId,
          viewer_id: viewerId,
          file_url: fileUrl
        });

      console.log("recorded that " + fileUrl + " was downloaded!");
    } catch (err) {
      console.error("Tracking error:", err);
    }
  },

  async getPublicCV(userId: string): Promise<{ file_url: string; is_locked: boolean } | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase!
      .from('uploaded_documents')
      .select('file_url, is_locked')
      .eq('user_id', userId)
      .eq('document_type', 'cv')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("No CV found in the vault for this user.");
      return null;
    }

    return data ? { file_url: data.file_url, is_locked: data.is_locked } : null;
  },

  // Toggle the lock status of the user's CV
  async toggleCvLock(userId: string, newLockStatus: boolean) {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase!
      .from('uploaded_documents')
      .update({ is_locked: newLockStatus })
      .eq('user_id', userId)
      .eq('document_type', 'cv');

    if (error) throw error;
    return true;
  },

  // Update avatar image
  async updateAvatar(userId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase storage not configured.');
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase!.storage
      .from('profiles')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase!.storage
      .from('profiles')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    await profilesService.updateProfile(userId, { avatar_url: avatarUrl });

    return avatarUrl;
  },

  // Update cover image
  async updateCover(userId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase storage not configured.');
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/cover-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase!.storage
      .from('profiles')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase!.storage
      .from('profiles')
      .getPublicUrl(filePath);

    const coverUrl = urlData.publicUrl;

    await profilesService.updateProfile(userId, { cover_url: coverUrl });

    return coverUrl;
  },

  // Helper to get a public storage URL
  async getImageUrl(bucket: string, path: string): Promise<string | null> {
    if (!isSupabaseConfigured) return null;

    const { data } = supabase!.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // Generic file upload
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase storage not configured.');
    }

    const { error } = await supabase!.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) throw error;

    const { data: publicUrlData } = supabase!.storage.from(bucket).getPublicUrl(path);
    const publicUrl = publicUrlData.publicUrl;

    try {
      const userId = path.split('/')[0];
      if (!userId) return publicUrl;

      await supabase!
        .from('uploaded_documents')
        .insert({
          user_id: userId,
          document_type: bucket === 'documents' ? 'cv' : 'verification',
          file_url: publicUrl
        });
    } catch (logErr) {
      console.error('Upload logging failed:', logErr);
    }

    return publicUrl;
  },

  // Delete a stored file
  async deleteFile(bucket: string, path: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase storage not configured.');
    }

    const { error } = await supabase!.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    try {
      const userId = path.split('/')[0];
      if (userId) {
        await supabase!
          .from('uploaded_documents')
          .delete()
          .eq('user_id', userId)
          .eq('document_type', bucket === 'documents' ? 'cv' : 'verification');
      }
    } catch (logErr) {
      console.warn('Failed to clean up document log, but file was deleted:', logErr);
    }
  },

  // Get user documents
  async getUserDocuments(userId: string): Promise<any[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase!
      .from('uploaded_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
    return data || [];
  },

  // Backwards-compatible upload helper
  async uploadImage(userId: string, file: File, bucketType: 'avatar' | 'cover') {
    if (bucketType === 'avatar') {
      return this.updateAvatar(userId, file);
    } else {
      return this.updateCover(userId, file);
    }
  },

  // Experiences CRUD
  async getExperiences(profileId: string): Promise<Experience[]> {
    if (!isSupabaseConfigured) return [];
    return experienceService.getExperiences(profileId);
  },

  async saveExperience(exp: Omit<Experience, 'id'> & { id?: string }): Promise<Experience> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured.');
    }
    return experienceService.saveExperience(exp);
  },

  async deleteExperience(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    return experienceService.deleteExperience(id);
  },

  // Education CRUD
  async getEducations(profileId: string): Promise<Education[]> {
    if (!isSupabaseConfigured) return [];
    return educationService.getEducations(profileId);
  },

  async saveEducation(edu: Omit<Education, 'id'> & { id?: string }): Promise<Education> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured.');
    }
    return educationService.saveEducation(edu);
  },

  async deleteEducation(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    return educationService.deleteEducation(id);
  },

  // Certifications CRUD
  async getCertifications(profileId: string): Promise<Certification[]> {
    if (!isSupabaseConfigured) return [];
    return certificatesService.getCertifications(profileId);
  },

  async saveCertification(cert: Omit<Certification, 'id'> & { id?: string }): Promise<Certification> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured.');
    }
    return certificatesService.saveCertification(cert);
  },

  async deleteCertification(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    return certificatesService.deleteCertification(id);
  },

  // Research Projects CRUD
  async getResearchProjects(profileId: string): Promise<ResearchProject[]> {
    if (!isSupabaseConfigured) return [];
    return researchService.getResearchProjects(profileId);
  },

  async saveResearchProject(proj: Omit<ResearchProject, 'id'> & { id?: string }): Promise<ResearchProject> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured.');
    }
    return researchService.saveResearchProject(proj);
  },

  async deleteResearchProject(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    return researchService.deleteResearchProject(id);
  },

  // Verification Requests
  async getVerificationRequests(): Promise<VerificationRequest[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase!
      .from('verification_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const { data: profiles } = await supabase!.from('profiles').select('id, full_name, email');
    const profilesMap = new Map<string, any>();
    if (profiles) {
      profiles.forEach(p => profilesMap.set(p.id, p));
    }

    return (data || []).map((row: any) => {
      const profile = profilesMap.get(row.user_id);
      return {
        id: row.id,
        profile_id: row.user_id,
        license_document_url: row.license_url || '',
        student_id_url: row.student_id_url || '',
        status: row.status as any || 'pending',
        submitted_at: row.created_at || new Date().toISOString(),
        review_notes: row.admin_note || '',
        license_number: '',
        license_type: 'NCK License',
        state_country: 'Kenya',
        nurse_name: profile?.full_name || 'Healthcare Associate',
        nurse_email: profile?.email || ''
      };
    });
  },

  // Submit a new verification request — FIXED: license details now persisted in admin_note
  async submitVerificationRequest(req: Omit<VerificationRequest, 'id' | 'status' | 'submitted_at'>): Promise<VerificationRequest> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured.');
    }

    const payload = {
      user_id: req.profile_id,
      license_url: req.license_document_url || null,
      student_id_url: req.student_id_url || null,
      status: 'pending',
      // Persist license metadata so the admin can review it. Until dedicated
      // columns are added to verification_requests, we store a structured note.
      admin_note: `Type: ${req.license_type || 'N/A'} | Number: ${req.license_number || 'N/A'} | State: ${req.state_country || 'N/A'}`
    };

    const { data, error } = await supabase!
      .from('verification_requests')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    // Reset verified flag on the profile until the admin approves
    await supabase!.from('profiles').update({ verified: false }).eq('id', req.profile_id);

    return {
      id: data.id,
      profile_id: data.user_id,
      license_document_url: data.license_url || '',
      student_id_url: data.student_id_url || '',
      status: data.status as any || 'pending',
      submitted_at: data.created_at || new Date().toISOString(),
      review_notes: data.admin_note || '',
      license_number: req.license_number || '',
      license_type: req.license_type || 'NCK License',
      state_country: req.state_country || 'Kenya'
    };
  },

  // Endorsements
  async getProfileEndorsements(profileId: string): Promise<any[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase!
      .from('profile_endorsements')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getProfileEndorsements error:', error);
      return [];
    }

    return data || [];
  },

  async getProfileById(profileId: string): Promise<any> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase!
      .from('profiles')
      .select('id, first_name, last_name, username, avatar_url, qualification, nursing_level')
      .eq('id', profileId)
      .single();

    if (error) {
      console.error('getProfileById error:', error);
      return null;
    }

    return data;
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
      .insert({
        endorser_id: endorserId,
        profile_id: profileId,
        specialty: specialty || null,
        message: message || null
      })
      .select()
      .single();

    if (error) {
      console.error('createEndorsement error:', error);
      throw error;
    }

    return data;
  },

  async deleteEndorsement(endorsementId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase!
      .from('profile_endorsements')
      .delete()
      .eq('id', endorsementId);

    if (error) {
      console.error('deleteEndorsement error:', error);
      throw error;
    }
  },

  // Admin review of verification request
  async reviewVerificationRequest(reqId: string, status: VerificationStatus, note?: string): Promise<VerificationRequest> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured.');
    }

    const { data, error } = await supabase!
      .from('verification_requests')
      .update({ status, admin_note: note || '' })
      .eq('id', reqId)
      .select()
      .single();
    if (error) throw error;

    await supabase!
      .from('profiles')
      .update({ verified: status === 'verified' })
      .eq('id', data.user_id);

    return {
      id: data.id,
      profile_id: data.user_id,
      license_document_url: data.license_url || '',
      student_id_url: data.student_id_url || '',
      status: data.status as any || 'pending',
      submitted_at: data.created_at || new Date().toISOString(),
      review_notes: data.admin_note || '',
      license_number: '',
      license_type: 'NCK License',
      state_country: 'Kenya'
    };
  },

  // ==========================================
  // ACCOUNT DELETION — wipes profile + related rows + storage + auth
  // ==========================================
  async deleteAccount(userId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    if (!userId) {
      throw new Error('A user id is required to delete an account.');
    }

    // 1. Delete child rows (best-effort — if a table doesn't exist, we log and continue)
    //    Order: children first so foreign keys don't block the profile deletion.
    const childTables: Array<{ table: string; cleanup: () => Promise<any> }> = [
      {
        table: 'cv_downloads',
        cleanup: () =>
          supabase!
            .from('cv_downloads')
            .delete()
            .or(`profile_id.eq.${userId},viewer_id.eq.${userId}`)
      },
      {
        table: 'profile_endorsements',
        cleanup: () =>
          supabase!
            .from('profile_endorsements')
            .delete()
            .or(`profile_id.eq.${userId},endorser_id.eq.${userId}`)
      },
      {
        table: 'verification_requests',
        cleanup: () =>
          supabase!.from('verification_requests').delete().eq('user_id', userId)
      },
      {
        table: 'uploaded_documents',
        cleanup: () =>
          supabase!.from('uploaded_documents').delete().eq('user_id', userId)
      },
      {
        table: 'nurse_skills',
        cleanup: () =>
          supabase!.from('nurse_skills').delete().eq('user_id', userId)
      },
      {
        table: 'experiences',
        cleanup: () =>
          supabase!.from('experiences').delete().eq('profile_id', userId)
      },
      {
        table: 'educations',
        cleanup: () =>
          supabase!.from('educations').delete().eq('profile_id', userId)
      },
      {
        table: 'certifications',
        cleanup: () =>
          supabase!.from('certifications').delete().eq('profile_id', userId)
      },
      {
        table: 'research_projects',
        cleanup: () =>
          supabase!.from('research_projects').delete().eq('profile_id', userId)
      },
      {
        table: 'analytics_events',
        cleanup: () =>
          supabase!.from('analytics_events').delete().eq('profile_id', userId)
      }
    ];

    for (const { table, cleanup } of childTables) {
      try {
        await cleanup();
      } catch (err) {
        console.warn(`Cleanup skipped for ${table}:`, err);
      }
    }

    // 2. Delete the profile row itself
    const { error: profileError } = await supabase!
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to delete profile row:', profileError);
      throw profileError;
    }

    // 3. Delete stored files under the user's folder (best-effort)
    try {
      const { data: files } = await supabase!.storage
        .from('profiles')
        .list(userId);

      if (files && files.length > 0) {
        const paths = files.map(f => `${userId}/${f.name}`);
        await supabase!.storage.from('profiles').remove(paths);
      }
    } catch (storageErr) {
      console.warn('Storage cleanup skipped:', storageErr);
    }

    // 4. Sign out the user.
    //    NOTE: Deleting the auth.users row itself requires the service_role key
    //    and must run server-side (Supabase Edge Function). For the client app,
    //    we wipe the profile and sign the user out, which leaves the auth row
    //    orphaned but harmless — a fresh signup will create a new profile stub.
    await supabase!.auth.signOut();
  },
};