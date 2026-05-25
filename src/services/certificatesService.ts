import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Certification } from '../types';

export const certificatesService = {
  async getCertifications(profileId: string): Promise<Certification[]> {
    try {
      if (!isSupabaseConfigured || !profileId) return [];

      const { data, error } = await supabase!
        .from('certifications')
        .select('*')
        .eq('user_id', profileId)
        .order('issue_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any): Certification => ({
        id: row.id,
        profile_id: row.user_id,
        name: row.title || '',
        issuing_organization: row.issuer || '',
        // When reading from DB, we change "2024-05-01" back to "2024-05" for our form
        issue_date: row.issue_date ? row.issue_date.substring(0, 7) : '',
        expiration_date: undefined,
        credential_id: undefined,
        verification_url: row.certificate_url || ''
      }));
    } catch (err) {
      console.error('Mama, I failed to get certs:', err);
      return [];
    }
  },

  async saveCertification(cert: Omit<Certification, 'id'> & { id?: string }): Promise<Certification> {
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase not configured');

      // --- MAMA'S DATE MAGIC ---
      // This turns "2026-06" into "2026-06-01" so the database is happy!
      const formatToDbDate = (dateStr?: string) => {
        if (!dateStr) return null;
        // If it's 7 characters (YYYY-MM), add the day (-01)
        return dateStr.length === 7 ? `${dateStr}-01` : dateStr;
      };

      const dbPayload = {
        user_id: cert.profile_id,
        title: (cert.name || '').trim(),
        issuer: (cert.issuing_organization || '').trim(),
        issue_date: formatToDbDate(cert.issue_date), // <--- THE FIX IS HERE!
        certificate_url: cert.verification_url || null
      };

      let result;

      if (cert.id) {
        // We are EDITING
        const { data, error } = await supabase!
          .from('certifications')
          .update(dbPayload)
          .eq('id', cert.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        // We are ADDING NEW
        const { data, error } = await supabase!
          .from('certifications')
          .insert(dbPayload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      return {
        id: result.id,
        profile_id: result.user_id,
        name: result.title || '',
        issuing_organization: result.issuer || '',
        // Clean the date back to "YYYY-MM" for the UI
        issue_date: result.issue_date ? result.issue_date.substring(0, 7) : '',
        expiration_date: undefined,
        credential_id: undefined,
        verification_url: result.certificate_url || ''
      };
    } catch (err: any) {
      // If we still get an error, Mama will tell us exactly why in the console
      console.error('I failed to save cert:', err);
      throw err;
    }
  },

  async deleteCertification(id: string): Promise<void> {
    try {
      if (!isSupabaseConfigured || !id) return;
      const { error } = await supabase!
        .from('certifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(' I failed to delete cert:', err);
      throw err;
    }
  }
};