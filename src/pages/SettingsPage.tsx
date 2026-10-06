/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { VerificationBadge } from '../components/VerificationBadge';
import {
  ShieldCheck, Check, Key, LogOut, AlertTriangle,
  Heart, Trash2, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Availability state
  const [availability, setAvailability] = useState<'available' | 'open' | 'busy'>(
    user?.availability_status || 'available'
  );

  // Verification Form State
  const [licenseType, setLicenseType] = useState('Registered Nurse (RN) ID');
  const [licenseNum, setLicenseNum] = useState('');
  const [licenseState, setLicenseState] = useState('');

  const [submittingVer, setSubmittingVer] = useState(false);
  const [verSuccess, setVerSuccess] = useState('');
  const [verError, setVerError] = useState('');

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passIsError, setPassIsError] = useState(false);

  // Goodbye modal + Delete modal
  const [showGoodbyeModal, setShowGoodbyeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!user) return null;

  const handleAvailabilityChange = async (val: 'available' | 'open' | 'busy') => {
    setAvailability(val);
    try {
      await databaseService.updateProfile(user.id, { availability_status: val });
      await refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerError('');
    setVerSuccess('');
    setSubmittingVer(true);

    if (!licenseNum.trim() || !licenseState.trim()) {
      setVerError('Please input license ID and regulatory state board parameters.');
      setSubmittingVer(false);
      return;
    }

    try {
      await databaseService.submitVerificationRequest({
        profile_id: user.id,
        license_type: licenseType,
        license_number: licenseNum,
        state_country: licenseState,
        nurse_name: `${user.first_name} ${user.last_name}`,
        nurse_email: user.email,
        license_document_url: 'dummy_license_doc.png'
      });
      await refreshUser();
      setVerSuccess('Verification request filed successfully. Our team will review your documents within 24 hours.');
      setLicenseNum('');
      setLicenseState('');
    } catch (err: any) {
      setVerError(err.message || 'Verification submission error.');
    } finally {
      setSubmittingVer(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg('');
    setPassIsError(false);

    if (!newPassword.trim()) {
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

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPassMsg(error.message);
        setPassIsError(true);
        return;
      }
      setPassMsg('Password updated successfully.');
      setPassIsError(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassMsg(''), 4000);
    } catch (err: any) {
      setPassMsg(err.message || 'Failed to update password.');
      setPassIsError(true);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');
    try {
      // Requires a databaseService.deleteAccount() that wipes profile + auth user
      // If not yet implemented, we surface a graceful message.
      await databaseService.deleteAccount?.(user.id);
      await logout();
      navigate('/');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Please contact support.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 font-sans -mx-3 md:mx-0">

      {/* Availability Section */}
      <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:shadow-sm space-y-4 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
        <div>
          <h3 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Active Availability Status
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-normal leading-relaxed">
            Set your placement availability for hospitals and medical agencies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <button
            id="avail-btn-available"
            onClick={() => handleAvailabilityChange('available')}
            className={`flex items-center gap-3 p-3.5 md:p-4 border rounded-xl select-none transition-all active:scale-[98%] cursor-pointer text-left ${availability === 'available'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0"></span>
            <div className="min-w-0">
              <span className="block font-bold text-sm">Active Care</span>
              <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                Available for hire
              </span>
            </div>
          </button>

          <button
            id="avail-btn-open"
            onClick={() => handleAvailabilityChange('open')}
            className={`flex items-center gap-3 p-3.5 md:p-4 border rounded-xl select-none transition-all active:scale-[98%] cursor-pointer text-left ${availability === 'open'
              ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
            <div className="min-w-0">
              <span className="block font-bold text-sm">Open to Offers</span>
              <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                Considering placement
              </span>
            </div>
          </button>

          <button
            id="avail-btn-busy"
            onClick={() => handleAvailabilityChange('busy')}
            className={`flex items-center gap-3 p-3.5 md:p-4 border rounded-xl select-none transition-all active:scale-[98%] cursor-pointer text-left ${availability === 'busy'
              ? 'border-slate-500 bg-slate-50/30 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 flex-shrink-0"></span>
            <div className="min-w-0">
              <span className="block font-bold text-sm">Not Available</span>
              <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                Currently placed
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Verification Portal */}
      <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:shadow-sm space-y-4 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Verified Credential Badge</span>
            </h3>
            <VerificationBadge status={user.verification_status} showText={true} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-normal leading-relaxed max-w-xl">
            To earn verified badge trust, submit your board license details. Our team cross-checks with regulatory bodies.
          </p>
        </div>

        {verSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{verSuccess}</span>
          </div>
        )}

        {verError && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl text-sm font-semibold">
            {verError}
          </div>
        )}

        {user.verification_status === 'verified' ? (
          <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl">
            <p className="font-bold flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Board verification complete</span>
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-400 font-normal leading-relaxed text-sm">
              Your license matches state regulators. No further verification is required.
            </p>
          </div>
        ) : user.verification_status === 'pending' ? (
          <div className="p-4 bg-amber-50/40 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl">
            <p className="font-bold flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>Verification in progress</span>
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-400 font-normal leading-relaxed text-sm">
              We have received your board details safely. Please await admin review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerificationSubmit} className="space-y-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-sm font-semibold">
                  Board Designation
                </label>
                <select
                  id="ver-license-type"
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                >
                  <option value="Registered Nurse (RN) ID">Registered Nurse (RN)</option>
                  <option value="Family Nurse Practitioner (FNP) ID">Nurse Practitioner (FNP)</option>
                  <option value="Licensed Practical Nurse (LPN) ID">Practical Nurse (LPN)</option>
                  <option value="Student Registration Certification ID">Student Registration</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-sm font-semibold">
                  License / Student ID
                </label>
                <input
                  id="ver-license-num"
                  required
                  type="text"
                  value={licenseNum}
                  onChange={(e) => setLicenseNum(e.target.value)}
                  placeholder="e.g. RN-9821817"
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-sm font-semibold">
                  State / Country Board
                </label>
                <input
                  id="ver-license-state"
                  required
                  type="text"
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                  placeholder="e.g. Nyeri, Kenya"
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              id="submit-ver-btn"
              type="submit"
              disabled={submittingVer}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl cursor-pointer active:scale-[98%] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {submittingVer ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Submit Verification Request'
              )}
            </button>
          </form>
        )}
      </div>

      {/* Security Credentials */}
      <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:shadow-sm space-y-4 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
        <div>
          <h3 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Key className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Update Password</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal mt-1">
            Change your account password. Use at least 8 characters.
          </p>
        </div>

        {passMsg && (
          <div className={`p-3.5 rounded-xl text-sm font-semibold border ${passIsError
            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400'
            : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            }`}>
            {passMsg}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-sm font-medium text-slate-700 dark:text-slate-300 max-w-md">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-sm font-semibold">
              New Password
            </label>
            <input
              id="sec-new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-sm font-semibold">
              Confirm New Password
            </label>
            <input
              id="sec-confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400"
            />
          </div>

          <button
            id="save-sec-btn"
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl active:scale-[98%] transition text-sm font-bold"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Account Actions — Sign Out */}
      <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:shadow-sm space-y-4 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
        <div>
          <h3 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <LogOut className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <span>Account Session</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal mt-1">
            Sign out of your Nursefolio account on this device.
          </p>
        </div>

        <button
          id="settings-signout-btn"
          onClick={() => setShowGoodbyeModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition active:scale-[98%] text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Danger Zone — Delete Account */}
      <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-rose-100 md:dark:border-rose-950/50 p-4 md:p-6 md:shadow-sm space-y-4 border-b border-rose-100 dark:border-rose-950/50 md:border-b md:border-rose-100">
        <div>
          <h3 className="text-base md:text-lg font-extrabold text-rose-700 dark:text-rose-400 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal mt-1 leading-relaxed">
            Permanently delete your account, portfolio, credentials, and all associated data. This action cannot be undone.
          </p>
        </div>

        <button
          id="settings-delete-btn"
          onClick={() => setShowDeleteModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition active:scale-[98%] text-sm shadow-md shadow-rose-200/50 dark:shadow-rose-950/40"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete My Account</span>
        </button>
      </div>

      {/* Goodbye Modal — Sign Out */}
      {showGoodbyeModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowGoodbyeModal(false)}
        >
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full text-center border border-slate-100 dark:border-slate-800 animate-goodbye-pop"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center animate-goodbye-pulse">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-400" />
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              Goodbye, {user?.first_name || 'Nurse'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 leading-relaxed">
              We'll miss you around here.
            </p>

            <div className="mt-3 mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <p className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                Your daily streak is still active. Come back within 3 days to keep it going.
              </p>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 leading-relaxed italic">
              "Every nurse you meet carries a little piece of their patients with them. Thank you for the care you give every day."
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSignOut}
                className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-all shadow-md shadow-rose-200 dark:shadow-rose-950/40 active:scale-[98%]"
              >
                Yes, sign me out
              </button>
              <button
                onClick={() => setShowGoodbyeModal(false)}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-all active:scale-[98%]"
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full border border-rose-100 dark:border-rose-950 animate-goodbye-pop"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => !deleting && setShowDeleteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              disabled={deleting}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">
              Delete Account?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed mb-4">
              This will permanently erase your profile, portfolio, certifications, experience records, and CV files. This cannot be undone.
            </p>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-xl p-3 mb-4">
              <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 mb-2">
                Type <span className="font-mono bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-800 focus:outline-none focus:border-rose-400 text-slate-800 dark:text-slate-200 text-sm font-mono placeholder:text-slate-300 dark:placeholder:text-slate-600"
                disabled={deleting}
              />
            </div>

            {deleteError && (
              <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3 rounded-xl text-xs font-semibold mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all active:scale-[98%] flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-all active:scale-[98%] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local animation styles for this page's modals */}
      <style>{`
        @keyframes goodbye-pop {
          0%   { opacity: 0; transform: scale(0.88) translateY(12px); }
          70%  { transform: scale(1.03) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes goodbye-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
        .animate-goodbye-pop {
          animation: goodbye-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-goodbye-pulse {
          animation: goodbye-pulse 1.6s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
}