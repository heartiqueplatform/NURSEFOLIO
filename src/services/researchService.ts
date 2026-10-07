/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ResearchProject } from '../types';

// ==========================================================
// DATE HELPERS
// ==========================================================
/**
 * The form uses `<input type="month">` → "YYYY-MM".
 * The DB column is `date` → "YYYY-MM-DD".
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
function mapRowToResearchProject(row: any): ResearchProject {
  return {
    id: row.id,
    profile_id: row.profile_id || row.user_id,
    title: row.title || '',
    journal_or_publisher: row.journal_or_publisher || '',
    publication_date: toFormMonth(row.publication_date),
    co_authors: row.co_authors || '',
    abstract_text: row.abstract_text || row.description || '',
    project_url: row.project_url || '',
  };
}

// ==========================================================
// SERVICE
// ==========================================================
export const researchService = {
  // ----------------------------------------------------------
  // READ
  // ----------------------------------------------------------
  async getResearchProjects(profileId: string): Promise<ResearchProject[]> {
    if (!isSupabaseConfigured || !profileId) return [];

    try {
      // Match either profile_id or user_id (migration compat)
      const { data, error } = await supabase!
        .from('research_projects')
        .select('*')
        .or(`profile_id.eq.${profileId},user_id.eq.${profileId}`)
        .order('publication_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRowToResearchProject);
    } catch (err) {
      console.error('[researchService.getResearchProjects] failed:', err);
      return [];
    }
  },

  // ----------------------------------------------------------
  // WRITE — create or update
  // ----------------------------------------------------------
  async saveResearchProject(
    proj: Omit<ResearchProject, 'id'> & { id?: string }
  ): Promise<ResearchProject> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured.');
    }
    if (!proj.profile_id) {
      throw new Error('Research project requires a profile_id.');
    }
    if (!proj.title?.trim()) {
      throw new Error('Title is required.');
    }

    // Write to BOTH column names during the migration window.
    // Old code reads `description`.
    // New code reads `abstract_text`.
    // Once you've confirmed all reads use `abstract_text`, drop `description` from the payload.
    const payload: Record<string, any> = {
      // Identity
      user_id: proj.profile_id,
      profile_id: proj.profile_id,

      // Title
      title: proj.title.trim(),

      // Publication metadata (added by the SQL migration)
      journal_or_publisher: proj.journal_or_publisher?.trim() || null,
      publication_date: toDbDate(proj.publication_date),
      co_authors: proj.co_authors?.trim() || null,

      // Abstract — write to both columns during migration
      abstract_text: proj.abstract_text?.trim() || null,
      description: proj.abstract_text?.trim() || null,

      // Link
      project_url: proj.project_url?.trim() || null,
    };

    try {
      if (proj.id) {
        // ---- UPDATE ----
        const { data, error } = await supabase!
          .from('research_projects')
          .update(payload)
          .eq('id', proj.id)
          .select()
          .single();

        if (error) throw error;
        return mapRowToResearchProject(data);
      }

      // ---- INSERT ----
      const { data, error } = await supabase!
        .from('research_projects')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return mapRowToResearchProject(data);
    } catch (err: any) {
      console.error('[researchService.saveResearchProject] failed:', err);

      // Friendlier messages for the most common failures
      const msg = err?.message || '';
      if (msg.includes('violates not-null')) {
        throw new Error('Please fill in all required fields.');
      }
      if (msg.includes('invalid input syntax for type date')) {
        throw new Error('Please check the publication date and try again.');
      }
      throw err;
    }
  },

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------
  async deleteResearchProject(id: string): Promise<void> {
    if (!isSupabaseConfigured || !id) return;

    try {
      const { error } = await supabase!
        .from('research_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('[researchService.deleteResearchProject] failed:', err);
      throw err;
    }
  },
};