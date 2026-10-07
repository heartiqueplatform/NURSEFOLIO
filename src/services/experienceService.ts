/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Experience } from '../types';

// ==========================================================
// DATE HELPERS
// ==========================================================
/**
 * The form uses `<input type="month">` → "YYYY-MM".
 * The DB column is `date` → needs "YYYY-MM-DD".
 * We use the first of the month as the canonical day.
 */
function toDbDate(monthStr?: string | null): string | null {
  if (!monthStr) return null;
  const trimmed = monthStr.trim();
  if (!trimmed) return null;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // YYYY-MM → YYYY-MM-01
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  // YYYY → YYYY-01-01
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;
  return trimmed;
}

/**
 * The DB returns "YYYY-MM-DD". The form expects "YYYY-MM".
 */
function toFormMonth(dbDate?: string | null): string {
  if (!dbDate) return '';
  return dbDate.length >= 7 ? dbDate.substring(0, 7) : dbDate;
}

// ==========================================================
// ROW → TYPED OBJECT
// ==========================================================
function mapRowToExperience(row: any): Experience {
  return {
    id: row.id,
    profile_id: row.profile_id || row.user_id,
    title: row.title || row.position || '',
    facility: row.facility || row.hospital_name || '',
    department: row.department || '',
    location: row.location || '',
    start_date: toFormMonth(row.start_date),
    end_date: row.current ? undefined : toFormMonth(row.end_date),
    current: row.current ?? row.current_job ?? false,
    description: row.description || '',
  };
}

// ==========================================================
// SERVICE
// ==========================================================
export const experienceService = {
  // ----------------------------------------------------------
  // READ
  // ----------------------------------------------------------
  async getExperiences(profileId: string): Promise<Experience[]> {
    if (!isSupabaseConfigured || !profileId) return [];

    try {
      // Match either profile_id or user_id (migration compat)
      const { data, error } = await supabase!
        .from('experiences')
        .select('*')
        .or(`profile_id.eq.${profileId},user_id.eq.${profileId}`)
        .order('start_date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data || []).map(mapRowToExperience);
    } catch (err) {
      console.error('[experienceService.getExperiences] failed:', err);
      return [];
    }
  },

  // ----------------------------------------------------------
  // WRITE — create or update
  // ----------------------------------------------------------
  async saveExperience(
    exp: Omit<Experience, 'id'> & { id?: string }
  ): Promise<Experience> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured.');
    }
    if (!exp.profile_id) {
      throw new Error('Experience requires a profile_id.');
    }
    if (!exp.title?.trim()) {
      throw new Error('Job title is required.');
    }
    if (!exp.facility?.trim()) {
      throw new Error('Facility is required.');
    }
    if (!exp.start_date) {
      throw new Error('Start date is required.');
    }
    if (!exp.current && !exp.end_date) {
      throw new Error('Please provide an end date, or mark as current.');
    }

    // Write to BOTH column names during the migration window.
    // Old code reads `position` / `hospital_name` / `current_job`.
    // New code reads `title` / `facility` / `current`.
    // Once you've confirmed all reads use the new columns, drop the old ones from the payload.
    const payload: Record<string, any> = {
      // Identity
      user_id: exp.profile_id,
      profile_id: exp.profile_id,

      // New column names
      title: exp.title.trim(),
      facility: exp.facility.trim(),
      department: exp.department?.trim() || null,
      location: exp.location?.trim() || null,
      current: exp.current ?? false,

      // Old column names (kept during migration)
      position: exp.title.trim(),
      hospital_name: exp.facility.trim(),
      current_job: exp.current ?? false,

      // Dates
      start_date: toDbDate(exp.start_date),
      end_date: exp.current ? null : toDbDate(exp.end_date),

      // Body
      description: exp.description?.trim() || null,
    };

    try {
      if (exp.id) {
        // ---- UPDATE ----
        const { data, error } = await supabase!
          .from('experiences')
          .update(payload)
          .eq('id', exp.id)
          .select()
          .single();

        if (error) throw error;
        return mapRowToExperience(data);
      }

      // ---- INSERT ----
      const { data, error } = await supabase!
        .from('experiences')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return mapRowToExperience(data);
    } catch (err: any) {
      console.error('[experienceService.saveExperience] failed:', err);

      // Friendlier messages for common Postgres errors
      const msg = err?.message || '';
      if (msg.includes('violates not-null')) {
        throw new Error('Please fill in all required fields.');
      }
      if (msg.includes('invalid input syntax for type date')) {
        throw new Error('Please check the dates and try again.');
      }
      throw err;
    }
  },

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------
  async deleteExperience(id: string): Promise<void> {
    if (!isSupabaseConfigured || !id) return;

    try {
      const { error } = await supabase!
        .from('experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('[experienceService.deleteExperience] failed:', err);
      throw err;
    }
  },
};