import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { skillService } from '../services/skillService';
import { supabase } from '../lib/supabase';
import { NurseSkill, ClinicalProcedure } from '../types';

import {
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
    Award,
    Calendar,
    Hospital,
    UserCheck,
    FileSignature,
    Clock,
    Stethoscope,
    ChevronDown,
    ChevronUp,
    Send,
    TrendingUp,
    Target,
    Flame,
    Crown
} from 'lucide-react';

export default function SkillsPage() {
    const { user } = useAuth();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loadingRole, setLoadingRole] = useState(true);

    // Get user role
    useEffect(() => {
        const fetchUserRole = async () => {
            if (!user) {
                setLoadingRole(false);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (error) throw error;
                setUserRole(data?.role || 'nurse');
            } catch (err) {
                console.error('Error fetching role:', err);
                setUserRole('nurse');
            } finally {
                setLoadingRole(false);
            }
        };
        fetchUserRole();
    }, [user]);

    // ============================================
    // NURSE VIEW (Original SkillsPage - Preserved)
    // ============================================
    const [skills, setSkills] = useState<NurseSkill[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [skillName, setSkillName] = useState('');
    const [proficiency, setProficiency] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    const fetchSkills = async () => {
        if (!user) return;
        try {
            setLoadingSkills(true);
            const data = await skillService.getSkills(user.id);
            setSkills(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSkills(false);
        }
    };

    useEffect(() => {
        if (user && userRole === 'nurse') {
            fetchSkills();
        }
    }, [user, userRole]);

    const resetForm = () => {
        setEditingId(null);
        setSkillName('');
        setSkillDescription('');
        setProficiency('');
        setShowForm(false);
    };

    const handleEdit = (skill: NurseSkill) => {
        setEditingId(skill.id);
        setSkillName(skill.skill_name);
        setSkillDescription(skill.skill_description || '');
        setProficiency(skill.proficiency || '');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            setSaving(true);

            // Combine the short name and detailed description
            const fullSkillText = `${skillName}\n\n${skillDescription}`;

            await skillService.saveSkill({
                id: editingId || undefined,
                user_id: user.id,
                skill_name: fullSkillText,  // ← Save both!
                proficiency
            });
            setSavedMsg(editingId ? 'Skill updated!' : 'Skill added!');
            resetForm();
            await fetchSkills();
            setTimeout(() => setSavedMsg(''), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };
    const handleDelete = async (id: string, skillName: string) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${skillName}"? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            await skillService.deleteSkill(id);
            await fetchSkills();
        } catch (err) {
            console.error(err);
        }
    };

    // ============================================
    // STUDENT VIEW (Clinical Logbook)
    // ============================================
    const [procedures, setProcedures] = useState<ClinicalProcedure[]>([]);
    const [loadingProcedures, setLoadingProcedures] = useState(true);
    const [showProcedureForm, setShowProcedureForm] = useState(false);
    const [editingProcId, setEditingProcId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [savingProc, setSavingProc] = useState(false);
    const [procSavedMsg, setProcSavedMsg] = useState('');
    const [skillDescription, setSkillDescription] = useState('');
    // Student Form state
    const [procedureName, setProcedureName] = useState('');
    const [category, setCategory] = useState('Basic Nursing');
    const [attemptsCount, setAttemptsCount] = useState(1);
    const [datePerformed, setDatePerformed] = useState(new Date().toISOString().slice(0, 16));
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
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const fetchProcedures = async () => {
        if (!user) return;
        try {
            setLoadingProcedures(true);
            const { data, error } = await supabase
                .from('clinical_procedures')
                .select('*') // This gets all columns defined in your types
                .eq('user_id', user.id)
                .order('date_performed', { ascending: false });

            if (error) throw error;
            setProcedures(data || []);
        } catch (err) {
            console.error('Error fetching:', err);
        } finally {
            setLoadingProcedures(false);
        }
    };
    // Run fetch when role is determined and user exists
    useEffect(() => {
        const loadProcedures = async () => {
            if (user && userRole === 'student') {
                console.log('Role is student, fetching procedures');
                await fetchProcedures();
            } else if (userRole === 'student' && !user) {
                setLoadingProcedures(false);
            } else if (userRole !== 'student') {
                setLoadingProcedures(false);
            }
        };
        loadProcedures();
    }, [user, userRole]);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [skillDescription]);
    const resetProcedureForm = () => {
        setEditingProcId(null);
        setProcedureName('');
        setCategory('Basic Nursing');
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
    };

    const handleEditProcedure = (procedure: ClinicalProcedure) => {
        setEditingProcId(procedure.id);
        setProcedureName(procedure.procedure_name);
        setCategory(procedure.category);
        setAttemptsCount(procedure.attempts_count);
        setDatePerformed(procedure.date_performed.slice(0, 16));
        setCompetencyLevel(procedure.competency_level);
        setFacilityName(procedure.facility_name || '');
        setDepartment(procedure.department || '');
        setPatientInitials(procedure.patient_initials || '');
        setSupervisorName(procedure.supervisor_name);
        setSupervisorTitle(procedure.supervisor_title || '');
        setSupervisorLicense(procedure.supervisor_license_number || '');
        setStudentNotes(procedure.student_notes || '');
        setChallengesFaced(procedure.challenges_faced || '');
        setImprovementPlan(procedure.improvement_plan || '');
        setShowProcedureForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmitProcedure = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setSavingProc(true);

            // 1. Prepare data matching your ClinicalProcedure type
            const procedureData = {
                user_id: user.id,
                procedure_name: procedureName,
                category,
                attempts_count: attemptsCount,
                // Convert datetime-local string to ISO format for Postgres
                date_performed: new Date(datePerformed).toISOString(),
                competency_level: competencyLevel,
                facility_name: facilityName || null,
                department: department || null,
                patient_initials: patientInitials ? patientInitials.toUpperCase() : null,
                supervisor_name: supervisorName,
                supervisor_title: supervisorTitle || null,
                supervisor_license_number: supervisorLicense || null,
                student_notes: studentNotes || null,
                challenges_faced: challengesFaced || null,
                improvement_plan: improvementPlan || null,
                verification_status: 'pending' as ClinicalVerificationStatus
            };

            if (editingProcId) {
                // 2. Update existing record
                const { data, error } = await supabase
                    .from('clinical_procedures')
                    .update(procedureData)
                    .eq('id', editingProcId)
                    .select() // <--- CRITICAL: This returns the updated row
                    .single();

                if (error) throw error;

                // 3. Update the list state immediately (This triggers the re-render)
                setProcedures(prev => prev.map(p => p.id === editingProcId ? data : p));
                setProcSavedMsg('Procedure updated!');
            } else {
                // 4. Insert new record
                const { data, error } = await supabase
                    .from('clinical_procedures')
                    .insert([procedureData])
                    .select() // <--- CRITICAL
                    .single();

                if (error) throw error;

                // 5. Add the new record to the start of the list state
                setProcedures(prev => [data, ...prev]);
                setProcSavedMsg('Procedure logged! Request verification.');
            }

            resetProcedureForm();
            setTimeout(() => setProcSavedMsg(''), 3000);
        } catch (err: any) {
            console.error('Error saving:', err.message);
            alert('Save failed: ' + err.message);
        } finally {
            setSavingProc(false);
        }
    };
    const handleDeleteProcedure = async (id: string, procedureName: string) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${procedureName}"? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            await supabase.from('clinical_procedures').delete().eq('id', id);
            await fetchProcedures();
            setProcSavedMsg('Procedure deleted!');
            setTimeout(() => setProcSavedMsg(''), 3000);
        } catch (err) {
            console.error(err);
            alert('Failed to delete. Please try again.');
        }
    };
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Check className="w-3 h-3" /> Verified</span>;
            case 'rejected':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1"><X className="w-3 h-3" /> Rejected</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
        }
    };

    // Get student level based on total procedures
    const getStudentLevel = (count: number) => {
        if (count >= 300) return { name: 'Nurse Guru', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100', next: 500 };
        if (count >= 200) return { name: 'Premium Nurse', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100', next: 300 };
        if (count >= 100) return { name: 'Advanced Nurse', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100', next: 200 };
        if (count >= 50) return { name: 'Intermediate Nurse', icon: Target, color: 'text-cyan-600', bg: 'bg-cyan-100', next: 100 };
        return { name: 'Beginner Nurse', icon: Award, color: 'text-slate-600', bg: 'bg-slate-100', next: 50 };
    };

    const level = getStudentLevel(procedures.length);
    const LevelIcon = level.icon;

    if (loadingRole) {
        return (
            <div className="text-center py-10 md:py-12">
                <div className="w-6 h-6 md:w-8 md:h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-[10px] md:text-xs text-slate-400">Loading...</p>
            </div>
        );
    }

    // ============================================
    // NURSE VIEW - Original preserved design
    // ============================================
    if (userRole === 'nurse') {
        return (
            <div className="space-y-0 md:space-y-6 -mx-3 md:mx-0">
                {/* HEADER */}
                <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200 md:dark:border-zinc-800 p-4 md:p-6 flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                            Nursing Specialties
                        </h2>
                        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">
                            Add your clinical specialties and competencies.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (showForm) {
                                resetForm();
                            } else {
                                setShowForm(true);
                            }
                        }}
                        className="px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 flex-shrink-0"
                    >
                        {showForm ? <X className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        <span>{showForm ? 'Cancel' : 'Add Skill'}</span>
                    </button>
                </div>

                {/* SUCCESS */}
                {savedMsg && (
                    <div className="mx-3 md:mx-0 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 md:p-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 md:gap-2">
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        {savedMsg}
                    </div>
                )}

                {/* FORM */}
                {/* NEW PARAGRAPH TEMPLATE - Fixed version */}
                {showForm && (
                    <div className="mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:border md:border-slate-200 md:dark:border-zinc-800 md:rounded-2xl p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200">
                        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                            {/* Skill Name - short input */}
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                                    Specialty / Skill Name *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={skillName}
                                    onChange={(e) => setSkillName(e.target.value)}
                                    placeholder="e.g., ICU Care, Pediatric Nursing"
                                    className="w-full px-3 py-2 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition"
                                />
                            </div>

                            {/* NEW: Paragraph template for detailed description */}
                            {/* NEW: Paragraph template for detailed description with quick-fill buttons */}
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                                    Skill Description & Details
                                </label>

                                {/* TEMPLATE BUTTONS - Horizontal scroll */}
                                <div className="mb-2 flex flex-nowrap gap-1.5 overflow-x-auto pb-1">
                                    {/* === UNIVERSAL TEMPLATES (5) === */}
                                    <button
                                        type="button"
                                        onClick={() => setSkillDescription(`Clinical Experience: [X] years as a Registered Nurse
Core Competencies:
• Comprehensive patient assessment and clinical judgment
• Medication administration (oral, IV, IM, subcutaneous)
• Care plan development and implementation
• Patient and family education
• Interdisciplinary team collaboration
• Electronic health record (EHR) documentation
• Infection control and prevention

Certifications: BLS, ACLS
Special Skills: Critical thinking, time management, patient advocacy`)}
                                        className="text-[9px] px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-md whitespace-nowrap font-medium"
                                    >
                                        ⭐ General Nursing
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSkillDescription(`Clinical Experience: [X] years in acute care setting
Clinical Skills:
• Head-to-toe physical assessment
• Vital signs monitoring and interpretation
• IV insertion and maintenance
• Wound care and dressing changes
• Catheter insertion and care
• Blood glucose monitoring
• Fall prevention and safety protocols

Documentation: Epic, Cerner, or Meditech
Certifications: BLS`)}
                                        className="text-[9px] px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-100 rounded-md whitespace-nowrap"
                                    >
                                        Acute Care
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSkillDescription(`Clinical Experience: [X] years in medical-surgical nursing
Procedures & Competencies:
• Post-operative care and monitoring
• Telemetry and cardiac monitoring
• Blood product administration
• NG tube insertion and management
• Enteral feeding management
• Central line care and maintenance
• Pressure injury prevention and treatment

Patient Ratios: Typically 1:5-6
Certifications: BLS, CMSRN (in progress)`)}
                                        className="text-[9px] px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-100 rounded-md whitespace-nowrap"
                                    >
                                        Med-Surg
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSkillDescription(`Clinical Experience: [X] years in long-term care / skilled nursing
Focus Areas:
• Chronic disease management (diabetes, hypertension, CHF, COPD)
• Wound care and pressure injury prevention
• Medication administration and reconciliation
• Fall risk assessment and prevention
• Hospice and palliative care coordination
• Family communication and care conferences

Certifications: BLS, Gerontology certification (preferred)`)}
                                        className="text-[9px] px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-100 rounded-md whitespace-nowrap"
                                    >
                                        Long-Term Care
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSkillDescription(`Clinical Experience: [X] years in outpatient / clinic setting
Scope of Practice:
• Rooming patients and vital signs
• Medication reconciliation and administration
• Vaccine and injection administration
• Prior authorizations and referrals
• Patient education on chronic conditions
• Telephone triage and message management
• Electronic medical record documentation

Certifications: BLS, Ambulatory Care Nursing (preferred)`)}
                                        className="text-[9px] px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-100 rounded-md whitespace-nowrap"
                                    >
                                        Outpatient Clinic
                                    </button>

                                    {/* === SEPARATOR === */}
                                    <div className="w-px h-6 bg-slate-300 dark:bg-zinc-700 mx-1 self-center"></div>

                                    {/* === SPECIALTY TEMPLATES (5) === */}
                                    <button
                                        type="button"
                                        onClick={() => setSkillDescription(`Clinical Experience: [X] years in Intensive Care Unit (ICU)
Procedures:
• Mechanical ventilation management
• Hemodynamic monitoring (arterial lines, CVP, PA catheter)
• Continuous renal replacement therapy (CRRT)
• Vasoactive medication titration (norepinephrine, vasopressin)
• Post-cardiac surgery recovery
• Targeted temperature management
• Central line and chest tube management

Patient Populations: Respiratory failure, sepsis, post-cardiac arrest, MODS
Certifications: ACLS, CCRN, BLS`)}
                                        className="text-[9px] px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md whitespace-nowrap"
                                    >
                                        ICU / Critical Care
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSkillDescription(`Clinical Experience: [X] years in Emergency Department (ER)
Procedures:
• Rapid triage and trauma assessment
• Code team participation and management
• Defibrillation and cardioversion
• Rapid sequence intubation (RSI) assistance
• Wound closure (suturing, staples, glue)
• Fracture splinting and immobilization
• Stroke and STEMI alert activation

Patient Populations: All ages, trauma, cardiac emergencies, psych crisis
Certifications: ACLS, PALS, TNCC, BLS`)}
                                        className="text-[9px] px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md whitespace-nowrap"
                                    >
                                        Emergency / ER
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSkillDescription(`Clinical Experience: [X] years in Pediatrics (Peds/PICU)
Procedures:
• Pediatric growth and developmental assessment
• Vaccine administration (CDC schedule)
• Pediatric medication dosage calculation
• Respiratory support (HFNC, CPAP, BiPAP)
• Pediatric code management (PALS algorithms)
• Family-centered care and education

Patient Populations: Neonates to adolescents
Certifications: PALS, CPN, BLS, NRP`)}
                                        className="text-[9px] px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md whitespace-nowrap"
                                    >
                                        Pediatrics
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSkillDescription(`Clinical Experience: [X] years in Labor & Delivery / Maternity
Procedures:
• Electronic fetal monitoring interpretation
• Labor induction and augmentation
• C-section and delivery support
• Newborn resuscitation (NRP)
• Postpartum assessment and breastfeeding support
• Newborn screening and assessments

Certifications: NRP, RNC-OB, C-EFM, BLS`)}
                                        className="text-[9px] px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md whitespace-nowrap"
                                    >
                                        Maternity / L&D
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSkillDescription(`Clinical Experience: [X] years in Psychiatric / Mental Health
Procedures:
• Mental status examination (MSE)
• Suicide risk assessment (C-SSRS)
• De-escalation techniques (CPI)
• Crisis intervention
• Therapeutic communication
• Psychiatric medication administration
• Group therapy facilitation

Patient Populations: Depression, anxiety, bipolar, schizophrenia, substance use
Certifications: CPI, PMHN, BLS`)}
                                        className="text-[9px] px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md whitespace-nowrap"
                                    >
                                        Psychiatric
                                    </button>
                                </div>

                                {/* TEXTAREA - Auto-resizing based on content */}
                                <textarea
                                    ref={textareaRef}
                                    value={skillDescription}
                                    onChange={(e) => {
                                        setSkillDescription(e.target.value);
                                        // Immediate auto-grow on type
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    placeholder="Click a template above to auto-fill, then replace [X] with your years of experience and customize as needed..."
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition"
                                    style={{ overflowY: 'auto', resize: 'none' }}
                                />

                                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                                    Tip: Click any template to start • Replace [X] with your experience • Text box grows as you type
                                </p>
                            </div>

                            {/* Proficiency dropdown */}
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                                    Proficiency Level
                                </label>
                                <select
                                    value={proficiency}
                                    onChange={(e) => setProficiency(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition"
                                >
                                    <option value="">Select Level</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-2.5 md:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : editingId ? 'Update Skill' : 'Save Skill'}
                            </button>
                        </form>
                    </div>
                )}

                {/* LIST */}
                {loadingSkills ? (
                    <div className="text-center py-10 md:py-12">
                        <div className="w-6 h-6 md:w-8 md:h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">Loading specialties...</p>
                    </div>
                ) : skills.length === 0 ? (
                    <div className="mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200 md:dark:border-zinc-800 p-8 md:p-10 text-center">
                        <Award className="w-8 h-8 md:w-10 md:h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3 md:mb-4" />
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">No specialties yet</h4>
                        <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 mt-1">Add your first clinical specialty above</p>
                    </div>
                ) : (
                    <div className="space-y-0 md:space-y-4">
                        {skills.map((skill) => (
                            <div key={skill.id} className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200 md:dark:border-zinc-800 p-4 md:p-5 flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200 group">
                                <div className="min-w-0 flex-1">
                                    {/* Extract the first line as the title (before the first \n\n) */}
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                                        {skill.skill_name.split('\n\n')[0]}
                                    </h4>

                                    {/* Show the description part in point form */}
                                    {skill.skill_name.includes('\n\n') && (
                                        <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                                            {skill.skill_name.split('\n\n')[1].split('\n').map((line, idx) => {
                                                // Skip empty lines
                                                if (!line.trim()) return null;
                                                // Check if line starts with bullet point or dash
                                                if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                                                    return (
                                                        <div key={idx} className="flex gap-2 mt-1">
                                                            <span className="text-indigo-500 dark:text-indigo-400">•</span>
                                                            <span className="flex-1">{line.trim().substring(1)}</span>
                                                        </div>
                                                    );
                                                }
                                                // For section headers (like "Certifications:", "Procedures:", etc.)
                                                if (line.includes(':')) {
                                                    return (
                                                        <div key={idx} className="font-semibold mt-2 text-slate-700 dark:text-slate-300">
                                                            {line.trim()}
                                                        </div>
                                                    );
                                                }
                                                // Regular text
                                                return (
                                                    <div key={idx} className="mt-1">
                                                        {line.trim()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Proficiency display */}
                                    {skill.proficiency && (
                                        <div className="flex items-center gap-2 mt-3">
                                            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">{skill.proficiency}</p>
                                            <div className="flex-1 max-w-[80px] md:max-w-[120px] h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${skill.proficiency === 'Beginner' ? 'w-1/4 bg-slate-400' :
                                                    skill.proficiency === 'Intermediate' ? 'w-2/4 bg-sky-500' :
                                                        skill.proficiency === 'Advanced' ? 'w-3/4 bg-indigo-500' : 'w-full bg-indigo-600'
                                                    }`}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1 md:gap-2 flex-shrink-0 ml-2">
                                    <button onClick={() => handleEdit(skill)} className="p-1.5 md:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                                        <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(skill.id, skill.skill_name.split('\n')[0])}
                                        className="p-1.5 md:p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ============================================
    // STUDENT VIEW - Clinical Logbook with Level System
    // ============================================
    // STUDENT VIEW - Clinical Logbook with Level System (Dark Mode + Mobile Optimized)
    // ============================================
    const totalProcedures = procedures.length;
    const verifiedCount = procedures.filter(p => p.verification_status === 'verified').length;
    const requiredForNCK = 20;

    return (
        <div className="space-y-4 md:space-y-6 px-3 md:px-0 pb-24">
            {/* Level Badge & NCK Header Banner */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-2xl p-5 text-white -mx-3 md:mx-0">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full mb-3">
                            <LevelIcon className={`w-4 h-4 text-white`} />
                            <span className="text-xs font-bold text-white">{level.name}</span>
                        </div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <FileSignature className="w-6 h-6" />
                            Clinical Logbook
                        </h1>
                        <p className="text-emerald-100 text-xs mt-1">
                            Record procedures with supervisor verification — NCK compliant
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">{totalProcedures}</div>
                        <div className="text-[10px] text-emerald-200">Total Procedures</div>
                    </div>
                </div>

                {/* Progress to next level */}
                <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-emerald-200 mb-1">
                        <span>Progress to {level.next} procedures</span>
                        <span>{totalProcedures}/{level.next}</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(100, (totalProcedures / level.next) * 100)}%` }}></div>
                    </div>
                </div>

                {/* NCK Progress */}
                <div className="mt-4 pt-3 border-t border-white/20">
                    <div className="flex justify-between text-[10px] text-emerald-200 mb-1">
                        <span>NCK Verification Progress</span>
                        <span>{verifiedCount}/{requiredForNCK}</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-300 rounded-full transition-all" style={{ width: `${(verifiedCount / requiredForNCK) * 100}%` }}></div>
                    </div>
                    <p className="text-[9px] text-emerald-200 mt-1">
                        {requiredForNCK - verifiedCount} more verified procedures needed
                    </p>
                </div>
            </div>

            {/* Stats Cards with Level Info - Mobile optimized */}
            <div className="grid grid-cols-4 gap-2">
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 p-3 text-center">
                    <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{totalProcedures}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Total Logs</div>
                </div>
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 p-3 text-center">
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{verifiedCount}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Verified</div>
                </div>
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 p-3 text-center">
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{procedures.filter(p => p.verification_status === 'pending').length}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Pending</div>
                </div>
                <div className={`${level.bg.replace('bg-', 'bg-')} dark:bg-opacity-20 rounded-xl border dark:border-zinc-800 p-3 text-center`}>
                    <LevelIcon className={`w-5 h-5 mx-auto ${level.color.replace('text-', 'dark:text-')}`} />
                    <div className={`text-[9px] font-bold ${level.color.replace('text-', 'dark:text-')} mt-1`}>{level.name}</div>
                </div>
            </div>

            {/* Success Message */}
            {procSavedMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4" /> {procSavedMsg}
                </div>
            )}

            {/* Header with button */}
            <div className="flex justify-between items-center">
                <h2 className="font-bold text-slate-800 dark:text-white text-base">Procedure Logs</h2>
                <button
                    onClick={() => setShowProcedureForm(!showProcedureForm)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                    {showProcedureForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showProcedureForm ? 'Cancel' : 'New Log'}
                </button>
            </div>

            {/* Form - Dark mode fixed */}
            {showProcedureForm && (
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
                    <form onSubmit={handleSubmitProcedure} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                                Procedure Name *
                            </label>
                            <input
                                required
                                type="text"
                                value={procedureName}
                                onChange={(e) => setProcedureName(e.target.value)}
                                placeholder="e.g., Bed Bath, IV Cannulation"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                                >
                                    <option>Basic Nursing</option>
                                    <option>Medication Administration</option>
                                    <option>Wound Care</option>
                                    <option>Invasive Procedures</option>
                                    <option>Assessment</option>
                                    <option>Emergency</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Attempt #</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={attemptsCount}
                                    onChange={(e) => setAttemptsCount(parseInt(e.target.value))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Date & Time *</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={datePerformed}
                                    onChange={(e) => setDatePerformed(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Competency *</label>
                                <select
                                    required
                                    value={competencyLevel}
                                    onChange={(e) => setCompetencyLevel(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm"
                                >
                                    <option value="">Select level</option>
                                    <option>Observed Only</option>
                                    <option>Assisted</option>
                                    <option>Performed with Supervision</option>
                                    <option>Independent</option>
                                    <option>Can Teach Others</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Facility</label>
                                <input
                                    type="text"
                                    value={facilityName}
                                    onChange={(e) => setFacilityName(e.target.value)}
                                    placeholder="Hospital name"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Department</label>
                                <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="e.g., Medical Ward"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Patient Initials (confidential)</label>
                            <input
                                type="text"
                                value={patientInitials}
                                onChange={(e) => setPatientInitials(e.target.value)}
                                placeholder="e.g., A.B."
                                maxLength={10}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm"
                            />
                        </div>

                        {/* Supervisor Section */}
                        <div className="border-t border-slate-200 dark:border-zinc-800 pt-4">
                            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                                <UserCheck className="w-4 h-4" /> Supervisor Signature Required
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Supervisor Name *</label>
                                    <input
                                        required
                                        type="text"
                                        value={supervisorName}
                                        onChange={(e) => setSupervisorName(e.target.value)}
                                        placeholder="Full name"
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Title *</label>
                                    <input
                                        required
                                        type="text"
                                        value={supervisorTitle}
                                        onChange={(e) => setSupervisorTitle(e.target.value)}
                                        placeholder="Senior RN, Instructor"
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">License/PIN Number</label>
                                <input
                                    type="text"
                                    value={supervisorLicense}
                                    onChange={(e) => setSupervisorLicense(e.target.value)}
                                    placeholder="e.g., 123456"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm"
                                />
                            </div>
                        </div>

                        {/* Student Reflection Section */}
                        <div className="border-t border-slate-200 dark:border-zinc-800 pt-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Student Reflection</h3>
                            <textarea
                                rows={2}
                                value={studentNotes}
                                onChange={(e) => setStudentNotes(e.target.value)}
                                placeholder="What did you learn from this procedure?"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm resize-none"
                            />
                            <textarea
                                rows={2}
                                value={challengesFaced}
                                onChange={(e) => setChallengesFaced(e.target.value)}
                                placeholder="Any challenges or difficulties faced?"
                                className="w-full mt-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm resize-none"
                            />
                            <textarea
                                rows={2}
                                value={improvementPlan}
                                onChange={(e) => setImprovementPlan(e.target.value)}
                                placeholder="How will you improve next time?"
                                className="w-full mt-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={savingProc}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50"
                        >
                            {savingProc ? 'Saving...' : editingProcId ? 'Update Procedure' : 'Save & Request Verification'}
                        </button>
                    </form>
                </div>
            )}

            {/* Loading State */}
            {loadingProcedures ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Loading logs...</p>
                </div>
            ) : procedures.length === 0 ? (
                /* Empty State */
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 text-center">
                    <Stethoscope className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">No procedures logged yet</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Click "New Log" to start building your clinical logbook</p>
                    <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-3">Complete 50 procedures to reach Intermediate Nurse level</p>
                </div>
            ) : (
                /* Procedures List */
                <div className="space-y-3">
                    {procedures.map((proc) => (
                        <div key={proc.id} className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-2">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">{proc.procedure_name}</h3>
                                            {getStatusBadge(proc.verification_status)}
                                        </div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(proc.date_performed).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {proc.competency_level}</span>
                                            <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {proc.supervisor_name}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => setExpandedId(expandedId === proc.id ? null : proc.id)}
                                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                                        >
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        </button>
                                        <button
                                            onClick={() => handleEditProcedure(proc)}
                                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                                        >
                                            <Pencil className="w-4 h-4 text-slate-400" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProcedure(proc.id, proc.procedure_name)}
                                            className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                        >
                                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded view with verification link */}
                                {expandedId === proc.id && proc.verification_status === 'pending' && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                                            <p className="text-[10px] text-blue-700 dark:text-blue-400 flex items-center gap-2 flex-wrap">
                                                <Send className="w-3 h-3" />
                                                <span>Share this link with <strong>{proc.supervisor_name}</strong> to sign:</span>
                                                <code className="text-[9px] break-all bg-white dark:bg-zinc-800 px-2 py-1 rounded font-mono">
                                                    {window.location.origin}/verify/{proc.id}
                                                </code>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}