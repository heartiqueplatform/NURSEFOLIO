/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Education } from '../types';

// ==========================================================
// ROW → TYPED OBJECT
// ==========================================================
function mapRowToEducation(row: any): Education {
  return {
    id: row.id,
    profile_id: row.profile_id || row.user_id,
    institution: row.institution || '',
    degree: row.degree || '',
    field_of_study: row.field_of_study || '',
    start_date: row.start_date || '',
    end_date: row.end_date || undefined,
    completed: row.completed ?? !!row.end_date,
    gpa: row.gpa || undefined,
    description: row.description || '',
  };
}

// ==========================================================
// SERVICE
// ==========================================================
export const educationService = {
  // ----------------------------------------------------------
  // READ — fetch all education rows for a profile
  // ----------------------------------------------------------
  async getEducations(profileId: string): Promise<Education[]> {
    if (!isSupabaseConfigured || !profileId) return [];

    try {
      // Order by start_date (text "YYYY-MM") descending — works
      // because ISO-formatted dates sort lexically.
      const { data, error } = await supabase!
        .from('education')
        .select('*')
        .or(`profile_id.eq.${profileId},user_id.eq.${profileId}`)
        .order('start_date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data || []).map(mapRowToEducation);
    } catch (err) {
      console.error('[educationService.getEducations] failed:', err);
      return [];
    }
  },

  // ----------------------------------------------------------
  // WRITE — create or update
  // ----------------------------------------------------------
  async saveEducation(
    edu: Omit<Education, 'id'> & { id?: string }
  ): Promise<Education> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured.');
    }

    // Normalise month precision. The date inputs already send YYYY-MM,
    // but if a caller sends YYYY-MM-DD we trim it down.
    const normalizeMonth = (d?: string | null): string | null => {
      if (!d) return null;
      const trimmed = d.trim();
      if (!trimmed) return null;
      // YYYY-MM-DD → YYYY-MM
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed.slice(0, 7);
      // YYYY-MM → YYYY-MM
      if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
      // YYYY → YYYY-01
      if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01`;
      return null;
    };

    const payload = {
      // Keep both columns in sync during migration. Whichever the
      // reader uses, the data is there.
      user_id: edu.profile_id,
      profile_id: edu.profile_id,
      institution: (edu.institution || '').trim() || 'Nursing Academy',
      degree: (edu.degree || '').trim() || '',
      field_of_study: (edu.field_of_study || '').trim() || '',
      start_date: normalizeMonth(edu.start_date),
      end_date: edu.completed ? normalizeMonth(edu.end_date) : null,
      completed: edu.completed ?? true,
      gpa: edu.gpa?.trim() || null,
      description: (edu.description || '').trim() || null,
    };

    try {
      if (edu.id) {
        // ---- UPDATE ----
        const { data, error } = await supabase!
          .from('education')
          .update(payload)
          .eq('id', edu.id)
          .select()
          .single();

        if (error) throw error;
        return mapRowToEducation(data);
      }

      // ---- INSERT ----
      const { data, error } = await supabase!
        .from('education')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return mapRowToEducation(data);
    } catch (err) {
      console.error('[educationService.saveEducation] failed:', err);
      throw err;
    }
  },

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------
  async deleteEducation(id: string): Promise<void> {
    if (!isSupabaseConfigured || !id) return;

    try {
      const { error } = await supabase!
        .from('education')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('[educationService.deleteEducation] failed:', err);
      throw err;
    }
  },
};