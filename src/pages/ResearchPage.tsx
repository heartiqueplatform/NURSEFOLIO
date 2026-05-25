/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { ResearchProject } from '../types';
import { BookOpen, Calendar, Trash2, Plus, X, Check, ExternalLink } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export default function ResearchPage() {
  const { user } = useAuth();
  const [studies, setStudies] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [journal, setJournal] = useState('');
  const [pubDate, setPubDate] = useState('');
  const [coAuthors, setCoAuthors] = useState('');
  const [abstractText, setAbstractText] = useState('');
  const [projectUrl, setProjectUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchStudies = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await databaseService.getResearchProjects(user.id);
      setStudies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, [user]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await databaseService.saveResearchProject({
        profile_id: user.id,
        title,
        journal_or_publisher: journal || undefined,
        publication_date: pubDate || undefined,
        co_authors: coAuthors || undefined,
        abstract_text: abstractText || undefined,
        project_url: projectUrl || undefined
      });

      // Clear Form state
      setTitle('');
      setJournal('');
      setPubDate('');
      setCoAuthors('');
      setAbstractText('');
      setProjectUrl('');

      setShowForm(false);
      setMsg('Research paper compiled on profile timeline!');
      setTimeout(() => setMsg(''), 3000);
      await fetchStudies();
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
      await databaseService.deleteResearchProject(deleteId);
      setMsg('Research paper removed.');
      setTimeout(() => setMsg(''), 3000);
      await fetchStudies();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Clinical Studies & Research Publications</h2>
          <p className="text-xs text-slate-500 mt-1">
            Publish nursing informatics, geriatric therapies, or case reports on critical medicine.
          </p>
        </div>

        <button
          id="res-toggle-btn"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition active:scale-95 cursor-pointer shadow-sm select-none"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Close panel' : 'Add Publication'}</span>
        </button>
      </div>

      {msg && (
        <div id="res-alert" className="bg-emerald-50 border border-emerald-100 text-emerald-707 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-teal-100 p-6 shadow-sm border-2 animate-in fade-in duration-200">
          <h3 className="font-bold text-slate-800 text-sm mb-4 font-sans">Post Published Case Study</h3>
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs text-slate-705 font-medium">
            
            <div>
              <label className="block text-slate-500 mb-1">Study / Publication Title</label>
              <input
                id="res-input-title"
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Telehealth transition models in post-op cardiology wards"
                className="w-full pl-3 pr-4 py-2 bg-slate-55 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1">Journal name or Publisher</label>
                <input
                  id="res-input-journal"
                  type="text"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="e.g. Journal of Advanced Nursing Practice (JANP)"
                  className="w-full pl-3 pr-4 py-2 bg-slate-55 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Publication Month/Year</label>
                <input
                  id="res-input-date"
                  type="month"
                  value={pubDate}
                  onChange={(e) => setPubDate(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 bg-slate-55 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-sans">Co-Authors</label>
                <input
                  id="res-input-authors"
                  type="text"
                  value={coAuthors}
                  onChange={(e) => setCoAuthors(e.target.value)}
                  placeholder="e.g. Dr. Jane Kamau, Prof. Fredrick Omondi"
                  className="w-full pl-3 pr-4 py-2 bg-slate-55 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Published Study URL link</label>
                <input
                  id="res-input-url"
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://example.org/janp/study..."
                  className="w-full pl-3 pr-4 py-2 bg-slate-55 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Study abstract / background summary</label>
              <textarea
                id="res-input-abstract"
                value={abstractText}
                onChange={(e) => setAbstractText(e.target.value)}
                placeholder="A brief longitudinal quantitative report summarizing research findings..."
                rows={3}
                className="w-full pl-3 pr-4 py-2 bg-slate-55 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
              ></textarea>
            </div>

            <button
              id="res-save-btn"
              type="submit"
              disabled={saving}
              className="w-full py-3 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl active:scale-95 transition"
            >
              Verify & Add Publication to Timeline
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
      ) : studies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-500 font-sans shadow-sm">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h4 className="font-bold text-slate-850">No published studies listed</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Case studies, academic journals or remote consultation designs establish premium, peer leader qualifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {studies.map((proj) => (
            <div key={proj.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-base leading-tight">{proj.title}</h4>
                  {proj.journal_or_publisher && (
                    <p className="text-xs text-teal-750 font-bold">{proj.journal_or_publisher} ({proj.publication_date})</p>
                  )}
                  {proj.co_authors && (
                    <p className="text-[10px] text-slate-500">Co-authors: {proj.co_authors}</p>
                  )}
                </div>

                <button
                  id={`res-btn-delete-${proj.id}`}
                  onClick={() => handleDeleteItem(proj.id)}
                  className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 cursor-pointer flex-shrink-0"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>

              {proj.abstract_text && (
                <p className="text-xs text-slate-550 leading-relaxed max-w-2xl bg-slate-50/50 p-3 rounded-lg border border-slate-100/60 font-medium italic">
                  "{proj.abstract_text}"
                </p>
              )}

              {proj.project_url && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={proj.project_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <span>Full Published Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

     <ConfirmModal
        isOpen={!!deleteId}
        title="Remove Publication"
        message="Are you sure you want to remove this research paper publication card? This action is irreversible."
        onConfirm={purseDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
