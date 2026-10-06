/**
 * cvBuilder.ts
 *
 * Assembles CV data from Supabase and hands it to the phrase engine.
 *
 * Turn F changes:
 * - Reads the profile fields the phrase engine now consumes: bio,
 *   preferred_shift, available_for_relocation, open_to_locum,
 *   locum_specialties, locum_radius_km, phone_number, whatsapp_number.
 * - Passes header.contact through the bundle for the CV page.
 *
 * The principle: the schema is the ceiling on how good a CV can be. If the
 * app has the data, the CV should see it. This file is the bridge.
 */

import { supabase } from '../lib/supabase';
import {
    buildPhraseDocument,
    buildHeader,
    type PhraseEngineInput,
    type PhraseEngineOutput,
    type GroupedProcedure,
    type EndorsementLike,
    type ProfileLike,
    type ExperienceLike,
    type EducationLike,
    type CertificationLike,
    type SkillLike,
    type CVExtras,
} from '../lib/phraseEngine';
import { normalizeCVExtras, emptyCVExtras } from './cvExtrasService';

export interface CVBundle {
    document: PhraseEngineOutput;
    header: {
        name: string;
        title: string;
        meta: string;
        contact: string;
    };
    profile: {
        avatar_url: string | null;
        email: string | null;
        phone_number: string | null;
        whatsapp_number: string | null;
    };
    builtAt: Date;
}

export class CVBuilderError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = 'CVBuilderError';
    }
}

interface ProfileRow {
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    bio: string | null;
    avatar_url: string | null;
    specialty: string | null;
    nursing_level: string | null;
    qualification: string | null;
    location: string | null;
    years_experience: number | null;
    languages_spoken: string[] | null;
    license_expiry_date: string | null;
    nursing_council_id: string | null;
    phone_number: string | null;
    whatsapp_number: string | null;
    preferred_shift: string | null;
    available_for_relocation: boolean | null;
    open_to_locum: boolean | null;
    locum_specialties: string[] | null;
    locum_radius_km: number | null;
    cv_extras: unknown;
}

interface ExperienceRow {
    id: string;
    hospital_name: string | null;
    position: string | null;
    start_date: string | null;
    end_date: string | null;
    current_job: boolean | null;
    description: string | null;
}

interface EducationRow {
    id: string;
    institution: string | null;
    course: string | null;
    start_year: number | null;
    end_year: number | null;
    description: string | null;
}

interface ProcedureRow {
    procedure_name: string | null;
    attempts_count: number | null;
    competency_level: string | null;
    verification_status: string | null;
    date_performed: string | null;
    facility_name: string | null;
    department: string | null;
}

interface CertificationRow {
    id: string;
    title: string | null;
    issuer: string | null;
    issue_date: string | null;
}

interface SkillRow {
    id: string;
    skill_name: string | null;
    proficiency: string | null;
}

interface EndorsementRow {
    id: string;
    message: string | null;
    specialty: string | null;
    created_at: string;
    endorser:
    | { full_name: string | null; specialty: string | null; profile_theme?: string | null }
    | { full_name: string | null; specialty: string | null; profile_theme?: string | null }[]
    | null;
}

async function loadProfile(userId: string): Promise<ProfileRow> {
    const { data, error } = await supabase
        .from('profiles')
        .select(
            'first_name, last_name, full_name, email, bio, avatar_url, specialty, ' +
            'nursing_level, qualification, location, years_experience, ' +
            'languages_spoken, license_expiry_date, nursing_council_id, ' +
            'phone_number, whatsapp_number, preferred_shift, ' +
            'available_for_relocation, open_to_locum, locum_specialties, ' +
            'locum_radius_km, cv_extras'
        )
        .eq('id', userId)
        .maybeSingle();

    if (error) throw new CVBuilderError('Failed to load profile', error);
    if (!data) throw new CVBuilderError('Profile not found');
    return data as ProfileRow;
}

async function loadExperiences(userId: string): Promise<ExperienceLike[]> {
    const { data, error } = await supabase
        .from('experiences')
        .select('id, hospital_name, position, start_date, end_date, current_job, description')
        .eq('user_id', userId);
    if (error || !data) return [];
    return (data as ExperienceRow[])
        .filter((r) => r.hospital_name && r.position)
        .map((r) => ({
            id: r.id,
            hospital_name: r.hospital_name!,
            position: r.position!,
            start_date: r.start_date,
            end_date: r.end_date,
            current_job: Boolean(r.current_job),
            description: r.description,
        }));
}

async function loadEducation(userId: string): Promise<EducationLike[]> {
    const { data, error } = await supabase
        .from('education')
        .select('id, institution, course, start_year, end_year, description')
        .eq('user_id', userId);
    if (error || !data) return [];
    return (data as EducationRow[])
        .filter((r) => r.institution && r.course)
        .map((r) => ({
            id: r.id,
            institution: r.institution!,
            course: r.course!,
            start_year: r.start_year,
            end_year: r.end_year,
            description: r.description,
        }));
}

async function loadProcedures(userId: string): Promise<GroupedProcedure[]> {
    const { data, error } = await supabase
        .from('clinical_procedures')
        .select(
            'procedure_name, attempts_count, competency_level, ' +
            'verification_status, date_performed, facility_name, department'
        )
        .eq('user_id', userId);
    if (error || !data) return [];
    return groupProcedures(data as ProcedureRow[]);
}

async function loadCertifications(userId: string): Promise<CertificationLike[]> {
    const { data, error } = await supabase
        .from('certifications')
        .select('id, title, issuer, issue_date')
        .eq('user_id', userId);
    if (error || !data) return [];
    return (data as CertificationRow[])
        .filter((r) => r.title)
        .map((r) => ({
            id: r.id,
            title: r.title!,
            issuer: r.issuer,
            issue_date: r.issue_date,
        }));
}

async function loadSkills(userId: string): Promise<SkillLike[]> {
    const { data, error } = await supabase
        .from('nurse_skills')
        .select('id, skill_name, proficiency')
        .eq('user_id', userId);
    if (error || !data) return [];
    return (data as SkillRow[])
        .filter((r) => r.skill_name)
        .map((r) => ({
            id: r.id,
            skill_name: r.skill_name!,
            proficiency: r.proficiency,
        }));
}

async function loadEndorsements(userId: string): Promise<EndorsementLike[]> {
    const { data, error } = await supabase
        .from('profile_endorsements')
        .select(
            'id, message, specialty, created_at, ' +
            'endorser:profiles!profile_endorsements_endorser_id_fkey(full_name, specialty, profile_theme)'
        )
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as EndorsementRow[])
        .filter((r) => r.message && r.message.trim())
        .map((r) => {
            const rawEndorser = Array.isArray(r.endorser) ? r.endorser[0] ?? null : r.endorser;
            return {
                id: r.id,
                message: r.message!,
                specialty: r.specialty,
                created_at: r.created_at,
                endorser: rawEndorser
                    ? {
                        full_name: rawEndorser.full_name,
                        specialty: rawEndorser.specialty,
                        is_private: rawEndorser.profile_theme === 'private',
                    }
                    : null,
            };
        });
}

function groupProcedures(rows: ProcedureRow[]): GroupedProcedure[] {
    const COMPETENCY_RANK: Record<string, number> = {
        expert: 4, advanced: 3, proficient: 2, competent: 2, beginner: 1, novice: 1,
    };

    const groups = new Map<string, {
        displayName: string;
        count: number;
        verified: boolean;
        competency_level: string | null;
        competencyRank: number;
        last_performed: string | null;
        departments: Set<string>;
    }>();

    for (const row of rows) {
        if (!row.procedure_name) continue;
        const key = row.procedure_name.trim().toLowerCase();
        if (!key) continue;

        const existing = groups.get(key) ?? {
            displayName: row.procedure_name.trim(),
            count: 0,
            verified: false,
            competency_level: null,
            competencyRank: 0,
            last_performed: null,
            departments: new Set<string>(),
        };

        existing.count += row.attempts_count ?? 1;
        if (row.verification_status === 'verified') existing.verified = true;

        const rank = COMPETENCY_RANK[(row.competency_level ?? '').toLowerCase()] ?? 0;
        if (rank > existing.competencyRank) {
            existing.competencyRank = rank;
            existing.competency_level = row.competency_level;
        }

        if (row.date_performed) {
            if (!existing.last_performed) {
                existing.last_performed = row.date_performed;
            } else {
                const a = new Date(existing.last_performed).getTime();
                const b = new Date(row.date_performed).getTime();
                if (b > a) existing.last_performed = row.date_performed;
            }
        }

        if (row.department && row.department.trim()) {
            existing.departments.add(row.department.trim());
        }

        groups.set(key, existing);
    }

    return Array.from(groups.values()).map((g) => ({
        procedure_name: g.displayName,
        count: g.count,
        competency_level: g.competency_level,
        verified: g.verified,
        last_performed: g.last_performed,
        departments: Array.from(g.departments),
    }));
}

export async function buildCV(userId: string): Promise<CVBundle> {
    const [profile, experiences, education, procedures, certifications, skills, endorsements] =
        await Promise.all([
            loadProfile(userId),
            loadExperiences(userId),
            loadEducation(userId),
            loadProcedures(userId),
            loadCertifications(userId),
            loadSkills(userId),
            loadEndorsements(userId),
        ]);

    const cvExtras: CVExtras =
        profile.cv_extras != null
            ? normalizeCVExtras(profile.cv_extras)
            : emptyCVExtras();

    const engineInput: PhraseEngineInput = {
        profile: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            full_name: profile.full_name,
            bio: profile.bio,
            specialty: profile.specialty,
            nursing_level: profile.nursing_level,
            qualification: profile.qualification,
            location: profile.location,
            years_experience: profile.years_experience,
            languages_spoken: profile.languages_spoken,
            license_expiry_date: profile.license_expiry_date,
            nursing_council_id: profile.nursing_council_id,
            phone_number: profile.phone_number,
            whatsapp_number: profile.whatsapp_number,
            preferred_shift: profile.preferred_shift,
            available_for_relocation: profile.available_for_relocation,
            open_to_locum: profile.open_to_locum,
            locum_specialties: profile.locum_specialties,
            locum_radius_km: profile.locum_radius_km,
        } as ProfileLike,
        experiences,
        education,
        procedures,
        certifications,
        skills,
        endorsements,
        cvExtras,
    };

    const document = buildPhraseDocument(engineInput);
    const header = buildHeader(engineInput.profile);

    return {
        document,
        header,
        profile: {
            avatar_url: profile.avatar_url,
            email: profile.email,
            phone_number: profile.phone_number,
            whatsapp_number: profile.whatsapp_number,
        },
        builtAt: new Date(),
    };
}

export const __test__ = { groupProcedures };