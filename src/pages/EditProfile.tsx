/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { Check, Clipboard, Tag, MapPin, Briefcase, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function EditProfile() {
  const { user, refreshUser } = useAuth();

  // Text States
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [qualification, setQualification] = useState(user?.qualification || '');
  const [nursingLevel, setNursingLevel] = useState(user?.nursing_level || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [yearsExperience, setYearsExperience] = useState(user?.years_experience || 0);
  const [specialtiesText, setSpecialtiesText] = useState(user?.specialty || '');

  // Image States
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(user?.cover_url || '');
  const [uploading, setUploading] = useState<{ avatar: boolean; cover: boolean }>({ avatar: false, cover: false });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Refs for hidden file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // Handle Image Uploads
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading((prev) => ({ ...prev, [type]: true }));

      // 1. Upload to Supabase Storage (assuming your service has an upload method)
      const publicUrl = await databaseService.uploadImage(user.id, file, type);

      if (type === 'avatar') setAvatarUrl(publicUrl);
      if (type === 'cover') setCoverUrl(publicUrl);

    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      alert(`Failed to upload ${type}`);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await databaseService.updateProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
        qualification,
        nursing_level: nursingLevel,
        bio,
        location,
        years_experience: Number(yearsExperience),
        specialty: specialtiesText,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        updated_at: new Date().toISOString()
      });

      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="md:bg-white md:dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 md:shadow-sm overflow-hidden font-sans -mx-3 md:mx-0">

      {/* HEADER & IMAGE SECTION */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-32 sm:h-40 md:h-52 bg-slate-200 dark:bg-slate-800 relative group overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
              <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-slate-400 dark:text-slate-500" />
            </div>
          )}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 bg-black/20 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium gap-1.5 md:gap-2 cursor-pointer text-xs md:text-sm"
          >
            {uploading.cover ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <Camera className="w-4 h-4 md:w-5 md:h-5" />}
            <span className="hidden md:inline">Change Cover Photo</span>
            <span className="md:hidden">Edit Cover</span>
          </button>
          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
        </div>

        {/* Avatar Image */}
        <div className="absolute -bottom-10 md:-bottom-12 left-4 md:left-8">
          <div className="relative group">
            <div className="w-20 h-20 md:w-24 lg:w-32 lg:h-32 rounded-xl md:rounded-2xl border-3 md:border-4 border-white dark:border-slate-900 overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 font-bold text-lg md:text-2xl">
                  {firstName[0]}{lastName[0]}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-xl md:rounded-2xl md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
            >
              {uploading.avatar ? <Loader2 className="animate-spin w-5 h-5 md:w-6 md:h-6" /> : <Camera className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 pt-14 md:pt-16 lg:pt-20 space-y-6 md:space-y-8">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 md:pb-5">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Portfolio Profile</h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">
            Update your visuals and professional information.
          </p>
        </div>

        {saved && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-2.5 md:p-3.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold flex items-center gap-1.5 md:gap-2">
            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Profile configuration saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-5 md:space-y-6 text-[11px] md:text-xs text-slate-700 dark:text-slate-300 font-medium">

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">First Name</label>
              <input
                required
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs md:text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">Last Name</label>
              <input
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs md:text-sm"
              />
            </div>
          </div>

          {/* Professional tag line */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">Board Qualifications</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="BSN, RN, CCRN"
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">Nursing Level title</label>
              <input
                type="text"
                value={nursingLevel}
                onChange={(e) => setNursingLevel(e.target.value)}
                placeholder="Registered Nurse (RN) - Intensive Care"
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm"
              />
            </div>
          </div>

          {/* Location or years exp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold flex items-center gap-1 text-[10px] md:text-xs">
                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Boston, MA"
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold flex items-center gap-1 text-[10px] md:text-xs">
                <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Years of active experience</span>
              </label>
              <input
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value))}
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm"
              />
            </div>
          </div>

          {/* Biography */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold flex items-center gap-1 text-[10px] md:text-xs">
              <Clipboard className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Biography / Narrative</span>
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share details on your nursing journey..."
              className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-normal"
            ></textarea>
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold flex items-center gap-1 text-[10px] md:text-xs">
              <Tag className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-600 dark:text-teal-400" />
              <span>Nursing Specialties</span>
            </label>
            <input
              type="text"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
              placeholder="Intensive Care, Cardiology"
              className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm"
            />
          </div>

          <div className="pt-4 md:pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving || uploading.avatar || uploading.cover}
              className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-lg md:rounded-xl cursor-pointer active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}