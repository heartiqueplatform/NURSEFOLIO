/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// We use the certificatesService we fixed
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Focus Designations & Board Licenses</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publish credentials like ACLS, CCRN, or state licenses.
          </p>
        </div>

        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition active:scale-95 shadow-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Cancel' : 'Add Certification'}</span>
        </button>
      </div>

      {msg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-teal-100 dark:border-teal-800 p-6 shadow-sm animate-in slide-in-from-top duration-300">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">
            {editingId ? 'Edit Specialty Certification' : 'Post Specialty Certification'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-705 dark:text-slate-300 font-medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Certification Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ACLS"
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Issuing Organization</label>
                <input
                  required
                  type="text"
                  value={issuingOrg}
                  onChange={(e) => setIssuingOrg(e.target.value)}
                  placeholder="e.g. Nursing Council"
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Issue Date</label>
                <input
                  required
                  type="month"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Verification URL (Optional)</label>
                <input
                  type="url"
                  value={verificationUrl}
                  onChange={(e) => setVerificationUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition"
            >
              {saving ? 'Saving...' : editingId ? 'Update Certification' : 'Add Certification'}
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : certs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200">No designations listed</h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {certs.map((cert) => (
            <div key={cert.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEditClick(cert)} className="text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/50"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(cert.id)} className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{cert.name}</h4>
              <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400">{cert.issuing_organization}</p>
              <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
                <span>Issued: <span className="font-semibold text-slate-700 dark:text-slate-300">{cert.issue_date}</span></span>
                {cert.verification_url && (
                  <a href={cert.verification_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
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