/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { experienceService } from '../services/experienceService';
import { Experience } from '../types';
import {
  Briefcase, Calendar, Trash2, Plus, X, Check, Building, Pencil, Loader2
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
// EXPERIENCE CARD
// ==========================================================
const ExperienceCard = React.memo<{
  exp: Experience;
  onEdit: (exp: Experience) => void;
  onDelete: (id: string) => void;
}>(({ exp, onEdit, onDelete }) => {
  const startLabel = useMemo(() => formatMonth(exp.start_date), [exp.start_date]);
  const endLabel = useMemo(() => {
    if (exp.current) return 'Present';
    return formatMonth(exp.end_date) || '—';
  }, [exp.current, exp.end_date]);

  return (
    <article className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
            {exp.title}
          </h3>
          <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 mt-0.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {exp.facility}
              {exp.department ? ` · ${exp.department}` : ''}
            </span>
          </p>
          {exp.location && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {exp.location}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            {startLabel} — {endLabel}
            {exp.current && (
              <span className="ml-1 inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold text-[10px]">
                Current
              </span>
            )}
          </p>
        </div>
      </div>

      {exp.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-3 line-clamp-3">
          {exp.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-3.5">
        <button
          onClick={() => onEdit(exp)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800 transition"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => onDelete(exp.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-950/50 transition ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>
    </article>
  );
});
ExperienceCard.displayName = 'ExperienceCard';

// ==========================================================
// SKELETON
// ==========================================================
const ExperienceSkeleton = React.memo(() => (
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
ExperienceSkeleton.displayName = 'ExperienceSkeleton';

// ==========================================================
// MAIN
// ==========================================================
export default function ExperiencePage() {
  const { user } = useAuth();

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [facility, setFacility] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [current, setCurrent] = useState(false);
  const [description, setDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // ----------------------------------------------------------
  // Load
  // ----------------------------------------------------------
  const fetchItems = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await experienceService.getExperiences(user.id);
      setExperiences(data);
    } catch (err) {
      console.error('Failed to load experience:', err);
      setError('Could not load your experience.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ----------------------------------------------------------
  // Form
  // ----------------------------------------------------------
  const resetForm = useCallback(() => {
    setEditingId(null);
    setTitle('');
    setFacility('');
    setDepartment('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setCurrent(false);
    setDescription('');
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

  const handleEditClick = useCallback((exp: Experience) => {
    setEditingId(exp.id);
    setTitle(exp.title);
    setFacility(exp.facility);
    setDepartment(exp.department || '');
    setLocation(exp.location || '');
    setStartDate(exp.start_date);
    setEndDate(exp.end_date || '');
    setCurrent(exp.current);
    setDescription(exp.description);
    setShowForm(true);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!title.trim() || !facility.trim() || !startDate) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!current && !endDate) {
      setError('Please provide an end date, or mark as current.');
      return;
    }
    if (!current && endDate && startDate && endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }

    setSaving(true);
    try {
      await experienceService.saveExperience({
        id: editingId || undefined,
        profile_id: user.id,
        title: title.trim(),
        facility: facility.trim(),
        department: department.trim(),
        location: location.trim(),
        start_date: startDate,
        end_date: current ? undefined : endDate,
        current,
        description: description.trim(),
      });

      setMsg(editingId ? 'Experience updated' : 'Experience added');
      resetForm();
      setShowForm(false);
      setTimeout(() => setMsg(''), 3000);
      await fetchItems();
    } catch (err) {
      console.error('Save failed:', err);
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [user, editingId, title, facility, department, location, startDate, endDate, current, description, resetForm, fetchItems]);

  const handleDeleteRequest = useCallback((id: string) => setDeleteId(id), []);
  const handleCancelDelete = useCallback(() => setDeleteId(null), []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await experienceService.deleteExperience(deleteId);
      setMsg('Experience removed');
      setTimeout(() => setMsg(''), 3000);
      await fetchItems();
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Could not remove. Please try again.');
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, fetchItems]);

  // ----------------------------------------------------------
  // Derived
  // ----------------------------------------------------------
  const canSubmit = useMemo(() => {
    if (!title.trim() || !facility.trim() || !startDate) return false;
    if (!current && !endDate) return false;
    if (!current && endDate && startDate && endDate < startDate) return false;
    return true;
  }, [title, facility, startDate, endDate, current]);

  const todayMonth = new Date().toISOString().slice(0, 7);
  const endDateMin = startDate || undefined;

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
              Work experience
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Hospitals, wards, and clinical rotations
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
              {editingId ? 'Edit position' : 'Add position'}
            </h2>

            {error && (
              <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="exp-title" className={labelClass}>
                  Job title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="exp-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Critical Care Nurse"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="exp-facility" className={labelClass}>
                  Facility <span className="text-rose-500">*</span>
                </label>
                <input
                  id="exp-facility"
                  type="text"
                  required
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  placeholder="e.g. Kenyatta National Hospital"
                  autoComplete="organization"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exp-dept" className={labelClass}>
                    Department <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    id="exp-dept"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. ICU"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="exp-loc" className={labelClass}>
                    Location <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    id="exp-loc"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nairobi"
                    autoComplete="address-level2"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exp-start" className={labelClass}>
                    Start <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="exp-start"
                    type="month"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={todayMonth}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="exp-end" className={labelClass}>
                    End {!current && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    id="exp-end"
                    type="month"
                    disabled={current}
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
                  checked={current}
                  onChange={(e) => setCurrent(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 dark:bg-zinc-800"
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  I currently work here
                </span>
              </label>

              <div>
                <label htmlFor="exp-desc" className={labelClass}>
                  Description <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  id="exp-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you do in this role?"
                  rows={3}
                  className={`${inputClass} resize-none`}
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
                  ) : editingId ? (
                    'Update'
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
            {[1, 2, 3].map(i => <ExperienceSkeleton key={i} />)}
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              No work experience yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Add the hospitals and wards you've worked in to build your clinical timeline.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Add your first position
            </button>
          </div>
        ) : (
          <div>
            {experiences.map(exp => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                onEdit={handleEditClick}
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
        title="Remove work experience?"
        message="This will permanently remove this position from your profile. This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}