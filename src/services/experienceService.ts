import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Experience } from '../types';

export const experienceService = {
  // 1. MAMA'S EAR: This fetches the list from the database
  async getExperiences(profileId: string): Promise<Experience[]> {
    try {
      if (!isSupabaseConfigured || !profileId) return [];

      const { data, error } = await supabase!
        .from('experiences')
        .select('*')
        .eq('user_id', profileId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      // We turn the database names into names our UI understands
      return (data || []).map((row: any): Experience => ({
        id: row.id,
        profile_id: row.user_id,
        facility: row.hospital_name || '',
        title: row.position || '',
        // Use substring(0,7) to keep the UI happy
        start_date: row.start_date ? row.start_date.substring(0, 7) : '',
        end_date: row.end_date ? row.end_date.substring(0, 7) : undefined,
        current: !!row.current_job,
        description: row.description || '',
        department: '',
        location: ''
      }));
    } catch (err) {
      console.error('Mama, I could not read the experiences:', err);
      return [];
    }
  },

  // 2. MAMA'S HAND: This saves a NEW card or UPDATES an old one
  async saveExperience(exp: Omit<Experience, 'id'> & { id?: string }): Promise<Experience> {
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase not connected');

      // --- MAMA'S SPECIAL TRICK ---
      // If the date is "2026-06", we turn it into "2026-06-01"
      // so the database doesn't get a headache.
      const formatToDbDate = (dateStr?: string) => {
        if (!dateStr) return null;
        // If it's already YYYY-MM-DD, leave it. If it's YYYY-MM, add -01
        return dateStr.length === 7 ? `${dateStr}-01` : dateStr;
      };

      const dbPayload = {
        user_id: exp.profile_id,
        hospital_name: exp.facility,
        position: exp.title,
        start_date: formatToDbDate(exp.start_date),
        end_date: exp.current ? null : formatToDbDate(exp.end_date),
        current_job: !!exp.current,
        description: exp.description
      };

      let result;

      if (exp.id) {
        const { data, error } = await supabase!
          .from('experiences')
          .update(dbPayload)
          .eq('id', exp.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase!
          .from('experiences')
          .insert(dbPayload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      // When we send it back to the UI, we cut off the "-01"
      // so the <input type="month"> can read it back!
      const formatFromDbDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return dateStr.substring(0, 7); // Takes "2026-06-01" and makes it "2026-06"
      };

      return {
        id: result.id,
        profile_id: result.user_id,
        facility: result.hospital_name || '',
        title: result.position || '',
        start_date: formatFromDbDate(result.start_date),
        end_date: formatFromDbDate(result.end_date) || undefined,
        current: !!result.current_job,
        description: result.description || '',
        department: '',
        location: ''
      };
    } catch (err: any) {
      console.error('could not save:', err);
      throw err;
    }
  },

  // 3. MAMA'S ERASER: This deletes a card
  async deleteExperience(id: string): Promise<void> {
    try {
      if (!isSupabaseConfigured || !id) return;

      const { error } = await supabase!
        .from('experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('I could not delete:', err);
      throw err;
    }
  }
};