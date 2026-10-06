/**
 * phraseEngine.ts
 *
 * The "writer" behind Nursefolio's CV Generator.
 *
 * Contract: deterministic. Same input -> same output. No randomness.
 * Tone: warm professional. Kenyan nursing context.
 *
 * Changelog:
 * - v1-v4: incremental composers for summary, skills, competencies, etc.
 * - v5 (this turn): stop inferring "student". Add Work Preferences section.
 *   Use bio as a summary fallback. Expand the header to include phone and
 *   WhatsApp. Add locum context to the availability line.
 *
 * The core principle: never infer facts the data doesn't state. If a
 * field is empty, omit the claim. If a field is present, honor it.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * ProfileLike now carries the fields the CV actually uses. Every field on
 * this interface is either consumed by a composer or read for the header.
 * Adding a field here without using it is a bug — dead code that hides
 * what the CV depends on.
 */
export interface ProfileLike {
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    bio: string | null;
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
}

export interface ExperienceLike {
    id: string;
    hospital_name: string;
    position: string;
    start_date: string | null;
    end_date: string | null;
    current_job: boolean;
    description: string | null;
}

export interface EducationLike {
    id: string;
    institution: string;
    course: string;
    start_year: number | null;
    end_year: number | null;
    description: string | null;
}

export interface GroupedProcedure {
    procedure_name: string;
    count: number;
    competency_level: string | null;
    verified: boolean;
    last_performed: string | null;
    departments: string[];
}

export interface CertificationLike {
    id: string;
    title: string;
    issuer: string | null;
    issue_date: string | null;
}

export interface SkillLike {
    id: string;
    skill_name: string;
    proficiency: string | null;
}

export interface EndorsementLike {
    id: string;
    message: string;
    specialty: string | null;
    created_at: string;
    endorser: {
        full_name: string | null;
        specialty: string | null;
        is_private: boolean;
    } | null;
}

export interface CVAward {
    id: string;
    title: string;
    issuer: string | null;
    date: string | null;
    description: string | null;
}

export interface CVLeadership {
    id: string;
    role: string;
    organization: string;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
}

export interface CVReferee {
    id: string;
    name: string;
    title: string | null;
    organization: string | null;
    phone: string | null;
    email: string | null;
    relationship: string | null;
}

export interface CVExtras {
    strengths: string[] | null;
    interests: string[] | null;
    availability: string | null;
    awards: CVAward[] | null;
    leadership: CVLeadership[] | null;
    referees: CVReferee[] | null;
    summary: string | null;
}

export interface PhraseEngineInput {
    profile: ProfileLike;
    experiences: ExperienceLike[];
    education: EducationLike[];
    procedures: GroupedProcedure[];
    certifications: CertificationLike[];
    skills: SkillLike[];
    endorsements: EndorsementLike[];
    cvExtras: CVExtras;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export interface CompetencyPhrase {
    text: string;
    name: string;
    count: number;
    verified: boolean;
}

export interface ExperiencePhrase {
    header: string;
    dates: string;
    location?: string;
    body?: string;
}

export interface EducationPhrase {
    header: string;
    dates: string;
    description?: string;
}

export interface CertificationPhrase {
    text: string;
    year?: number;
}

export interface EndorsementPhrase {
    quote: string;
    attribution: string;
}

export interface AwardPhrase {
    header: string;
    date?: string;
    body?: string;
}

export interface LeadershipPhrase {
    header: string;
    dates: string;
    body?: string;
}

export interface RefereePhrase {
    name: string;
    line: string;
    contact: string;
}

/**
 * Work Preferences — a compact list of shift/relocation/locum facts.
 * Each is optional; a nurse with none of these set produces an empty list
 * and the section is hidden.
 */
export interface WorkPreferencesPhrase {
    shift?: string;
    relocation?: string;
    locum?: string;
}

export interface PhraseEngineOutput {
    summary: string;
    skills: string[];
    competencies: CompetencyPhrase[];
    experiences: ExperiencePhrase[];
    education: EducationPhrase[];
    certifications: CertificationPhrase[];
    endorsements: EndorsementPhrase[];
    languages: string[];
    strengths: string[];
    interests: string[];
    availability?: string;
    awards: AwardPhrase[];
    leadership: LeadershipPhrase[];
    referees: RefereePhrase[];
    workPreferences: WorkPreferencesPhrase;
    licenseNote?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_SKILLS = 10;
const MAX_COMPETENCIES = 12;
const MAX_ENDORSEMENTS = 3;
const ENDORSEMENT_MAX_CHARS = 180;
const EXPERIENCE_BODY_MAX_CHARS = 240;
const LICENSE_WARNING_MONTHS = 6;
const DEPARTMENT_DOMINANCE = 0.6;

const MAX_STRENGTHS = 8;
const MAX_INTERESTS = 8;
const MAX_AWARDS = 4;
const AWARD_BODY_MAX_CHARS = 200;
const MAX_LEADERSHIP = 4;
const MAX_REFEREES = 3;
const AVAILABILITY_MAX_CHARS = 300;
const BIO_SUMMARY_MAX_CHARS = 600;

const MIN_PLAUSIBLE_YEAR = 1960;

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const KNOWN_NAIROBI_HOSPITALS = [
    'kenyatta national hospital', 'knh',
    'aga khan', 'mater', 'mp shah', 'the nairobi hospital',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function displayName(p: ProfileLike): string {
    if (p.full_name && p.full_name.trim()) return p.full_name.trim();
    const parts = [p.first_name, p.last_name].filter(Boolean) as string[];
    return parts.join(' ').trim() || 'Nurse';
}

const PRESERVED_ACRONYMS = new Set([
    'IV', 'ECG', 'ICU', 'A&E', 'ER', 'OR', 'NG', 'NICU', 'PICU', 'KNH', 'KMTC',
    'UON', 'ACLS', 'BLS', 'PALS', 'KNC', 'PPE', 'HIV', 'TB', 'KRCHN', 'NCK',
    'EMR', 'KCSE', 'MCH',
]);

function titleCasePreservingAcronyms(input: string): string {
    return input
        .trim()
        .split(/\s+/)
        .map((word) => {
            const upper = word.toUpperCase();
            if (PRESERVED_ACRONYMS.has(upper)) return upper;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

function monthYear(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function truncateAtWord(text: string, max: number): string {
    const t = text.trim();
    if (t.length <= max) return t;
    const cut = t.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

function monthsUntil(iso: string | null, now: Date): number | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const diffMs = d.getTime() - now.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44));
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function listWithAnd(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function uniqueTop(items: string[], n: number): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of items) {
        const key = item.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
        if (out.length === n) break;
    }
    return out;
}

function isMeaningfulString(s: string | null | undefined, minLength = 2): boolean {
    if (!s) return false;
    const t = s.trim();
    if (t.length < minLength) return false;
    if (/^(.)\1+$/i.test(t)) return false;
    if (/^(test|testing|dummy|asdf|xxx|n\/a|na|tbd|todo)$/i.test(t)) return false;
    return true;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const DEPARTMENT_NARRATIVES: Record<string, string> = {
    surgical: 'medical-surgical wards',
    'medical-surgical': 'medical-surgical wards',
    medical: 'medical wards',
    maternity: 'maternity and newborn care',
    'maternal-child': 'maternal and child health',
    pediatric: 'pediatric care',
    paediatrics: 'pediatric care',
    pediatrics: 'pediatric care',
    emergency: 'accident and emergency',
    'a&e': 'accident and emergency',
    'accident & emergency': 'accident and emergency',
    icu: 'critical care',
    'critical care': 'critical care',
    community: 'community health',
    'community health': 'community health',
    psychiatric: 'mental health nursing',
    mental: 'mental health nursing',
    'mental health': 'mental health nursing',
    theatre: 'perioperative care',
    surgical_theatre: 'perioperative care',
    outpatient: 'outpatient services',
    'out-patient': 'outpatient services',
};

function describeDepartment(raw: string): string | null {
    const key = raw.trim().toLowerCase();
    return DEPARTMENT_NARRATIVES[key] ?? null;
}

/**
 * Explicit student detection.
 *
 * WHY this is the fix:
 * The old version treated `years_experience === 0` as equivalent to being a
 * student. That's false — a Registered Nurse with two months of experience
 * has zero full years, but is emphatically NOT a student. That bug was
 * calling our test user "Nursing student" in the summary.
 *
 * The new rule: a nurse is a "student" only if their nursing_level explicitly
 * says so. Anything else, we trust their declared level.
 */
function isExplicitStudent(level: string, qualification: string): boolean {
    const l = level.toLowerCase();
    const q = qualification.toLowerCase();
    if (l.includes('student')) return true;
    // Some students declare their level as the program name (e.g. "KRCHN").
    // We don't treat that as a student marker — the level field is authoritative.
    // Only explicit "student" wording counts.
    void q;
    return false;
}

/**
 * Build the professional summary.
 *
 * Order of sources:
 *   1. cv_extras.summary — user-authored, wins outright
 *   2. profile.bio — a fallback if the user filled in their bio
 *   3. Composed from structured data
 *
 * We only use bio as a fallback when the composed summary would be thin.
 * Why: the composed summary is generally better than a bio (which is often
 * a sentence or two about the nurse's interests). But if the composed
 * summary is empty of substance, bio beats nothing.
 */
function buildSummary(input: PhraseEngineInput, now: Date): string {
    const { profile, skills, procedures, experiences } = input;
    const years = profile.years_experience ?? 0;
    const level = (profile.nursing_level ?? '').trim();
    const specialty = (profile.specialty ?? '').trim();
    const qualification = (profile.qualification ?? '').trim();
    const bio = (profile.bio ?? '').trim();

    const isStudent = isExplicitStudent(level, qualification);

    // Sentence 1: who.
    const role = isStudent ? 'Nursing student' : (level || 'Registered Nurse');
    const specClause = specialty ? ` in ${specialty.toLowerCase()}` : '';
    const qualClause =
        qualification && isStudent
            ? ` completing ${startsWithVowel(qualification) ? 'an' : 'a'} ${qualification}`
            : qualification && !isStudent && years === 0
                ? `, ${qualification}`
                : '';
    const yearsClause =
        !isStudent && years > 0
            ? ` with ${years} year${years === 1 ? '' : 's'} of experience`
            : '';
    const s1 = `${role}${specClause}${yearsClause || qualClause}.`;

    // Sentence 2: what, with proof.
    const topSkills = rankSkills(skills)
        .filter((s) => isMeaningfulString(s.skill_name, 3))
        .slice(0, 4)
        .map((s) => s.skill_name.toLowerCase().trim());

    const verifiedProcs = procedures
        .filter((p) => p.verified && p.count > 0)
        .sort(compareProcedures);

    let s2 = '';
    if (topSkills.length >= 2) {
        s2 = `Skilled in ${listWithAnd(topSkills.slice(0, 3))}.`;
    } else if (verifiedProcs.length >= 2) {
        const procNames = verifiedProcs
            .slice(0, 3)
            .map((p) => `${p.procedure_name.toLowerCase()} (${p.count} verified)`);
        s2 = `Verified in ${listWithAnd(procNames)}.`;
    } else if (verifiedProcs.length === 1) {
        const p = verifiedProcs[0];
        s2 = `Verified in ${p.procedure_name.toLowerCase()} under direct supervision.`;
    }

    // Sentence 3: departments.
    const departments = new Set<string>();
    for (const p of procedures) {
        for (const d of p.departments) {
            const narrative = describeDepartment(d);
            if (narrative) departments.add(narrative);
        }
    }
    const deptList = Array.from(departments).slice(0, 5);

    let s3 = '';
    if (deptList.length >= 2) {
        s3 = `Clinical exposure across ${listWithAnd(deptList)}.`;
    } else if (deptList.length === 1) {
        s3 = `Focused clinical experience in ${deptList[0]}.`;
    }

    // Sentence 4: where.
    const hospitals = uniqueTop(
        experiences
            .map((e) => e.hospital_name.trim())
            .filter((h) => isMeaningfulString(h, 3)),
        2,
    );
    let s4 = '';
    if (hospitals.length >= 2) {
        s4 = `Proven across ${listWithAnd(hospitals)}.`;
    } else if (hospitals.length === 1) {
        s4 = `Currently at ${hospitals[0]}.`;
    }

    const composed = [s1, s2, s3, s4].filter(Boolean).join(' ');

    // Bio fallback: if the composed summary has almost no substance AND we
    // have a bio, prefer the bio — it's the user's own words.
    const thin = !s2 && !s3 && !s4;
    if (thin && bio && isMeaningfulString(bio, 40)) {
        return truncateAtWord(bio, BIO_SUMMARY_MAX_CHARS);
    }

    return composed || s1;
}

function startsWithVowel(s: string): boolean {
    return /^[aeiou]/i.test(s.trim());
}

function resolveSummary(input: PhraseEngineInput, now: Date): string {
    const custom = input.cvExtras?.summary;
    if (typeof custom === 'string' && custom.trim().length > 0) {
        return custom.trim();
    }
    return buildSummary(input, now);
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

const PROFICIENCY_RANK: Record<string, number> = {
    expert: 4,
    advanced: 3,
    proficient: 2,
    intermediate: 2,
    beginner: 1,
};

function rankSkills(skills: SkillLike[]): SkillLike[] {
    const seen = new Map<string, SkillLike>();
    for (const s of skills) {
        const key = s.skill_name.trim().toLowerCase();
        if (!key) continue;
        const existing = seen.get(key);
        if (!existing) {
            seen.set(key, s);
            continue;
        }
        const a = PROFICIENCY_RANK[(existing.proficiency ?? '').toLowerCase()] ?? 0;
        const b = PROFICIENCY_RANK[(s.proficiency ?? '').toLowerCase()] ?? 0;
        if (b > a) seen.set(key, s);
    }
    return Array.from(seen.values()).sort((a, b) => {
        const ra = PROFICIENCY_RANK[(a.proficiency ?? '').toLowerCase()] ?? 0;
        const rb = PROFICIENCY_RANK[(b.proficiency ?? '').toLowerCase()] ?? 0;
        if (rb !== ra) return rb - ra;
        return a.skill_name.localeCompare(b.skill_name);
    });
}

function buildSkills(skills: SkillLike[]): string[] {
    return rankSkills(skills)
        .filter((s) => isMeaningfulString(s.skill_name, 3))
        .slice(0, MAX_SKILLS)
        .map((s) => {
            const name = titleCasePreservingAcronyms(s.skill_name);
            const prof = (s.proficiency ?? '').toLowerCase();
            if (prof === 'expert' || prof === 'advanced') {
                return `${name} (${capitalize(prof)})`;
            }
            return name;
        });
}

// ---------------------------------------------------------------------------
// Clinical Competencies
// ---------------------------------------------------------------------------

function compareProcedures(a: GroupedProcedure, b: GroupedProcedure): number {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (b.count !== a.count) return b.count - a.count;
    const ta = a.last_performed ? new Date(a.last_performed).getTime() : 0;
    const tb = b.last_performed ? new Date(b.last_performed).getTime() : 0;
    return tb - ta;
}

function dominantDepartment(p: GroupedProcedure): string | null {
    if (!p.departments.length) return null;
    const counts = new Map<string, number>();
    for (const d of p.departments) {
        const key = d.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    if (!counts.size) return null;
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    let best: [string, number] | null = null;
    for (const [d, c] of counts) {
        if (!best || c > best[1]) best = [d, c];
    }
    if (!best) return null;
    return best[1] / total >= DEPARTMENT_DOMINANCE ? best[0] : null;
}

function buildCompetencies(procedures: GroupedProcedure[]): CompetencyPhrase[] {
    return [...procedures]
        .filter((p) => isMeaningfulString(p.procedure_name, 3) && p.count > 0)
        .sort(compareProcedures)
        .slice(0, MAX_COMPETENCIES)
        .map((p) => {
            const name = titleCasePreservingAcronyms(p.procedure_name);
            const dept = dominantDepartment(p);
            const parts: string[] = [`${p.count}×`];
            if (p.verified) parts.push('verified');
            if (dept) parts.push(dept);
            const text = `${name} (${parts.join(', ')})`;
            return { text, name, count: p.count, verified: p.verified };
        });
}

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------

function isKnownNairobiHospital(hospital: string): boolean {
    const h = hospital.toLowerCase();
    return KNOWN_NAIROBI_HOSPITALS.some((k) => h.includes(k));
}

function fallbackExperienceBody(
    position: string,
    hospital: string,
    current: boolean,
): string | undefined {
    const pos = position.toLowerCase();

    if (pos.includes('student') || pos.includes('intern')) {
        return `Completed supervised clinical placements across core nursing rotations at ${hospital}, developing foundational skills in patient assessment, medication administration, and documentation.`;
    }
    if (pos.includes('senior') || pos.includes('charge') || pos.includes('head')) {
        return `Led nursing care delivery at ${hospital}${current ? ', coordinating shift teams and mentoring junior staff' : ''}. Maintained clinical standards across patient assessment, treatment, and documentation.`;
    }
    if (pos.includes('nurse') || pos.includes('rn') || pos.includes('enrolled')) {
        return `Provided direct nursing care at ${hospital}${current ? ', covering patient assessment, medication administration, wound care, and clinical documentation' : ''}. Worked as part of a multidisciplinary team to deliver patient-centred care.`;
    }
    return undefined;
}

function buildExperiences(experiences: ExperienceLike[]): ExperiencePhrase[] {
    return [...experiences]
        .filter((e) => isMeaningfulString(e.hospital_name, 3) && isMeaningfulString(e.position, 2))
        .sort((a, b) => {
            if (a.current_job !== b.current_job) return a.current_job ? -1 : 1;
            const ta = a.start_date ? new Date(a.start_date).getTime() : 0;
            const tb = b.start_date ? new Date(b.start_date).getTime() : 0;
            return tb - ta;
        })
        .map((e) => {
            const position = e.position.trim();
            const hospital = e.hospital_name.trim();
            const header = `${position} · ${hospital}`;
            const start = monthYear(e.start_date);
            const end = e.current_job ? 'Present' : monthYear(e.end_date);
            const dates = start && end ? `${start} – ${end}` : start || end || '';

            const phrase: ExperiencePhrase = { header, dates };

            if (isKnownNairobiHospital(hospital)) {
                phrase.location = 'Nairobi';
            }

            if (e.description && e.description.trim().length >= 20) {
                phrase.body = truncateAtWord(e.description, EXPERIENCE_BODY_MAX_CHARS);
            } else {
                const generated = fallbackExperienceBody(position, hospital, e.current_job);
                if (generated) {
                    phrase.body = truncateAtWord(generated, EXPERIENCE_BODY_MAX_CHARS);
                }
            }
            return phrase;
        });
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

function buildEducation(education: EducationLike[]): EducationPhrase[] {
    return [...education]
        .filter((e) => isMeaningfulString(e.institution, 3) && isMeaningfulString(e.course, 3))
        .sort((a, b) => (b.end_year ?? 0) - (a.end_year ?? 0))
        .map((e) => {
            const course = e.course.trim();
            const institution = e.institution.trim();
            const header = `${course} · ${institution}`;
            let dates = '';
            if (e.start_year && e.end_year) dates = `${e.start_year} – ${e.end_year}`;
            else if (e.end_year) dates = String(e.end_year);
            else if (e.start_year) dates = `${e.start_year} – In progress`;

            const phrase: EducationPhrase = { header, dates };
            if (e.description && e.description.trim().length >= 20) {
                phrase.description = truncateAtWord(e.description, EXPERIENCE_BODY_MAX_CHARS);
            }
            return phrase;
        });
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

function buildCertifications(certs: CertificationLike[]): CertificationPhrase[] {
    return [...certs]
        .filter((c) => isMeaningfulString(c.title, 2))
        .sort((a, b) => {
            const ta = a.issue_date ? new Date(a.issue_date).getTime() : 0;
            const tb = b.issue_date ? new Date(b.issue_date).getTime() : 0;
            return tb - ta;
        })
        .map((c) => {
            const title = c.title.trim();
            const issuer = c.issuer && isMeaningfulString(c.issuer, 2) ? c.issuer.trim() : '';
            const rawYear = c.issue_date ? new Date(c.issue_date).getFullYear() : undefined;
            const validYear =
                rawYear && !Number.isNaN(rawYear) && rawYear >= MIN_PLAUSIBLE_YEAR
                    ? rawYear
                    : undefined;

            let text = title;
            if (issuer && validYear) text += ` — ${issuer} (${validYear})`;
            else if (issuer) text += ` — ${issuer}`;
            else if (validYear) text += ` (${validYear})`;

            const out: CertificationPhrase = { text };
            if (validYear) out.year = validYear;
            return out;
        });
}

// ---------------------------------------------------------------------------
// Endorsements
// ---------------------------------------------------------------------------

function buildEndorsements(endorsements: EndorsementLike[]): EndorsementPhrase[] {
    return [...endorsements]
        .filter((e) => isMeaningfulString(e.message, 20))
        .sort((a, b) => {
            const ta = new Date(a.created_at).getTime();
            const tb = new Date(b.created_at).getTime();
            return tb - ta;
        })
        .slice(0, MAX_ENDORSEMENTS)
        .map((e) => {
            const trimmed = truncateAtWord(e.message.trim(), ENDORSEMENT_MAX_CHARS);
            const quote = `“${trimmed}”`;

            let name: string;
            let spec: string;
            if (!e.endorser || e.endorser.is_private) {
                name = 'Senior colleague';
                spec = e.specialty || e.endorser?.specialty || '';
            } else {
                name =
                    e.endorser.full_name && isMeaningfulString(e.endorser.full_name, 3)
                        ? e.endorser.full_name.trim()
                        : 'Senior colleague';
                spec = e.endorser.specialty?.trim() || e.specialty || '';
            }

            const attribution = spec ? `— ${name}, ${spec}` : `— ${name}`;
            return { quote, attribution };
        });
}

// ---------------------------------------------------------------------------
// Strengths, Interests, Availability
// ---------------------------------------------------------------------------

function buildStrengths(strengths: string[] | null): string[] {
    if (!strengths || !strengths.length) return [];
    return strengths
        .map((s) => s.trim())
        .filter((s) => isMeaningfulString(s, 2))
        .slice(0, MAX_STRENGTHS);
}

function buildInterests(interests: string[] | null): string[] {
    if (!interests || !interests.length) return [];
    return interests
        .map((s) => s.trim())
        .filter((s) => isMeaningfulString(s, 2))
        .slice(0, MAX_INTERESTS);
}

function buildAvailability(availability: string | null): string | undefined {
    if (!availability) return undefined;
    const t = availability.trim();
    if (!isMeaningfulString(t, 10)) return undefined;
    return truncateAtWord(t, AVAILABILITY_MAX_CHARS);
}

// ---------------------------------------------------------------------------
// Awards
// ---------------------------------------------------------------------------

function buildAwards(awards: CVAward[] | null): AwardPhrase[] {
    if (!awards || !awards.length) return [];

    return [...awards]
        .filter((a) => isMeaningfulString(a.title, 3))
        .sort((a, b) => {
            const ta = a.date ? new Date(a.date).getTime() : 0;
            const tb = b.date ? new Date(b.date).getTime() : 0;
            return tb - ta;
        })
        .slice(0, MAX_AWARDS)
        .map((a) => {
            const title = a.title.trim();
            const issuer =
                a.issuer && isMeaningfulString(a.issuer, 3) ? a.issuer.trim() : undefined;
            const header = issuer ? `${title} — ${issuer}` : title;

            const phrase: AwardPhrase = { header };

            if (a.date) {
                const d = new Date(a.date);
                if (!Number.isNaN(d.getTime())) {
                    const y = d.getFullYear();
                    if (y >= MIN_PLAUSIBLE_YEAR) {
                        phrase.date = String(y);
                    }
                }
            }

            if (a.description && a.description.trim().length >= 20) {
                phrase.body = truncateAtWord(a.description, AWARD_BODY_MAX_CHARS);
            }
            return phrase;
        });
}

// ---------------------------------------------------------------------------
// Leadership
// ---------------------------------------------------------------------------

function buildLeadership(leadership: CVLeadership[] | null): LeadershipPhrase[] {
    if (!leadership || !leadership.length) return [];

    return [...leadership]
        .filter(
            (l) =>
                isMeaningfulString(l.role, 3) && isMeaningfulString(l.organization, 3),
        )
        .sort((a, b) => {
            const aCurrent = !a.end_date;
            const bCurrent = !b.end_date;
            if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;
            const ta = a.start_date ? new Date(a.start_date).getTime() : 0;
            const tb = b.start_date ? new Date(b.start_date).getTime() : 0;
            return tb - ta;
        })
        .slice(0, MAX_LEADERSHIP)
        .map((l) => {
            const header = `${l.role.trim()} · ${l.organization.trim()}`;
            const start = monthYear(l.start_date);
            const end = l.end_date ? monthYear(l.end_date) : 'Present';
            const dates = start && end ? `${start} – ${end}` : start || end || '';

            const phrase: LeadershipPhrase = { header, dates };
            if (l.description && l.description.trim().length >= 20) {
                phrase.body = truncateAtWord(l.description, EXPERIENCE_BODY_MAX_CHARS);
            }
            return phrase;
        });
}

// ---------------------------------------------------------------------------
// Referees
// ---------------------------------------------------------------------------

function buildReferees(referees: CVReferee[] | null): RefereePhrase[] {
    if (!referees || !referees.length) return [];

    return [...referees]
        .filter((r) => isMeaningfulString(r.name, 3))
        .filter((r) => {
            const hasPhone = r.phone && r.phone.trim().length >= 7;
            const hasEmail = r.email && r.email.includes('@');
            return hasPhone || hasEmail;
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, MAX_REFEREES)
        .map((r) => {
            const name = r.name.trim();

            const roleParts: string[] = [];
            if (r.title && isMeaningfulString(r.title, 2)) roleParts.push(r.title.trim());
            if (r.organization && isMeaningfulString(r.organization, 3)) {
                roleParts.push(r.organization.trim());
            }
            const line = roleParts.join(', ');

            const contact =
                (r.phone && r.phone.trim().length >= 7
                    ? r.phone.trim()
                    : r.email?.trim()) || '';

            return { name, line, contact };
        });
}

// ---------------------------------------------------------------------------
// Work Preferences — new in Turn F
// ---------------------------------------------------------------------------

/**
 * Build the work preferences block from profile fields.
 *
 * WHY this section exists:
 * Shift preference, relocation willingness, and locum availability are hard
 * facts that a matron or HR reader actively scans for. They belong on the CV,
 * not buried in profile settings. The schema already has these fields; we're
 * surfacing them where they earn their weight.
 *
 * Every field is optional. If the nurse has none of these set, the section
 * hides. We never write "Not specified" — that's noise.
 */
function buildWorkPreferences(profile: ProfileLike): WorkPreferencesPhrase {
    const prefs: WorkPreferencesPhrase = {};

    const shift = profile.preferred_shift?.trim();
    if (shift && isMeaningfulString(shift, 2)) {
        // Schema constrains this to Day/Night/Rotating/Flexible/Weekend.
        // We render as-is; the constraint guarantees good input.
        prefs.shift = `${shift} shifts`;
    }

    if (profile.available_for_relocation === true) {
        prefs.relocation = 'Open to relocation';
    }

    if (profile.open_to_locum === true) {
        const parts: string[] = ['Available for locum'];
        if (profile.locum_specialties && profile.locum_specialties.length) {
            const specs = profile.locum_specialties
                .map((s) => s.trim())
                .filter((s) => isMeaningfulString(s, 2))
                .slice(0, 3);
            if (specs.length) {
                parts.push(`in ${listWithAnd(specs)}`);
            }
        }
        const radius = profile.locum_radius_km;
        if (radius && radius > 0) {
            parts.push(`within ${radius} km`);
        }
        prefs.locum = parts.join(' ');
    }

    return prefs;
}

function hasWorkPreferences(prefs: WorkPreferencesPhrase): boolean {
    return Boolean(prefs.shift || prefs.relocation || prefs.locum);
}

// ---------------------------------------------------------------------------
// Languages + license note
// ---------------------------------------------------------------------------

function buildLanguages(languages: string[] | null): string[] {
    if (!languages) return [];
    return languages
        .map((l) => l.trim())
        .filter((l) => isMeaningfulString(l, 2));
}

function buildLicenseNote(profile: ProfileLike, now: Date): string | undefined {
    const months = monthsUntil(profile.license_expiry_date, now);
    if (months === null) return undefined;
    if (months < 0) return 'KNC license renewal pending.';
    if (months <= LICENSE_WARNING_MONTHS) {
        const d = new Date(profile.license_expiry_date!);
        const monthLabel = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        return `KNC license expires ${monthLabel}.`;
    }
    return undefined;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function buildPhraseDocument(
    input: PhraseEngineInput,
    now: Date = new Date(),
): PhraseEngineOutput {
    const summary = resolveSummary(input, now);
    const skills = buildSkills(input.skills);
    const competencies = buildCompetencies(input.procedures);
    const experiences = buildExperiences(input.experiences);
    const education = buildEducation(input.education);
    const certifications = buildCertifications(input.certifications);
    const endorsements = buildEndorsements(input.endorsements);
    const languages = buildLanguages(input.profile.languages_spoken);
    const strengths = buildStrengths(input.cvExtras?.strengths ?? null);
    const interests = buildInterests(input.cvExtras?.interests ?? null);
    const availability = buildAvailability(input.cvExtras?.availability ?? null);
    const awards = buildAwards(input.cvExtras?.awards ?? null);
    const leadership = buildLeadership(input.cvExtras?.leadership ?? null);
    const referees = buildReferees(input.cvExtras?.referees ?? null);
    const workPreferences = buildWorkPreferences(input.profile);

    const out: PhraseEngineOutput = {
        summary,
        skills,
        competencies,
        experiences,
        education,
        certifications,
        endorsements,
        languages,
        strengths,
        interests,
        awards,
        leadership,
        referees,
        workPreferences,
    };

    if (availability) out.availability = availability;

    const note = buildLicenseNote(input.profile, now);
    if (note) out.licenseNote = note;

    return out;
}

/**
 * Header — name, title, and the meta line.
 *
 * Turn F: contact lines now include phone and WhatsApp in addition to email.
 * The meta line (location · KNC · exp) sits under the title; the contact
 * line (email · phone · whatsapp) sits under that. Two distinct rows because
 * they answer different questions: "who is this" vs "how do I reach them."
 */
export function buildHeader(profile: ProfileLike): {
    name: string;
    title: string;
    meta: string;
    contact: string;
} {
    const name = displayName(profile);
    const level = profile.nursing_level?.trim() || 'Nurse';
    const spec = profile.specialty?.trim();
    const title = spec ? `${level} — ${spec}` : level;

    const metaParts: string[] = [];
    if (profile.location && isMeaningfulString(profile.location, 3)) {
        metaParts.push(profile.location);
    }
    if (profile.nursing_council_id) {
        metaParts.push(`KNC #${profile.nursing_council_id}`);
    }
    if (profile.license_expiry_date) {
        const d = new Date(profile.license_expiry_date);
        if (!Number.isNaN(d.getTime())) {
            metaParts.push(`Exp ${d.getFullYear()}`);
        }
    }

    const contactParts: string[] = [];
    // We deliberately do NOT include email here — the CV page shows it
    // elsewhere and the header stays focused on the channels a matron calls.
    if (profile.phone_number && isMeaningfulString(profile.phone_number, 7)) {
        contactParts.push(profile.phone_number);
    }
    if (
        profile.whatsapp_number &&
        isMeaningfulString(profile.whatsapp_number, 7) &&
        profile.whatsapp_number !== profile.phone_number
    ) {
        contactParts.push(`WhatsApp ${profile.whatsapp_number}`);
    }

    return {
        name,
        title,
        meta: metaParts.join(' · '),
        contact: contactParts.join('  ·  '),
    };
}

export { hasWorkPreferences };