/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { skillService } from '../services/skillService';
import { supabase } from '../lib/supabase';
import { NurseSkill, ClinicalProcedure } from '../types';
import {
    Plus, Trash2, Pencil, Check, X, Award, Calendar, UserCheck,
    FileSignature, Clock, Stethoscope, ChevronDown, Send,
    TrendingUp, Target, Flame, Crown, Loader2
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

// ==========================================================
// SHARED CLASSES
// ==========================================================
const inputClass =
    'w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition';

const labelClass =
    'block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5';

const INDIGO = 'indigo';
const EMERALD = 'emerald';

// ==========================================================
// SKILL TEMPLATES
// ==========================================================
const SKILL_TEMPLATES = [
    {
        id: 'general',
        label: 'General Nursing',
        text: `Clinical Experience: [X] years as a Registered Nurse
Core Competencies:
• Comprehensive patient assessment and clinical judgment
• Medication administration (oral, IV, IM, subcutaneous)
• Care plan development and implementation
• Patient and family education
• Interdisciplinary team collaboration
• Electronic health record (EHR) documentation
• Infection control and prevention

Certifications: BLS, ACLS
Special Skills: Critical thinking, time management, patient advocacy`,
    },
    {
        id: 'icu',
        label: 'ICU / Critical Care',
        text: `Clinical Experience: [X] years in Intensive Care Unit (ICU)
Procedures:
• Mechanical ventilation management
• Hemodynamic monitoring (arterial lines, CVP, PA catheter)
• Continuous renal replacement therapy (CRRT)
• Vasoactive medication titration
• Post-cardiac surgery recovery

Certifications: ACLS, CCRN, BLS`,
    },
    {
        id: 'er',
        label: 'Emergency / ER',
        text: `Clinical Experience: [X] years in Emergency Department (ER)
Procedures:
• Rapid triage and trauma assessment
• Code team participation and management
• Defibrillation and cardioversion
• Wound closure (suturing, staples, glue)
• Fracture splinting and immobilization

Certifications: ACLS, PALS, TNCC, BLS`,
    },
    {
        id: 'peds',
        label: 'Pediatrics',
        text: `Clinical Experience: [X] years in Pediatrics
Procedures:
• Pediatric growth and developmental assessment
• Vaccine administration (CDC schedule)
• Pediatric medication dosage calculation
• Respiratory support (HFNC, CPAP, BiPAP)
• Family-centered care and education

Certifications: PALS, CPN, BLS, NRP`,
    },
    {
        id: 'maternity',
        label: 'Maternity / L&D',
        text: `Clinical Experience: [X] years in Labor & Delivery
Procedures:
• Electronic fetal monitoring interpretation
• Labor induction and augmentation
• C-section and delivery support
• Newborn resuscitation (NRP)
• Postpartum assessment and breastfeeding support

Certifications: NRP, RNC-OB, C-EFM, BLS`,
    },
];

const PROCEDURE_CATEGORIES = [
    'Basic Nursing',
    'Medication Administration',
    'Wound Care',
    'Invasive Procedures',
    'Assessment',
    'Emergency',
];

const COMPETENCY_LEVELS = [
    'Observed Only',
    'Assisted',
    'Performed with Supervision',
    'Independent',
    'Can Teach Others',
];

// ==========================================================
// HELPERS
// ==========================================================
interface ParsedSkill {
    name: string;
    body: string | null;
}

function parseSkill(skillName: string): ParsedSkill {
    const [name, ...rest] = skillName.split('\n\n');
    return {
        name: name.trim(),
        body: rest.length > 0 ? rest.join('\n\n') : null,
    };
}

function getProficiencyWidth(p: string): string {
    switch (p) {
        case 'Beginner': return 'w-1/4';
        case 'Intermediate': return 'w-2/4';
        case 'Advanced': return 'w-3/4';
        case 'Expert': return 'w-full';
        default: return 'w-0';
    }
}

function getProficiencyColor(p: string): string {
    switch (p) {
        case 'Beginner': return 'bg-slate-400';
        case 'Intermediate': return 'bg-sky-500';
        case 'Advanced': return 'bg-indigo-500';
        case 'Expert': return 'bg-indigo-600';
        default: return 'bg-slate-300';
    }
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'verified':
            return {
                classes: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
                icon: Check,
                label: 'Verified',
            };
        case 'rejected':
            return {
                classes: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400',
                icon: X,
                label: 'Rejected',
            };
        default:
            return {
                classes: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
                icon: Clock,
                label: 'Pending',
            };
    }
}

function getStudentLevel(count: number) {
    if (count >= 300) return { name: 'Nurse Guru', icon: Crown, next: 500 };
    if (count >= 200) return { name: 'Premium Nurse', icon: Flame, next: 300 };
    if (count >= 100) return { name: 'Advanced Nurse', icon: TrendingUp, next: 200 };
    if (count >= 50) return { name: 'Intermediate Nurse', icon: Target, next: 100 };
    return { name: 'Beginner Nurse', icon: Award, next: 50 };
}

// ==========================================================
// SKILL CARD
// ==========================================================
const SkillCard = React.memo<{
    skill: NurseSkill;
    onEdit: (skill: NurseSkill) => void;
    onDelete: (id: string, name: string) => void;
}>(({ skill, onEdit, onDelete }) => {
    const { name, body } = useMemo(() => parseSkill(skill.skill_name), [skill.skill_name]);

    return (
        <article className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900">
            <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                        {name}
                    </h3>
                    {skill.proficiency && (
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                {skill.proficiency}
                            </span>
                            <div className="w-20 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${getProficiencyWidth(skill.proficiency)} ${getProficiencyColor(skill.proficiency)}`} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {body && (
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    {body.split('\n').map((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                            return (
                                <div key={idx} className="flex gap-2">
                                    <span className="text-indigo-500 dark:text-indigo-400 flex-shrink-0">•</span>
                                    <span className="flex-1 leading-relaxed">{trimmed.substring(1).trim()}</span>
                                </div>
                            );
                        }
                        if (trimmed.includes(':') && !trimmed.startsWith('•')) {
                            return (
                                <p key={idx} className="font-semibold text-slate-700 dark:text-slate-300 pt-1.5">
                                    {trimmed}
                                </p>
                            );
                        }
                        return (
                            <p key={idx} className="leading-relaxed">{trimmed}</p>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center gap-2 mt-3.5">
                <button
                    onClick={() => onEdit(skill)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800 transition"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                </button>
                <button
                    onClick={() => onDelete(skill.id, name)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-950/50 transition ml-auto"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                </button>
            </div>
        </article>
    );
});
SkillCard.displayName = 'SkillCard';

// ==========================================================
// PROCEDURE CARD
// ==========================================================
const ProcedureCard = React.memo<{
    proc: ClinicalProcedure;
    expanded: boolean;
    onToggleExpand: (id: string) => void;
    onEdit: (proc: ClinicalProcedure) => void;
    onDelete: (id: string, name: string) => void;
}>(({ proc, expanded, onToggleExpand, onEdit, onDelete }) => {
    const badge = getStatusBadge(proc.verification_status);
    const BadgeIcon = badge.icon;

    const verifyUrl = useMemo(
        () => `${window.location.origin}/verify/${proc.id}`,
        [proc.id]
    );

    const dateLabel = useMemo(
        () => new Date(proc.date_performed).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        }),
        [proc.date_performed]
    );

    return (
        <article className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900">
            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">
                            {proc.procedure_name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.classes}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateLabel}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                            <Award className="w-3 h-3" />
                            {proc.competency_level}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                            <UserCheck className="w-3 h-3" />
                            {proc.supervisor_name}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => onToggleExpand(proc.id)}
                    className="p-2 rounded-full active:bg-slate-100 dark:active:bg-zinc-900 transition flex-shrink-0"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                    <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>

            {expanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-900 space-y-3">
                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        {proc.facility_name && (
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide text-[10px]">
                                    Facility
                                </p>
                                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                                    {proc.facility_name}
                                </p>
                            </div>
                        )}
                        {proc.department && (
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide text-[10px]">
                                    Department
                                </p>
                                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                                    {proc.department}
                                </p>
                            </div>
                        )}
                        {proc.attempts_count > 1 && (
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide text-[10px]">
                                    Attempts
                                </p>
                                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                                    {proc.attempts_count}
                                </p>
                            </div>
                        )}
                        {proc.supervisor_title && (
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide text-[10px]">
                                    Supervisor title
                                </p>
                                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                                    {proc.supervisor_title}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Student reflections */}
                    {proc.student_notes && (
                        <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                                What I learned
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {proc.student_notes}
                            </p>
                        </div>
                    )}
                    {proc.challenges_faced && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                                Challenges
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {proc.challenges_faced}
                            </p>
                        </div>
                    )}
                    {proc.improvement_plan && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">
                                Improvement plan
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {proc.improvement_plan}
                            </p>
                        </div>
                    )}

                    {/* Share with supervisor */}
                    {proc.verification_status === 'pending' && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-3">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 mb-1.5">
                                <Send className="w-3 h-3" />
                                Share with {proc.supervisor_name} to sign
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="text-[10px] flex-1 break-all bg-white dark:bg-zinc-900 px-2 py-1.5 rounded-lg font-mono text-blue-800 dark:text-blue-300">
                                    {verifyUrl}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(verifyUrl)}
                                    className="px-3 py-1.5 rounded-full bg-blue-600 active:bg-blue-700 text-white text-xs font-bold flex-shrink-0"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(proc)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800 transition"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(proc.id, proc.procedure_name)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-950/50 transition ml-auto"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
});
ProcedureCard.displayName = 'ProcedureCard';

// ==========================================================
// SKELETON
// ==========================================================
const CardSkeleton = React.memo(() => (
    <div className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900 animate-pulse">
        <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
            </div>
        </div>
    </div>
));
CardSkeleton.displayName = 'CardSkeleton';

// ==========================================================
// MAIN
// ==========================================================
export default function SkillsPage() {
    const { user } = useAuth();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loadingRole, setLoadingRole] = useState(true);
    const loadedRoleForRef = useRef<string | null>(null);

    // ----------------------------------------------------------
    // Role
    // ----------------------------------------------------------
    useEffect(() => {
        if (!user?.id) {
            setLoadingRole(false);
            return;
        }

        let cancelled = false;
        setLoadingRole(true);

        (async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();                       // ← maybeSingle, not single
                if (error) throw error;
                if (!cancelled) setUserRole(data?.role || 'nurse');
            } catch (err) {
                console.error('Error fetching role:', err);
                if (!cancelled) setUserRole('nurse');
            } finally {
                if (!cancelled) setLoadingRole(false);
            }
        })();

        return () => { cancelled = true; };
    }, [user?.id]);

    // ==========================================================
    // NURSE STATE
    // ==========================================================
    const [skills, setSkills] = useState<NurseSkill[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(true);
    const [showSkillForm, setShowSkillForm] = useState(false);
    const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
    const [skillName, setSkillName] = useState('');
    const [skillDescription, setSkillDescription] = useState('');
    const [skillProficiency, setSkillProficiency] = useState('');
    const [savingSkill, setSavingSkill] = useState(false);
    const [skillMsg, setSkillMsg] = useState('');
    const [skillError, setSkillError] = useState('');

    // ==========================================================
    // STUDENT STATE
    // ==========================================================
    const [procedures, setProcedures] = useState<ClinicalProcedure[]>([]);
    const [loadingProcedures, setLoadingProcedures] = useState(true);
    const [showProcedureForm, setShowProcedureForm] = useState(false);
    const [editingProcId, setEditingProcId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [savingProc, setSavingProc] = useState(false);
    const [procMsg, setProcMsg] = useState('');
    const [procError, setProcError] = useState('');

    // Procedure form fields
    const [procedureName, setProcedureName] = useState('');
    const [category, setCategory] = useState(PROCEDURE_CATEGORIES[0]);
    const [attemptsCount, setAttemptsCount] = useState(1);
    const [datePerformed, setDatePerformed] = useState(() => new Date().toISOString().slice(0, 16));
    const [competencyLevel, setCompetencyLevel] = useState('');
    const [facilityName, setFacilityName] = useState('');
    const [department, setDepartment] = useState('');
    const [patientInitials, setPatientInitials] = useState('');
    const [supervisorName, setSupervisorName] = useState('');
    const [supervisorTitle, setSupervisorTitle] = useState('');
    const [supervisorLicense, setSupervisorLicense] = useState('');
    const [studentNotes, setStudentNotes] = useState('');
    const [challengesFaced, setChallengesFaced] = useState('');
    const [improvementPlan, setImprovementPlan] = useState('');

    // Delete confirmations
    const [deleteSkill, setDeleteSkill] = useState<{ id: string; name: string } | null>(null);
    const [deleteProcedure, setDeleteProcedure] = useState<{ id: string; name: string } | null>(null);

    // ==========================================================
    // FETCHERS
    // ==========================================================
    const fetchSkills = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoadingSkills(true);
            const data = await skillService.getSkills(user.id);
            setSkills(data);
        } catch (err) {
            console.error('Failed to load skills:', err);
            setSkillError('Could not load specialties.');
        } finally {
            setLoadingSkills(false);
        }
    }, [user?.id]);

    const fetchProcedures = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoadingProcedures(true);
            const { data, error } = await supabase
                .from('clinical_procedures')
                .select('*')
                .eq('user_id', user.id)
                .order('date_performed', { ascending: false });
            if (error) throw error;
            setProcedures(data || []);
        } catch (err) {
            console.error('Failed to load procedures:', err);
            setProcError('Could not load procedures.');
        } finally {
            setLoadingProcedures(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id || !userRole) return;
        if (userRole === 'nurse') fetchSkills();
        if (userRole === 'student') fetchProcedures();
        if (userRole !== 'student' && userRole !== 'nurse') {
            setLoadingSkills(false);
            setLoadingProcedures(false);
        }
    }, [user?.id, userRole, fetchSkills, fetchProcedures]);

    // ==========================================================
    // SKILL FORM
    // ==========================================================
    const resetSkillForm = useCallback(() => {
        setEditingSkillId(null);
        setSkillName('');
        setSkillDescription('');
        setSkillProficiency('');
        setShowSkillForm(false);
        setSkillError('');
    }, []);

    const toggleSkillForm = useCallback(() => {
        if (showSkillForm) resetSkillForm();
        else setShowSkillForm(true);
    }, [showSkillForm, resetSkillForm]);

    const handleEditSkill = useCallback((skill: NurseSkill) => {
        const { name, body } = parseSkill(skill.skill_name);
        setEditingSkillId(skill.id);
        setSkillName(name);
        setSkillDescription(body || '');
        setSkillProficiency(skill.proficiency || '');
        setShowSkillForm(true);
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }, []);

    const handleSubmitSkill = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSkillError('');

        if (!skillName.trim()) {
            setSkillError('Please enter a specialty name.');
            return;
        }

        setSavingSkill(true);
        try {
            // ✅ BUG FIX: combine name + description when saving, parse on read
            const combined = skillDescription.trim()
                ? `${skillName.trim()}\n\n${skillDescription.trim()}`
                : skillName.trim();

            await skillService.saveSkill({
                id: editingSkillId || undefined,
                user_id: user.id,
                skill_name: combined,
                proficiency: skillProficiency,
            });

            setSkillMsg(editingSkillId ? 'Specialty updated' : 'Specialty added');
            setTimeout(() => setSkillMsg(''), 3000);
            resetSkillForm();
            await fetchSkills();
        } catch (err) {
            console.error('Save skill failed:', err);
            setSkillError('Could not save. Please try again.');
        } finally {
            setSavingSkill(false);
        }
    }, [user, skillName, skillDescription, skillProficiency, editingSkillId, resetSkillForm, fetchSkills]);

    const requestDeleteSkill = useCallback((id: string, name: string) => {
        setDeleteSkill({ id, name });
    }, []);

    const confirmDeleteSkill = useCallback(async () => {
        if (!deleteSkill) return;
        try {
            await skillService.deleteSkill(deleteSkill.id);
            setSkillMsg('Specialty removed');
            setTimeout(() => setSkillMsg(''), 3000);
            await fetchSkills();
        } catch (err) {
            console.error('Delete skill failed:', err);
            setSkillError('Could not remove. Please try again.');
        } finally {
            setDeleteSkill(null);
        }
    }, [deleteSkill, fetchSkills]);

    // ==========================================================
    // PROCEDURE FORM
    // ==========================================================
    const resetProcedureForm = useCallback(() => {
        setEditingProcId(null);
        setProcedureName('');
        setCategory(PROCEDURE_CATEGORIES[0]);
        setAttemptsCount(1);
        setDatePerformed(new Date().toISOString().slice(0, 16));
        setCompetencyLevel('');
        setFacilityName('');
        setDepartment('');
        setPatientInitials('');
        setSupervisorName('');
        setSupervisorTitle('');
        setSupervisorLicense('');
        setStudentNotes('');
        setChallengesFaced('');
        setImprovementPlan('');
        setShowProcedureForm(false);
        setProcError('');
    }, []);

    const toggleProcedureForm = useCallback(() => {
        if (showProcedureForm) resetProcedureForm();
        else setShowProcedureForm(true);
    }, [showProcedureForm, resetProcedureForm]);

    const handleEditProcedure = useCallback((proc: ClinicalProcedure) => {
        setEditingProcId(proc.id);
        setProcedureName(proc.procedure_name);
        setCategory(proc.category);
        setAttemptsCount(proc.attempts_count);
        setDatePerformed(proc.date_performed.slice(0, 16));
        setCompetencyLevel(proc.competency_level);
        setFacilityName(proc.facility_name || '');
        setDepartment(proc.department || '');
        setPatientInitials(proc.patient_initials || '');
        setSupervisorName(proc.supervisor_name);
        setSupervisorTitle(proc.supervisor_title || '');
        setSupervisorLicense(proc.supervisor_license_number || '');
        setStudentNotes(proc.student_notes || '');
        setChallengesFaced(proc.challenges_faced || '');
        setImprovementPlan(proc.improvement_plan || '');
        setShowProcedureForm(true);
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }, []);

    const canSubmitProcedure = useMemo(() => {
        return !!(
            procedureName.trim() &&
            competencyLevel &&
            supervisorName.trim() &&
            supervisorTitle.trim() &&
            datePerformed
        );
    }, [procedureName, competencyLevel, supervisorName, supervisorTitle, datePerformed]);

    const handleSubmitProcedure = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setProcError('');

        if (!canSubmitProcedure) {
            setProcError('Please fill in all required fields.');
            return;
        }

        setSavingProc(true);
        try {
            const payload = {
                user_id: user.id,
                procedure_name: procedureName.trim(),
                category,
                attempts_count: attemptsCount,
                date_performed: new Date(datePerformed).toISOString(),
                competency_level: competencyLevel,
                facility_name: facilityName.trim() || null,
                department: department.trim() || null,
                patient_initials: patientInitials ? patientInitials.toUpperCase().trim() : null,
                supervisor_name: supervisorName.trim(),
                supervisor_title: supervisorTitle.trim() || null,
                supervisor_license_number: supervisorLicense.trim() || null,
                student_notes: studentNotes.trim() || null,
                challenges_faced: challengesFaced.trim() || null,
                improvement_plan: improvementPlan.trim() || null,
                verification_status: 'pending',
            };

            if (editingProcId) {
                const { data, error } = await supabase
                    .from('clinical_procedures')
                    .update(payload)
                    .eq('id', editingProcId)
                    .select()
                    .single();
                if (error) throw error;
                setProcedures(prev => prev.map(p => p.id === editingProcId ? data : p));
                setProcMsg('Procedure updated');
            } else {
                const { data, error } = await supabase
                    .from('clinical_procedures')
                    .insert([payload])
                    .select()
                    .single();
                if (error) throw error;
                setProcedures(prev => [data, ...prev]);
                setProcMsg('Procedure logged — request supervisor verification');
            }

            resetProcedureForm();
            setTimeout(() => setProcMsg(''), 3000);
        } catch (err: any) {
            console.error('Save procedure failed:', err);
            setProcError(err?.message || 'Could not save. Please try again.');
        } finally {
            setSavingProc(false);
        }
    }, [user, canSubmitProcedure, procedureName, category, attemptsCount, datePerformed, competencyLevel, facilityName, department, patientInitials, supervisorName, supervisorTitle, supervisorLicense, studentNotes, challengesFaced, improvementPlan, editingProcId, resetProcedureForm]);

    const requestDeleteProcedure = useCallback((id: string, name: string) => {
        setDeleteProcedure({ id, name });
    }, []);

    const confirmDeleteProcedure = useCallback(async () => {
        if (!deleteProcedure) return;
        try {
            await supabase.from('clinical_procedures').delete().eq('id', deleteProcedure.id);
            setProcedures(prev => prev.filter(p => p.id !== deleteProcedure.id));
            setProcMsg('Procedure removed');
            setTimeout(() => setProcMsg(''), 3000);
        } catch (err) {
            console.error('Delete procedure failed:', err);
            setProcError('Could not remove. Please try again.');
        } finally {
            setDeleteProcedure(null);
        }
    }, [deleteProcedure]);

    const toggleExpand = useCallback((id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
    }, []);

    // ==========================================================
    // DERIVED
    // ==========================================================
    const level = useMemo(() => getStudentLevel(procedures.length), [procedures.length]);
    const LevelIcon = level.icon;

    const verifiedCount = useMemo(
        () => procedures.filter(p => p.verification_status === 'verified').length,
        [procedures]
    );
    const pendingCount = useMemo(
        () => procedures.filter(p => p.verification_status === 'pending').length,
        [procedures]
    );

    const totalProcedures = procedures.length;
    const requiredForNCK = 20;
    const nckRemaining = Math.max(0, requiredForNCK - verifiedCount);

    // ==========================================================
    // LOADING
    // ==========================================================
    if (loadingRole) {
        return (
            <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
                <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
                    <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-48 animate-pulse mb-6" />
                    {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    // ==========================================================
    // NURSE VIEW
    // ==========================================================
    if (userRole === 'nurse') {
        return (
            <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
                <div className="max-w-2xl mx-auto md:px-6 md:py-8 pb-24">
                    {/* Header */}
                    <div className="px-4 md:px-0 pt-4 md:pt-0 pb-4 md:pb-6 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Specialties
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                Your clinical competencies and skills
                            </p>
                        </div>
                        <button
                            onClick={toggleSkillForm}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold transition min-h-[40px] ${showSkillForm
                                ? 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-zinc-800'
                                : 'bg-indigo-600 active:bg-indigo-700 text-white'
                                }`}
                        >
                            {showSkillForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            <span>{showSkillForm ? 'Cancel' : 'Add'}</span>
                        </button>
                    </div>

                    {/* Messages */}
                    {skillMsg && (
                        <div className="mx-4 md:mx-0 mb-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                            <Check className="w-4 h-4 flex-shrink-0" />
                            <span>{skillMsg}</span>
                        </div>
                    )}
                    {skillError && !showSkillForm && (
                        <div className="mx-4 md:mx-0 mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-sm font-semibold">
                            {skillError}
                        </div>
                    )}

                    {/* Form */}
                    {showSkillForm && (
                        <section className="mx-4 md:mx-0 mb-6 bg-white dark:bg-zinc-950 md:rounded-2xl p-4 md:p-5 animate-in fade-in duration-200">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                                {editingSkillId ? 'Edit specialty' : 'Add specialty'}
                            </h2>

                            {skillError && (
                                <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-2xl text-xs font-semibold">
                                    {skillError}
                                </div>
                            )}

                            <form onSubmit={handleSubmitSkill} className="space-y-4">
                                <div>
                                    <label htmlFor="skill-name" className={labelClass}>
                                        Specialty name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="skill-name"
                                        type="text"
                                        required
                                        value={skillName}
                                        onChange={(e) => setSkillName(e.target.value)}
                                        placeholder="e.g. ICU Care, Pediatric Nursing"
                                        autoComplete="off"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="skill-desc" className={labelClass}>
                                        Description & details
                                    </label>
                                    {/* Templates — horizontal scroll */}
                                    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1 scrollbar-hide">
                                        {SKILL_TEMPLATES.map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setSkillDescription(t.text)}
                                                className="text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-full whitespace-nowrap font-semibold flex-shrink-0 active:opacity-70 transition"
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        id="skill-desc"
                                        value={skillDescription}
                                        onChange={(e) => setSkillDescription(e.target.value)}
                                        placeholder="Click a template above to auto-fill, or write your own..."
                                        rows={6}
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="skill-prof" className={labelClass}>
                                        Proficiency level
                                    </label>
                                    <select
                                        id="skill-prof"
                                        value={skillProficiency}
                                        onChange={(e) => setSkillProficiency(e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Select level</option>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={resetSkillForm}
                                        disabled={savingSkill}
                                        className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition disabled:opacity-50 min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!skillName.trim() || savingSkill}
                                        className="flex-[2] py-3 rounded-2xl bg-indigo-600 active:bg-indigo-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                                    >
                                        {savingSkill ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving
                                            </>
                                        ) : editingSkillId ? (
                                            'Update'
                                        ) : (
                                            'Save'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    {/* List */}
                    {loadingSkills ? (
                        <div>{[1, 2].map(i => <CardSkeleton key={i} />)}</div>
                    ) : skills.length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                                <Award className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                No specialties yet
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                                Add your first clinical specialty so colleagues and recruiters know what you do best.
                            </p>
                            <button
                                onClick={() => setShowSkillForm(true)}
                                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-indigo-600 active:bg-indigo-700 text-white text-sm font-bold transition"
                            >
                                <Plus className="w-4 h-4" />
                                Add a specialty
                            </button>
                        </div>
                    ) : (
                        <div>
                            {skills.map(skill => (
                                <SkillCard
                                    key={skill.id}
                                    skill={skill}
                                    onEdit={handleEditSkill}
                                    onDelete={requestDeleteSkill}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <ConfirmModal
                    isOpen={!!deleteSkill}
                    title="Remove specialty?"
                    message={`This will permanently remove "${deleteSkill?.name || ''}" from your profile. This cannot be undone.`}
                    onConfirm={confirmDeleteSkill}
                    onCancel={() => setDeleteSkill(null)}
                />
            </div>
        );
    }

    // ==========================================================
    // STUDENT VIEW
    // ==========================================================
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto md:px-6 md:py-8 pb-24">

                {/* ============================================
                    HERO — flat emerald card with progress
                    ============================================ */}
                <section className="bg-gradient-to-br from-emerald-600 to-teal-700 px-4 md:px-6 py-5 md:rounded-3xl md:mb-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full mb-2">
                                <LevelIcon className="w-3.5 h-3.5 text-white" />
                                <span className="text-xs font-bold text-white">{level.name}</span>
                            </span>
                            <h1 className="text-xl md:text-2xl font-display font-extrabold text-white flex items-center gap-2">
                                <FileSignature className="w-5 h-5" />
                                Clinical Logbook
                            </h1>
                            <p className="text-emerald-100 text-xs mt-1 leading-relaxed">
                                NCK-compliant procedure records with supervisor verification
                            </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-3xl md:text-4xl font-display font-extrabold text-white leading-none tabular-nums">
                                {totalProcedures}
                            </div>
                            <div className="text-[10px] text-emerald-100 mt-1 uppercase tracking-wider">
                                Total
                            </div>
                        </div>
                    </div>

                    {/* Progress to next level */}
                    <div className="mt-4">
                        <div className="flex justify-between text-[11px] text-emerald-100 mb-1">
                            <span>Next level: {level.next} procedures</span>
                            <span className="tabular-nums">{totalProcedures}/{level.next}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (totalProcedures / level.next) * 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* NCK progress */}
                    <div className="mt-4 pt-3 border-t border-white/20">
                        <div className="flex justify-between text-[11px] text-emerald-100 mb-1">
                            <span>NCK verification</span>
                            <span className="tabular-nums">{verifiedCount}/{requiredForNCK}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-300 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (verifiedCount / requiredForNCK) * 100)}%` }}
                            />
                        </div>
                        {nckRemaining > 0 && (
                            <p className="text-[10px] text-emerald-200 mt-1.5">
                                {nckRemaining} more verified procedure{nckRemaining === 1 ? '' : 's'} to go
                            </p>
                        )}
                    </div>
                </section>

                {/* ============================================
                    STATS — 4 flat tiles
                    ============================================ */}
                <section className="grid grid-cols-4 border-b border-slate-100 dark:border-zinc-900">
                    <div className="px-3 py-4 text-center border-r border-slate-100 dark:border-zinc-900">
                        <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">
                            {totalProcedures}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5">
                            Total
                        </p>
                    </div>
                    <div className="px-3 py-4 text-center border-r border-slate-100 dark:border-zinc-900">
                        <div className="text-2xl font-display font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                            {verifiedCount}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5">
                            Verified
                        </p>
                    </div>
                    <div className="px-3 py-4 text-center border-r border-slate-100 dark:border-zinc-900">
                        <div className="text-2xl font-display font-extrabold text-amber-600 dark:text-amber-400 tabular-nums leading-none">
                            {pendingCount}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5">
                            Pending
                        </p>
                    </div>
                    <div className="px-3 py-4 text-center">
                        <LevelIcon className="w-5 h-5 mx-auto text-slate-600 dark:text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1.5 truncate">
                            {level.name}
                        </p>
                    </div>
                </section>

                {/* ============================================
                    MESSAGES
                    ============================================ */}
                {procMsg && (
                    <div className="mx-4 md:mx-0 my-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <span>{procMsg}</span>
                    </div>
                )}
                {procError && !showProcedureForm && (
                    <div className="mx-4 md:mx-0 my-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-sm font-semibold">
                        {procError}
                    </div>
                )}

                {/* ============================================
                    SECTION HEADER + NEW LOG BUTTON
                    ============================================ */}
                <div className="px-4 md:px-0 py-4 flex items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Procedure logs
                    </h2>
                    <button
                        onClick={toggleProcedureForm}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold transition min-h-[40px] ${showProcedureForm
                            ? 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-zinc-800'
                            : 'bg-indigo-600 active:bg-indigo-700 text-white'
                            }`}
                    >
                        {showProcedureForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{showProcedureForm ? 'Cancel' : 'New log'}</span>
                    </button>
                </div>

                {/* ============================================
                    PROCEDURE FORM
                    ============================================ */}
                {showProcedureForm && (
                    <section className="mx-4 md:mx-0 mb-6 bg-white dark:bg-zinc-950 md:rounded-2xl p-4 md:p-5 animate-in fade-in duration-200">
                        {procError && (
                            <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-2xl text-xs font-semibold">
                                {procError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitProcedure} className="space-y-4">
                            {/* Procedure */}
                            <div>
                                <label htmlFor="proc-name" className={labelClass}>
                                    Procedure name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="proc-name"
                                    type="text"
                                    required
                                    value={procedureName}
                                    onChange={(e) => setProcedureName(e.target.value)}
                                    placeholder="e.g. IV Cannulation, Bed Bath"
                                    autoComplete="off"
                                    className={inputClass}
                                />
                            </div>

                            {/* Category + attempts */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="proc-cat" className={labelClass}>Category</label>
                                    <select
                                        id="proc-cat"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className={inputClass}
                                    >
                                        {PROCEDURE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="proc-attempts" className={labelClass}>Attempt #</label>
                                    <input
                                        id="proc-attempts"
                                        type="number"
                                        min="1"
                                        value={attemptsCount}
                                        onChange={(e) => setAttemptsCount(Math.max(1, parseInt(e.target.value) || 1))}
                                        inputMode="numeric"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Date + competency */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="proc-date" className={labelClass}>
                                        Date & time <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="proc-date"
                                        type="datetime-local"
                                        required
                                        value={datePerformed}
                                        onChange={(e) => setDatePerformed(e.target.value)}
                                        max={new Date().toISOString().slice(0, 16)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="proc-competency" className={labelClass}>
                                        Competency <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        id="proc-competency"
                                        required
                                        value={competencyLevel}
                                        onChange={(e) => setCompetencyLevel(e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Select</option>
                                        {COMPETENCY_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Facility + department */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="proc-facility" className={labelClass}>Facility</label>
                                    <input
                                        id="proc-facility"
                                        type="text"
                                        value={facilityName}
                                        onChange={(e) => setFacilityName(e.target.value)}
                                        placeholder="Hospital name"
                                        autoComplete="organization"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="proc-dept" className={labelClass}>Department</label>
                                    <input
                                        id="proc-dept"
                                        type="text"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        placeholder="e.g. Medical Ward"
                                        autoComplete="off"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Patient initials */}
                            <div>
                                <label htmlFor="proc-initials" className={labelClass}>
                                    Patient initials <span className="text-slate-400 dark:text-slate-500 font-normal">(confidential)</span>
                                </label>
                                <input
                                    id="proc-initials"
                                    type="text"
                                    value={patientInitials}
                                    onChange={(e) => setPatientInitials(e.target.value)}
                                    placeholder="e.g. A.B."
                                    maxLength={10}
                                    autoComplete="off"
                                    className={inputClass}
                                />
                            </div>

                            {/* Supervisor */}
                            <div className="pt-3 border-t border-slate-100 dark:border-zinc-900 space-y-4">
                                <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4" />
                                    Supervisor signature
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="proc-sup-name" className={labelClass}>
                                            Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            id="proc-sup-name"
                                            type="text"
                                            required
                                            value={supervisorName}
                                            onChange={(e) => setSupervisorName(e.target.value)}
                                            placeholder="Full name"
                                            autoComplete="off"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="proc-sup-title" className={labelClass}>
                                            Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            id="proc-sup-title"
                                            type="text"
                                            required
                                            value={supervisorTitle}
                                            onChange={(e) => setSupervisorTitle(e.target.value)}
                                            placeholder="Senior RN, Instructor"
                                            autoComplete="off"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="proc-sup-license" className={labelClass}>
                                        License / PIN
                                    </label>
                                    <input
                                        id="proc-sup-license"
                                        type="text"
                                        value={supervisorLicense}
                                        onChange={(e) => setSupervisorLicense(e.target.value)}
                                        placeholder="e.g. 123456"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Reflection */}
                            <div className="pt-3 border-t border-slate-100 dark:border-zinc-900 space-y-3">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Reflection
                                </h3>
                                <textarea
                                    rows={2}
                                    value={studentNotes}
                                    onChange={(e) => setStudentNotes(e.target.value)}
                                    placeholder="What did you learn from this procedure?"
                                    className={`${inputClass} resize-none`}
                                />
                                <textarea
                                    rows={2}
                                    value={challengesFaced}
                                    onChange={(e) => setChallengesFaced(e.target.value)}
                                    placeholder="Any challenges or difficulties?"
                                    className={`${inputClass} resize-none`}
                                />
                                <textarea
                                    rows={2}
                                    value={improvementPlan}
                                    onChange={(e) => setImprovementPlan(e.target.value)}
                                    placeholder="How will you improve next time?"
                                    className={`${inputClass} resize-none`}
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={resetProcedureForm}
                                    disabled={savingProc}
                                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition disabled:opacity-50 min-h-[44px]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canSubmitProcedure || savingProc}
                                    className="flex-[2] py-3 rounded-2xl bg-indigo-600 active:bg-indigo-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                    {savingProc ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving
                                        </>
                                    ) : editingProcId ? (
                                        'Update log'
                                    ) : (
                                        'Save & request verification'
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {/* ============================================
                    PROCEDURE LIST
                    ============================================ */}
                {loadingProcedures ? (
                    <div>{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>
                ) : procedures.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                            <Stethoscope className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                            No procedures logged
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                            Start building your clinical logbook. Complete 50 procedures to reach Intermediate Nurse.
                        </p>
                        <button
                            onClick={() => setShowProcedureForm(true)}
                            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-indigo-600 active:bg-indigo-700 text-white text-sm font-bold transition"
                        >
                            <Plus className="w-4 h-4" />
                            Log first procedure
                        </button>
                    </div>
                ) : (
                    <div>
                        {procedures.map(proc => (
                            <ProcedureCard
                                key={proc.id}
                                proc={proc}
                                expanded={expandedId === proc.id}
                                onToggleExpand={toggleExpand}
                                onEdit={handleEditProcedure}
                                onDelete={requestDeleteProcedure}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!deleteProcedure}
                title="Remove procedure log?"
                message={`This will permanently remove "${deleteProcedure?.name || ''}" and its supervisor verification status. This cannot be undone.`}
                onConfirm={confirmDeleteProcedure}
                onCancel={() => setDeleteProcedure(null)}
            />
        </div>
    );
}