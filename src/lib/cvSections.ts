/**
 * cvSections.ts
 *
 * The canonical registry of CV sections.
 *
 * WHY a registry instead of hardcoding section lists in three places:
 * The template, the customize sheet, and the preferences hook all need to
 * agree on what sections exist, what they're called, and which column they
 * belong to. A single registry makes "add a new section" a one-line change.
 *
 * Ordering rule: the array order is the DEFAULT order. User preferences
 * (in useCVPreferences) override it. Sections are grouped by column —
 * reordering within a column never moves a section across columns.
 *
 * Turn F addition: work_preferences. Nurses care about shift preference,
 * relocation willingness, and locum availability — these are hard facts
 * that belong on the CV, not buried in profile settings.
 */

export type CVSectionId =
    | 'summary'
    | 'skills'
    | 'competencies'
    | 'experience'
    | 'leadership'
    | 'education'
    | 'certifications'
    | 'endorsements'
    | 'awards'
    | 'strengths'
    | 'interests'
    | 'referees'
    | 'languages'
    | 'work_preferences'
    | 'availability';

export type CVColumn = 'left' | 'right';

export interface CVSectionMeta {
    id: CVSectionId;
    label: string;
    /** Which column this section lives in. Immutable — user reorders within. */
    column: CVColumn;
    /** Displayed in the sheet to explain what the section contains. */
    description: string;
}

/**
 * Left column = credentials and facts. Right column = narrative and proof.
 */
export const CV_SECTIONS: CVSectionMeta[] = [
    {
        id: 'summary',
        label: 'Professional Summary',
        column: 'right',
        description: 'Opening paragraph, generated from your profile',
    },
    {
        id: 'skills',
        label: 'Core Skills',
        column: 'left',
        description: 'Your top skills, ranked by proficiency',
    },
    {
        id: 'competencies',
        label: 'Clinical Competencies',
        column: 'left',
        description: 'Verified procedures with counts',
    },
    {
        id: 'experience',
        label: 'Experience',
        column: 'right',
        description: 'Work history from your profile',
    },
    {
        id: 'leadership',
        label: 'Leadership & Development',
        column: 'right',
        description: 'Founder roles, committees, mentorship positions',
    },
    {
        id: 'education',
        label: 'Education',
        column: 'right',
        description: 'Degrees and diplomas',
    },
    {
        id: 'certifications',
        label: 'Certifications',
        column: 'left',
        description: 'ACLS, BLS, and other credentials',
    },
    {
        id: 'endorsements',
        label: 'Endorsements',
        column: 'right',
        description: 'Quotes from colleagues and supervisors',
    },
    {
        id: 'awards',
        label: 'Awards & Honors',
        column: 'right',
        description: 'Recognitions from schools and employers',
    },
    {
        id: 'strengths',
        label: 'Professional Strengths',
        column: 'right',
        description: 'Values and qualities you bring to a role',
    },
    {
        id: 'interests',
        label: 'Interests',
        column: 'right',
        description: 'Professional interests and areas of focus',
    },
    {
        id: 'referees',
        label: 'Referees',
        column: 'right',
        description: 'Up to three professional references with contact details',
    },
    {
        id: 'languages',
        label: 'Languages',
        column: 'left',
        description: 'Languages you speak',
    },
    {
        id: 'work_preferences',
        label: 'Work Preferences',
        column: 'left',
        description: 'Shift preference, relocation, and locum availability',
    },
    {
        id: 'availability',
        label: 'Availability',
        column: 'right',
        description: 'Your current availability for work',
    },
];

export function defaultSectionOrder(): CVSectionId[] {
    return [
        ...CV_SECTIONS.filter((s) => s.column === 'left').map((s) => s.id),
        ...CV_SECTIONS.filter((s) => s.column === 'right').map((s) => s.id),
    ];
}

export function sectionMeta(id: CVSectionId): CVSectionMeta {
    const found = CV_SECTIONS.find((s) => s.id === id);
    if (!found) throw new Error(`Unknown CV section: ${id}`);
    return found;
}

export const REQUIRED_SECTIONS: CVSectionId[] = ['summary'];