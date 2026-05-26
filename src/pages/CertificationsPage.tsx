/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { certificatesService } from '../services/certificatesService';
import { Certification } from '../types';
import { Award, Calendar, Trash2, Plus, X, Check, Globe, Pencil } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export default function CertificationsPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- Form State ---
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [issuingOrg, setIssuingOrg] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadCerts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await certificatesService.getCertifications(user.id);
      setCerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCerts();
  }, [user]);

  const handleEditClick = (cert: Certification) => {
    setEditingId(cert.id);
    setName(cert.name);
    setIssuingOrg(cert.issuing_organization);
    setIssueDate(cert.issue_date);
    setVerificationUrl(cert.verification_url || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setIssuingOrg('');
    setIssueDate('');
    setVerificationUrl('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await certificatesService.saveCertification({
        id: editingId || undefined,
        profile_id: user.id,
        name,
        issuing_organization: issuingOrg,
        issue_date: issueDate,
        verification_url: verificationUrl || undefined
      });

      setMsg(editingId ? 'Certification updated!' : 'Certification and license published!');
      resetForm();
      setTimeout(() => setMsg(''), 3000);
      await loadCerts();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await certificatesService.deleteCertification(deleteId);
      setMsg('Certification removed.');
      setTimeout(() => setMsg(''), 3000);
      await loadCerts();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-0 md:space-y-6 font-sans -mx-3 md:mx-0">

      {/* Header - full width on mobile */}
      <div className="bg-white dark:bg-slate-900 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 md:shadow-sm border-b border-slate-100 dark:border-slate-800 md:border-b md:border-slate-100">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Focus Designations & Board Licenses</h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">
            Publish credentials like ACLS, CCRN, or state licenses.
          </p>
        </div>

        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition active:scale-95 md:shadow-sm"
        >
          {showForm ? <X className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          <span>{showForm ? 'Cancel' : 'Add Certification'}</span>
        </button>
      </div>

      {msg && (
        <div className="mx-3 md:mx-0 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-2.5 md:p-3.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold flex items-center gap-1.5 md:gap-2">
          <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Form - full width on mobile */}
      {showForm && (
        <div className="mx-3 md:mx-0 bg-white dark:bg-slate-900 md:rounded-2xl md:border-2 md:border-teal-100 md:dark:border-teal-800 p-4 md:p-6 md:shadow-sm border-b-2 border-teal-100 dark:border-teal-800 md:border-b-2 md:border-teal-100">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm mb-3 md:mb-4">
            {editingId ? 'Edit Specialty Certification' : 'Post Specialty Certification'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 text-[11px] md:text-xs text-slate-700 dark:text-slate-300 font-medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">Certification Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ACLS"
                  className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">Issuing Organization</label>
                <input
                  required
                  type="text"
                  value={issuingOrg}
                  onChange={(e) => setIssuingOrg(e.target.value)}
                  placeholder="e.g. Nursing Council"
                  className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">Issue Date</label>
                <input
                  required
                  type="month"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[10px] md:text-xs">Verification URL (Optional)</label>
                <input
                  type="url"
                  value={verificationUrl}
                  onChange={(e) => setVerificationUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-3 pr-3 md:pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 md:py-3 text-[11px] md:text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg md:rounded-xl transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Certification' : 'Add Certification'}
            </button>
          </form>
        </div>
      )}

      {/* List - single column feed on mobile, grid on desktop */}
      {loading ? (
        <div className="py-16 md:py-20 text-center">
          <div className="w-6 h-6 md:w-8 md:h-8 border-3 md:border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">Loading certifications...</p>
        </div>
      ) : certs.length === 0 ? (
        <div className="mx-3 md:mx-0 bg-white dark:bg-slate-900 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-8 md:p-12 text-center text-slate-500 dark:text-slate-400 md:shadow-sm">
          <Award className="w-8 h-8 md:w-10 md:h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3 md:mb-4" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">No designations listed</h4>
          <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 mt-1">Add your first certification above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 md:gap-6">
          {certs.map((cert) => (
            <div key={cert.id} className="bg-white dark:bg-slate-900 md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-5 md:rounded-2xl md:shadow-sm md:hover:shadow-md transition border-b border-slate-100 dark:border-slate-800 md:border-b md:border-slate-100 last:border-b-0 md:last:border-b">
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Award className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex gap-0.5 md:gap-1">
                  <button
                    onClick={() => handleEditClick(cert)}
                    className="text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/50 transition"
                    title="Edit certification"
                  >
                    <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(cert.id)}
                    className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    title="Delete certification"
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>

              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm md:text-base">{cert.name}</h4>
              <p className="text-[10px] md:text-[11px] font-bold text-teal-700 dark:text-teal-400 mt-0.5">{cert.issuing_organization}</p>

              <div className="mt-2.5 md:mt-3 pt-2.5 md:pt-3 border-t border-slate-50 dark:border-slate-800 text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 flex justify-between items-center flex-wrap gap-2">
                <span>Issued: <span className="font-semibold text-slate-700 dark:text-slate-300">{cert.issue_date}</span></span>
                {cert.verification_url && (
                  <a
                    href={cert.verification_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Globe className="w-3 h-3" /> Verify
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Remove Certification"
        message="Are you sure you want to remove this? This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}