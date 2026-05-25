import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Education } from '../types';

export const educationService = {
  async getEducations(profileId: string): Promise<Education[]> {
    try {
      if (!isSupabaseConfigured || !profileId) return [];

      const { data, error } = await supabase!
        .from('education')
        .select('*')
        .eq('user_id', profileId)
        .order('start_year', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any): Education => {
        const courseText = row.course || '';
        const parts = courseText.split(' in ');
        const degree = parts[0] || 'Bachelor';
        const field_of_study = parts.slice(1).join(' in ') || courseText;
        
        return {
          id: row.id,
          profile_id: row.user_id,
          institution: row.institution || '',
          degree,
          field_of_study,
          start_date: row.start_year ? `${row.start_year}-09` : '',
          end_date: row.end_year ? `${row.end_year}-05` : undefined,
          completed: !!row.end_year,
          gpa: (row.description || '').startsWith('GPA: ') ? row.description.replace('GPA: ', '') : undefined,
          description: row.description || ''
        };
      });
    } catch (err) {
      console.error('educationService.getEducations failed:', err);
      return [];
    }
  },

  async saveEducation(edu: Omit<Education, 'id'> & { id?: string }): Promise<Education> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase client not configured');
      }

      const startYear = edu.start_date ? parseInt(edu.start_date.split('-')[0], 10) || null : null;
      const endYear = edu.end_date ? parseInt(edu.end_date.split('-')[0], 10) || null : null;
      
      const dbPayload = {
        user_id: edu.profile_id,
        institution: (edu.institution || '').trim() || 'Nursing Academy',
        course: edu.degree && edu.field_of_study ? `${edu.degree} in ${edu.field_of_study}` : (edu.field_of_study || edu.degree || 'Nursing Studies'),
        start_year: startYear,
        end_year: endYear,
        description: edu.description || (edu.gpa ? `GPA: ${edu.gpa}` : '')
      };

      if (edu.id) {
        const { data, error } = await supabase!
          .from('education')
          .update(dbPayload)
          .eq('id', edu.id)
          .select()
          .single();

        if (error) throw error;
        
        const parts = (data.course || '').split(' in ');
        const degree = parts[0] || 'Bachelor';
        const field_of_study = parts.slice(1).join(' in ') || data.course || '';
        
        return {
          id: data.id,
          profile_id: data.user_id,
          institution: data.institution || '',
          degree,
          field_of_study,
          start_date: data.start_year ? `${data.start_year}-09` : '',
          end_date: data.end_year ? `${data.end_year}-05` : undefined,
          completed: !!data.end_year,
          gpa: (data.description || '').startsWith('GPA: ') ? data.description.replace('GPA: ', '') : undefined,
          description: data.description || ''
        };
      } else {
        const { data, error } = await supabase!
          .from('education')
          .insert(dbPayload)
          .select()
          .single();

        if (error) throw error;

        const parts = (data.course || '').split(' in ');
        const degree = parts[0] || 'Bachelor';
        const field_of_study = parts.slice(1).join(' in ') || data.course || '';

        return {
          id: data.id,
          profile_id: data.user_id,
          institution: data.institution || '',
          degree,
          field_of_study,
          start_date: data.start_year ? `${data.start_year}-09` : '',
          end_date: data.end_year ? `${data.end_year}-05` : undefined,
          completed: !!data.end_year,
          gpa: (data.description || '').startsWith('GPA: ') ? data.description.replace('GPA: ', '') : undefined,
          description: data.description || ''
        };
      }
    } catch (err: any) {
      console.error('educationService.saveEducation failed:', err);
      throw err;
    }
  },

  async deleteEducation(id: string): Promise<void> {
    try {
      if (!isSupabaseConfigured || !id) return;

      const { error } = await supabase!
        .from('education')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('educationService.deleteEducation failed:', err);
      throw err;
    }
  }
};
