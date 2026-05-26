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
        <div className="space-y-6">

            {/* HEADER */}

            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 flex justify-between items-center">

                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Nursing Specialties
                    </h2>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                    {showForm ? (
                        <X className="w-4 h-4" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}

                    <span>
                        {showForm ? 'Cancel' : 'Add Skill'}
                    </span>
                </button>
            </div>

            {/* SUCCESS */}

            {savedMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {savedMsg}
                </div>
            )}

            {/* FORM */}

            {showForm && (

                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >

                        <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                                Specialty / Skill
                            </label>

                            <input
                                required
                                type="text"
                                value={skillName}
                                onChange={(e) => setSkillName(e.target.value)}
                                placeholder="e.g ICU Care"
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                                Proficiency
                            </label>

                            <select
                                value={proficiency}
                                onChange={(e) => setProficiency(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
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
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
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

            {/* LIST */}

            {loading ? (

                <div className="text-center py-12">
                    Loading...
                </div>

            ) : skills.length === 0 ? (

                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 p-10 text-center">

                    <Award className="w-10 h-10 mx-auto text-slate-300 mb-4" />

                    <h4 className="font-bold text-slate-800 dark:text-slate-200">
                        No specialties yet
                    </h4>

                </div>

            ) : (

                <div className="space-y-4">

                    {skills.map((skill) => (

                        <div
                            key={skill.id}
                            className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 flex justify-between items-center"
                        >

                            <div>

                                <h4 className="font-bold text-slate-900 dark:text-white">
                                    {skill.skill_name}
                                </h4>

                                {skill.proficiency && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {skill.proficiency}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">

                                <button
                                    onClick={() => handleEdit(skill)}
                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => handleDelete(skill.id)}
                                    className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}