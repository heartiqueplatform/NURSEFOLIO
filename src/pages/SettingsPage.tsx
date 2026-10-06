/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { VerificationBadge } from '../components/VerificationBadge';
import { supabase } from '../lib/supabase';
import {
  ShieldCheck, Check, Key, LogOut, AlertTriangle,
  Heart, Trash2, X, ChevronRight, Eye, EyeOff, Loader2
} from 'lucide-react';

// ==========================================================
// SHARED INPUT CLASSES
// ==========================================================
const inputClass =
  'w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition';

const labelClass =
  'block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5';

// ==========================================================
// SECTION WRAPPER — reusable
// ==========================================================
const Section = React.memo<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}>(({ title, subtitle, icon, tone = 'default', children }) => {
  const titleColor =
    tone === 'danger'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-900 dark:text-white';

  return (
    <section className="px-4 md:px-0 py-5 border-b border-slate-100 dark:border-zinc-900 md:border-0 md:py-0 md:mb-6">
      <div className="flex items-start gap-3 mb-4">
        {icon && (
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${tone === 'danger'
            ? 'bg-rose-50 dark:bg-rose-950/40'
            : 'bg-slate-100 dark:bg-zinc-900'
            }`}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className={`text-base md:text-lg font-bold tracking-tight ${titleColor}`}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
});
Section.displayName = 'Section';

// ==========================================================
// PASSWORD INPUT — with visibility toggle
// ==========================================================
const PasswordInput = React.memo<{
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
}>(({ id, value, onChange, placeholder, autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 dark:text-slate-500 active:bg-slate-200 dark:active:bg-zinc-800 transition"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

// ==========================================================
// AVAILABILITY OPTION
// ==========================================================
const AVAILABILITY_OPTIONS: Array<{
  value: 'available' | 'open' | 'busy';
  label: string;
  sublabel: string;
  dot: string;
  activeClasses: string;
}> = [
    {
      value: 'available',
      label: 'Available now',
      sublabel: 'Ready for hire',
      dot: 'bg-emerald-500',
      activeClasses: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/30',
    },
    {
      value: 'open',
      label: 'Open to offers',
      sublabel: 'Considering roles',
      dot: 'bg-amber-500',
      activeClasses: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/30',
    },
    {
      value: 'busy',
      label: 'Not available',
      sublabel: 'Currently placed',
      dot: 'bg-slate-400',
      activeClasses: 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 ring-2 ring-slate-400/30',
    },
  ];

// ==========================================================
// MAIN PAGE
// ==========================================================
export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Availability
  const [availability, setAvailability] = useState<'available' | 'open' | 'busy'>(
    user?.availability_status || 'available'
  );
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Verification
  const [licenseType, setLicenseType] = useState('Registered Nurse (RN) ID');
  const [licenseNum, setLicenseNum] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [submittingVer, setSubmittingVer] = useState(false);
  const [verSuccess, setVerSuccess] = useState('');
  const [verError, setVerError] = useState('');

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passIsError, setPassIsError] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Modals
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Sync availability from user once it loads/changes
  useEffect(() => {
    if (user?.availability_status) {
      setAvailability(user.availability_status);
    }
  }, [user?.availability_status]);

  // ----------------------------------------------------------
  // Availability
  // ----------------------------------------------------------
  const handleAvailabilityChange = useCallback(async (val: 'available' | 'open' | 'busy') => {
    if (!user || val === availability) return;
    const previous = availability;
    setAvailability(val); // optimistic
    setSavingAvailability(true);
    try {
      await databaseService.updateProfile(user.id, { availability_status: val });
      await refreshUser();
    } catch (err) {
      console.error('Availability update failed:', err);
      setAvailability(previous); // roll back
    } finally {
      setSavingAvailability(false);
    }
  }, [user, availability, refreshUser]);

  // ----------------------------------------------------------
  // Verification
  // ----------------------------------------------------------
  const handleVerificationSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setVerError('');
    setVerSuccess('');

    const num = licenseNum.trim();
    const state = licenseState.trim();

    if (!num || !state) {
      setVerError('Please enter both your license number and issuing board.');
      return;
    }

    setSubmittingVer(true);
    try {
      await databaseService.submitVerificationRequest({
        profile_id: user.id,
        license_type: licenseType,
        license_number: num,
        state_country: state,
        nurse_name: `${user.first_name} ${user.last_name}`,
        nurse_email: user.email,
        license_document_url: 'dummy_license_doc.png',
      });
      await refreshUser();
      setVerSuccess('Verification request filed. Our team will review your details within 24 hours.');
      setLicenseNum('');
      setLicenseState('');
    } catch (err: any) {
      setVerError(err?.message || 'Could not submit verification. Please try again.');
    } finally {
      setSubmittingVer(false);
    }
  }, [user, licenseType, licenseNum, licenseState, refreshUser]);

  // ----------------------------------------------------------
  // Password
  // ----------------------------------------------------------
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg('');
    setPassIsError(false);

    if (!newPassword) {
      setPassMsg('Please enter a new password.');
      setPassIsError(true);
      return;
    }
    if (newPassword.length < 8) {
      setPassMsg('Password must be at least 8 characters.');
      setPassIsError(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg('Passwords do not match.');
      setPassIsError(true);
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPassMsg('Password updated successfully.');
      setPassIsError(false);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassMsg(''), 4000);
    } catch (err: any) {
      setPassMsg(err?.message || 'Failed to update password.');
      setPassIsError(true);
    } finally {
      setUpdatingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  // ----------------------------------------------------------
  // Sign out
  // ----------------------------------------------------------
  const handleSignOut = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  // ----------------------------------------------------------
  // Delete account
  // ----------------------------------------------------------
  const handleDeleteAccount = useCallback(async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');
    try {
      await databaseService.deleteAccount?.(user.id);
      await logout();
      navigate('/');
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete account. Please contact support.');
      setDeleting(false);
    }
  }, [user, deleteConfirmText, logout, navigate]);

  // Close modals with Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSignOutModal && !deleting) setShowSignOutModal(false);
        if (showDeleteModal && !deleting) setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSignOutModal, showDeleteModal, deleting]);

  // ----------------------------------------------------------
  // Memoized derived state
  // ----------------------------------------------------------
  const isVerified = user?.verification_status === 'verified';
  const isPending = user?.verification_status === 'pending';
  const canDelete = deleteConfirmText === 'DELETE' && !deleting;
  const canUpdatePassword = newPassword.length >= 8 && newPassword === confirmPassword && !updatingPassword;

  if (!user) return null;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto md:px-6 md:py-8">

        {/* ============================================
            AVAILABILITY
            ============================================ */}
        <Section
          title="Availability"
          subtitle="Let hospitals and agencies know your current status."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {AVAILABILITY_OPTIONS.map(opt => {
              const isActive = availability === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAvailabilityChange(opt.value)}
                  disabled={savingAvailability}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl text-left transition active:opacity-70 disabled:opacity-50 ${isActive
                    ? opt.activeClasses
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300'
                    }`}
                  aria-pressed={isActive}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{opt.label}</p>
                    <p className="text-[10px] opacity-80 truncate mt-0.5">{opt.sublabel}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ============================================
            VERIFICATION
            ============================================ */}
        <Section
          title="Verified credential"
          subtitle="Earn a badge by submitting your board license details."
          icon={<ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
        >
          {/* Status pill */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Current status
            </span>
            <VerificationBadge status={user.verification_status} showText={true} />
          </div>

          {verSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 p-3 rounded-2xl text-sm font-semibold flex items-start gap-2">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{verSuccess}</span>
            </div>
          )}

          {verError && (
            <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 p-3 rounded-2xl text-sm font-semibold">
              {verError}
            </div>
          )}

          {isVerified ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  Board verification complete
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                  Your license matches state regulators. No further action needed.
                </p>
              </div>
            </div>
          ) : isPending ? (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                  Verification in progress
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                  We received your details. An admin will review them within 24 hours.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <label htmlFor="ver-license-type" className={labelClass}>
                  Board designation
                </label>
                <select
                  id="ver-license-type"
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className={inputClass}
                >
                  <option value="Registered Nurse (RN) ID">Registered Nurse (RN)</option>
                  <option value="Family Nurse Practitioner (FNP) ID">Nurse Practitioner (FNP)</option>
                  <option value="Licensed Practical Nurse (LPN) ID">Practical Nurse (LPN)</option>
                  <option value="Student Registration Certification ID">Student Registration</option>
                </select>
              </div>

              <div>
                <label htmlFor="ver-license-num" className={labelClass}>
                  License / Student ID
                </label>
                <input
                  id="ver-license-num"
                  type="text"
                  required
                  value={licenseNum}
                  onChange={(e) => setLicenseNum(e.target.value)}
                  placeholder="e.g. RN-9821817"
                  className={inputClass}
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="ver-license-state" className={labelClass}>
                  Issuing board
                </label>
                <input
                  id="ver-license-state"
                  type="text"
                  required
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                  placeholder="e.g. Nairobi, Kenya"
                  className={inputClass}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={submittingVer}
                className="w-full py-3 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
              >
                {submittingVer ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting
                  </>
                ) : (
                  'Submit verification'
                )}
              </button>
            </form>
          )}
        </Section>

        {/* ============================================
            PASSWORD
            ============================================ */}
        <Section
          title="Password"
          subtitle="Change your account password. Minimum 8 characters."
          icon={<Key className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
        >
          {passMsg && (
            <div className={`p-3 rounded-2xl text-sm font-semibold ${passIsError
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
              }`}>
              {passMsg}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="sec-new-pass" className={labelClass}>
                New password
              </label>
              <PasswordInput
                id="sec-new-pass"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                  {8 - newPassword.length} more character{8 - newPassword.length === 1 ? '' : 's'} needed
                </p>
              )}
            </div>

            <div>
              <label htmlFor="sec-confirm-pass" className={labelClass}>
                Confirm password
              </label>
              <PasswordInput
                id="sec-confirm-pass"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">
                  Passwords don't match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canUpdatePassword}
              className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold active:opacity-80 transition disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating
                </>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        </Section>

        {/* ============================================
            SESSION
            ============================================ */}
        <Section
          title="Session"
          subtitle="Sign out of Nursefolio on this device."
          icon={<LogOut className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
        >
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800 transition"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Sign out
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </button>
        </Section>

        {/* ============================================
            DANGER ZONE
            ============================================ */}
        <Section
          title="Danger zone"
          subtitle="Permanently delete your account, portfolio, credentials, and all associated data. This cannot be undone."
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
          tone="danger"
        >
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-950/50 transition"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                Delete my account
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 dark:text-rose-500" />
          </button>
        </Section>

      </div>

      {/* ============================================
          SIGN OUT MODAL
          ============================================ */}
      {showSignOutModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 bg-black/60"
          onClick={() => setShowSignOutModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-3xl w-full md:max-w-sm p-6 md:p-8 text-center animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-400" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Sign out, {user.first_name || 'Nurse'}?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Your streak stays active. Come back within 3 days to keep it going.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={handleSignOut}
                className="w-full py-3 rounded-2xl bg-rose-500 active:bg-rose-600 text-white text-sm font-bold transition min-h-[48px]"
              >
                Yes, sign me out
              </button>
              <button
                onClick={() => setShowSignOutModal(false)}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          DELETE ACCOUNT MODAL
          ============================================ */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 bg-black/70"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-3xl w-full md:max-w-md p-6 md:p-8 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !deleting && setShowDeleteModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 dark:text-slate-500 active:bg-slate-100 dark:active:bg-zinc-900 transition"
              aria-label="Close"
              disabled={deleting}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
              Delete your account?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed mb-5">
              This permanently erases your profile, portfolio, certifications, experience records, and CV files.
            </p>

            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-4 mb-4">
              <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 mb-2">
                Type <span className="font-mono bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-slate-800 dark:text-slate-200 text-sm font-mono placeholder:text-slate-300 dark:placeholder:text-slate-600 transition"
                disabled={deleting}
                autoCapitalize="characters"
                autoComplete="off"
              />
            </div>

            {deleteError && (
              <div className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 p-3 rounded-2xl text-xs font-semibold mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={!canDelete}
                className="w-full py-3 rounded-2xl bg-rose-500 active:bg-rose-600 disabled:bg-slate-200 dark:disabled:bg-zinc-900 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold transition flex items-center justify-center gap-2 min-h-[48px]"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete permanently
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition disabled:opacity-50 min-h-[48px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}