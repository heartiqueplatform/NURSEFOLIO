/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { uploadToCloudinary } from '../lib/cloudinary';
import { supabase } from '../lib/supabase'
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { Check, Clipboard, Tag, MapPin, Briefcase, Camera, Image as ImageIcon, Loader2, Sparkles, Upload, CheckCircle, Trash2, Heart, Frown, AlertTriangle } from 'lucide-react';

// Emotional Delete Confirmation Modal
function EmotionalDeleteModal({ onConfirm, onCancel, isDeleting }: { onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const emotionalMessages = [
    { emoji: "💔", text: "Wait... are you sure? We'll really miss you!" },
    { emoji: "😢", text: "Your nursing journey won't be the same without you here..." },
    { emoji: "🌟", text: "You've been such a valuable part of our community!" },
    { emoji: "🤝", text: "Is there anything we could do to make you stay?" },
    { emoji: "💕", text: "We've loved having you as part of the nursing family!" },
    { emoji: "🫂", text: "Take a moment to think about it... we'll be here if you change your mind." }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % emotionalMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl transform animate-in zoom-in-95 duration-300">
        {!isDeleting ? (
          <>
            <div className="p-6 text-center">
              <div className="mb-4 text-6xl animate-bounce">
                {emotionalMessages[currentMessageIndex].emoji}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Leaving so soon?
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4 text-lg">
                {emotionalMessages[currentMessageIndex].text}
              </p>
              <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-700 dark:text-red-300 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  This action is permanent and cannot be undone
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-all"
                >
                  No, Keep My Account
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Yes, Delete
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 border-4 border-red-200 dark:border-red-900 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Deleting your account...
            </h3>
            <div className="space-y-2">
              <p className="text-slate-600 dark:text-slate-300 animate-pulse">
                😢 Saying goodbye to your profile
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse delay-150">
                Removing your nursing portfolio...
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse delay-300">
                Clearing your memories...
              </p>
            </div>
            <div className="mt-6 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-progress"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fancy Toast/Popup Component
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 rounded-xl md:rounded-2xl shadow-2xl p-3 md:p-4 flex items-center gap-2 md:gap-3 border border-white/20">
        <div className="bg-white/20 rounded-full p-1.5 md:p-2">
          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-xs md:text-sm">{message}</p>
          <p className="text-white/80 text-[10px] md:text-xs">Your profile keeps getting better ✨</p>
        </div>
        <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-300 animate-pulse" />
      </div>
    </div>
  );
}

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
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Image States
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(user?.cover_url || '');
  const [uploading, setUploading] = useState<{ avatar: boolean; cover: boolean }>({ avatar: false, cover: false });

  // Upload progress states (for fancy loaders)
  const [uploadProgress, setUploadProgress] = useState<{ avatar: number; cover: number }>({ avatar: 0, cover: 0 });
  const [showSuccessPopup, setShowSuccessPopup] = useState<{ avatar: boolean; cover: boolean }>({ avatar: false, cover: false });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Refs for hidden file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteAccount = async () => {
    if (deleting) return;

    try {
      setDeleting(true)

      // GET ACTIVE SESSION
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (!session?.access_token) {
        throw new Error('No active session found')
      }

      // CALL EDGE FUNCTION
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // SAFE JSON PARSE
      let data

      try {
        data = await response.json()
      } catch {
        data = null
      }

      // HANDLE ERRORS
      if (!response.ok) {
        throw new Error(
          data?.error ||
          `Delete failed (${response.status})`
        )
      }

      // SIGN OUT LOCALLY
      await supabase.auth.signOut()

      // REDIRECT WITH SAD MESSAGE
      window.location.replace('/?deleted=true')

    } catch (error) {
      console.error('Delete account error:', error)

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete account'
      )
      setShowDeleteModal(false);
    } finally {
      setDeleting(false)
    }
  }

  if (!user) return null;

  // Simulate upload progress (if your actual upload doesn't provide progress)
  const simulateProgress = (type: 'avatar' | 'cover', callback: () => Promise<string>) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(prev => ({ ...prev, [type]: Math.min(progress, 100) }));
    }, 200);
    return callback().finally(() => {
      clearInterval(interval);
      setUploadProgress(prev => ({ ...prev, [type]: 100 }));
    });
  };

  // Handle Image Uploads with fancy loaders
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      setUploading((prev) => ({ ...prev, [type]: true }));
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }));

      // Upload with progress simulation
      const uploadResult = await simulateProgress(type, () =>
        uploadToCloudinary(file)
      );

      const publicUrl = uploadResult.url;

      if (type === 'avatar') {
        setAvatarUrl(publicUrl);

        await databaseService.updateProfile(user.id, {
          avatar_url: publicUrl,
        });
      }

      if (type === 'cover') {
        setCoverUrl(publicUrl);

        await databaseService.updateProfile(user.id, {
          cover_url: publicUrl,
        });
      }
      // Show success popup with cute messages
      setShowSuccessPopup((prev) => ({ ...prev, [type]: true }));

      // Hide popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup((prev) => ({ ...prev, [type]: false }));
      }, 3000);

    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      alert(`Failed to upload ${type}. Please try again.`);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
      // Reset progress after completion
      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
      }, 500);
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
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get cute upload message based on type
  const getUploadMessage = (type: 'avatar' | 'cover') => {
    const messages = {
      avatar: [
        " Looking sharp, nurse!",
        " Professional profile picture updated!",
        " Your smile lights up the nursing community!",
        " Picture perfect! Ready for opportunities!",
        " What a glow-up! Recruiters will love this!"
      ],
      cover: [
        " Your portfolio cover is stunning!",
        " Setting the standard for nursing excellence!",
        " Your professional story looks beautiful!",
        " Making a great first impression!",
        " Your profile stands out from the crowd!"
      ]
    };
    const messageList = messages[type];
    return messageList[Math.floor(Math.random() * messageList.length)];
  };

  return (
    <div className="md:bg-white md:dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 md:shadow-sm overflow-hidden font-sans -mx-3 md:mx-0">

      {/* Emotional Delete Modal */}
      {showDeleteModal && (
        <EmotionalDeleteModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={deleting}
        />
      )}

      {/* Success Popups */}
      {showSuccessPopup.avatar && (
        <SuccessToast
          message={getUploadMessage('avatar')}
          onClose={() => setShowSuccessPopup(prev => ({ ...prev, avatar: false }))}
        />
      )}
      {showSuccessPopup.cover && (
        <SuccessToast
          message={getUploadMessage('cover')}
          onClose={() => setShowSuccessPopup(prev => ({ ...prev, cover: false }))}
        />
      )}

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

          {/* Upload Overlay with Progress */}
          {uploading.cover && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="animate-spin w-6 h-6 md:w-8 md:h-8 text-white" />
              <div className="w-32 md:w-48 bg-white/20 rounded-full h-1.5 md:h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.cover}%` }}
                />
              </div>
              <p className="text-white text-[10px] md:text-xs font-medium">
                {Math.round(uploadProgress.cover)}% Uploading...
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading.cover}
            className="absolute inset-0 bg-black/20 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium gap-1.5 md:gap-2 cursor-pointer text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!uploading.cover && <Camera className="w-4 h-4 md:w-5 md:h-5" />}
            <span className="hidden md:inline">
              {uploading.cover ? 'Uploading...' : 'Change Cover Photo'}
            </span>
            <span className="md:hidden">{uploading.cover ? 'Uploading...' : 'Edit Cover'}</span>
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
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 text-teal-600 dark:text-teal-400 font-bold text-lg md:text-2xl">
                  {firstName[0]}{lastName[0]}
                </div>
              )}

              {/* Upload Overlay for Avatar */}
              {uploading.avatar && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-1">
                  <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5 text-white" />
                  <div className="w-10 md:w-12 bg-white/20 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.avatar}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading.avatar}
              className="absolute inset-0 bg-black/40 rounded-xl md:rounded-2xl md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!uploading.avatar && <Camera className="w-5 h-5 md:w-6 md:h-6" />}
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
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-2.5 md:p-3.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold flex items-center gap-1.5 md:gap-2 animate-in fade-in duration-300">
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
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs md:text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">Last Name</label>
              <input
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs md:text-sm transition-all"
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
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">Nursing Level title</label>
              <input
                type="text"
                value={nursingLevel}
                onChange={(e) => setNursingLevel(e.target.value)}
                placeholder="Registered Nurse (RN) - Intensive Care"
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
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
                placeholder="Mombasa, Kenya"
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
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
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
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
              className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-normal transition-all"
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
              className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
            />
          </div>

          <div className="pt-4 md:pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving || uploading.avatar || uploading.cover}
              className="w-full md:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-lg md:rounded-xl cursor-pointer active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm shadow-lg hover:shadow-xl"
            >
              {saving ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-red-200 dark:border-red-900 pt-6 mt-8">
            <h3 className="text-red-600 font-bold text-sm mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Permanently delete your account and all your data. This action cannot be undone.
            </p>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Frown className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}