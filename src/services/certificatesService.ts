/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Certification } from '../types';

// ==========================================================
// DATE HELPERS
// ==========================================================
/**
 * The form sends "YYYY-MM" (month input).
 * The DB column is `date` and needs "YYYY-MM-DD".
 * We use the first of the month as a canonical value.
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

  // Anything else — let Postgres decide (it may accept or reject)
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
function mapRowToCertification(row: any): Certification {
  return {
    id: row.id,
    profile_id: row.profile_id || row.user_id,
    name: row.name || row.title || '',
    issuing_organization: row.issuing_organization || row.issuer || '',
    issue_date: toFormMonth(row.issue_date),
    expiration_date: row.expiration_date
      ? toFormMonth(row.expiration_date)
      : undefined,
    credential_id: row.credential_id || undefined,
    verification_url: row.verification_url || row.certificate_url || '',
  };
}

// ==========================================================
// SERVICE
// ==========================================================
export const certificatesService = {
  // ----------------------------------------------------------
  // READ
  // ----------------------------------------------------------
  async getCertifications(profileId: string): Promise<Certification[]> {
    if (!isSupabaseConfigured || !profileId) return [];

    try {
      // Match either profile_id or user_id (migration compat)
      const { data, error } = await supabase!
        .from('certifications')
        .select('*')
        .or(`profile_id.eq.${profileId},user_id.eq.${profileId}`)
        .order('issue_date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data || []).map(mapRowToCertification);
    } catch (err) {
      console.error('[certificatesService.getCertifications] failed:', err);
      return [];
    }
  },

  // ----------------------------------------------------------
  // WRITE — create or update
  // ----------------------------------------------------------
  async saveCertification(
    cert: Omit<Certification, 'id'> & { id?: string }
  ): Promise<Certification> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client not configured.');
    }
    if (!cert.profile_id) {
      throw new Error('Certification requires a profile_id.');
    }
    if (!cert.name?.trim()) {
      throw new Error('Certification name is required.');
    }
    if (!cert.issuing_organization?.trim()) {
      throw new Error('Issuing organization is required.');
    }

    // Write to BOTH column names during the migration window.
    // Old code reads `title` / `issuer` / `certificate_url`.
    // New code (and the SQL migration) reads `name` / `issuing_organization` / `verification_url`.
    // Once you've confirmed no code reads the old columns, drop them from the payload.
    const payload: Record<string, any> = {
      user_id: cert.profile_id,
      profile_id: cert.profile_id,

      name: cert.name.trim(),
      title: cert.name.trim(),

      issuing_organization: cert.issuing_organization.trim(),
      issuer: cert.issuing_organization.trim(),

      issue_date: toDbDate(cert.issue_date),

      verification_url: cert.verification_url?.trim() || null,
      certificate_url: cert.verification_url?.trim() || null,

      credential_id: cert.credential_id?.trim() || null,
      expiration_date: toDbDate(cert.expiration_date),
    };

    try {
      if (cert.id) {
        // ---- UPDATE ----
        const { data, error } = await supabase!
          .from('certifications')
          .update(payload)
          .eq('id', cert.id)
          .select()
          .single();

        if (error) throw error;
        return mapRowToCertification(data);
      }

      // ---- INSERT ----
      const { data, error } = await supabase!
        .from('certifications')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return mapRowToCertification(data);
    } catch (err: any) {
      console.error('[certificatesService.saveCertification] failed:', err);

      // Give the UI a friendlier message for the most common failures
      const msg = err?.message || '';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        throw new Error('A certification with this name already exists.');
      }
      if (msg.includes('violates not-null')) {
        throw new Error('Please fill in all required fields.');
      }
      throw err;
    }
  },

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------
  async deleteCertification(id: string): Promise<void> {
    if (!isSupabaseConfigured || !id) return;

    try {
      const { error } = await supabase!
        .from('certifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('[certificatesService.deleteCertification] failed:', err);
      throw err;
    }
  },
};