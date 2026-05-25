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
      // If you haven't written this yet, we'll do it in the "What's Next" section
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
        specialty: specialtiesText, // Keeping it simple as per your table schema
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden font-sans">

      {/* HEADER & IMAGE SECTION */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-40 sm:h-52 bg-slate-200 relative group overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-slate-100 to-slate-200">
              <ImageIcon className="w-8 h-8 text-slate-400" />
            </div>
          )}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium gap-2 cursor-pointer"
          >
            {uploading.cover ? <Loader2 className="animate-spin" /> : <Camera className="w-5 h-5" />}
            Change Cover Photo
          </button>
          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
        </div>

        {/* Avatar Image */}
        <div className="absolute -bottom-12 left-8">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white overflow-hidden bg-slate-100 shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-600 font-bold text-2xl">
                  {firstName[0]}{lastName[0]}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
            >
              {uploading.avatar ? <Loader2 className="animate-spin" /> : <Camera className="w-6 h-6" />}
            </button>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 pt-16 sm:pt-20 space-y-8">
        <div className="border-b border-slate-100 pb-5">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Edit Portfolio Profile</h2>
          <p className="text-xs text-slate-500 mt-1">
            Update your visuals and professional information.
          </p>
        </div>

        {saved && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Profile configuration saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-6 text-xs text-slate-700 font-medium">

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-500 mb-1.5 font-bold">First Name</label>
              <input
                required
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full pl-3.5 pr-4 py-2 bg-slate-50/60 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1.5 font-bold">Last Name</label>
              <input
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full pl-3.5 pr-4 py-2 bg-slate-50/60 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800 font-semibold"
              />
            </div>
          </div>

          {/* Professional tag line */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-500 mb-1.5 font-bold">Board Qualifications</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="BSN, RN, CCRN"
                className="w-full pl-3.5 pr-4 py-2 bg-slate-50/60 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1.5 font-bold">Nursing Level title</label>
              <input
                type="text"
                value={nursingLevel}
                onChange={(e) => setNursingLevel(e.target.value)}
                placeholder="Registered Nurse (RN) - Intensive Care"
                className="w-full pl-3.5 pr-4 py-2 bg-slate-50/60 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Location or years exp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-500 mb-1.5 font-bold flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Boston, MA"
                className="w-full pl-3.5 pr-4 py-2 bg-slate-50/60 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1.5 font-bold flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span>Years of active experience</span>
              </label>
              <input
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value))}
                className="w-full pl-3.5 pr-4 py-2 bg-slate-50/60 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Biography */}
          <div>
            <label className="block text-slate-500 mb-1.5 font-bold flex items-center gap-1">
              <Clipboard className="w-4 h-4" />
              <span>Biography / Narrative</span>
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share details on your nursing journey..."
              className="w-full pl-3.5 pr-4 py-2 bg-slate-50/60 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800 text-xs font-normal"
            ></textarea>
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-slate-500 mb-1.5 font-bold flex items-center gap-1">
              <Tag className="w-4 h-4 text-teal-600" />
              <span>Nursing Specialties</span>
            </label>
            <input
              type="text"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
              placeholder="Intensive Care, Cardiology"
              className="w-full pl-3.5 pr-4 py-2 bg-slate-50/60 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving || uploading.avatar || uploading.cover}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl cursor-pointer active:scale-95 transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}