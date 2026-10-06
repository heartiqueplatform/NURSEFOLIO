/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { certificatesService } from '../services/certificatesService';
import { Certification } from '../types';
import {
  Award, Calendar, Trash2, Plus, X, Check, Globe, Pencil,
  ExternalLink, Loader2
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
// CERT CARD
// ==========================================================
const CertCard = React.memo<{
  cert: Certification;
  onEdit: (cert: Certification) => void;
  onDelete: (id: string) => void;
}>(({ cert, onEdit, onDelete }) => {
  const issuedLabel = useMemo(() => {
    if (!cert.issue_date) return '';
    // issue_date is stored as YYYY-MM; render it as "Mon YYYY"
    const [year, month] = cert.issue_date.split('-');
    if (!year || !month) return cert.issue_date;
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [cert.issue_date]);

  return (
    <article className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">
            {cert.name}
          </h3>
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 mt-0.5 truncate">
            {cert.issuing_organization}
          </p>
          {issuedLabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Issued {issuedLabel}
            </p>
          )}
          {cert.verification_url && (
            <a
              href={cert.verification_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 active:opacity-70"
            >
              <Globe className="w-3 h-3" />
              Verify credential
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3.5">
        <button
          onClick={() => onEdit(cert)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800 transition"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => onDelete(cert.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-950/50 transition ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>
    </article>
  );
});
CertCard.displayName = 'CertCard';

// ==========================================================
// SKELETON
// ==========================================================
const CertSkeleton = React.memo(() => (
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
CertSkeleton.displayName = 'CertSkeleton';

// ==========================================================
// MAIN
// ==========================================================
export default function CertificationsPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [issuingOrg, setIssuingOrg] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // ----------------------------------------------------------
  // Load
  // ----------------------------------------------------------
  const loadCerts = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await certificatesService.getCertifications(user.id);
      setCerts(data);
    } catch (err) {
      console.error('Failed to load certifications:', err);
      setError('Could not load your certifications.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCerts();
  }, [loadCerts]);

  // ----------------------------------------------------------
  // Form helpers
  // ----------------------------------------------------------
  const resetForm = useCallback(() => {
    setEditingId(null);
    setName('');
    setIssuingOrg('');
    setIssueDate('');
    setVerificationUrl('');
    setShowForm(false);
    setError('');
  }, []);

  const handleEditClick = useCallback((cert: Certification) => {
    setEditingId(cert.id);
    setName(cert.name);
    setIssuingOrg(cert.issuing_organization);
    setIssueDate(cert.issue_date);
    setVerificationUrl(cert.verification_url || '');
    setShowForm(true);
    // Smooth scroll — use rAF so the form is rendered before scroll
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!name.trim() || !issuingOrg.trim() || !issueDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      await certificatesService.saveCertification({
        id: editingId || undefined,
        profile_id: user.id,
        name: name.trim(),
        issuing_organization: issuingOrg.trim(),
        issue_date: issueDate,
        verification_url: verificationUrl.trim() || undefined,
      });

      setMsg(editingId ? 'Certification updated' : 'Certification published');
      setTimeout(() => setMsg(''), 3000);
      resetForm();
      await loadCerts();
    } catch (err) {
      console.error('Save failed:', err);
      setError('Could not save certification. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [user, name, issuingOrg, issueDate, verificationUrl, editingId, resetForm, loadCerts]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await certificatesService.deleteCertification(deleteId);
      setMsg('Certification removed');
      setTimeout(() => setMsg(''), 3000);
      await loadCerts();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, loadCerts]);

  const handleDeleteRequest = useCallback((id: string) => setDeleteId(id), []);
  const handleCancelDelete = useCallback(() => setDeleteId(null), []);

  const toggleForm = useCallback(() => {
    if (showForm) resetForm();
    else setShowForm(true);
  }, [showForm, resetForm]);

  // Derived — is the form dirty?
  const formDirty = useMemo(() => {
    return !!(name || issuingOrg || issueDate || verificationUrl);
  }, [name, issuingOrg, issueDate, verificationUrl]);

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
              Certifications
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Board licenses, ACLS, CCRN, and specialty designations
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
            SUCCESS / ERROR MESSAGES
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
            FORM — flat, edge-to-edge on mobile
            ============================================ */}
        {showForm && (
          <section className="mx-4 md:mx-0 mb-6 bg-white dark:bg-zinc-950 md:rounded-2xl p-4 md:p-5 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              {editingId ? 'Edit certification' : 'Add certification'}
            </h2>

            {error && (
              <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="cert-name" className={labelClass}>
                  Certification name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cert-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ACLS, CCRN, RN License"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="cert-org" className={labelClass}>
                  Issuing organization <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cert-org"
                  type="text"
                  required
                  value={issuingOrg}
                  onChange={(e) => setIssuingOrg(e.target.value)}
                  placeholder="e.g. Nursing Council of Kenya"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="cert-date" className={labelClass}>
                  Issue date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cert-date"
                  type="month"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 7)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="cert-url" className={labelClass}>
                  Verification URL <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  id="cert-url"
                  type="url"
                  value={verificationUrl}
                  onChange={(e) => setVerificationUrl(e.target.value)}
                  placeholder="https://..."
                  inputMode="url"
                  autoComplete="url"
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  Link to the official register or your digital certificate
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition disabled:opacity-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim() || !issuingOrg.trim() || !issueDate}
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
            {[1, 2, 3].map(i => <CertSkeleton key={i} />)}
          </div>
        ) : certs.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <Award className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              No certifications yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Add your board license, ACLS, or specialty designations to build trust with recruiters.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Add your first certification
            </button>
          </div>
        ) : (
          <div>
            {certs.map(cert => (
              <CertCard
                key={cert.id}
                cert={cert}
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
        title="Remove certification?"
        message="This will permanently remove the certification from your profile. This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}