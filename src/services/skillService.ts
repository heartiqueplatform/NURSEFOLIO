import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NurseSkill, ClinicalProcedure, ClinicalProcedureFormData } from '../types';

export const skillService = {

    // ============================================
    // NURSE SKILLS (Self-reported competencies)
    // ============================================

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
    },

    // ============================================
    // CLINICAL PROCEDURES (NCK Logbook)
    // ============================================

    // GET ALL CLINICAL PROCEDURES
    async getClinicalProcedures(userId: string): Promise<ClinicalProcedure[]> {
        try {
            if (!isSupabaseConfigured || !userId) return [];

            const { data, error } = await supabase!
                .from('clinical_procedures')
                .select('*')
                .eq('user_id', userId)
                .order('date_performed', { ascending: false });

            if (error) throw error;
            return data || [];

        } catch (err) {
            console.error('Could not fetch clinical procedures:', err);
            return [];
        }
    },

    // GET SINGLE CLINICAL PROCEDURE
    async getClinicalProcedure(id: string): Promise<ClinicalProcedure | null> {
        try {
            if (!isSupabaseConfigured || !id) return null;

            const { data, error } = await supabase!
                .from('clinical_procedures')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;

        } catch (err) {
            console.error('Could not fetch clinical procedure:', err);
            return null;
        }
    },

    // SAVE CLINICAL PROCEDURE (Insert or Update)
    async saveClinicalProcedure(procedure: {
        id?: string;
        user_id: string;
        procedure_name: string;
        category: string;
        attempts_count: number;
        date_performed: string;
        competency_level: string;
        facility_name?: string | null;
        department?: string | null;
        patient_initials?: string | null;
        supervisor_name: string;
        supervisor_title?: string | null;
        supervisor_license_number?: string | null;
        student_notes?: string | null;
        challenges_faced?: string | null;
        improvement_plan?: string | null;
        verification_status?: 'pending' | 'verified' | 'rejected';
    }): Promise<ClinicalProcedure> {

        try {
            if (!isSupabaseConfigured) {
                throw new Error('Supabase not configured');
            }

            let result;

            if (procedure.id) {
                // UPDATE
                const { data, error } = await supabase!
                    .from('clinical_procedures')
                    .update({
                        procedure_name: procedure.procedure_name,
                        category: procedure.category,
                        attempts_count: procedure.attempts_count,
                        date_performed: procedure.date_performed,
                        competency_level: procedure.competency_level,
                        facility_name: procedure.facility_name,
                        department: procedure.department,
                        patient_initials: procedure.patient_initials,
                        supervisor_name: procedure.supervisor_name,
                        supervisor_title: procedure.supervisor_title,
                        supervisor_license_number: procedure.supervisor_license_number,
                        student_notes: procedure.student_notes,
                        challenges_faced: procedure.challenges_faced,
                        improvement_plan: procedure.improvement_plan,
                        verification_status: procedure.verification_status || 'pending',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', procedure.id)
                    .select()
                    .single();

                if (error) throw error;
                result = data;

            } else {
                // INSERT
                const { data, error } = await supabase!
                    .from('clinical_procedures')
                    .insert({
                        user_id: procedure.user_id,
                        procedure_name: procedure.procedure_name,
                        category: procedure.category,
                        attempts_count: procedure.attempts_count,
                        date_performed: procedure.date_performed,
                        competency_level: procedure.competency_level,
                        facility_name: procedure.facility_name,
                        department: procedure.department,
                        patient_initials: procedure.patient_initials,
                        supervisor_name: procedure.supervisor_name,
                        supervisor_title: procedure.supervisor_title,
                        supervisor_license_number: procedure.supervisor_license_number,
                        student_notes: procedure.student_notes,
                        challenges_faced: procedure.challenges_faced,
                        improvement_plan: procedure.improvement_plan,
                        verification_status: procedure.verification_status || 'pending'
                    })
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            }

            return result;

        } catch (err) {
            console.error('Could not save clinical procedure:', err);
            throw err;
        }
    },

    // DELETE CLINICAL PROCEDURE
    async deleteClinicalProcedure(id: string): Promise<void> {
        try {
            if (!isSupabaseConfigured || !id) return;

            const { error } = await supabase!
                .from('clinical_procedures')
                .delete()
                .eq('id', id);

            if (error) throw error;

        } catch (err) {
            console.error('Could not delete clinical procedure:', err);
            throw err;
        }
    },

    // REQUEST VERIFICATION (send email to supervisor)
    async requestVerification(procedureId: string, staffEmail: string): Promise<void> {
        try {
            if (!isSupabaseConfigured) return;

            const { error } = await supabase!
                .from('procedure_verifications')
                .insert({
                    procedure_id: procedureId,
                    requested_to_email: staffEmail,
                    status: 'pending'
                });

            if (error) throw error;

        } catch (err) {
            console.error('Could not request verification:', err);
            throw err;
        }
    },

    // VERIFY PROCEDURE (staff signs off)
    async verifyProcedure(
        procedureId: string,
        status: 'verified' | 'rejected',
        comment: string,
        signature: string
    ): Promise<void> {
        try {
            if (!isSupabaseConfigured) return;

            const { error } = await supabase!
                .from('clinical_procedures')
                .update({
                    verification_status: status,
                    supervisor_comment: comment,
                    supervisor_signature: signature,
                    verified_at: new Date().toISOString()
                })
                .eq('id', procedureId);

            if (error) throw error;

        } catch (err) {
            console.error('Could not verify procedure:', err);
            throw err;
        }
    },

    // GET CLINICAL PROCEDURES STATS
    async getClinicalStats(userId: string): Promise<{
        total: number;
        verified: number;
        pending: number;
        rejected: number;
        completionPercentage: number;
    }> {
        try {
            const procedures = await this.getClinicalProcedures(userId);
            const total = procedures.length;
            const verified = procedures.filter(p => p.verification_status === 'verified').length;
            const pending = procedures.filter(p => p.verification_status === 'pending').length;
            const rejected = procedures.filter(p => p.verification_status === 'rejected').length;
            const requiredForNCK = 20;
            const completionPercentage = Math.min(100, (verified / requiredForNCK) * 100);

            return {
                total,
                verified,
                pending,
                rejected,
                completionPercentage
            };
        } catch (err) {
            console.error('Could not get clinical stats:', err);
            return {
                total: 0,
                verified: 0,
                pending: 0,
                rejected: 0,
                completionPercentage: 0
            };
        }
    },

    // GET PROCEDURES BY CATEGORY
    async getProceduresByCategory(userId: string): Promise<{ category: string; count: number }[]> {
        try {
            const procedures = await this.getClinicalProcedures(userId);
            const categoryMap = new Map<string, number>();

            procedures.forEach(proc => {
                const cat = proc.category || 'Uncategorized';
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
            });

            return Array.from(categoryMap.entries()).map(([category, count]) => ({
                category,
                count
            }));
        } catch (err) {
            console.error('Could not get procedures by category:', err);
            return [];
        }
    },

    // GET COMPETENCY DISTRIBUTION
    async getCompetencyDistribution(userId: string): Promise<{ level: string; count: number }[]> {
        try {
            const procedures = await this.getClinicalProcedures(userId);
            const competencyMap = new Map<string, number>();

            procedures.forEach(proc => {
                const level = proc.competency_level || 'Unknown';
                competencyMap.set(level, (competencyMap.get(level) || 0) + 1);
            });

            return Array.from(competencyMap.entries()).map(([level, count]) => ({
                level,
                count
            }));
        } catch (err) {
            console.error('Could not get competency distribution:', err);
            return [];
        }
    },

    // BULK DELETE (for testing or reset)
    async bulkDeleteClinicalProcedures(userId: string): Promise<void> {
        try {
            if (!isSupabaseConfigured || !userId) return;

            const { error } = await supabase!
                .from('clinical_procedures')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;

        } catch (err) {
            console.error('Could not bulk delete procedures:', err);
            throw err;
        }
    }
};