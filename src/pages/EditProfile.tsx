/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { uploadToCloudinary } from '../lib/cloudinary';
import { supabase } from '../lib/supabase';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import {
  Check, Tag, MapPin, Briefcase, Camera, Image as ImageIcon,
  Loader2, Sparkles, CheckCircle, Trash2, Heart, AlertTriangle,
  Shield, Syringe, Phone, Languages, Building, Users, Activity,
  ShieldAlert, TrendingUp, Eye, X
} from 'lucide-react';

// ==========================================================
// SHARED CLASSES
// ==========================================================
const inputClass =
  'w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition';

const labelClass =
  'block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5';

// ==========================================================
// OPTIONS
// ==========================================================
const VACCINATION_OPTIONS = ['Hepatitis B', 'COVID-19', 'Influenza', 'MMR', 'Varicella', 'Tdap', 'Meningococcal', 'Polio', 'Yellow Fever', 'Cholera'];
const INSURANCE_TYPES = ['NHIF', 'Private Insurance', 'AAR Insurance', 'Jubilee Health', 'Madison Health', 'Other'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SHIFT_OPTIONS = ['Day', 'Night', 'Rotating', 'Flexible', 'Weekend'];
const LANGUAGES = ['English', 'Swahili', 'Luo', 'Kikuyu', 'Luhya', 'Kalenjin', 'Kamba', 'Kisii', 'Meru', 'Maa', 'Somali', 'Other'];
const SPECIALTY_OPTIONS = [
  'ICU', 'Emergency', 'Pediatrics', 'Oncology', 'Cardiology',
  'Neurology', 'Maternity', 'Surgical', 'Psychiatric', 'Community Health',
  'Theatre', 'Renal', 'Nephrology', 'Orthopedics', 'Geriatrics',
];

// ==========================================================
// SECTION WRAPPER
// ==========================================================
const Section = React.memo<{
  title: string;
  icon: React.ReactNode;
  tone?: 'teal' | 'amber';
  children: React.ReactNode;
}>(({ title, icon, tone = 'teal', children }) => {
  const accent = tone === 'amber' ? 'border-amber-500' : 'border-teal-500';
  return (
    <section className="space-y-4">
      <h3 className={`text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-l-[3px] ${accent} pl-3`}>
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
});
Section.displayName = 'Section';

// ==========================================================
// CHIP LIST
// ==========================================================
const ChipList = React.memo<{
  items: string[];
  onRemove: (item: string) => void;
  tone: 'emerald' | 'blue' | 'purple' | 'amber';
}>(({ items, onRemove, tone }) => {
  const tones = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400',
  };
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span
          key={item}
          className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold ${tones[tone]}`}
        >
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="p-0.5 rounded-full active:opacity-70 transition"
            aria-label={`Remove ${item}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
});
ChipList.displayName = 'ChipList';

// ==========================================================
// USERNAME CHECK
// ==========================================================
const UsernameCheck = React.memo<{
  username: string;
  userId: string;
  onAvailabilityChange: (isAvailable: boolean) => void;
}>(({ username, userId, onAvailabilityChange }) => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      onAvailabilityChange(false);
      return;
    }

    let cancelled = false;
    setChecking(true);

    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .neq('id', userId)
          .maybeSingle();

        if (cancelled) return;
        const available = !data;
        setIsAvailable(available);
        onAvailabilityChange(available);
      } catch {
        if (!cancelled) {
          setIsAvailable(true);
          onAvailabilityChange(true);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, userId]);

  if (!username || username.length < 3) return null;
  if (checking) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking availability...
      </p>
    );
  }
  if (isAvailable === true) {
    return (
      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
        <Check className="w-3 h-3" />
        Username is available
      </p>
    );
  }
  if (isAvailable === false) {
    return (
      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3" />
        Username is already taken
      </p>
    );
  }
  return null;
});
UsernameCheck.displayName = 'UsernameCheck';

// ==========================================================
// DELETE MODAL
// ==========================================================
const DeleteModal = React.memo<{
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}>(({ onConfirm, onCancel, isDeleting }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDeleting, onCancel]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 bg-black/70" onClick={() => !isDeleting && onCancel()}>
      <div
        className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-3xl max-w-md w-full p-6 md:p-8 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {!isDeleting ? (
          <>
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-3">
              Delete your account?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-5 leading-relaxed">
              This will permanently delete your profile, portfolio, certifications, experience records, and CV files.
            </p>
            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-3.5 mb-6">
              <p className="text-sm text-rose-700 dark:text-rose-400 flex items-center justify-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                This action is permanent and cannot be undone
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-200 font-bold active:opacity-70 transition min-h-[48px] text-sm"
              >
                Keep my account
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-2xl bg-rose-600 active:bg-rose-700 text-white font-bold transition min-h-[48px] text-sm flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="relative inline-block mb-5">
              <div className="w-20 h-20 border-4 border-rose-200 dark:border-rose-900 rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Deleting your account...
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              This will take a few seconds
            </p>
            <div className="h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full animate-progress" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
DeleteModal.displayName = 'DeleteModal';

// ==========================================================
// SUCCESS TOAST
// ==========================================================
const SuccessToast = React.memo<{ message: string; onClose: () => void }>(({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[9999] animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="bg-emerald-600 dark:bg-emerald-700 rounded-2xl px-4 py-3.5 flex items-center gap-3 max-w-sm">
        <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm">{message}</p>
          <p className="text-white/85 text-xs mt-0.5">Your profile keeps getting better</p>
        </div>
      </div>
    </div>
  );
});
SuccessToast.displayName = 'SuccessToast';

// ==========================================================
// MAIN COMPONENT
// ==========================================================
export default function EditProfile() {
  const { user, refreshUser } = useAuth();

  // Basic
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

  // Kenyan nurse fields
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

  // Locum
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
  const [error, setError] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------
  // Add/remove helpers
  // ----------------------------------------------------------
  const addVaccination = useCallback(() => {
    if (newVaccination && !vaccinations.includes(newVaccination)) {
      setVaccinations(prev => [...prev, newVaccination]);
      setNewVaccination('');
    }
  }, [newVaccination, vaccinations]);

  const removeVaccination = useCallback((v: string) => {
    setVaccinations(prev => prev.filter(x => x !== v));
  }, []);

  const addLanguage = useCallback(() => {
    if (newLanguage && !languagesSpoken.includes(newLanguage)) {
      setLanguagesSpoken(prev => [...prev, newLanguage]);
      setNewLanguage('');
    }
  }, [newLanguage, languagesSpoken]);

  const removeLanguage = useCallback((l: string) => {
    setLanguagesSpoken(prev => prev.filter(x => x !== l));
  }, []);

  const addCertification = useCallback(() => {
    if (newCertification && !certifications.includes(newCertification)) {
      setCertifications(prev => [...prev, newCertification]);
      setNewCertification('');
    }
  }, [newCertification, certifications]);

  const removeCertification = useCallback((c: string) => {
    setCertifications(prev => prev.filter(x => x !== c));
  }, []);

  const addLocumSpecialty = useCallback(() => {
    if (newLocumSpecialty && !locumSpecialties.includes(newLocumSpecialty)) {
      setLocumSpecialties(prev => [...prev, newLocumSpecialty]);
      setNewLocumSpecialty('');
    }
  }, [newLocumSpecialty, locumSpecialties]);

  const removeLocumSpecialty = useCallback((s: string) => {
    setLocumSpecialties(prev => prev.filter(x => x !== s));
  }, []);

  // ----------------------------------------------------------
  // Delete account
  // ----------------------------------------------------------
  const handleDeleteAccount = useCallback(async () => {
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

      let data: any = null;
      try { data = await response.json(); } catch { /* ignore */ }

      if (!response.ok) throw new Error(data?.error || `Delete failed (${response.status})`);

      await supabase.auth.signOut();
      window.location.replace('/?deleted=true');
    } catch (err) {
      console.error('Delete account error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete account');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }, [deleting]);

  // ----------------------------------------------------------
  // Image upload
  // ----------------------------------------------------------
  const simulateProgress = useCallback((type: 'avatar' | 'cover', callback: () => Promise<{ url: string }>) => {
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
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB'); return; }
      if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }

      setUploading(prev => ({ ...prev, [type]: true }));
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));

      const { url } = await simulateProgress(type, () => uploadToCloudinary(file));

      if (type === 'avatar') {
        setAvatarUrl(url);
        await databaseService.updateProfile(user!.id, { avatar_url: url });
      } else {
        setCoverUrl(url);
        await databaseService.updateProfile(user!.id, { cover_url: url });
      }

      setShowSuccessPopup(prev => ({ ...prev, [type]: true }));
      setTimeout(() => setShowSuccessPopup(prev => ({ ...prev, [type]: false })), 3000);
    } catch (err) {
      console.error(`Upload ${type} failed:`, err);
      alert(`Failed to upload ${type}. Please try again.`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
      setTimeout(() => setUploadProgress(prev => ({ ...prev, [type]: 0 })), 500);
    }
    if (type === 'avatar' && avatarInputRef.current) avatarInputRef.current.value = '';
    if (type === 'cover' && coverInputRef.current) coverInputRef.current.value = '';
  }, [simulateProgress, user]);

  // ----------------------------------------------------------
  // Save
  // ----------------------------------------------------------
  const handleProfileSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!usernameAvailable) {
      setError('Please choose a different username');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const updateData: Record<string, any> = {
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        qualification: qualification.trim() || null,
        nursing_level: nursingLevel.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        years_experience: Number(yearsExperience) || 0,
        specialty: specialtiesText.trim() || null,
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
        open_to_locum: openToLocum,
        locum_radius_km: locumRadiusKm,
        locum_specialties: locumSpecialties.length > 0 ? locumSpecialties : null,
        phone_number: phoneNumber.trim() || null,
        whatsapp_number: whatsappNumber.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (username.trim() !== user.username) {
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
      console.error('Save profile failed:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [user, username, firstName, lastName, email, qualification, nursingLevel, bio, location,
    yearsExperience, specialtiesText, avatarUrl, coverUrl, healthInsuranceType, insuranceNumber,
    vaccinations, lastVaccinationDate, nursingCouncilId, licenseExpiryDate, emergencyContactName,
    emergencyContactPhone, bloodType, languagesSpoken, availableForRelocation, preferredShift,
    certifications, openToLocum, locumRadiusKm, locumSpecialties, phoneNumber, whatsappNumber,
    usernameAvailable, refreshUser]);

  // ----------------------------------------------------------
  // Derived
  // ----------------------------------------------------------
  const isLicenseExpiring = useMemo(() => {
    if (!licenseExpiryDate) return false;
    const expiry = new Date(licenseExpiryDate);
    const today = new Date();
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return days <= 90 && days > 0;
  }, [licenseExpiryDate]);

  const completenessScore = useMemo(() => {
    const checks = [
      !!firstName, !!lastName, !!email, !!qualification, !!nursingLevel,
      !!bio, !!location, yearsExperience > 0, !!specialtiesText,
      !!nursingCouncilId, !!avatarUrl, !!coverUrl,
      certifications.length > 0, languagesSpoken.length > 0,
      vaccinations.length > 0,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [firstName, lastName, email, qualification, nursingLevel, bio, location,
    yearsExperience, specialtiesText, nursingCouncilId, avatarUrl, coverUrl,
    certifications.length, languagesSpoken.length, vaccinations.length]);

  const uploadMessage = useCallback((type: 'avatar' | 'cover') => {
    const messages = {
      avatar: ['Professional profile picture updated', 'Your smile lights up the community', 'Picture perfect', 'Recruiters will notice this'],
      cover: ['Your portfolio cover is stunning', 'Setting the standard for nursing excellence', 'Your professional story looks beautiful', 'Your profile stands out'],
    };
    const list = messages[type];
    return list[Math.floor(Math.random() * list.length)];
  }, []);

  const canSave = !saving && !uploading.avatar && !uploading.cover && usernameAvailable;

  if (!user) return null;

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* ✅ FIX 3: padding-bottom only extra on mobile (for sticky bar) */}
      <div className="max-w-2xl mx-auto md:px-6 md:py-8 pb-40 md:pb-8">

        {showDeleteModal && (
          <DeleteModal
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteModal(false)}
            isDeleting={deleting}
          />
        )}

        {showSuccessPopup.avatar && (
          <SuccessToast message={uploadMessage('avatar')} onClose={() => setShowSuccessPopup(prev => ({ ...prev, avatar: false }))} />
        )}
        {showSuccessPopup.cover && (
          <SuccessToast message={uploadMessage('cover')} onClose={() => setShowSuccessPopup(prev => ({ ...prev, cover: false }))} />
        )}

        {/* ============================================
            ✅ FIX 1: COVER + AVATAR
            Only the COVER has overflow-hidden.
            Avatar is a sibling and won't be clipped.
            ============================================ */}
        <div className="relative">
          {/* Cover — clipped */}
          <div className="md:rounded-3xl overflow-hidden">
            <div className="h-32 sm:h-40 md:h-52 bg-slate-200 dark:bg-zinc-800 relative group">
              {coverUrl ? (
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700">
                  <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
              )}

              {uploading.cover && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
                  <Loader2 className="animate-spin w-8 h-8 text-white" />
                  <div className="w-48 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div className="bg-white h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress.cover}%` }} />
                  </div>
                  <p className="text-white text-xs font-medium">{Math.round(uploadProgress.cover)}%</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading.cover}
                className="absolute inset-0 bg-black/20 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2 text-sm active:bg-black/30 disabled:opacity-50"
              >
                {!uploading.cover && <Camera className="w-5 h-5" />}
                <span>{uploading.cover ? 'Uploading' : 'Change cover'}</span>
              </button>
              <input
                type="file"
                ref={coverInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'cover')}
              />
            </div>
          </div>

          {/* Avatar — sits OUTSIDE the overflow-hidden wrapper, so it's fully visible */}
          <div className="absolute -bottom-10 md:-bottom-12 left-4 md:left-6 z-10">
            <div className="relative group">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-50 dark:border-zinc-950 overflow-hidden bg-slate-100 dark:bg-zinc-800">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-950/50 dark:to-emerald-950/50 text-teal-700 dark:text-teal-400 font-bold text-2xl">
                    {firstName?.[0]}{lastName?.[0]}
                  </div>
                )}
                {uploading.avatar && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                    <Loader2 className="animate-spin w-5 h-5 text-white" />
                    <div className="w-12 bg-white/20 rounded-full h-1 overflow-hidden">
                      <div className="bg-white h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress.avatar}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading.avatar}
                className="absolute inset-0 rounded-full bg-black/40 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center text-white disabled:opacity-50"
                aria-label="Change avatar"
              >
                {!uploading.avatar && <Camera className="w-6 h-6" />}
              </button>
              <input
                type="file"
                ref={avatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'avatar')}
              />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-0 pt-14 md:pt-16 space-y-6">

          {/* MOTIVATION BANNER */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-4 md:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                  Every detail opens a door
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Recruiters, locum coordinators, and colleagues discover you through these fields.
                </p>

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Profile completeness
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {completenessScore}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${completenessScore}%` }}
                    />
                  </div>
                </div>

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
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span>Get matched for locum shifts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HEADER + MESSAGES */}
          <div>
            <h1 className="text-lg md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              Edit profile
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Complete your professional nursing portfolio
            </p>
          </div>

          {saved && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-150">
              <Check className="w-4 h-4 flex-shrink-0" />
              Profile saved
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-sm font-semibold">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleProfileSave} className="space-y-8">

            {/* BASIC */}
            <Section title="Basic information" icon={<Users className="w-4 h-4 text-teal-500" />}>
              <div>
                <label htmlFor="ep-username" className={labelClass}>
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ep-username"
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className={`${inputClass} font-mono`}
                  placeholder="nurse_jane_254"
                  autoComplete="username"
                />
                <UsernameCheck username={username} userId={user.id} onAvailabilityChange={setUsernameAvailable} />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  3-30 characters · letters, numbers, underscores
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ep-first" className={labelClass}>
                    First name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="ep-first"
                    required
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ep-last" className={labelClass}>
                    Last name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="ep-last"
                    required
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ep-email" className={labelClass}>Email</label>
                <input
                  id="ep-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  Where recruiters and Nursefolio reach you
                </p>
              </div>
            </Section>

            {/* PROFESSIONAL */}
            <Section title="Professional details" icon={<Briefcase className="w-4 h-4 text-teal-500" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ep-qual" className={labelClass}>Board qualifications</label>
                  <input
                    id="ep-qual"
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="BSN, RN, CCRN"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ep-level" className={labelClass}>Nursing level</label>
                  <input
                    id="ep-level"
                    type="text"
                    value={nursingLevel}
                    onChange={(e) => setNursingLevel(e.target.value)}
                    placeholder="Registered Nurse (RN) - ICU"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ep-location" className={labelClass}>
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    Current location
                  </label>
                  <input
                    id="ep-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Nairobi, Kenya"
                    autoComplete="address-level2"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ep-years" className={labelClass}>Years of experience</label>
                  <input
                    id="ep-years"
                    type="number"
                    min={0}
                    max={70}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(Math.max(0, Number(e.target.value) || 0))}
                    inputMode="numeric"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ep-specialties" className={labelClass}>
                  <Tag className="w-3.5 h-3.5 inline mr-1" />
                  Nursing specialties
                </label>
                <input
                  id="ep-specialties"
                  type="text"
                  value={specialtiesText}
                  onChange={(e) => setSpecialtiesText(e.target.value)}
                  placeholder="Intensive Care, Cardiology, Pediatrics"
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  Comma-separated
                </p>
              </div>

              <div>
                <label htmlFor="ep-bio" className={labelClass}>Bio / professional summary</label>
                <textarea
                  id="ep-bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your nursing journey, passions, and career goals..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </Section>

            {/* LOCUM */}
            <Section title="Locum & shift cover" icon={<Briefcase className="w-4 h-4 text-amber-500" />} tone="amber">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Get notified when facilities post shifts that match your location and specialty.
              </p>

              <div className={`rounded-2xl p-4 transition ${openToLocum
                ? 'bg-amber-50 dark:bg-amber-950/30'
                : 'bg-slate-100 dark:bg-zinc-900'
                }`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openToLocum}
                    onChange={(e) => setOpenToLocum(e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      I'm open to locum shifts
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Turn on to appear in locum requests near you
                    </p>
                  </div>
                </label>
              </div>

              {openToLocum && (
                <>
                  <div>
                    <label className={labelClass}>
                      Travel radius{' '}
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                        {locumRadiusKm} km
                      </span>
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

                  <div>
                    <label className={labelClass}>Locum specialties</label>
                    <div className="flex gap-2">
                      <select
                        value={newLocumSpecialty}
                        onChange={(e) => setNewLocumSpecialty(e.target.value)}
                        className={`${inputClass} flex-1`}
                      >
                        <option value="">Select specialty...</option>
                        {SPECIALTY_OPTIONS.filter(s => !locumSpecialties.includes(s)).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addLocumSpecialty}
                        disabled={!newLocumSpecialty}
                        className="px-4 rounded-2xl bg-amber-500 active:bg-amber-600 text-white text-sm font-bold transition disabled:opacity-50 flex-shrink-0 min-h-[48px]"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2.5">
                      <ChipList items={locumSpecialties} onRemove={removeLocumSpecialty} tone="amber" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ep-phone" className={labelClass}>
                        <Phone className="w-3.5 h-3.5 inline mr-1" />
                        Phone number
                      </label>
                      <input
                        id="ep-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+254 7XX XXX XXX"
                        autoComplete="tel"
                        inputMode="tel"
                        className={inputClass}
                      />
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                        Shared only after you accept a shift
                      </p>
                    </div>
                    <div>
                      <label htmlFor="ep-whatsapp" className={labelClass}>WhatsApp number</label>
                      <input
                        id="ep-whatsapp"
                        type="tel"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="+254 7XX XXX XXX"
                        inputMode="tel"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </>
              )}
            </Section>

            {/* NURSING COUNCIL */}
            <Section title="Nursing council & licensing" icon={<Shield className="w-4 h-4 text-teal-500" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ep-nck" className={labelClass}>NCK ID number</label>
                  <input
                    id="ep-nck"
                    type="text"
                    value={nursingCouncilId || ''}
                    onChange={(e) => setNursingCouncilId(e.target.value || null)}
                    placeholder="NCK-XXXXXX"
                    className={inputClass}
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Required for verified badge</p>
                </div>
                <div>
                  <label htmlFor="ep-license" className={labelClass}>License expiry</label>
                  <input
                    id="ep-license"
                    type="date"
                    value={licenseExpiryDate || ''}
                    onChange={(e) => setLicenseExpiryDate(e.target.value || null)}
                    className={inputClass}
                  />
                  {isLicenseExpiring && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" />
                      License expiring soon — please renew
                    </p>
                  )}
                </div>
              </div>
            </Section>

            {/* INSURANCE */}
            <Section title="Health insurance" icon={<Building className="w-4 h-4 text-teal-500" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ep-ins-type" className={labelClass}>Provider</label>
                  <select
                    id="ep-ins-type"
                    value={healthInsuranceType || ''}
                    onChange={(e) => setHealthInsuranceType(e.target.value || null)}
                    className={inputClass}
                  >
                    <option value="">Select provider</option>
                    {INSURANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="ep-ins-num" className={labelClass}>Policy number</label>
                  <input
                    id="ep-ins-num"
                    type="text"
                    value={insuranceNumber || ''}
                    onChange={(e) => setInsuranceNumber(e.target.value || null)}
                    placeholder="NHIF-123456789"
                    className={inputClass}
                  />
                </div>
              </div>
            </Section>

            {/* VACCINATIONS */}
            <Section title="Vaccination records" icon={<Syringe className="w-4 h-4 text-teal-500" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Add vaccination</label>
                  <div className="flex gap-2">
                    <select
                      value={newVaccination}
                      onChange={(e) => setNewVaccination(e.target.value)}
                      className={`${inputClass} flex-1`}
                    >
                      <option value="">Select vaccine...</option>
                      {VACCINATION_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={addVaccination}
                      disabled={!newVaccination}
                      className="px-4 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex-shrink-0 min-h-[48px]"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="ep-last-vax" className={labelClass}>Last vaccination date</label>
                  <input
                    id="ep-last-vax"
                    type="date"
                    value={lastVaccinationDate || ''}
                    onChange={(e) => setLastVaccinationDate(e.target.value || null)}
                    className={inputClass}
                  />
                </div>
              </div>
              <ChipList items={vaccinations} onRemove={removeVaccination} tone="emerald" />
            </Section>

            {/* WORK PREFERENCES */}
            <Section title="Work preferences" icon={<Activity className="w-4 h-4 text-teal-500" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ep-shift" className={labelClass}>Preferred shift</label>
                  <select
                    id="ep-shift"
                    value={preferredShift || ''}
                    onChange={(e) => setPreferredShift(e.target.value || null)}
                    className={inputClass}
                  >
                    <option value="">Select...</option>
                    {SHIFT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-zinc-900 rounded-2xl cursor-pointer sm:mt-6">
                  <input
                    type="checkbox"
                    checked={availableForRelocation}
                    onChange={(e) => setAvailableForRelocation(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Available for relocation
                  </span>
                </label>
              </div>
            </Section>

            {/* LANGUAGES */}
            <Section title="Languages spoken" icon={<Languages className="w-4 h-4 text-teal-500" />}>
              <div className="flex gap-2">
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className={`${inputClass} flex-1`}
                >
                  <option value="">Select language...</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button
                  type="button"
                  onClick={addLanguage}
                  disabled={!newLanguage}
                  className="px-4 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex-shrink-0 min-h-[48px]"
                >
                  Add
                </button>
              </div>
              <ChipList items={languagesSpoken} onRemove={removeLanguage} tone="blue" />
            </Section>

            {/* CERTIFICATIONS */}
            <Section title="Additional certifications" icon={<ShieldAlert className="w-4 h-4 text-teal-500" />}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  placeholder="ACLS, BLS, PALS, Trauma Nursing"
                  className={`${inputClass} flex-1`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={addCertification}
                  disabled={!newCertification}
                  className="px-4 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex-shrink-0 min-h-[48px]"
                >
                  Add
                </button>
              </div>
              <ChipList items={certifications} onRemove={removeCertification} tone="purple" />
            </Section>

            {/* EMERGENCY CONTACT */}
            <Section title="Emergency contact" icon={<Phone className="w-4 h-4 text-teal-500" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ep-em-name" className={labelClass}>Contact name</label>
                  <input
                    id="ep-em-name"
                    type="text"
                    value={emergencyContactName || ''}
                    onChange={(e) => setEmergencyContactName(e.target.value || null)}
                    placeholder="Full name"
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ep-em-phone" className={labelClass}>Contact phone</label>
                  <input
                    id="ep-em-phone"
                    type="tel"
                    value={emergencyContactPhone || ''}
                    onChange={(e) => setEmergencyContactPhone(e.target.value || null)}
                    placeholder="+254 XXX XXX XXX"
                    inputMode="tel"
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ep-blood" className={labelClass}>Blood type</label>
                  <select
                    id="ep-blood"
                    value={bloodType || ''}
                    onChange={(e) => setBloodType(e.target.value || null)}
                    className={inputClass}
                  >
                    <option value="">Not specified</option>
                    {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </Section>

            {/* ============================================
                ✅ FIX 2a: Desktop-only inline save button
                ============================================ */}
            <div className="hidden md:flex justify-end pt-6 border-t border-slate-100 dark:border-zinc-900">
              <button
                type="submit"
                disabled={!canSave}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 min-h-[48px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Save profile
                  </>
                )}
              </button>
            </div>

            {/* DANGER ZONE */}
            <section className="pt-6 border-t border-rose-100 dark:border-rose-950">
              <h3 className="text-rose-600 dark:text-rose-400 font-bold text-sm mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Danger zone
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Permanently delete your account, portfolio, and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm font-bold active:bg-rose-100 dark:active:bg-rose-950/50 transition min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                Delete account
              </button>
            </section>
          </form>
        </div>
      </div>

      {/* ============================================
          ✅ FIX 2b + 3: Sticky save bar — MOBILE ONLY
          With iOS safe-area support
          ============================================ */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-100 dark:border-zinc-900"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={handleProfileSave}
            disabled={!canSave}
            className="w-full py-3.5 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Save profile
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}