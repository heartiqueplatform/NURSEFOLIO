/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NurseSkill, ClinicalProcedure } from '../types';

// ==========================================================
// ROW → TYPED OBJECT MAPPERS
// ==========================================================
function mapSkillRow(row: any): NurseSkill {
    return {
        id: row.id,
        user_id: row.user_id,
        skill_name: row.skill_name || '',
        proficiency: row.proficiency || 'Intermediate',
        created_at: row.created_at,
    } as NurseSkill;
}

function mapProcedureRow(row: any): ClinicalProcedure {
    return {
        id: row.id,
        user_id: row.user_id,
        procedure_name: row.procedure_name || '',
        category: row.category || 'Basic Nursing',
        attempts_count: row.attempts_count ?? 1,
        date_performed: row.date_performed,
        competency_level: row.competency_level || '',
        facility_name: row.facility_name ?? null,
        department: row.department ?? null,
        patient_initials: row.patient_initials ?? null,
        supervisor_name: row.supervisor_name || '',
        supervisor_title: row.supervisor_title ?? null,
        supervisor_signature: row.supervisor_signature ?? null,
        supervisor_license_number: row.supervisor_license_number ?? null,
        verification_status: row.verification_status || 'pending',
        supervisor_comment: row.supervisor_comment ?? null,
        verified_at: row.verified_at ?? null,
        student_notes: row.student_notes ?? null,
        challenges_faced: row.challenges_faced ?? null,
        improvement_plan: row.improvement_plan ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
    } as ClinicalProcedure;
}

// ==========================================================
// SERVICE
// ==========================================================
export const skillService = {
    // ============================================
    // NURSE SKILLS
    // ============================================

    /**
     * Fetch all skills for a user as full objects.
     * Use this when the caller needs proficiency levels and IDs
     * (e.g. SkillsPage.tsx editing a skill).
     */
    async getSkills(userId: string): Promise<NurseSkill[]> {
        if (!isSupabaseConfigured || !userId) return [];

        try {
            const { data, error } = await supabase!
                .from('nurse_skills')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(mapSkillRow);
        } catch (err) {
            console.error('[skillService.getSkills] failed:', err);
            return [];
        }
    },

    /**
     * Fetch skills as a plain string array.
     * This is what profilesService and other shape-agnostic callers want.
     */
    async getSkillNames(userId: string): Promise<string[]> {
        if (!isSupabaseConfigured || !userId) return [];

        try {
            const { data, error } = await supabase!
                .from('nurse_skills')
                .select('skill_name')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map((row: any) => row.skill_name).filter(Boolean);
        } catch (err) {
            console.error('[skillService.getSkillNames] failed:', err);
            return [];
        }
    },

    /**
     * Replace a user's entire skills list.
     * Old skills are deleted, then the new list is inserted.
     *
     * NOTE: This is NOT atomic — if the insert fails after the delete,
     * the user's skills are wiped. For true atomicity, wrap in a Postgres
     * function. See the "Recommended RPC" section below.
     */
    async syncSkills(userId: string, skills: string[]): Promise<void> {
        if (!isSupabaseConfigured || !userId) return;

        try {
            // 1. Delete existing
            const { error: deleteErr } = await supabase!
                .from('nurse_skills')
                .delete()
                .eq('user_id', userId);

            if (deleteErr) throw deleteErr;

            // 2. Insert new (dedup, trim, filter empties)
            const clean = Array.from(
                new Set(
                    (skills || [])
                        .map(s => s.trim())
                        .filter(Boolean)
                )
            );

            if (clean.length === 0) return;

            const rows = clean.map(name => ({
                user_id: userId,
                skill_name: name,
                proficiency: 'Intermediate',
            }));

            const { error: insertErr } = await supabase!
                .from('nurse_skills')
                .insert(rows);

            if (insertErr) throw insertErr;
        } catch (err) {
            console.error('[skillService.syncSkills] failed:', err);
            throw err;
        }
    },

    /**
     * Create or update a single skill.
     */
    async saveSkill(skill: {
        id?: string;
        user_id: string;
        skill_name: string;
        proficiency?: string;
    }): Promise<NurseSkill> {
        if (!isSupabaseConfigured) throw new Error('Supabase not configured.');
        if (!skill.user_id) throw new Error('Skill requires a user_id.');
        if (!skill.skill_name?.trim()) throw new Error('Skill name is required.');

        const payload = {
            user_id: skill.user_id,
            skill_name: skill.skill_name.trim(),
            proficiency: skill.proficiency?.trim() || 'Intermediate',
        };

        try {
            if (skill.id) {
                const { data, error } = await supabase!
                    .from('nurse_skills')
                    .update({
                        skill_name: payload.skill_name,
                        proficiency: payload.proficiency,
                    })
                    .eq('id', skill.id)
                    .select()
                    .single();

                if (error) throw error;
                return mapSkillRow(data);
            }

            const { data, error } = await supabase!
                .from('nurse_skills')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            return mapSkillRow(data);
        } catch (err) {
            console.error('[skillService.saveSkill] failed:', err);
            throw err;
        }
    },

    /**
     * Delete a single skill.
     */
    async deleteSkill(id: string): Promise<void> {
        if (!isSupabaseConfigured || !id) return;

        try {
            const { error } = await supabase!
                .from('nurse_skills')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('[skillService.deleteSkill] failed:', err);
            throw err;
        }
    },

    // ============================================
    // CLINICAL PROCEDURES (NCK Logbook)
    // ============================================

    async getClinicalProcedures(userId: string): Promise<ClinicalProcedure[]> {
        if (!isSupabaseConfigured || !userId) return [];

        try {
            const { data, error } = await supabase!
                .from('clinical_procedures')
                .select('*')
                .eq('user_id', userId)
                .order('date_performed', { ascending: false });

            if (error) throw error;
            return (data || []).map(mapProcedureRow);
        } catch (err) {
            console.error('[skillService.getClinicalProcedures] failed:', err);
            return [];
        }
    },

    /**
     * Fetch only verified procedures — what PublicProfile.tsx uses.
     */
    async getVerifiedProcedures(userId: string, limit = 20): Promise<ClinicalProcedure[]> {
        if (!isSupabaseConfigured || !userId) return [];

        try {
            const { data, error } = await supabase!
                .from('clinical_procedures')
                .select('*')
                .eq('user_id', userId)
                .eq('verification_status', 'verified')
                .order('date_performed', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []).map(mapProcedureRow);
        } catch (err) {
            console.error('[skillService.getVerifiedProcedures] failed:', err);
            return [];
        }
    },

    async getClinicalProcedure(id: string): Promise<ClinicalProcedure | null> {
        if (!isSupabaseConfigured || !id) return null;

        try {
            const { data, error } = await supabase!
                .from('clinical_procedures')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data ? mapProcedureRow(data) : null;
        } catch (err) {
            console.error('[skillService.getClinicalProcedure] failed:', err);
            return null;
        }
    },

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
        if (!isSupabaseConfigured) throw new Error('Supabase not configured.');
        if (!procedure.user_id) throw new Error('Procedure requires a user_id.');
        if (!procedure.procedure_name?.trim()) throw new Error('Procedure name is required.');
        if (!procedure.competency_level) throw new Error('Competency level is required.');
        if (!procedure.supervisor_name?.trim()) throw new Error('Supervisor name is required.');

        const payload = {
            user_id: procedure.user_id,
            procedure_name: procedure.procedure_name.trim(),
            category: procedure.category || 'Basic Nursing',
            attempts_count: Math.max(1, procedure.attempts_count || 1),
            date_performed: procedure.date_performed,
            competency_level: procedure.competency_level,
            facility_name: procedure.facility_name?.trim() || null,
            department: procedure.department?.trim() || null,
            patient_initials: procedure.patient_initials?.trim().toUpperCase() || null,
            supervisor_name: procedure.supervisor_name.trim(),
            supervisor_title: procedure.supervisor_title?.trim() || null,
            supervisor_license_number: procedure.supervisor_license_number?.trim() || null,
            student_notes: procedure.student_notes?.trim() || null,
            challenges_faced: procedure.challenges_faced?.trim() || null,
            improvement_plan: procedure.improvement_plan?.trim() || null,
            verification_status: procedure.verification_status || 'pending',
        };

        try {
            if (procedure.id) {
                const { data, error } = await supabase!
                    .from('clinical_procedures')
                    .update({
                        ...payload,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', procedure.id)
                    .select()
                    .single();

                if (error) throw error;
                return mapProcedureRow(data);
            }

            const { data, error } = await supabase!
                .from('clinical_procedures')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            return mapProcedureRow(data);
        } catch (err) {
            console.error('[skillService.saveClinicalProcedure] failed:', err);
            throw err;
        }
    },

    async deleteClinicalProcedure(id: string): Promise<void> {
        if (!isSupabaseConfigured || !id) return;

        try {
            const { error } = await supabase!
                .from('clinical_procedures')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('[skillService.deleteClinicalProcedure] failed:', err);
            throw err;
        }
    },

    async requestVerification(procedureId: string, staffEmail: string): Promise<void> {
        if (!isSupabaseConfigured) return;

        try {
            const { error } = await supabase!
                .from('procedure_verifications')
                .insert({
                    procedure_id: procedureId,
                    requested_to_email: staffEmail,
                    status: 'pending',
                });

            if (error) throw error;
        } catch (err) {
            console.error('[skillService.requestVerification] failed:', err);
            throw err;
        }
    },

    async verifyProcedure(
        procedureId: string,
        status: 'verified' | 'rejected',
        comment: string,
        signature: string
    ): Promise<void> {
        if (!isSupabaseConfigured) return;

        try {
            const { error } = await supabase!
                .from('clinical_procedures')
                .update({
                    verification_status: status,
                    supervisor_comment: comment || null,
                    supervisor_signature: signature,
                    verified_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', procedureId);

            if (error) throw error;
        } catch (err) {
            console.error('[skillService.verifyProcedure] failed:', err);
            throw err;
        }
    },

    // ============================================
    // AGGREGATES
    // ============================================

    async getClinicalStats(userId: string): Promise<{
        total: number;
        verified: number;
        pending: number;
        rejected: number;
        completionPercentage: number;
    }> {
        if (!isSupabaseConfigured || !userId) {
            return { total: 0, verified: 0, pending: 0, rejected: 0, completionPercentage: 0 };
        }

        try {
            const procedures = await this.getClinicalProcedures(userId);
            const total = procedures.length;
            const verified = procedures.filter(p => p.verification_status === 'verified').length;
            const pending = procedures.filter(p => p.verification_status === 'pending').length;
            const rejected = procedures.filter(p => p.verification_status === 'rejected').length;
            const requiredForNCK = 20;
            const completionPercentage = Math.min(100, (verified / requiredForNCK) * 100);

            return { total, verified, pending, rejected, completionPercentage };
        } catch (err) {
            console.error('[skillService.getClinicalStats] failed:', err);
            return { total: 0, verified: 0, pending: 0, rejected: 0, completionPercentage: 0 };
        }
    },

    async getProceduresByCategory(userId: string): Promise<Array<{ category: string; count: number }>> {
        if (!isSupabaseConfigured || !userId) return [];

        try {
            const procedures = await this.getClinicalProcedures(userId);
            const map = new Map<string, number>();
            procedures.forEach(p => {
                const cat = p.category || 'Uncategorized';
                map.set(cat, (map.get(cat) || 0) + 1);
            });
            return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
        } catch {
            return [];
        }
    },

    async getCompetencyDistribution(userId: string): Promise<Array<{ level: string; count: number }>> {
        if (!isSupabaseConfigured || !userId) return [];

        try {
            const procedures = await this.getClinicalProcedures(userId);
            const map = new Map<string, number>();
            procedures.forEach(p => {
                const level = p.competency_level || 'Unknown';
                map.set(level, (map.get(level) || 0) + 1);
            });
            return Array.from(map.entries()).map(([level, count]) => ({ level, count }));
        } catch {
            return [];
        }
    },

    async bulkDeleteClinicalProcedures(userId: string): Promise<void> {
        if (!isSupabaseConfigured || !userId) return;

        try {
            const { error } = await supabase!
                .from('clinical_procedures')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;
        } catch (err) {
            console.error('[skillService.bulkDeleteClinicalProcedures] failed:', err);
            throw err;
        }
    },
};