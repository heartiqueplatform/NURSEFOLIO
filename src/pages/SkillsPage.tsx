import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
            if (!user) { setLoadingRole(false); return; }
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
    // NURSE VIEW STATES
    // ============================================
    const [skills, setSkills] = useState<NurseSkill[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [skillName, setSkillName] = useState('');
    const [skillDescription, setSkillDescription] = useState('');
    const [proficiency, setProficiency] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    const fetchSkills = useCallback(async () => {
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
    }, [user]);

    useEffect(() => {
        if (user && userRole === 'nurse') {
            fetchSkills();
        }
    }, [user, userRole, fetchSkills]);

    const resetForm = useCallback(() => {
        setEditingId(null);
        setSkillName('');
        setSkillDescription('');
        setProficiency('');
        setShowForm(false);
    }, []);

    const handleEdit = useCallback((skill: NurseSkill) => {
        setEditingId(skill.id);
        setSkillName(skill.skill_name);
        setSkillDescription(skill.skill_description || '');
        setProficiency(skill.proficiency || '');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            setSaving(true);
            const fullSkillText = skillDescription ? `${skillName}\n\n${skillDescription}` : skillName;
            await skillService.saveSkill({
                id: editingId || undefined,
                user_id: user.id,
                skill_name: fullSkillText,
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
    }, [user, skillName, skillDescription, proficiency, editingId, resetForm, fetchSkills]);

    const handleDelete = useCallback(async (id: string, skillName: string) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${skillName}"? This action cannot be undone.`);
        if (!confirmed) return;
        try {
            await skillService.deleteSkill(id);
            await fetchSkills();
        } catch (err) {
            console.error(err);
        }
    }, [fetchSkills]);

    // ============================================
    // STUDENT VIEW STATES
    // ============================================
    const [procedures, setProcedures] = useState<ClinicalProcedure[]>([]);
    const [loadingProcedures, setLoadingProcedures] = useState(true);
    const [showProcedureForm, setShowProcedureForm] = useState(false);
    const [editingProcId, setEditingProcId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [savingProc, setSavingProc] = useState(false);
    const [procSavedMsg, setProcSavedMsg] = useState('');
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

    const fetchProcedures = useCallback(async () => {
        if (!user) return;
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
            console.error('Error fetching:', err);
        } finally {
            setLoadingProcedures(false);
        }
    }, [user]);

    useEffect(() => {
        if (user && userRole === 'student') {
            fetchProcedures();
        } else if (userRole !== 'student') {
            setLoadingProcedures(false);
        }
    }, [user, userRole, fetchProcedures]);

    const resetProcedureForm = useCallback(() => {
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
    }, []);

    const handleEditProcedure = useCallback((procedure: ClinicalProcedure) => {
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
    }, []);

    const handleSubmitProcedure = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            setSavingProc(true);
            const procedureData = {
                user_id: user.id,
                procedure_name: procedureName,
                category,
                attempts_count: attemptsCount,
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
                verification_status: 'pending'
            };
            if (editingProcId) {
                const { data, error } = await supabase
                    .from('clinical_procedures')
                    .update(procedureData)
                    .eq('id', editingProcId)
                    .select()
                    .single();
                if (error) throw error;
                setProcedures(prev => prev.map(p => p.id === editingProcId ? data : p));
                setProcSavedMsg('Procedure updated!');
            } else {
                const { data, error } = await supabase
                    .from('clinical_procedures')
                    .insert([procedureData])
                    .select()
                    .single();
                if (error) throw error;
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
    }, [user, procedureName, category, attemptsCount, datePerformed, competencyLevel, facilityName, department, patientInitials, supervisorName, supervisorTitle, supervisorLicense, studentNotes, challengesFaced, improvementPlan, editingProcId, resetProcedureForm]);

    const handleDeleteProcedure = useCallback(async (id: string, procedureName: string) => {
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
    }, [fetchProcedures]);

    const getStatusBadge = useCallback((status: string) => {
        switch (status) {
            case 'verified':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Check className="w-3 h-3" /> Verified</span>;
            case 'rejected':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1"><X className="w-3 h-3" /> Rejected</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
        }
    }, []);

    const getStudentLevel = useCallback((count: number) => {
        if (count >= 300) return { name: 'Nurse Guru', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100', next: 500 };
        if (count >= 200) return { name: 'Premium Nurse', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100', next: 300 };
        if (count >= 100) return { name: 'Advanced Nurse', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100', next: 200 };
        if (count >= 50) return { name: 'Intermediate Nurse', icon: Target, color: 'text-cyan-600', bg: 'bg-cyan-100', next: 100 };
        return { name: 'Beginner Nurse', icon: Award, color: 'text-slate-600', bg: 'bg-slate-100', next: 50 };
    }, []);

    const level = useMemo(() => getStudentLevel(procedures.length), [procedures.length, getStudentLevel]);
    const LevelIcon = level.icon;
    const totalProcedures = procedures.length;
    const verifiedCount = useMemo(() => procedures.filter(p => p.verification_status === 'verified').length, [procedures]);
    const pendingCount = useMemo(() => procedures.filter(p => p.verification_status === 'pending').length, [procedures]);
    const requiredForNCK = 20;

    if (loadingRole) {
        return (
            <div className="text-center py-10 md:py-12">
                <div className="w-6 h-6 md:w-8 md:h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-[10px] md:text-xs text-slate-400">Loading...</p>
            </div>
        );
    }

    // ============================================
    // NURSE VIEW
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
                            if (showForm) resetForm();
                            else setShowForm(true);
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
                {showForm && (
                    <div className="mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:border md:border-slate-200 md:dark:border-zinc-800 md:rounded-2xl p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200">
                        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                            {/* Skill Name */}
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
                                    className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition"
                                    autoComplete="off"
                                />
                            </div>

                            {/* Skill Description with Templates */}
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                                    Skill Description & Details
                                </label>
                                {/* Template Buttons - Horizontal scroll */}
                                <div className="mb-2 flex flex-nowrap gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                                    <button type="button" onClick={() => setSkillDescription(`Clinical Experience: [X] years as a Registered Nurse\nCore Competencies:\n• Comprehensive patient assessment and clinical judgment\n• Medication administration (oral, IV, IM, subcutaneous)\n• Care plan development and implementation\n• Patient and family education\n• Interdisciplinary team collaboration\n• Electronic health record (EHR) documentation\n• Infection control and prevention\n\nCertifications: BLS, ACLS\nSpecial Skills: Critical thinking, time management, patient advocacy`)} className="text-[9px] px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-md whitespace-nowrap font-medium flex-shrink-0">⭐ General Nursing</button>
                                    <button type="button" onClick={() => setSkillDescription(`Clinical Experience: [X] years in Intensive Care Unit (ICU)\nProcedures:\n• Mechanical ventilation management\n• Hemodynamic monitoring (arterial lines, CVP, PA catheter)\n• Continuous renal replacement therapy (CRRT)\n• Vasoactive medication titration\n• Post-cardiac surgery recovery\n\nCertifications: ACLS, CCRN, BLS`)} className="text-[9px] px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md whitespace-nowrap flex-shrink-0">ICU / Critical Care</button>
                                    <button type="button" onClick={() => setSkillDescription(`Clinical Experience: [X] years in Emergency Department (ER)\nProcedures:\n• Rapid triage and trauma assessment\n• Code team participation and management\n• Defibrillation and cardioversion\n• Wound closure (suturing, staples, glue)\n• Fracture splinting and immobilization\n\nCertifications: ACLS, PALS, TNCC, BLS`)} className="text-[9px] px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md whitespace-nowrap flex-shrink-0">Emergency / ER</button>
                                    <button type="button" onClick={() => setSkillDescription(`Clinical Experience: [X] years in Pediatrics\nProcedures:\n• Pediatric growth and developmental assessment\n• Vaccine administration (CDC schedule)\n• Pediatric medication dosage calculation\n• Respiratory support (HFNC, CPAP, BiPAP)\n• Family-centered care and education\n\nCertifications: PALS, CPN, BLS, NRP`)} className="text-[9px] px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md whitespace-nowrap flex-shrink-0">Pediatrics</button>
                                    <button type="button" onClick={() => setSkillDescription(`Clinical Experience: [X] years in Labor & Delivery\nProcedures:\n• Electronic fetal monitoring interpretation\n• Labor induction and augmentation\n• C-section and delivery support\n• Newborn resuscitation (NRP)\n• Postpartum assessment and breastfeeding support\n\nCertifications: NRP, RNC-OB, C-EFM, BLS`)} className="text-[9px] px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md whitespace-nowrap flex-shrink-0">Maternity / L&D</button>
                                </div>
                                {/* Textarea - optimized for mobile typing */}
                                <textarea
                                    value={skillDescription}
                                    onChange={(e) => setSkillDescription(e.target.value)}
                                    placeholder="Click a template above to auto-fill, then replace [X] with your years of experience and customize as needed..."
                                    rows={4}
                                    className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition resize-none"
                                    style={{ WebkitAppearance: 'none' }}
                                />
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                                    Tip: Click any template to start • Replace [X] with your experience
                                </p>
                            </div>

                            {/* Proficiency */}
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                                    Proficiency Level
                                </label>
                                <select
                                    value={proficiency}
                                    onChange={(e) => setProficiency(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition"
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
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg md:rounded-xl text-sm font-bold transition disabled:opacity-50 active:scale-[0.98]"
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
                            <div key={skill.id} className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200 md:dark:border-zinc-800 p-4 md:p-5 flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200 group">
                                <div className="min-w-0 flex-1 pr-2">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                                        {skill.skill_name.split('\n\n')[0]}
                                    </h4>
                                    {skill.skill_name.includes('\n\n') && (
                                        <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                                            {skill.skill_name.split('\n\n')[1].split('\n').map((line, idx) => {
                                                if (!line.trim()) return null;
                                                if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                                                    return (
                                                        <div key={idx} className="flex gap-2 mt-1">
                                                            <span className="text-indigo-500 dark:text-indigo-400">•</span>
                                                            <span className="flex-1">{line.trim().substring(1)}</span>
                                                        </div>
                                                    );
                                                }
                                                if (line.includes(':')) {
                                                    return (
                                                        <div key={idx} className="font-semibold mt-2 text-slate-700 dark:text-slate-300">
                                                            {line.trim()}
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={idx} className="mt-1">
                                                        {line.trim()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {skill.proficiency && (
                                        <div className="flex items-center gap-2 mt-3">
                                            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">{skill.proficiency}</p>
                                            <div className="flex-1 max-w-[80px] md:max-w-[120px] h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${skill.proficiency === 'Beginner' ? 'w-1/4 bg-slate-400' : skill.proficiency === 'Intermediate' ? 'w-2/4 bg-sky-500' : skill.proficiency === 'Advanced' ? 'w-3/4 bg-indigo-500' : 'w-full bg-indigo-600'}`}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1 md:gap-2 flex-shrink-0 ml-2 pt-0.5">
                                    <button onClick={() => handleEdit(skill)} className="p-1.5 md:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                                        <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(skill.id, skill.skill_name.split('\n')[0])} className="p-1.5 md:p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition">
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
    // STUDENT VIEW - Clinical Logbook
    // ============================================
    return (
        <div className="space-y-4 md:space-y-6 px-0 md:px-0 pb-24 -mx-3 md:mx-0">
            {/* Level Badge & NCK Header Banner - full width */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 md:rounded-2xl p-4 md:p-5 text-white rounded-none">
                <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-0.5 md:py-1 bg-white/20 rounded-full mb-2 md:mb-3">
                            <LevelIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                            <span className="text-[10px] md:text-xs font-bold text-white">{level.name}</span>
                        </div>
                        <h1 className="text-lg md:text-xl font-bold flex items-center gap-1.5 md:gap-2">
                            <FileSignature className="w-5 h-5 md:w-6 md:h-6" />
                            Clinical Logbook
                        </h1>
                        <p className="text-emerald-100 text-[10px] md:text-xs mt-0.5 md:mt-1">
                            Record procedures with supervisor verification — NCK compliant
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl md:text-3xl font-bold">{totalProcedures}</div>
                        <div className="text-[9px] md:text-[10px] text-emerald-200">Total Procedures</div>
                    </div>
                </div>

                {/* Progress to next level */}
                <div className="mt-3 md:mt-4">
                    <div className="flex justify-between text-[9px] md:text-[10px] text-emerald-200 mb-1">
                        <span>Progress to {level.next} procedures</span>
                        <span>{totalProcedures}/{level.next}</span>
                    </div>
                    <div className="w-full h-1.5 md:h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(100, (totalProcedures / level.next) * 100)}%` }}></div>
                    </div>
                </div>

                {/* NCK Progress */}
                <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-white/20">
                    <div className="flex justify-between text-[9px] md:text-[10px] text-emerald-200 mb-1">
                        <span>NCK Verification Progress</span>
                        <span>{verifiedCount}/{requiredForNCK}</span>
                    </div>
                    <div className="w-full h-1.5 md:h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-300 rounded-full transition-all" style={{ width: `${(verifiedCount / requiredForNCK) * 100}%` }}></div>
                    </div>
                    <p className="text-[8px] md:text-[9px] text-emerald-200 mt-0.5 md:mt-1">
                        {requiredForNCK - verifiedCount} more verified procedures needed
                    </p>
                </div>
            </div>

            {/* Stats Cards - full width on mobile */}
            <div className="grid grid-cols-4 gap-1.5 md:gap-2 px-3 md:px-0">
                <div className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-slate-200 md:dark:border-zinc-800 p-2.5 md:p-3 text-center border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200">
                    <div className="text-lg md:text-xl font-bold text-indigo-600 dark:text-indigo-400">{totalProcedures}</div>
                    <div className="text-[8px] md:text-[9px] text-slate-500 dark:text-slate-400">Total Logs</div>
                </div>
                <div className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-slate-200 md:dark:border-zinc-800 p-2.5 md:p-3 text-center border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200">
                    <div className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400">{verifiedCount}</div>
                    <div className="text-[8px] md:text-[9px] text-slate-500 dark:text-slate-400">Verified</div>
                </div>
                <div className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-slate-200 md:dark:border-zinc-800 p-2.5 md:p-3 text-center border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200">
                    <div className="text-lg md:text-xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</div>
                    <div className="text-[8px] md:text-[9px] text-slate-500 dark:text-slate-400">Pending</div>
                </div>
                <div className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-slate-200 md:dark:border-zinc-800 p-2.5 md:p-3 text-center border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200">
                    <LevelIcon className="w-4 h-4 md:w-5 md:h-5 mx-auto text-slate-600 dark:text-slate-400" />
                    <div className="text-[8px] md:text-[9px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 md:mt-1">{level.name}</div>
                </div>
            </div>

            {/* Success Message */}
            {procSavedMsg && (
                <div className="mx-3 md:mx-0 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 md:p-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 md:gap-2">
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> {procSavedMsg}
                </div>
            )}

            {/* Header with button - full width on mobile */}
            <div className="flex justify-between items-center px-3 md:px-0">
                <h2 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">Procedure Logs</h2>
                <button
                    onClick={() => setShowProcedureForm(!showProcedureForm)}
                    className="px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 shadow-sm active:scale-[0.98]"
                >
                    {showProcedureForm ? <X className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                    {showProcedureForm ? 'Cancel' : 'New Log'}
                </button>
            </div>

            {/* Form - full width on mobile */}
            {showProcedureForm && (
                <div className="mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200 md:dark:border-zinc-800 p-4 md:p-5 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200">
                    <form onSubmit={handleSubmitProcedure} className="space-y-3 md:space-y-4">
                        <div>
                            <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Procedure Name *</label>
                            <input required type="text" value={procedureName} onChange={(e) => setProcedureName(e.target.value)} placeholder="e.g., Bed Bath, IV Cannulation" className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition" autoComplete="off" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Category</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition">
                                    <option>Basic Nursing</option><option>Medication Administration</option><option>Wound Care</option><option>Invasive Procedures</option><option>Assessment</option><option>Emergency</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Attempt #</label>
                                <input type="number" min="1" value={attemptsCount} onChange={(e) => setAttemptsCount(parseInt(e.target.value))} className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm transition" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Date & Time *</label>
                                <input required type="datetime-local" value={datePerformed} onChange={(e) => setDatePerformed(e.target.value)} className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm transition" />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Competency *</label>
                                <select required value={competencyLevel} onChange={(e) => setCompetencyLevel(e.target.value)} className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm transition">
                                    <option value="">Select level</option><option>Observed Only</option><option>Assisted</option><option>Performed with Supervision</option><option>Independent</option><option>Can Teach Others</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Facility</label>
                                <input type="text" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="Hospital name" className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm transition" autoComplete="off" />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Department</label>
                                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Medical Ward" className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm transition" autoComplete="off" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Patient Initials (confidential)</label>
                            <input type="text" value={patientInitials} onChange={(e) => setPatientInitials(e.target.value)} placeholder="e.g., A.B." maxLength={10} className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm transition" autoComplete="off" />
                        </div>
                        {/* Supervisor Section */}
                        <div className="border-t border-slate-200 dark:border-zinc-800 pt-3 md:pt-4">
                            <h3 className="text-xs md:text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
                                <UserCheck className="w-3.5 h-3.5 md:w-4 md:h-4" /> Supervisor Signature Required
                            </h3>
                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                                <div>
                                    <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Supervisor Name *</label>
                                    <input required type="text" value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm transition" autoComplete="off" />
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Title *</label>
                                    <input required type="text" value={supervisorTitle} onChange={(e) => setSupervisorTitle(e.target.value)} placeholder="Senior RN, Instructor" className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm transition" autoComplete="off" />
                                </div>
                            </div>
                            <div className="mt-2 md:mt-3">
                                <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">License/PIN Number</label>
                                <input type="text" value={supervisorLicense} onChange={(e) => setSupervisorLicense(e.target.value)} placeholder="e.g., 123456" className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm transition" autoComplete="off" />
                            </div>
                        </div>
                        {/* Student Reflection */}
                        <div className="border-t border-slate-200 dark:border-zinc-800 pt-3 md:pt-4">
                            <h3 className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 md:mb-3">Student Reflection</h3>
                            <textarea rows={2} value={studentNotes} onChange={(e) => setStudentNotes(e.target.value)} placeholder="What did you learn from this procedure?" className="w-full px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition resize-none" style={{ WebkitAppearance: 'none' }} />
                            <textarea rows={2} value={challengesFaced} onChange={(e) => setChallengesFaced(e.target.value)} placeholder="Any challenges or difficulties faced?" className="w-full mt-2 md:mt-3 px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition resize-none" style={{ WebkitAppearance: 'none' }} />
                            <textarea rows={2} value={improvementPlan} onChange={(e) => setImprovementPlan(e.target.value)} placeholder="How will you improve next time?" className="w-full mt-2 md:mt-3 px-3 py-2.5 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition resize-none" style={{ WebkitAppearance: 'none' }} />
                        </div>
                        <button type="submit" disabled={savingProc} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg md:rounded-xl text-sm font-bold transition disabled:opacity-50 active:scale-[0.98]">
                            {savingProc ? 'Saving...' : editingProcId ? 'Update Procedure' : 'Save & Request Verification'}
                        </button>
                    </form>
                </div>
            )}

            {/* Loading / Empty / List - full width on mobile */}
            {loadingProcedures ? (
                <div className="text-center py-10 md:py-12">
                    <div className="w-6 h-6 md:w-8 md:h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">Loading logs...</p>
                </div>
            ) : procedures.length === 0 ? (
                <div className="mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200 md:dark:border-zinc-800 p-6 md:p-8 text-center">
                    <Stethoscope className="w-10 h-10 md:w-12 md:h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2 md:mb-3" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base mb-1">No procedures logged yet</h4>
                    <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">Click "New Log" to start building your clinical logbook</p>
                    <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-2 md:mt-3">Complete 50 procedures to reach Intermediate Nurse level</p>
                </div>
            ) : (
                <div className="space-y-0 md:space-y-3 px-3 md:px-0">
                    {procedures.map((proc) => (
                        <div key={proc.id} className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-slate-200 md:dark:border-zinc-800 overflow-hidden border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200">
                            <div className="p-3 md:p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-2 min-w-0">
                                        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mb-1.5 md:mb-2">
                                            <h3 className="font-bold text-slate-800 dark:text-white text-xs md:text-sm">{proc.procedure_name}</h3>
                                            {getStatusBadge(proc.verification_status)}
                                        </div>
                                        <div className="flex flex-wrap gap-x-2 md:gap-x-3 gap-y-0.5 md:gap-y-1 text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" /> {new Date(proc.date_performed).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><Award className="w-2.5 h-2.5 md:w-3 md:h-3" /> {proc.competency_level}</span>
                                            <span className="flex items-center gap-1"><UserCheck className="w-2.5 h-2.5 md:w-3 md:h-3" /> {proc.supervisor_name}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5 md:gap-1 flex-shrink-0">
                                        <button onClick={() => setExpandedId(expandedId === proc.id ? null : proc.id)} className="p-1.5 md:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition">
                                            <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 transition-transform ${expandedId === proc.id ? 'rotate-180' : ''}`} />
                                        </button>
                                        <button onClick={() => handleEditProcedure(proc)} className="p-1.5 md:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition">
                                            <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                                        </button>
                                        <button onClick={() => handleDeleteProcedure(proc.id, proc.procedure_name)} className="p-1.5 md:p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition">
                                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" />
                                        </button>
                                    </div>
                                </div>
                                {expandedId === proc.id && proc.verification_status === 'pending' && (
                                    <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-slate-100 dark:border-zinc-800">
                                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2.5 md:p-3">
                                            <p className="text-[9px] md:text-[10px] text-blue-700 dark:text-blue-400 flex items-center gap-1.5 md:gap-2 flex-wrap">
                                                <Send className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                                <span>Share with <strong>{proc.supervisor_name}</strong> to sign:</span>
                                                <code className="text-[8px] md:text-[9px] break-all bg-white dark:bg-zinc-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded font-mono">
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