import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ResearchProject } from '../types';

export const researchService = {
  async getResearchProjects(profileId: string): Promise<ResearchProject[]> {
    try {
      if (!isSupabaseConfigured || !profileId) return [];

      const { data, error } = await supabase!
        .from('research_projects')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any): ResearchProject => ({
        id: row.id,
        profile_id: row.user_id,
        title: row.title || '',
        journal_or_publisher: '',
        publication_date: '',
        co_authors: '',
        abstract_text: row.description || '',
        project_url: row.project_url || ''
      }));
    } catch (err) {
      console.error('researchService.getResearchProjects failed:', err);
      return [];
    }
  },

  async saveResearchProject(proj: Omit<ResearchProject, 'id'> & { id?: string }): Promise<ResearchProject> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase client not configured');
      }

      const dbPayload = {
        user_id: proj.profile_id,
        title: (proj.title || '').trim() || 'Clinical Informatics Study',
        description: (proj.abstract_text || '').trim(),
        project_url: proj.project_url || null
      };

      if (proj.id) {
        const { data, error } = await supabase!
          .from('research_projects')
          .update(dbPayload)
          .eq('id', proj.id)
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          profile_id: data.user_id,
          title: data.title || '',
          journal_or_publisher: '',
          publication_date: '',
          co_authors: '',
          abstract_text: data.description || '',
          project_url: data.project_url || ''
        };
      } else {
        const { data, error } = await supabase!
          .from('research_projects')
          .insert(dbPayload)
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          profile_id: data.user_id,
          title: data.title || '',
          journal_or_publisher: '',
          publication_date: '',
          co_authors: '',
          abstract_text: data.description || '',
          project_url: data.project_url || ''
        };
      }
    } catch (err: any) {
      console.error('researchService.saveResearchProject failed:', err);
      throw err;
    }
  },

  async deleteResearchProject(id: string): Promise<void> {
    try {
      if (!isSupabaseConfigured || !id) return;

      const { error } = await supabase!
        .from('research_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('researchService.deleteResearchProject failed:', err);
      throw err;
    }
  }
};
