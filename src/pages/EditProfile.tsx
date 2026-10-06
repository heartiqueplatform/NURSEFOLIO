/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { uploadToCloudinary } from '../lib/cloudinary';
import { supabase } from '../lib/supabase'
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import {
  Check, Tag, MapPin, Briefcase, Camera, Image as ImageIcon,
  Loader2, Sparkles, CheckCircle, Trash2, Heart,
  AlertTriangle, Shield, Syringe, Phone, Languages,
  Building, Users, Activity, ShieldAlert,
  TrendingUp, Briefcase as BriefcaseIcon, Eye, Star
} from 'lucide-react';

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
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .neq('id', userId)
          .maybeSingle();

        const available = !data;
        setIsAvailable(available);
        onAvailabilityChange(available);
      } catch {
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
  if (checking) return <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Checking availability...</p>;
  if (isAvailable === true) return <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5"><Check className="w-3 h-3" /> Username is available</p>;
  if (isAvailable === false) return <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Username is already taken</p>;
  return null;
}

// ==========================================
// EMOTIONAL DELETE CONFIRMATION MODAL (clean copy)
// ==========================================
function EmotionalDeleteModal({ onConfirm, onCancel, isDeleting }: { onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-950 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/60 dark:border-zinc-800 overflow-hidden">
        {!isDeleting ? (
          <div className="p-6 md:p-8">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center animate-goodbye-pulse">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-400" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-3">
              Delete your account?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-5 leading-relaxed">
              This will permanently delete your profile, portfolio, certifications, experience records, and CV files. Your nursing story here will be gone.
            </p>

            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3.5 mb-6 border border-rose-100 dark:border-rose-900">
              <p className="text-sm text-rose-700 dark:text-rose-400 flex items-center justify-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                This action is permanent and cannot be undone
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition active:scale-[98%] min-h-[44px] text-sm"
              >
                Keep My Account
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition active:scale-[98%] min-h-[44px] text-sm flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mb-5">
              <div className="relative inline-block">
                <div className="w-20 h-20 border-4 border-rose-200 dark:border-rose-900 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Deleting your account...
            </h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p className="animate-pulse">Removing your portfolio</p>
              <p className="animate-pulse delay-150">Clearing your certifications</p>
              <p className="animate-pulse delay-300">Wiping your records</p>
            </div>
            <div className="mt-6 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full animate-progress"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// SUCCESS TOAST
// ==========================================
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-white/20">
        <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm">{message}</p>
          <p className="text-white/85 text-xs mt-0.5">Your profile keeps getting better</p>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse flex-shrink-0" />
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function EditProfile() {
  const { user, refreshUser } = useAuth();

  // Basic Info
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

  // Kenyan Nurse fields
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

  // ==========================================
  // LOCUM PREFERENCES (NEW)
  // ==========================================
  const [openToLocum, setOpenToLocum] = useState<boolean>((user as any)?.open_to_locum || false);
  const [locumRadiusKm, setLocumRadiusKm] = useState<number>((user as any)?.locum_radius_km || 20);
  const [locumSpecialties, setLocumSpecialties] = useState<string[]>((user as any)?.locum_specialties || []);
  const [newLocumSpecialty, setNewLocumSpecialty] = useState('');
  const [phoneNumber, setPhoneNumber] = useState<string>((user as any)?.phone_number || '');
  const [whatsappNumber, setWhatsappNumber] = useState<string>((user as any)?.whatsapp_number || '');

  // UI
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Images
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(user?.cover_url || '');
  const [uploading, setUploading] = useState<{ avatar: boolean; cover: boolean }>({ avatar: false, cover: false });
  const [uploadProgress, setUploadProgress] = useState<{ avatar: number; cover: number }>({ avatar: 0, cover: 0 });
  const [showSuccessPopup, setShowSuccessPopup] = useState<{ avatar: boolean; cover: boolean }>({ avatar: false, cover: false });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Options
  const vaccinationOptions = ['Hepatitis B', 'COVID-19', 'Influenza', 'MMR', 'Varicella', 'Tdap', 'Meningococcal', 'Polio', 'Yellow Fever', 'Cholera'];
  const insuranceTypes = ['NHIF', 'Private Insurance', 'AAR Insurance', 'Jubilee Health', 'Madison Health', 'Other'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const shiftOptions = ['Day', 'Night', 'Rotating', 'Flexible', 'Weekend'];
  const kenyanLanguages = ['English', 'Swahili', 'Luo', 'Kikuyu', 'Luhya', 'Kalenjin', 'Kamba', 'Kisii', 'Meru', 'Maa', 'Somali', 'Other'];
  const specialtyOptions = [
    'ICU', 'Emergency', 'Pediatrics', 'Oncology', 'Cardiology',
    'Neurology', 'Maternity', 'Surgical', 'Psychiatric', 'Community Health',
    'Theatre', 'Renal', 'Nephrology', 'Orthopedics', 'Geriatrics'
  ];

  const handleDeleteAccount = async () => {
    if (deleting) return;
    try {
      setDeleting(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error('No active session found');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let data;
      try { data = await response.json(); } catch { data = null; }

      if (!response.ok) throw new Error(data?.error || `Delete failed (${response.status})`);

      await supabase.auth.signOut();
      window.location.replace('/?deleted=true');
    } catch (error) {
      console.error('Delete account error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete account');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  // Helpers
  const addVaccination = () => {
    if (newVaccination && !vaccinations.includes(newVaccination)) {
      setVaccinations([...vaccinations, newVaccination]);
      setNewVaccination('');
    }
  };
  const removeVaccination = (v: string) => setVaccinations(vaccinations.filter(x => x !== v));

  const addLanguage = () => {
    if (newLanguage && !languagesSpoken.includes(newLanguage)) {
      setLanguagesSpoken([...languagesSpoken, newLanguage]);
      setNewLanguage('');
    }
  };
  const removeLanguage = (l: string) => setLanguagesSpoken(languagesSpoken.filter(x => x !== l));

  const addCertification = () => {
    if (newCertification && !certifications.includes(newCertification)) {
      setCertifications([...certifications, newCertification]);
      setNewCertification('');
    }
  };
  const removeCertification = (c: string) => setCertifications(certifications.filter(x => x !== c));

  const addLocumSpecialty = () => {
    if (newLocumSpecialty && !locumSpecialties.includes(newLocumSpecialty)) {
      setLocumSpecialties([...locumSpecialties, newLocumSpecialty]);
      setNewLocumSpecialty('');
    }
  };
  const removeLocumSpecialty = (s: string) => setLocumSpecialties(locumSpecialties.filter(x => x !== s));

  if (!user) return null;

  const simulateProgress = (type: 'avatar' | 'cover', callback: () => Promise<{ url: string }>) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) { progress = 100; clearInterval(interval); }
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
      if (file.size > 5 * 1024 * 1024) { alert('Image size should be less than 5MB'); return; }
      if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }

      setUploading(prev => ({ ...prev, [type]: true }));
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));

      const uploadResult = await simulateProgress(type, () => uploadToCloudinary(file));
      const publicUrl = uploadResult.url;

      if (type === 'avatar') {
        setAvatarUrl(publicUrl);
        await databaseService.updateProfile(user.id, { avatar_url: publicUrl });
      } else {
        setCoverUrl(publicUrl);
        await databaseService.updateProfile(user.id, { cover_url: publicUrl });
      }

      setShowSuccessPopup(prev => ({ ...prev, [type]: true }));
      setTimeout(() => setShowSuccessPopup(prev => ({ ...prev, [type]: false })), 3000);
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      alert(`Failed to upload ${type}. Please try again.`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
      setTimeout(() => setUploadProgress(prev => ({ ...prev, [type]: 0 })), 500);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameAvailable) { alert('Please choose a different username'); return; }

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
        // Locum preferences
        open_to_locum: openToLocum,
        locum_radius_km: locumRadiusKm,
        locum_specialties: locumSpecialties.length > 0 ? locumSpecialties : null,
        phone_number: phoneNumber || null,
        whatsapp_number: whatsappNumber || null,
        updated_at: new Date().toISOString()
      };

      if (username !== user.username) {
        updateData.username_updated_at = new Date().toISOString();
      }

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
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
      avatar: ['Professional profile picture updated', 'Your smile lights up the community', 'Picture perfect — ready for opportunities', 'Recruiters will notice this'],
      cover: ['Your portfolio cover is stunning', 'Setting the standard for nursing excellence', 'Your professional story looks beautiful', 'Your profile stands out']
    };
    const list = messages[type];
    return list[Math.floor(Math.random() * list.length)];
  };

  const isLicenseExpiring = () => {
    if (!licenseExpiryDate) return false;
    const expiry = new Date(licenseExpiryDate);
    const today = new Date();
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return days <= 90 && days > 0;
  };

  // Count how complete the profile is (drives the motivation banner)
  const completenessScore = (() => {
    let score = 0;
    const checks = [
      firstName, lastName, email, qualification, nursingLevel,
      bio, location, yearsExperience > 0, specialtiesText,
      nursingCouncilId, avatarUrl, coverUrl,
      certifications.length > 0, languagesSpoken.length > 0,
      vaccinations.length > 0
    ];
    checks.forEach(v => { if (v) score++; });
    return Math.round((score / checks.length) * 100);
  })();

  return (
    <div className="md:bg-white md:dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200/60 md:dark:border-zinc-800 md:shadow-sm overflow-hidden font-sans -mx-3 md:mx-0">

      {showDeleteModal && (
        <EmotionalDeleteModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={deleting}
        />
      )}

      {showSuccessPopup.avatar && (
        <SuccessToast message={getUploadMessage('avatar')} onClose={() => setShowSuccessPopup(prev => ({ ...prev, avatar: false }))} />
      )}
      {showSuccessPopup.cover && (
        <SuccessToast message={getUploadMessage('cover')} onClose={() => setShowSuccessPopup(prev => ({ ...prev, cover: false }))} />
      )}

      {/* HEADER & IMAGES */}
      <div className="relative">
        <div className="h-32 sm:h-40 md:h-52 bg-slate-200 dark:bg-zinc-800 relative group overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700">
              <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
          )}

          {uploading.cover && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="animate-spin w-8 h-8 text-white" />
              <div className="w-48 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.cover}%` }}
                />
              </div>
              <p className="text-white text-xs font-medium">{Math.round(uploadProgress.cover)}% Uploading...</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading.cover}
            className="absolute inset-0 bg-black/20 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium gap-2 cursor-pointer text-sm disabled:opacity-50"
          >
            {!uploading.cover && <Camera className="w-5 h-5" />}
            <span className="hidden md:inline">{uploading.cover ? 'Uploading...' : 'Change Cover Photo'}</span>
            <span className="md:hidden">{uploading.cover ? 'Uploading...' : 'Edit Cover'}</span>
          </button>
          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
        </div>

        <div className="absolute -bottom-10 md:-bottom-12 left-4 md:left-8">
          <div className="relative group">
            <div className="w-20 h-20 md:w-24 lg:w-32 lg:h-32 rounded-full border-4 border-white dark:border-zinc-950 overflow-hidden bg-slate-100 dark:bg-zinc-800 shadow-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 text-teal-600 dark:text-teal-400 font-bold text-2xl">
                  {firstName?.[0]}{lastName?.[0]}
                </div>
              )}

              {uploading.avatar && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-1">
                  <Loader2 className="animate-spin w-5 h-5 text-white" />
                  <div className="w-12 bg-white/20 rounded-full h-1 overflow-hidden">
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
              className="absolute inset-0 bg-black/40 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer disabled:opacity-50"
            >
              {!uploading.avatar && <Camera className="w-6 h-6" />}
            </button>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 pt-14 md:pt-16 lg:pt-20 space-y-6 md:space-y-8">

        {/* ==========================================
            MOTIVATION BANNER — WHY details matter
            ========================================== */}
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                Every detail opens a door
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Recruiters, locum coordinators, and colleagues discover you through these fields. The more you complete, the more opportunities reach you.
              </p>

              {/* Completeness bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Profile completeness
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {completenessScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-white dark:bg-zinc-900 rounded-full overflow-hidden border border-slate-100 dark:border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${completenessScore}%` }}
                  />
                </div>
              </div>

              {/* Value props */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Eye className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>Be found by recruiters</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>Rank higher in Explore</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <BriefcaseIcon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>Get matched for locum shifts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 dark:border-zinc-800 pb-5">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Nursing Profile</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete your professional nursing portfolio
          </p>
        </div>

        {saved && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-3.5 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-300">
            <Check className="w-4 h-4" />
            <span>Profile configuration saved successfully</span>
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-8 text-sm text-slate-700 dark:text-slate-300 font-medium">

          {/* BASIC INFO */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] border-teal-500 pl-3">
              <Users className="w-4 h-4 text-teal-500" />
              Basic Information
            </h3>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">
                Username <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 font-mono text-sm transition"
                placeholder="nurse_jane_254"
              />
              <UsernameCheck username={username} userId={user.id} onAvailabilityChange={setUsernameAvailable} />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Unique, 3-30 characters (letters, numbers, underscores)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">First Name <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Last Name <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Where recruiters and Nursefolio reach you</p>
            </div>
          </div>

          {/* PROFESSIONAL DETAILS */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] border-teal-500 pl-3">
              <Briefcase className="w-4 h-4 text-teal-500" />
              Professional Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Board Qualifications</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="BSN, RN, CCRN"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Nursing Level</label>
                <input
                  type="text"
                  value={nursingLevel}
                  onChange={(e) => setNursingLevel(e.target.value)}
                  placeholder="Registered Nurse (RN) - ICU"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  Current Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Nairobi, Kenya"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Used to match you with nearby locum shifts</p>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold flex items-center gap-1.5 text-xs">
                  <Briefcase className="w-3.5 h-3.5" />
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold flex items-center gap-1.5 text-xs">
                <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Nursing Specialties
              </label>
              <input
                type="text"
                value={specialtiesText}
                onChange={(e) => setSpecialtiesText(e.target.value)}
                placeholder="Intensive Care, Cardiology, Pediatrics"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Bio / Professional Summary</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your nursing journey, passions, and career goals..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm font-normal transition resize-none"
              />
            </div>
          </div>

          {/* ==========================================
              LOCUM PREFERENCES — NEW SECTION
              ========================================== */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] border-amber-500 pl-3">
              <BriefcaseIcon className="w-4 h-4 text-amber-500" />
              Locum & Shift Cover
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
              Get notified when facilities post shifts that match your location and specialty.
            </p>

            {/* Open toggle */}
            <div className={`rounded-2xl border p-4 transition ${openToLocum
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700'
              }`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openToLocum}
                  onChange={(e) => setOpenToLocum(e.target.checked)}
                  className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                />
                <div className="flex-1">
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    I'm open to locum shifts
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Turn on to appear in locum requests near you
                  </span>
                </div>
              </label>
            </div>

            {openToLocum && (
              <>
                {/* Radius */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">
                    Travel radius: <span className="text-amber-600 dark:text-amber-400 font-extrabold">{locumRadiusKm} km</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={locumRadiusKm}
                    onChange={(e) => setLocumRadiusKm(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                    <span>5 km</span>
                    <span>100 km</span>
                  </div>
                </div>

                {/* Locum specialties */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">
                    Locum specialties
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={newLocumSpecialty}
                      onChange={(e) => setNewLocumSpecialty(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 text-slate-800 dark:text-slate-200 text-sm"
                    >
                      <option value="">Select specialty...</option>
                      {specialtyOptions.filter(s => !locumSpecialties.includes(s)).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addLocumSpecialty}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition active:scale-[98%]"
                    >
                      Add
                    </button>
                  </div>
                  {locumSpecialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {locumSpecialties.map(s => (
                        <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 rounded-full text-xs font-semibold">
                          {s}
                          <button type="button" onClick={() => removeLocumSpecialty(s)} className="hover:text-rose-600 transition">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone + WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold flex items-center gap-1.5 text-xs">
                      <Phone className="w-3.5 h-3.5" />
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 text-slate-800 dark:text-slate-200 text-sm"
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Shared only after you accept a shift</p>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">
                      WhatsApp number
                    </label>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 text-slate-800 dark:text-slate-200 text-sm"
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">For faster contact on urgent shifts</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* NURSING COUNCIL */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] border-teal-500 pl-3">
              <Shield className="w-4 h-4 text-teal-500" />
              Nursing Council & Licensing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">
                  Nursing Council of Kenya ID
                </label>
                <input
                  type="text"
                  value={nursingCouncilId || ''}
                  onChange={(e) => setNursingCouncilId(e.target.value || null)}
                  placeholder="NCK-XXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Required for verified badge</p>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">
                  License Expiry Date
                </label>
                <input
                  type="date"
                  value={licenseExpiryDate || ''}
                  onChange={(e) => setLicenseExpiryDate(e.target.value || null)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border ${isLicenseExpiring() ? 'border-amber-500' : 'border-slate-200 dark:border-zinc-700'} focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition`}
                />
                {isLicenseExpiring() && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    License expiring soon — please renew
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* INSURANCE */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] border-teal-500 pl-3">
              <Building className="w-4 h-4 text-teal-500" />
              Health Insurance Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Insurance Provider</label>
                <select
                  value={healthInsuranceType || ''}
                  onChange={(e) => setHealthInsuranceType(e.target.value || null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 text-sm transition"
                >
                  <option value="">Select Insurance Type</option>
                  {insuranceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Insurance Number</label>
                <input
                  type="text"
                  value={insuranceNumber || ''}
                  onChange={(e) => setInsuranceNumber(e.target.value || null)}
                  placeholder="NHIF-123456789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-200 text-sm transition"
                />
              </div>
            </div>
          </div>

          {/* VACCINATIONS */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] border-teal-500 pl-3">
              <Syringe className="w-4 h-4 text-teal-500" />
              Vaccination Records
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Add Vaccination</label>
                <div className="flex gap-2">
                  <select
                    value={newVaccination}
                    onChange={(e) => setNewVaccination(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 text-sm"
                  >
                    <option value="">Select vaccine...</option>
                    {vaccinationOptions.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <button type="button" onClick={addVaccination} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition active:scale-[98%]">
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Last Vaccination Date</label>
                <input
                  type="date"
                  value={lastVaccinationDate || ''}
                  onChange={(e) => setLastVaccinationDate(e.target.value || null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 text-sm"
                />
              </div>
            </div>

            {vaccinations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vaccinations.map(v => (
                  <span key={v} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold">
                    {v}
                    <button type="button" onClick={() => removeVaccination(v)} className="hover:text-rose-600 transition">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* WORK PREFERENCES */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] border-teal-500 pl-3">
              <Activity className="w-4 h-4 text-teal-500" />
              Work Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Preferred Shift</label>
                <select
                  value={preferredShift || ''}
                  onChange={(e) => setPreferredShift(e.target.value || null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 text-sm"
                >
                  <option value="">Select preferred shift...</option>
                  {shiftOptions.map(s => <option key={s} value={s}>{s}</option>)}
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
                <label htmlFor="relocation" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Available for relocation
                </label>
              </div>
            </div>
          </div>

          {/* LANGUAGES */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] border-teal-500 pl-3">
              <Languages className="w-4 h-4 text-teal-500" />
              Languages Spoken
            </h3>

            <div className="flex gap-2">
              <select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 text-sm"
              >
                <option value="">Select language...</option>
                {kenyanLanguages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <button type="button" onClick={addLanguage} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition active:scale-[98%]">
                Add
              </button>
            </div>

            {languagesSpoken.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {languagesSpoken.map(l => (
                  <span key={l} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                    {l}
                    <button type="button" onClick={() => removeLanguage(l)} className="hover:text-rose-600 transition">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CERTIFICATIONS */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] border-teal-500 pl-3">
              <ShieldAlert className="w-4 h-4 text-teal-500" />
              Additional Certifications
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="ACLS, BLS, PALS, Trauma Nursing"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 text-sm"
              />
              <button type="button" onClick={addCertification} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition active:scale-[98%]">
                Add
              </button>
            </div>

            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {certifications.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold">
                    {c}
                    <button type="button" onClick={() => removeCertification(c)} className="hover:text-rose-600 transition">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* EMERGENCY CONTACT */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] border-teal-500 pl-3">
              <Phone className="w-4 h-4 text-teal-500" />
              Emergency Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Contact Name</label>
                <input
                  type="text"
                  value={emergencyContactName || ''}
                  onChange={(e) => setEmergencyContactName(e.target.value || null)}
                  placeholder="Full name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Contact Phone</label>
                <input
                  type="tel"
                  value={emergencyContactPhone || ''}
                  onChange={(e) => setEmergencyContactPhone(e.target.value || null)}
                  placeholder="+254 XXX XXX XXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold text-xs">Blood Type</label>
                <select
                  value={bloodType || ''}
                  onChange={(e) => setBloodType(e.target.value || null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 text-sm"
                >
                  <option value="">Not specified</option>
                  {bloodTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={saving || uploading.avatar || uploading.cover || !usernameAvailable}
              className="w-full md:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl cursor-pointer active:scale-[98%] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl min-h-[48px]"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>

          {/* DANGER ZONE */}
          <div className="border-t border-rose-200 dark:border-rose-950 pt-6 mt-8">
            <h3 className="text-rose-600 dark:text-rose-400 font-bold text-sm mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Permanently delete your account and all your data. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition active:scale-[98%] flex items-center gap-2 min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </form>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes goodbye-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
        @keyframes progress {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        .animate-goodbye-pulse {
          animation: goodbye-pulse 1.6s ease-in-out infinite;
        }
        .animate-progress {
          animation: progress 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}