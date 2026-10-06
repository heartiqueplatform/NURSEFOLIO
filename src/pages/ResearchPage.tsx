/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { ResearchProject } from '../types';
import {
  BookOpen, Calendar, Trash2, Plus, X, Check, ExternalLink, Loader2
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

// ==========================================================
// SHARED CLASSES
// ==========================================================
const inputClass =
  'w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition';

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
// RESEARCH CARD
// ==========================================================
const ResearchCard = React.memo<{
  project: ResearchProject;
  onDelete: (id: string) => void;
}>(({ project, onDelete }) => {
  const pubLabel = useMemo(
    () => formatMonth(project.publication_date),
    [project.publication_date]
  );

  return (
    <article className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
            {project.title}
          </h3>
          {project.journal_or_publisher && (
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 mt-0.5 truncate">
              {project.journal_or_publisher}
            </p>
          )}
          {pubLabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              Published {pubLabel}
            </p>
          )}
          {project.co_authors && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Co-authors: </span>
              {project.co_authors}
            </p>
          )}
        </div>
      </div>

      {project.abstract_text && (
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-3 italic line-clamp-4">
          "{project.abstract_text}"
        </p>
      )}

      <div className="flex items-center gap-2 mt-3.5">
        {project.project_url && (
          <a
            href={project.project_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 active:bg-blue-100 dark:active:bg-blue-950/50 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Read paper
          </a>
        )}
        <button
          onClick={() => onDelete(project.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-950/50 transition ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>
    </article>
  );
});
ResearchCard.displayName = 'ResearchCard';

// ==========================================================
// SKELETON
// ==========================================================
const ResearchSkeleton = React.memo(() => (
  <div className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
      </div>
    </div>
  </div>
));
ResearchSkeleton.displayName = 'ResearchSkeleton';

// ==========================================================
// MAIN
// ==========================================================
export default function ResearchPage() {
  const { user } = useAuth();
  const [studies, setStudies] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [journal, setJournal] = useState('');
  const [pubDate, setPubDate] = useState('');
  const [coAuthors, setCoAuthors] = useState('');
  const [abstractText, setAbstractText] = useState('');
  const [projectUrl, setProjectUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // ----------------------------------------------------------
  // Load
  // ----------------------------------------------------------
  const fetchStudies = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await databaseService.getResearchProjects(user.id);
      setStudies(data);
    } catch (err) {
      console.error('Failed to load research:', err);
      setError('Could not load your publications.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  // ----------------------------------------------------------
  // Form
  // ----------------------------------------------------------
  const resetForm = useCallback(() => {
    setTitle('');
    setJournal('');
    setPubDate('');
    setCoAuthors('');
    setAbstractText('');
    setProjectUrl('');
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!title.trim()) {
      setError('Please enter a publication title.');
      return;
    }
    if (projectUrl.trim() && !/^https?:\/\//i.test(projectUrl.trim())) {
      setError('URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    try {
      await databaseService.saveResearchProject({
        profile_id: user.id,
        title: title.trim(),
        journal_or_publisher: journal.trim() || undefined,
        publication_date: pubDate || undefined,
        co_authors: coAuthors.trim() || undefined,
        abstract_text: abstractText.trim() || undefined,
        project_url: projectUrl.trim() || undefined,
      });

      resetForm();
      setShowForm(false);
      setMsg('Publication added');
      setTimeout(() => setMsg(''), 3000);
      await fetchStudies();
    } catch (err) {
      console.error('Save research failed:', err);
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [user, title, journal, pubDate, coAuthors, abstractText, projectUrl, resetForm, fetchStudies]);

  const handleDeleteRequest = useCallback((id: string) => setDeleteId(id), []);
  const handleCancelDelete = useCallback(() => setDeleteId(null), []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await databaseService.deleteResearchProject(deleteId);
      setMsg('Publication removed');
      setTimeout(() => setMsg(''), 3000);
      await fetchStudies();
    } catch (err) {
      console.error('Delete research failed:', err);
      setError('Could not remove. Please try again.');
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, fetchStudies]);

  // ----------------------------------------------------------
  // Derived
  // ----------------------------------------------------------
  const canSubmit = useMemo(() => title.trim().length > 0, [title]);
  const todayMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

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
              Publications & Research
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Journal articles, case studies, and clinical research
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
              Add publication
            </h2>

            {error && (
              <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="res-title" className={labelClass}>
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="res-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Telehealth transition models in post-op cardiology"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="res-journal" className={labelClass}>
                    Journal / publisher
                  </label>
                  <input
                    id="res-journal"
                    type="text"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    placeholder="e.g. Journal of Advanced Nursing"
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="res-date" className={labelClass}>
                    Published
                  </label>
                  <input
                    id="res-date"
                    type="month"
                    value={pubDate}
                    onChange={(e) => setPubDate(e.target.value)}
                    max={todayMonth}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="res-authors" className={labelClass}>
                  Co-authors <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  id="res-authors"
                  type="text"
                  value={coAuthors}
                  onChange={(e) => setCoAuthors(e.target.value)}
                  placeholder="e.g. Dr. Jane Kamau, Prof. Fredrick Omondi"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="res-url" className={labelClass}>
                  Published URL <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  id="res-url"
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://doi.org/..."
                  inputMode="url"
                  autoComplete="url"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="res-abstract" className={labelClass}>
                  Abstract <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  id="res-abstract"
                  value={abstractText}
                  onChange={(e) => setAbstractText(e.target.value)}
                  placeholder="A brief summary of the study and its findings..."
                  rows={4}
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
          <div>{[1, 2].map(i => <ResearchSkeleton key={i} />)}</div>
        ) : studies.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              No publications yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Add your journal articles, case studies, and research work to showcase your academic contributions.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Add your first publication
            </button>
          </div>
        ) : (
          <div>
            {studies.map(project => (
              <ResearchCard
                key={project.id}
                project={project}
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
        title="Remove publication?"
        message="This will permanently remove this research paper from your profile. This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}