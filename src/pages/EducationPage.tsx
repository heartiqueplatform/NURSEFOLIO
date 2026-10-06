/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { Education } from '../types';
import {
  GraduationCap, Calendar, Trash2, Plus, X, Check, Loader2
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

// ==========================================================
// SHARED CLASSES
// ==========================================================
const inputClass =
  'w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition disabled:opacity-50';

const labelClass =
  'block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5';

// ==========================================================
// HELPERS
// ==========================================================
function formatMonth(ym: string | null | undefined): string {
  if (!ym) return '';
  const [year, month] = ym.split('-');
  if (!year || !month) return ym;
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ==========================================================
// EDUCATION CARD
// ==========================================================
const EducationCard = React.memo<{
  edu: Education;
  onDelete: (id: string) => void;
}>(({ edu, onDelete }) => {
  const startLabel = useMemo(() => formatMonth(edu.start_date), [edu.start_date]);
  const endLabel = useMemo(() => {
    if (!edu.completed) return 'Ongoing';
    return formatMonth(edu.end_date) || 'Present';
  }, [edu.completed, edu.end_date]);

  return (
    <article className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
            {edu.degree}
          </h3>
          <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 mt-0.5 truncate">
            {edu.field_of_study}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 truncate">
            {edu.institution}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {startLabel} — {endLabel}
            </span>
            {edu.gpa && (
              <>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold text-[11px]">
                  GPA {edu.gpa}
                </span>
              </>
            )}
            {!edu.completed && (
              <>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                  In progress
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3.5">
        <button
          onClick={() => onDelete(edu.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-950/50 transition ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>
    </article>
  );
});
EducationCard.displayName = 'EducationCard';

// ==========================================================
// SKELETON
// ==========================================================
const EducationSkeleton = React.memo(() => (
  <div className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
      </div>
    </div>
  </div>
));
EducationSkeleton.displayName = 'EducationSkeleton';

// ==========================================================
// MAIN
// ==========================================================
export default function EducationPage() {
  const { user } = useAuth();
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
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
  const [error, setError] = useState('');

  // ----------------------------------------------------------
  // Load
  // ----------------------------------------------------------
  const loadEducations = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await databaseService.getEducations(user.id);
      setEducationList(data);
    } catch (err) {
      console.error('Failed to load education:', err);
      setError('Could not load your education history.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEducations();
  }, [loadEducations]);

  // ----------------------------------------------------------
  // Form
  // ----------------------------------------------------------
  const resetForm = useCallback(() => {
    setInstitution('');
    setDegree('');
    setFieldOfStudy('');
    setStartDate('');
    setEndDate('');
    setCompleted(true);
    setGpa('');
    setError('');
  }, []);

  const toggleForm = useCallback(() => {
    if (showForm) {
      resetForm();
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  }, [showForm, resetForm]);

  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    // Client-side validation
    if (!institution.trim() || !degree.trim() || !fieldOfStudy.trim() || !startDate) {
      setError('Please fill in all required fields.');
      return;
    }
    if (completed && !endDate) {
      setError('Please provide an end date, or mark as ongoing.');
      return;
    }
    if (completed && endDate && startDate && endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }

    setSaving(true);
    try {
      await databaseService.saveEducation({
        profile_id: user.id,
        institution: institution.trim(),
        degree: degree.trim(),
        field_of_study: fieldOfStudy.trim(),
        start_date: startDate,
        end_date: completed ? endDate : undefined,
        completed,
        gpa: gpa.trim() || undefined,
      });

      resetForm();
      setShowForm(false);
      setMsg('Education added');
      setTimeout(() => setMsg(''), 3000);
      await loadEducations();
    } catch (err) {
      console.error('Save education failed:', err);
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [user, institution, degree, fieldOfStudy, startDate, endDate, completed, gpa, resetForm, loadEducations]);

  const handleDeleteRequest = useCallback((id: string) => setDeleteId(id), []);
  const handleCancelDelete = useCallback(() => setDeleteId(null), []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await databaseService.deleteEducation(deleteId);
      setMsg('Education removed');
      setTimeout(() => setMsg(''), 3000);
      await loadEducations();
    } catch (err) {
      console.error('Delete education failed:', err);
      setError('Could not remove. Please try again.');
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, loadEducations]);

  // Derived — is the form valid + filled?
  const canSubmit = useMemo(() => {
    if (!institution.trim() || !degree.trim() || !fieldOfStudy.trim() || !startDate) return false;
    if (completed && !endDate) return false;
    if (completed && endDate && startDate && endDate < startDate) return false;
    return true;
  }, [institution, degree, fieldOfStudy, startDate, endDate, completed]);

  // Set min on end date so it can't be before start
  const endDateMin = startDate || undefined;
  const todayMonth = new Date().toISOString().slice(0, 7);

  if (!user) return null;

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto md:px-6 md:py-8 pb-24">

        {/* ============================================
            HEADER
            ============================================ */}
        <div className="px-4 md:px-0 pt-4 md:pt-0 pb-4 md:pb-6 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              Education
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Degrees, diplomas, and academic credentials
            </p>
          </div>
          <button
            onClick={toggleForm}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold transition min-h-[40px] ${showForm
              ? 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-zinc-800'
              : 'bg-teal-600 active:bg-teal-700 text-white'
              }`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Cancel' : 'Add'}</span>
          </button>
        </div>

        {/* ============================================
            MESSAGES
            ============================================ */}
        {msg && (
          <div className="mx-4 md:mx-0 mb-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {error && !showForm && (
          <div className="mx-4 md:mx-0 mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-sm font-semibold">
            {error}
          </div>
        )}

        {/* ============================================
            FORM
            ============================================ */}
        {showForm && (
          <section className="mx-4 md:mx-0 mb-6 bg-white dark:bg-zinc-950 md:rounded-2xl p-4 md:p-5 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Add education
            </h2>

            {error && (
              <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="edu-institution" className={labelClass}>
                  Institution <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edu-institution"
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of Nairobi, KMTC"
                  autoComplete="organization"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edu-degree" className={labelClass}>
                  Degree / Diploma <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edu-degree"
                  type="text"
                  required
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. BSN, MSN, Diploma in Nursing"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edu-field" className={labelClass}>
                  Field of study <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edu-field"
                  type="text"
                  required
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="e.g. Midwifery, Critical Care"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edu-start" className={labelClass}>
                    Start <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edu-start"
                    type="month"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={todayMonth}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edu-end" className={labelClass}>
                    End {completed && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    id="edu-end"
                    type="month"
                    disabled={!completed}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={endDateMin}
                    max={todayMonth}
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 dark:bg-zinc-800"
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  I have completed this program
                </span>
              </label>

              <div>
                <label htmlFor="edu-gpa" className={labelClass}>
                  GPA <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  id="edu-gpa"
                  type="text"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="e.g. 3.9, First Class"
                  className={inputClass}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  disabled={saving}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition disabled:opacity-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || saving}
                  className="flex-[2] py-3 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    'Publish'
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ============================================
            LIST
            ============================================ */}
        {loading ? (
          <div>
            {[1, 2].map(i => <EducationSkeleton key={i} />)}
          </div>
        ) : educationList.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              No education yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Add your degrees and diplomas to show your academic background.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Add your first degree
            </button>
          </div>
        ) : (
          <div>
            {educationList.map(edu => (
              <EducationCard
                key={edu.id}
                edu={edu}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          DELETE CONFIRM
          ============================================ */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Remove education record?"
        message="This will permanently remove this academic record from your profile. This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}