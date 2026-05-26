import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NurseSkill } from '../types';

export const skillService = {

    // GET SKILLS
    async getSkills(userId: string): Promise<NurseSkill[]> {
        try {
            if (!isSupabaseConfigured || !userId) return [];

            const { data, error } = await supabase!
                .from('nurse_skills')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];

        } catch (err) {
            console.error('Could not fetch skills:', err);
            return [];
        }
    },

    // SAVE SKILL
    async saveSkill(skill: {
        id?: string;
        user_id: string;
        skill_name: string;
        proficiency?: string;
    }): Promise<NurseSkill> {

        try {
            if (!isSupabaseConfigured) {
                throw new Error('Supabase not configured');
            }

            let result;

            if (skill.id) {

                // UPDATE
                const { data, error } = await supabase!
                    .from('nurse_skills')
                    .update({
                        skill_name: skill.skill_name,
                        proficiency: skill.proficiency
                    })
                    .eq('id', skill.id)
                    .select()
                    .single();

                if (error) throw error;

                result = data;

            } else {

                // INSERT
                const { data, error } = await supabase!
                    .from('nurse_skills')
                    .insert({
                        user_id: skill.user_id,
                        skill_name: skill.skill_name,
                        proficiency: skill.proficiency
                    })
                    .select()
                    .single();

                if (error) throw error;

                result = data;
            }

            return result;

        } catch (err) {
            console.error('Could not save skill:', err);
            throw err;
        }
    },

    // DELETE SKILL
    async deleteSkill(id: string): Promise<void> {
        try {
            if (!isSupabaseConfigured || !id) return;

            const { error } = await supabase!
                .from('nurse_skills')
                .delete()
                .eq('id', id);

            if (error) throw error;

        } catch (err) {
            console.error('Could not delete skill:', err);
            throw err;
        }
    }
};