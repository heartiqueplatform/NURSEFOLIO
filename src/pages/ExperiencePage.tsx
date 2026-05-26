/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { experienceService } from '../services/experienceService';
import { Experience } from '../types';
import { Briefcase, Calendar, Trash2, Plus, X, Check, Building, Pencil } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export default function ExperiencePage() {
  const { user } = useAuth();

  // --- State for our data ---
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- Form State (Used for both Adding AND Editing) ---
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
  const [savedMsg, setSavedMsg] = useState('');

  // --- Functions to talk to the Database ---
  const fetchItems = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await experienceService.getExperiences(user.id);
      setExperiences(data);
    } catch (err) {
      console.error("Couldn't get the list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  // When we want to edit, we fill the form with the card's old info
  const handleEditClick = (exp: Experience) => {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setFacility('');
    setDepartment('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setCurrent(false);
    setDescription('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await experienceService.saveExperience({
        id: editingId || undefined,
        profile_id: user.id,
        title,
        facility,
        department,
        location,
        start_date: startDate,
        end_date: current ? undefined : endDate,
        current,
        description
      });

      setSavedMsg(editingId ? 'Experience updated!' : 'Experience position appended!');
      resetForm();
      setTimeout(() => setSavedMsg(''), 3000);
      await fetchItems();
    } catch (err) {
      console.error("The save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await experienceService.deleteExperience(deleteId);
      setSavedMsg('Experience card trashed!');
      setTimeout(() => setSavedMsg(''), 3000);
      await fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-0 md:space-y-6 font-sans -mx-3 md:mx-0">

      {/* Header Row - full width on mobile */}
      <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 md:shadow-sm border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Work Experience Records</h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">
            Build up a timeline of hospital services, critical care placements, or rotations.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition active:scale-95 cursor-pointer md:shadow-sm"
        >
          {showForm ? <X className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          <span>{showForm ? 'Cancel' : 'Add Position'}</span>
        </button>
      </div>

      {savedMsg && (
        <div className="mx-3 md:mx-0 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-2.5 md:p-3.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold flex items-center gap-1.5 md:gap-2">
          <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Experience Form Section - full width on mobile */}
      {showForm && (
        <div className="mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:rounded-2xl md:border-2 md:border-teal-100 md:dark:border-teal-800 p-4 md:p-6 md:shadow-sm border-b-2 border-teal-100 dark:border-teal-800 md:border-b-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm mb-3 md:mb-4">
            {editingId ? 'Update Position Details' : 'Post New Position Profile'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 text-[11px] md:text-xs text-slate-700 dark:text-slate-300 font-medium">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">Clinical Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Critical Care Nurse"
                  className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">Hospital / Medical Facility</label>
                <input
                  required
                  type="text"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  placeholder="e.g. Kenyatta National Hospital"
                  className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">Department (Optional)</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. ICU"
                  className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">Facility Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nairobi"
                  className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 items-end">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">Start Month/Year</label>
                <input
                  required
                  type="month"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">End Month/Year</label>
                <input
                  type="month"
                  disabled={current}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>

              <div className="pb-1.5 md:pb-2">
                <label className="inline-flex items-center gap-1.5 md:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={current}
                    onChange={(e) => setCurrent(e.target.checked)}
                    className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-600 rounded dark:bg-slate-800"
                  />
                  <span className="text-[10px] md:text-xs font-semibold text-slate-700 dark:text-slate-300">I work here currently</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your role..."
                rows={3}
                className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 md:py-3 text-[11px] md:text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg md:rounded-xl transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Position' : 'Add Position'}
            </button>
          </form>
        </div>
      )}

      {/* List Section - feed style on mobile */}
      {loading ? (
        <div className="py-16 md:py-20 text-center">
          <div className="w-6 h-6 md:w-8 md:h-8 border-3 md:border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : experiences.length === 0 ? (
        <div className="mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-8 md:p-12 text-center md:shadow-sm">
          <Briefcase className="w-8 h-8 md:w-10 md:h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3 md:mb-4" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">No experiences listed</h4>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">Tell us where you've worked!</p>
        </div>
      ) : (
        <div className="space-y-0 md:space-y-4">
          {experiences.map((exp) => (
            <div key={exp.id} className="bg-white dark:bg-zinc-950 md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-5 md:rounded-2xl md:shadow-sm flex items-start justify-between gap-3 md:gap-4 group border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
              <div className="space-y-1.5 md:space-y-2 min-w-0 flex-1">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm md:text-base leading-tight">{exp.title}</h4>
                  <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-teal-600 dark:text-teal-400 font-bold mt-0.5 md:mt-1">
                    <Building className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">{exp.facility} {exp.department ? `(${exp.department})` : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  <span>{exp.start_date} &mdash; {exp.current ? 'Present' : exp.end_date}</span>
                </div>

                {exp.description && (
                  <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">{exp.description}</p>
                )}
              </div>

              <div className="flex gap-1 md:gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEditClick(exp)}
                  className="text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 p-1.5 md:p-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/50 transition"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(exp.id)}
                  className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 md:p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Remove Position"
        message="Are you sure? This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}