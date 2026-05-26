import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { skillService } from '../services/skillService';
import { NurseSkill } from '../types';

import {
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
    Award
} from 'lucide-react';

export default function SkillsPage() {

    const { user } = useAuth();

    const [skills, setSkills] = useState<NurseSkill[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);

    const [skillName, setSkillName] = useState('');
    const [proficiency, setProficiency] = useState('');

    const [saving, setSaving] = useState(false);

    const [savedMsg, setSavedMsg] = useState('');

    // FETCH
    const fetchSkills = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const data = await skillService.getSkills(user.id);
            setSkills(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [user]);

    // RESET FORM
    const resetForm = () => {
        setEditingId(null);
        setSkillName('');
        setProficiency('');
        setShowForm(false);
    };

    // EDIT
    const handleEdit = (skill: NurseSkill) => {
        setEditingId(skill.id);
        setSkillName(skill.skill_name);
        setProficiency(skill.proficiency || '');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // SAVE
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        try {
            setSaving(true);

            await skillService.saveSkill({
                id: editingId || undefined,
                user_id: user.id,
                skill_name: skillName,
                proficiency
            });

            setSavedMsg(
                editingId
                    ? 'Skill updated!'
                    : 'Skill added!'
            );

            resetForm();
            await fetchSkills();

            setTimeout(() => {
                setSavedMsg('');
            }, 3000);

        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // DELETE
    const handleDelete = async (id: string) => {
        try {
            await skillService.deleteSkill(id);
            await fetchSkills();
        } catch (err) {
            console.error(err);
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-0 md:space-y-6 -mx-3 md:mx-0">

            {/* HEADER - full width on mobile */}
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
                    {showForm ? (
                        <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    ) : (
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    )}
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

            {/* FORM - full width on mobile */}
            {showForm && (
                <div className="mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:border md:border-slate-200 md:dark:border-zinc-800 md:rounded-2xl p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-3 md:space-y-4"
                    >
                        <div>
                            <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                                Specialty / Skill
                            </label>
                            <input
                                required
                                type="text"
                                value={skillName}
                                onChange={(e) => setSkillName(e.target.value)}
                                placeholder="e.g ICU Care"
                                className="w-full px-3 py-2 rounded-lg md:rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                                Proficiency
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

                        {/* Proficiency Level Visual Indicator */}
                        {proficiency && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    <span>Proficiency Level</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{proficiency}</span>
                                </div>
                                <div className="w-full h-1.5 md:h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${proficiency === 'Beginner' ? 'w-1/4 bg-slate-400' :
                                            proficiency === 'Intermediate' ? 'w-2/4 bg-sky-500' :
                                                proficiency === 'Advanced' ? 'w-3/4 bg-indigo-500' :
                                                    'w-full bg-indigo-600'
                                            }`}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-2.5 md:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition disabled:opacity-50"
                        >
                            {saving
                                ? 'Saving...'
                                : editingId
                                    ? 'Update Skill'
                                    : 'Save Skill'}
                        </button>
                    </form>
                </div>
            )}

            {/* LIST - feed style on mobile */}
            {loading ? (
                <div className="text-center py-10 md:py-12">
                    <div className="w-6 h-6 md:w-8 md:h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">Loading specialties...</p>
                </div>
            ) : skills.length === 0 ? (
                <div className="mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200 md:dark:border-zinc-800 p-8 md:p-10 text-center">
                    <Award className="w-8 h-8 md:w-10 md:h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3 md:mb-4" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">
                        No specialties yet
                    </h4>
                    <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Add your first clinical specialty above
                    </p>
                </div>
            ) : (
                <div className="space-y-0 md:space-y-4">
                    {skills.map((skill) => (
                        <div
                            key={skill.id}
                            className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200 md:dark:border-zinc-800 p-4 md:p-5 flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200 group"
                        >
                            <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                                    {skill.skill_name}
                                </h4>
                                {skill.proficiency && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                                            {skill.proficiency}
                                        </p>
                                        {/* Mini progress bar for proficiency */}
                                        <div className="flex-1 max-w-[80px] md:max-w-[120px] h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${skill.proficiency === 'Beginner' ? 'w-1/4 bg-slate-400' :
                                                    skill.proficiency === 'Intermediate' ? 'w-2/4 bg-sky-500' :
                                                        skill.proficiency === 'Advanced' ? 'w-3/4 bg-indigo-500' :
                                                            'w-full bg-indigo-600'
                                                    }`}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-1 md:gap-2 flex-shrink-0 ml-2">
                                <button
                                    onClick={() => handleEdit(skill)}
                                    className="p-1.5 md:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                                    title="Edit skill"
                                >
                                    <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(skill.id)}
                                    className="p-1.5 md:p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                                    title="Delete skill"
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