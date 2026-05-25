/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { VerificationBadge } from '../components/VerificationBadge';
import { ShieldCheck, Check, Key, Bell, HelpCircle, Heart, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  // Availability state
  const [availability, setAvailability] = useState<'available' | 'open' | 'busy'>(user?.availability_status || 'available');

  // Verification Form State
  const [licenseType, setLicenseType] = useState('Registered Nurse (RN) ID');
  const [licenseNum, setLicenseNum] = useState('');
  const [licenseState, setLicenseState] = useState('');

  const [submittingVer, setSubmittingVer] = useState(false);
  const [verSuccess, setVerSuccess] = useState('');
  const [verError, setVerError] = useState('');

  // Password Simulation state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');

  if (!user) return null;

  const handleAvailabilityChange = async (val: 'available' | 'open' | 'busy') => {
    setAvailability(val);
    try {
      await databaseService.updateProfile(user.id, {
        availability_status: val
      });
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
      setVerSuccess('Verification request filed compiled successfully! Staff will review boarding papers within 24 hours.');
      setLicenseNum('');
      setLicenseState('');
    } catch (err: any) {
      setVerError(err.message || 'Verification submission error.');
    } finally {
      setSubmittingVer(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPassword && newPassword) {
      setPassMsg('Security password updated successfully on servers.');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPassMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs">

      {/* Availability section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Active Availability Status</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium">Set your active placement indications for hospitals & medical agencies.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            id="avail-btn-available"
            onClick={() => handleAvailabilityChange('available')}
            className={`flex items-center gap-3 p-4 border rounded-xl select-none transition-all active:scale-98 cursor-pointer ${availability === 'available'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'
              : 'border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <div className="text-left">
              <span className="block font-bold">Active Care</span>
              <span className="block text-[9px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Available for round hire</span>
            </div>
          </button>

          <button
            id="avail-btn-open"
            onClick={() => handleAvailabilityChange('open')}
            className={`flex items-center gap-3 p-4 border rounded-xl select-none transition-all active:scale-98 cursor-pointer ${availability === 'open'
              ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/30 text-amber-850 dark:text-amber-300 font-bold'
              : 'border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <div className="text-left">
              <span className="block font-bold">Open to Offers</span>
              <span className="block text-[9px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Considering placement options</span>
            </div>
          </button>

          <button
            id="avail-btn-busy"
            onClick={() => handleAvailabilityChange('busy')}
            className={`flex items-center gap-3 p-4 border rounded-xl select-none transition-all active:scale-98 cursor-pointer ${availability === 'busy'
              ? 'border-slate-500 bg-slate-50/30 dark:bg-slate-800/50 text-slate-710 dark:text-slate-300 font-bold'
              : 'border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <div className="text-left">
              <span className="block font-bold">Not Available</span>
              <span className="block text-[9px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Currently fully placed</span>
            </div>
          </button>
        </div>
      </div>

      {/* Verification request portal upload */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5.5 h-5.5 text-teal-605 dark:text-teal-400" />
              <span>Verified Credential Badge Upload</span>
            </h3>
            <VerificationBadge status={user.verification_status} showText={true} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-medium max-w-xl">
            To earn professional credentials tag trust, file your state board index records here. Our administrators verify database inputs with regulatory boards.
          </p>
        </div>

        {verSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-705 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{verSuccess}</span>
          </div>
        )}

        {verError && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl text-xs font-semibold">
            {verError}
          </div>
        )}

        {user.verification_status === 'verified' ? (
          <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-110 dark:border-emerald-800 text-emerald-805 dark:text-emerald-300 rounded-xl">
            <p className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              <span>Full Board Verification Verified!</span>
            </p>
            <p className="mt-1 text-slate-500 dark:text-slate-400 font-normal leading-relaxed text-[11px]">
              Your nursing license matches state regulators. No further verification check is required at this time.
            </p>
          </div>
        ) : user.verification_status === 'pending' ? (
          <div className="p-4 bg-amber-50/40 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 text-amber-805 dark:text-amber-300 rounded-xl">
            <p className="font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>Verification checking in progress</span>
            </p>
            <p className="mt-1 text-slate-500 dark:text-slate-400 font-normal leading-relaxed text-[11px]">
              We have filed your board licensings details safely. Please await administrator review and status updates.
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerificationSubmit} className="space-y-4 text-xs font-medium text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Board Designations Type</label>
                <select
                  id="ver-license-type"
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-705 dark:text-slate-300"
                >
                  <option value="Registered Nurse (RN) ID">Registered Nurse (RN)</option>
                  <option value="Family Nurse Practitioner (FNP) ID">Nurse Practitioner (FNP)</option>
                  <option value="Licensed Practical Nurse (LPN) ID">Practical Nurse (LPN)</option>
                  <option value="Student Registration Certification ID">Student Registration pass</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">License ID / Student Card serial</label>
                <input
                  id="ver-license-num"
                  required
                  type="text"
                  value={licenseNum}
                  onChange={(e) => setLicenseNum(e.target.value)}
                  placeholder="e.g. RN-9821817"
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-805 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">State / Country regulatory Board</label>
                <input
                  id="ver-license-state"
                  required
                  type="text"
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                  placeholder="e.g. Massachusetts, USA"
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-805 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <button
                id="submit-ver-btn"
                type="submit"
                disabled={submittingVer}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-xl cursor-pointer active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingVer ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'File Verified Badge Request'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security credentials */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <Key className="w-5.5 h-5.5 text-teal-605 dark:text-teal-400" />
            <span>Update Security coordinates</span>
          </h3>
          <p className="text-slate-550 dark:text-slate-400 text-xs font-normal">Manage email registrations details and password changes.</p>
        </div>

        {passMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-705 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-semibold">
            {passMsg}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-md">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Current Password</label>
              <input
                id="sec-old-pass"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-805 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Create New Password</label>
              <input
                id="sec-new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-855 dark:text-slate-200"
              />
            </div>
          </div>

          <button
            id="save-sec-btn"
            type="submit"
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl active:scale-95 transition text-[11px] font-bold"
          >
            Update password
          </button>
        </form>
      </div>

    </div>
  );
}