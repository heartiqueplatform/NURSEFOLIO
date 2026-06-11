/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { uploadToCloudinary } from '../lib/cloudinary';
import { supabase } from '../lib/supabase'
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { Check, Clipboard, Tag, MapPin, Briefcase, Camera, Image as ImageIcon, Loader2, Sparkles, Upload, CheckCircle, Trash2, Heart, Frown, AlertTriangle, Shield, Syringe, Phone, Languages, Building, Calendar, Users, Activity, ShieldAlert } from 'lucide-react';

// Username availability check component
function UsernameCheck({ username, userId, onAvailabilityChange }: { username: string; userId: string; onAvailabilityChange: (isAvailable: boolean) => void }) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);

    if (!username || username.length < 3) {
      setIsAvailable(null);
      onAvailabilityChange(false);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .neq('id', userId)
          .maybeSingle();

        const available = !data;
        setIsAvailable(available);
        onAvailabilityChange(available);
      } catch (err) {
        setIsAvailable(true);
        onAvailabilityChange(true);
      } finally {
        setChecking(false);
      }
    }, 500);

    setDebounceTimer(timer);
    return () => clearTimeout(timer);
  }, [username, userId]);

  if (!username || username.length < 3) return null;
  if (checking) return <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking availability...</p>;
  if (isAvailable === true) return <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Username is available!</p>;
  if (isAvailable === false) return <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Username is already taken</p>;
  return null;
}

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

  // Basic Info States
  const [username, setUsername] = useState(user?.username || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [qualification, setQualification] = useState(user?.qualification || '');
  const [nursingLevel, setNursingLevel] = useState(user?.nursing_level || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [yearsExperience, setYearsExperience] = useState(user?.years_experience || 0);
  const [specialtiesText, setSpecialtiesText] = useState(user?.specialty || '');

  // Kenyan Nurse Specific States - ALL using null for optional fields
  const [healthInsuranceType, setHealthInsuranceType] = useState<string | null>(user?.health_insurance_type || null);
  const [insuranceNumber, setInsuranceNumber] = useState<string | null>(user?.insurance_number || null);
  const [vaccinations, setVaccinations] = useState<string[]>(user?.vaccinations || []);
  const [newVaccination, setNewVaccination] = useState('');
  const [lastVaccinationDate, setLastVaccinationDate] = useState<string | null>(user?.last_vaccination_date || null);
  const [nursingCouncilId, setNursingCouncilId] = useState<string | null>(user?.nursing_council_id || null);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<string | null>(user?.license_expiry_date || null);
  const [emergencyContactName, setEmergencyContactName] = useState<string | null>(user?.emergency_contact_name || null);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string | null>(user?.emergency_contact_phone || null);
  const [bloodType, setBloodType] = useState<string | null>(user?.blood_type || null);
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>(user?.languages_spoken || []);
  const [newLanguage, setNewLanguage] = useState('');
  const [availableForRelocation, setAvailableForRelocation] = useState(user?.available_for_relocation || false);
  const [preferredShift, setPreferredShift] = useState<string | null>(user?.preferred_shift || null);
  const [certifications, setCertifications] = useState<string[]>(user?.certifications || []);
  const [newCertification, setNewCertification] = useState('');

  // UI States
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Image States
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(user?.cover_url || '');
  const [uploading, setUploading] = useState<{ avatar: boolean; cover: boolean }>({ avatar: false, cover: false });
  const [uploadProgress, setUploadProgress] = useState<{ avatar: number; cover: number }>({ avatar: 0, cover: 0 });
  const [showSuccessPopup, setShowSuccessPopup] = useState<{ avatar: boolean; cover: boolean }>({ avatar: false, cover: false });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Refs for hidden file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Vaccination options for Kenyan nurses
  const vaccinationOptions = [
    'Hepatitis B', 'COVID-19', 'Influenza', 'MMR', 'Varicella',
    'Tdap', 'Meningococcal', 'Polio', 'Yellow Fever', 'Cholera'
  ];

  const insuranceTypes = ['NHIF', 'Private Insurance', 'AAR Insurance', 'Jubilee Health', 'Madison Health', 'Other'];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const shiftOptions = ['Day', 'Night', 'Rotating', 'Flexible', 'Weekend'];

  const kenyanLanguages = ['English', 'Swahili', 'Luo', 'Kikuyu', 'Luhya', 'Kalenjin', 'Kamba', 'Kisii', 'Meru', 'Maa', 'Somali', 'Other'];

  const handleDeleteAccount = async () => {
    if (deleting) return;

    try {
      setDeleting(true)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError
      if (!session?.access_token) throw new Error('No active session found')

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

      let data
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        throw new Error(data?.error || `Delete failed (${response.status})`)
      }

      await supabase.auth.signOut()
      window.location.replace('/?deleted=true')

    } catch (error) {
      console.error('Delete account error:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete account')
      setShowDeleteModal(false);
    } finally {
      setDeleting(false)
    }
  }

  // Add/Remove helpers
  const addVaccination = () => {
    if (newVaccination && !vaccinations.includes(newVaccination)) {
      setVaccinations([...vaccinations, newVaccination]);
      setNewVaccination('');
    }
  };

  const removeVaccination = (vaccine: string) => {
    setVaccinations(vaccinations.filter(v => v !== vaccine));
  };

  const addLanguage = () => {
    if (newLanguage && !languagesSpoken.includes(newLanguage)) {
      setLanguagesSpoken([...languagesSpoken, newLanguage]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setLanguagesSpoken(languagesSpoken.filter(l => l !== language));
  };

  const addCertification = () => {
    if (newCertification && !certifications.includes(newCertification)) {
      setCertifications([...certifications, newCertification]);
      setNewCertification('');
    }
  };

  const removeCertification = (cert: string) => {
    setCertifications(certifications.filter(c => c !== cert));
  };

  if (!user) return null;

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      setUploading((prev) => ({ ...prev, [type]: true }));
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }));

      const uploadResult = await simulateProgress(type, () =>
        uploadToCloudinary(file)
      );

      const publicUrl = uploadResult.url;

      if (type === 'avatar') {
        setAvatarUrl(publicUrl);
        await databaseService.updateProfile(user.id, { avatar_url: publicUrl });
      } else if (type === 'cover') {
        setCoverUrl(publicUrl);
        await databaseService.updateProfile(user.id, { cover_url: publicUrl });
      }

      setShowSuccessPopup((prev) => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setShowSuccessPopup((prev) => ({ ...prev, [type]: false }));
      }, 3000);

    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      alert(`Failed to upload ${type}. Please try again.`);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
      }, 500);
    }
  };

  // UPDATED: Fixed handleProfileSave with proper null handling
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usernameAvailable) {
      alert('Please choose a different username');
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const updateData: any = {
        username,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        qualification: qualification || null,
        nursing_level: nursingLevel || null,
        bio: bio || null,
        location: location || null,
        years_experience: Number(yearsExperience) || 0,
        specialty: specialtiesText || null,
        avatar_url: avatarUrl || null,
        cover_url: coverUrl || null,
        health_insurance_type: healthInsuranceType || null,
        insurance_number: insuranceNumber || null,
        vaccinations: vaccinations.length > 0 ? vaccinations : null,
        last_vaccination_date: lastVaccinationDate || null,
        nursing_council_id: nursingCouncilId || null,
        license_expiry_date: licenseExpiryDate || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        blood_type: bloodType || null,
        languages_spoken: languagesSpoken.length > 0 ? languagesSpoken : null,
        available_for_relocation: availableForRelocation,
        preferred_shift: preferredShift || null,
        certifications: certifications.length > 0 ? certifications : null,
        updated_at: new Date().toISOString()
      };

      // Only include username_updated_at if username changed
      if (username !== user.username) {
        updateData.username_updated_at = new Date().toISOString();
      }

      // Remove any undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await databaseService.updateProfile(user.id, updateData);
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

  const isLicenseExpiring = () => {
    if (!licenseExpiryDate) return false;
    const expiry = new Date(licenseExpiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  return (
    <div className="md:bg-white md:dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 md:shadow-sm overflow-hidden font-sans -mx-3 md:mx-0">

      {showDeleteModal && (
        <EmotionalDeleteModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={deleting}
        />
      )}

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
        <div className="h-32 sm:h-40 md:h-52 bg-slate-200 dark:bg-slate-800 relative group overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
              <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-slate-400 dark:text-slate-500" />
            </div>
          )}

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

        <div className="absolute -bottom-10 md:-bottom-12 left-4 md:left-8">
          <div className="relative group">
            <div className="w-20 h-20 md:w-24 lg:w-32 lg:h-32 rounded-xl md:rounded-2xl border-3 md:border-4 border-white dark:border-slate-900 overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 text-teal-600 dark:text-teal-400 font-bold text-lg md:text-2xl">
                  {firstName?.[0]}{lastName?.[0]}
                </div>
              )}

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
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Nursing Profile</h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">
            Complete your professional nursing portfolio
          </p>
        </div>

        {saved && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-2.5 md:p-3.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold flex items-center gap-1.5 md:gap-2 animate-in fade-in duration-300">
            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Profile configuration saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-6 md:space-y-8 text-[11px] md:text-xs text-slate-700 dark:text-slate-300 font-medium">

          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-3 border-teal-500 pl-3">
              <Users className="w-4 h-4 text-teal-500" />
              Basic Information
            </h3>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                Username <span className="text-red-500">*</span> (Unique identifier)
              </label>
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs md:text-sm transition-all"
                placeholder="e.g., nurse_jane_254"
              />
              <UsernameCheck username={username} userId={user.id} onAvailabilityChange={setUsernameAvailable} />
              <p className="text-xs text-slate-400 mt-1">Username must be unique, 3-30 characters (letters, numbers, underscores)</p>
            </div>

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

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
              />
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-3 border-teal-500 pl-3">
              <Briefcase className="w-4 h-4 text-teal-500" />
              Professional Details
            </h3>

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
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">Nursing Level</label>
                <input
                  type="text"
                  value={nursingLevel}
                  onChange={(e) => setNursingLevel(e.target.value)}
                  placeholder="Registered Nurse (RN) - ICU"
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold flex items-center gap-1 text-[10px] md:text-xs">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Current Location</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Nairobi, Kenya"
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold flex items-center gap-1 text-[10px] md:text-xs">
                  <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Years of Experience</span>
                </label>
                <input
                  type="number"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(Number(e.target.value))}
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold flex items-center gap-1 text-[10px] md:text-xs">
                <Tag className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-600 dark:text-teal-400" />
                <span>Nursing Specialties</span>
              </label>
              <input
                type="text"
                value={specialtiesText}
                onChange={(e) => setSpecialtiesText(e.target.value)}
                placeholder="Intensive Care, Cardiology, Pediatrics, Emergency"
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">Bio / Professional Summary</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your nursing journey, passions, and career goals..."
                className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-normal transition-all"
              />
            </div>
          </div>

          {/* Kenyan Nursing Council & Licensing */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-3 border-teal-500 pl-3">
              <Shield className="w-4 h-4 text-teal-500" />
              Nursing Council & Licensing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                  Nursing Council of Kenya ID
                </label>
                <input
                  type="text"
                  value={nursingCouncilId || ''}
                  onChange={(e) => setNursingCouncilId(e.target.value || null)}
                  placeholder="NCK-XXXXXX"
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                  License Expiry Date
                </label>
                <input
                  type="date"
                  value={licenseExpiryDate || ''}
                  onChange={(e) => setLicenseExpiryDate(e.target.value || null)}
                  className={`w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border ${isLicenseExpiring() ? 'border-yellow-500' : 'border-slate-200 dark:border-slate-700'} focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all`}
                />
                {isLicenseExpiring() && (
                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    License expiring soon! Please renew.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Health Insurance Section */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-3 border-teal-500 pl-3">
              <Building className="w-4 h-4 text-teal-500" />
              Health Insurance Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                  Insurance Provider
                </label>
                <select
                  value={healthInsuranceType || ''}
                  onChange={(e) => setHealthInsuranceType(e.target.value || null)}
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
                >
                  <option value="">Select Insurance Type</option>
                  {insuranceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                  Insurance Number / NHIF Card Number
                </label>
                <input
                  type="text"
                  value={insuranceNumber || ''}
                  onChange={(e) => setInsuranceNumber(e.target.value || null)}
                  placeholder="e.g., NHIF-123456789"
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs md:text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Vaccinations Section */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-3 border-teal-500 pl-3">
              <Syringe className="w-4 h-4 text-teal-500" />
              Vaccination Records
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                  Add Vaccination
                </label>
                <div className="flex gap-2">
                  <select
                    value={newVaccination}
                    onChange={(e) => setNewVaccination(e.target.value)}
                    className="flex-1 pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-xs md:text-sm"
                  >
                    <option value="">Select vaccine...</option>
                    {vaccinationOptions.map(vaccine => (
                      <option key={vaccine} value={vaccine}>{vaccine}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addVaccination}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                  Last Vaccination Date
                </label>
                <input
                  type="date"
                  value={lastVaccinationDate || ''}
                  onChange={(e) => setLastVaccinationDate(e.target.value || null)}
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-xs md:text-sm"
                />
              </div>
            </div>

            {vaccinations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vaccinations.map(vaccine => (
                  <span key={vaccine} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full text-xs">
                    {vaccine}
                    <button
                      type="button"
                      onClick={() => removeVaccination(vaccine)}
                      className="hover:text-red-600 transition"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Work Preferences & Availability */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-3 border-teal-500 pl-3">
              <Activity className="w-4 h-4 text-teal-500" />
              Work Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                  Preferred Shift
                </label>
                <select
                  value={preferredShift || ''}
                  onChange={(e) => setPreferredShift(e.target.value || null)}
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-xs md:text-sm"
                >
                  <option value="">Select preferred shift...</option>
                  {shiftOptions.map(shift => (
                    <option key={shift} value={shift}>{shift}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="relocation"
                  checked={availableForRelocation}
                  onChange={(e) => setAvailableForRelocation(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <label htmlFor="relocation" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Available for relocation
                </label>
              </div>
            </div>
          </div>

          {/* Languages Section */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-3 border-teal-500 pl-3">
              <Languages className="w-4 h-4 text-teal-500" />
              Languages Spoken
            </h3>

            <div className="flex gap-2">
              <select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="flex-1 pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-xs md:text-sm"
              >
                <option value="">Select language...</option>
                {kenyanLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addLanguage}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Add
              </button>
            </div>

            {languagesSpoken.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {languagesSpoken.map(lang => (
                  <span key={lang} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      className="hover:text-red-600 transition"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-3 border-teal-500 pl-3">
              <ShieldAlert className="w-4 h-4 text-teal-500" />
              Additional Certifications
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="e.g., ACLS, BLS, PALS, Trauma Nursing"
                className="flex-1 pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-xs md:text-sm"
              />
              <button
                type="button"
                onClick={addCertification}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Add
              </button>
            </div>

            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {certifications.map(cert => (
                  <span key={cert} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 rounded-full text-xs">
                    {cert}
                    <button
                      type="button"
                      onClick={() => removeCertification(cert)}
                      className="hover:text-red-600 transition"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-3 border-teal-500 pl-3">
              <Phone className="w-4 h-4 text-teal-500" />
              Emergency Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyContactName || ''}
                  onChange={(e) => setEmergencyContactName(e.target.value || null)}
                  placeholder="Full name"
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-xs md:text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={emergencyContactPhone || ''}
                  onChange={(e) => setEmergencyContactPhone(e.target.value || null)}
                  placeholder="+254 XXX XXX XXX"
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-xs md:text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 md:mb-1.5 font-bold text-[10px] md:text-xs">
                  Blood Type
                </label>
                <select
                  value={bloodType || ''}
                  onChange={(e) => setBloodType(e.target.value || null)}
                  className="w-full pl-3 md:pl-3.5 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-xs md:text-sm"
                >
                  <option value="">Not specified</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 md:pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving || uploading.avatar || uploading.cover || !usernameAvailable}
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