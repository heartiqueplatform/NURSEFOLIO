/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// We use the experienceService we talked about to talk to the database
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
  const [editingId, setEditingId] = useState<string | null>(null); // If this has an ID, we are editing!

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

  // --- Functions to talk to Mama (the Database) ---

  const fetchItems = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await experienceService.getExperiences(user.id);
      setExperiences(data);
    } catch (err) {
      console.error("  couldn't get the list:", err);
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
    setShowForm(true); // Open the panel
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Slide up to see the form
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
        id: editingId || undefined, // If we have an ID, Supabase knows to UPDATE
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
    <div className="space-y-6 font-sans">

      {/* Header Row */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Work Experience Records</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build up a timeline of hospital services, critical care placements, or rotations.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition active:scale-95 cursor-pointer shadow-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Cancel' : 'Add Position'}</span>
        </button>
      </div>

      {savedMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Experience Form Section */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-teal-100 dark:border-teal-800 p-6 shadow-sm animate-in slide-in-from-top duration-300">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">
            {editingId ? 'Update Position Details' : 'Post New Position Profile'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700 dark:text-slate-300 font-medium">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Clinical Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Critical Care Nurse"
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Hospital / Medical Facility</label>
                <input
                  required
                  type="text"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  placeholder="e.g. Kenyatta National Hospital"
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Department (Optional)</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. ICU"
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Facility Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nairobi"
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Start Month/Year</label>
                <input
                  required
                  type="month"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">End Month/Year</label>
                <input
                  type="month"
                  disabled={current}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="pb-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={current}
                    onChange={(e) => setCurrent(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded dark:bg-slate-800"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">I work here currently</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your role..."
                rows={3}
                className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Position' : 'Add Position'}
            </button>
          </form>
        </div>
      )}

      {/* List Section */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : experiences.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-sm">
          <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200">No experiences listed</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tell us where you've worked!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div key={exp.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-start justify-between gap-4 group">
              <div className="space-y-2">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">{exp.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-bold mt-1">
                    <Building className="w-4 h-4" />
                    <span>{exp.facility} {exp.department ? `(${exp.department})` : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>{exp.start_date} &mdash; {exp.current ? 'Present' : exp.end_date}</span>
                </div>

                {exp.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">{exp.description}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(exp)}
                  className="text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 p-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/50 transition"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(exp.id)}
                  className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
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