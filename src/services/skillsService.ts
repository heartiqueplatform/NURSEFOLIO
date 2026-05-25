import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface NurseSkillRow {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency: string;
  created_at?: string;
}

export const skillsService = {
  async getSkills(userId: string): Promise<string[]> {
    try {
      if (!isSupabaseConfigured || !userId) return [];

      const { data, error } = await supabase!
        .from('nurse_skills')
        .select('skill_name')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map((row: any) => row.skill_name);
    } catch (err) {
      console.error('skillsService.getSkills failed:', err);
      return [];
    }
  },

  async syncSkills(userId: string, skills: string[]): Promise<void> {
    try {
      if (!isSupabaseConfigured || !userId) return;

      // Delete existing
      const { error: deleteErr } = await supabase!
        .from('nurse_skills')
        .delete()
        .eq('user_id', userId);

      if (deleteErr) throw deleteErr;

      // Filter and insert new
      const sanitized = (skills || [])
        .map(s => s.trim())
        .filter(Boolean);

      if (sanitized.length > 0) {
        const rows = sanitized.map(s => ({
          user_id: userId,
          skill_name: s,
          proficiency: 'expert'
        }));

        const { error: insertErr } = await supabase!
          .from('nurse_skills')
          .insert(rows);

        if (insertErr) throw insertErr;
      }
    } catch (err) {
      console.error('skillsService.syncSkills failed:', err);
      throw err;
    }
  }
};
