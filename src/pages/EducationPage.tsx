/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { Education } from '../types';
import { GraduationCap, Calendar, Trash2, Plus, X, Check } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export default function EducationPage() {
  const { user } = useAuth();
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [completed, setCompleted] = useState(true);
  const [gpa, setGpa] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadEducations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await databaseService.getEducations(user.id);
      setEducationList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEducations();
  }, [user]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await databaseService.saveEducation({
        profile_id: user.id,
        institution,
        degree,
        field_of_study: fieldOfStudy,
        start_date: startDate,
        end_date: completed ? endDate : undefined,
        completed,
        gpa: gpa || undefined
      });

      // Clear Form state
      setInstitution('');
      setDegree('');
      setFieldOfStudy('');
      setStartDate('');
      setEndDate('');
      setCompleted(true);
      setGpa('');

      setShowForm(false);
      setMsg('Degree module added!');
      setTimeout(() => setMsg(''), 3000);
      await loadEducations();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setDeleteId(id);
  };

  const purseDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await databaseService.deleteEducation(deleteId);
      setMsg('Academic record deleted.');
      setTimeout(() => setMsg(''), 3000);
      await loadEducations();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Academic Board Degrees</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build a comprehensive directory of BSN, MSN degrees, NCLEX credentials, or GPAs.
          </p>
        </div>

        <button
          id="edu-toggle-form-btn"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition active:scale-95 cursor-pointer shadow-sm select-none"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Close panel' : 'Add Degree'}</span>
        </button>
      </div>

      {msg && (
        <div id="edu-save-alert" className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-705 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-teal-100 dark:border-teal-800 p-6 shadow-sm border-2 animate-in fade-in duration-200">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Post Academic Credentials</h3>
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs text-slate-705 dark:text-slate-300 font-medium">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Institution University name</label>
                <input
                  id="edu-input-institution"
                  required
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Kenya Medical Training College (KMTC) / UoN"
                  className="w-full pl-3 pr-4 py-2 bg-slate-55 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Degree (e.g. BSN, MSN, PhD, KRCHN)</label>
                <input
                  id="edu-input-degree"
                  required
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. Diploma in Community Health Nursing (KRCHN)"
                  className="w-full pl-3 pr-4 py-2 bg-slate-55 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Field of Study</label>
                <input
                  id="edu-input-field"
                  required
                  type="text"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="e.g. Midwifery & Reproductive Health"
                  className="w-full pl-3 pr-4 py-2 bg-slate-55 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-sans">GPA (Optional)</label>
                <input
                  id="edu-input-gpa"
                  type="text"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="e.g. 3.9"
                  className="w-full pl-3 pr-4 py-2 bg-slate-55 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Start Month/Year</label>
                <input
                  id="edu-input-start"
                  required
                  type="month"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 bg-slate-55 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">End Month/Year</label>
                <input
                  id="edu-input-end"
                  type="month"
                  disabled={!completed}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 bg-slate-55 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="inline-flex items-center gap-2 pb-2.5 cursor-pointer">
                  <input
                    id="edu-input-completed"
                    type="checkbox"
                    checked={completed}
                    onChange={(e) => setCompleted(e.target.checked)}
                    className="w-4.5 h-4.5 text-teal-600 rounded dark:bg-slate-800"
                  />
                  <span className="text-xs font-semibold text-slate-705 dark:text-slate-300">Degree Completed</span>
                </label>
              </div>
            </div>

            <button
              id="edu-save-btn"
              type="submit"
              disabled={saving}
              className="w-full py-3 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl active:scale-95 transition"
            >
              Verify & Add Education Module
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 border-4 border-slate-100 dark:border-slate-700 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
      ) : educationList.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200">No education blocks listed</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Record university credentials, pediatric rotations training or board certificates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {educationList.map((edu) => (
            <div key={edu.id} className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">{edu.degree}</h4>
                <p className="text-xs font-bold text-teal-650 dark:text-teal-400">{edu.field_of_study}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{edu.institution}</p>

                <div className="flex items-center gap-2 text-xs text-slate-550 dark:text-slate-500 pt-1.5 font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>{edu.start_date} &mdash; {edu.completed ? edu.end_date : 'Ongoing'}</span>
                  {edu.gpa && (
                    <>
                      <span>•</span>
                      <span className="bg-teal-50 dark:bg-teal-950/50 border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded text-[10px] font-bold">GPA: {edu.gpa}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                id={`edu-btn-delete-${edu.id}`}
                onClick={() => handleDeleteItem(edu.id)}
                className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer flex-shrink-0"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Remove Education Record"
        message="Are you sure you want to remove this academic degree? This action is irreversible."
        onConfirm={purseDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}