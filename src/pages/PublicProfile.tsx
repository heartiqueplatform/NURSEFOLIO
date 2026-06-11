/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { databaseService } from '../services/databaseService';
import { UserProfile, Experience, Education, Certification, ResearchProject, ClinicalProcedure } from '../types';
import { THEME_MAPS, ThemeStyles } from '../utils/themeMap';
import { VerificationBadge } from '../components/VerificationBadge';
import {
  Briefcase, GraduationCap, Award, BookOpen, MapPin, Lock as LockIcon,
  Calendar, Building, Download, Link2, Check, ExternalLink, HelpCircle,
  ArrowLeft, Stethoscope, FileSignature, Clock, TrendingUp, Target, Flame, Crown,
  Mail, Phone, Heart, Syringe, FileText, Shield, Users, Globe, Truck, Moon, Sun,
  AlertCircle, Edit3, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeMode } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from '../components/PageLoader';
import { supabase } from '../lib/supabase';

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { themeMode } = useThemeMode();
  const auth = useAuth();
  const user = auth ? auth.user : null;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [research, setResearch] = useState<ResearchProject[]>([]);
  const [clinicalProcedures, setClinicalProcedures] = useState<ClinicalProcedure[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(true);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isCvLocked, setIsCvLocked] = useState(true);
  const [isPermanentlyLocked, setIsPermanentlyLocked] = useState(true);
  const [showNotification, setShowNotification] = useState(true);

  // Check which profile sections are missing data (for owner notification)
  const getMissingSections = () => {
    if (!profile) return [];
    const missing = [];
    if (!profile.bio) missing.push('Bio');
    if (!profile.location) missing.push('Location');
    if (!profile.specialty) missing.push('Specialty');
    if (!profile.nursing_council_id) missing.push('Nursing Council ID');
    if (!profile.license_expiry_date) missing.push('License Expiry');
    if (!profile.blood_type) missing.push('Blood Type');
    if ((profile.vaccinations?.length || 0) === 0) missing.push('Vaccinations');
    if ((profile.languages_spoken?.length || 0) === 0) missing.push('Languages');
    if (experiences.length === 0) missing.push('Work Experience');
    if (educations.length === 0) missing.push('Education');
    if (certifications.length === 0) missing.push('Certifications');
    return missing;
  };

  // Get student level based on total procedures
  const getStudentLevel = (count: number) => {
    if (count >= 300) return { name: 'Nurse Guru', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100' };
    if (count >= 200) return { name: 'Premium Nurse', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100' };
    if (count >= 100) return { name: 'Advanced Nurse', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' };
    if (count >= 50) return { name: 'Intermediate Nurse', icon: Target, color: 'text-cyan-600', bg: 'bg-cyan-100' };
    return { name: 'Beginner Nurse', icon: Award, color: 'text-slate-600', bg: 'bg-slate-100' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Check className="w-3 h-3" /> Verified</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const p = await databaseService.getProfileByUsername(username);
        if (p) {
          setProfile(p);

          // Get CV Data
          const cvData = await databaseService.getPublicCV(p.id);
          if (cvData) {
            setCvUrl(cvData.file_url);
            setIsPermanentlyLocked(cvData.is_locked);
          }

          // Load everything else
          const [exp, edu, cert, res] = await Promise.all([
            databaseService.getExperiences(p.id),
            databaseService.getEducations(p.id),
            databaseService.getCertifications(p.id),
            databaseService.getResearchProjects(p.id),
          ]);

          // Fetch clinical procedures if user is a student
          if (p.role === 'student') {
            const { data, error } = await supabase
              .from('clinical_procedures')
              .select('*')
              .eq('user_id', p.id)
              .eq('verification_status', 'verified')
              .order('date_performed', { ascending: false })
              .limit(10);

            if (!error && data) {
              setClinicalProcedures(data);
            }
            setLoadingProcedures(false);
          } else {
            setLoadingProcedures(false);
          }

          // View tracking logic
          const viewKey = `viewed_profile_${p.id}`;
          const alreadyViewed = sessionStorage.getItem(viewKey);
          if (user?.id !== p.id && !alreadyViewed) {
            databaseService.recordProfileView(p.id);
            sessionStorage.setItem(viewKey, 'true');
          }

          setExperiences(exp);
          setEducations(edu);
          setCertifications(cert);
          setResearch(res);
        }
      } catch (err) {
        console.error('Error fetching public portfolio:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullProfile();
  }, [username]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCv = async () => {
    if (isCvLocked) {
      setIsCvLocked(false);
      return;
    }

    if (!cvUrl || !profile) {
      alert("This professional has not uploaded a CV to their vault yet.");
      return;
    }

    setDownloading(true);
    try {
      await databaseService.recordCvDownload(profile.id, cvUrl);
      const link = document.createElement('a');
      link.href = cvUrl;
      link.download = `${profile.first_name || 'profile'}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!profile) {
    return (
      <div id="profile-not-found" className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="md:bg-white md:dark:bg-zinc-900 md:rounded-xl md:p-10 max-w-md w-full text-center md:border md:border-gray-200 md:dark:border-zinc-800 md:shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Portfolio Not Found</h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed font-normal">
            The Nursefolio user <span className="font-semibold text-gray-800 dark:text-zinc-200">@{username}</span> does not appear to have finalized their registration or public profile links yet.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Link to="/explore" className="py-2.5 rounded-lg md:rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold transition">
              Browse Registry
            </Link>
            <Link to="/" className="py-2.5 rounded-lg md:rounded-xl border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800">
              Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const baseStyles: ThemeStyles = THEME_MAPS[profile.profile_theme] || THEME_MAPS.modern;
  const level = getStudentLevel(clinicalProcedures.length);
  const LevelIcon = level.icon;
  const totalVerifiedProcedures = clinicalProcedures.length;
  const missingSections = getMissingSections();
  const isOwner = user?.id === profile.id;

  return (
    <div className="min-h-screen pb-16 md:pb-20 bg-white dark:bg-zinc-950 transition-all duration-300">
      {/* Header */}
      <header className="max-w-4xl mx-auto pt-4 md:pt-6 px-3 md:px-4 flex items-center justify-between">
        <Link to="/dashboard" className="text-xs font-semibold hover:opacity-85 flex items-center gap-1.5 text-gray-700 dark:text-zinc-300">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Portal</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <span className="text-[9px] md:text-[10px] font-mono px-2 md:px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 uppercase font-bold text-gray-700 dark:text-zinc-300">
          Public Preview
        </span>
      </header>

      {/* Tiny Notification Banner for Profile Owner - ADDED */}
      <AnimatePresence>
        {isOwner && showNotification && missingSections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto mt-3 px-3 md:px-4"
          >
            <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl p-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    Complete your profile to attract more opportunities
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                    Missing: {missingSections.slice(0, 3).join(', ')}
                    {missingSections.length > 3 && ` +${missingSections.length - 3} more`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to="/dashboard/edit-profile"
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </Link>
                <button
                  onClick={() => setShowNotification(false)}
                  className="p-1 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded-lg transition"
                >
                  <XCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto mt-4 md:mt-6">
        {/* Profile Header Block */}
        <div className="md:rounded-xl md:shadow-sm md:overflow-hidden md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800">
          {/* Cover photo */}
          {profile.cover_url ? (
            <div className="h-32 md:h-52 relative">
              <img src={profile.cover_url} alt="Cover Banner" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="absolute inset-0 bg-white/10 dark:bg-zinc-950/40"></div>
            </div>
          ) : (
            <div className={`h-32 md:h-52 bg-gradient-to-tr ${baseStyles.bannerGradient} relative`}>
              <div className="absolute inset-0 bg-white/5 dark:bg-black/20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] bg-[size:16px_16px]"></div>
            </div>
          )}

          {/* User Details Panel */}
          <div className="px-3 md:px-8 pb-4 md:pb-8 relative pt-12 md:pt-16">
            {/* Avatar overlay */}
            <div className="absolute -top-12 md:-top-16 left-3 md:left-8">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl border-3 md:border-4 shadow bg-white dark:bg-zinc-900 border-white dark:border-zinc-800" />
              ) : (
                <img src="/192.png" alt="Default Avatar" className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl border-3 md:border-4 shadow bg-white dark:bg-zinc-900 border-white dark:border-zinc-800" />
              )}
            </div>

            {/* Availability badge */}
            <div className="absolute top-3 right-3 md:top-4 md:right-8">
              <span className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-bold rounded-full border ${profile.availability_status === 'available'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : profile.availability_status === 'open'
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
                }`}>
                <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${profile.availability_status === 'available'
                  ? 'bg-emerald-500 dark:bg-emerald-400 animate-ping'
                  : profile.availability_status === 'open'
                    ? 'bg-amber-500 dark:bg-amber-400'
                    : 'bg-gray-400 dark:bg-zinc-500'
                  }`}></span>
                <span className="uppercase tracking-wider">
                  {profile.availability_status === 'available' ? 'Offering Care' : profile.availability_status === 'open' ? 'Open to Offers' : 'Not Available'}
                </span>
              </span>
            </div>

            {/* Basic Info */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <VerificationBadge status={profile.verification_status} showText={true} />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-xs md:text-sm">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {profile.qualification || profile.nursing_level || 'BSN Professional'}
                  </span>
                  <span className="text-gray-300 dark:text-zinc-600">•</span>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-70" />
                    <span>{profile.location || 'Location not specified'}</span>
                  </div>
                  <span className="text-gray-300 dark:text-zinc-600">•</span>
                  <span className="text-gray-600 dark:text-zinc-400">{profile.years_experience || 0} Years Exp</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 w-full md:w-auto">
                {/* Owner's Privacy Management */}
                {user?.id === profile.id && (
                  <div className="w-full bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 mb-2">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isPermanentlyLocked ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {isPermanentlyLocked ? <LockIcon className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          Resume Visibility: {isPermanentlyLocked ? 'Private Vault' : 'Publicly Visible'}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                          {isPermanentlyLocked
                            ? "Your CV is currently HIDDEN. Recruiters and hospitals cannot see or download your professional resume until you enable public access."
                            : "Your CV is currently PUBLIC. Anyone with this link can unlock and download your resume for hiring purposes."}
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              const newStatus = !isPermanentlyLocked;
                              await databaseService.toggleCvLock(profile.id, newStatus);
                              setIsPermanentlyLocked(newStatus);
                            } catch (err) {
                              console.error("Failed to toggle lock", err);
                            }
                          }}
                          className={`mt-3 w-full py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${isPermanentlyLocked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 dark:bg-red-950/30 dark:border-red-900'
                            }`}
                        >
                          {isPermanentlyLocked ? <><Check className="w-4 h-4" /> Make Resume Public</> : <><LockIcon className="w-4 h-4" /> Revoke Public Access</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visitor Interaction Buttons */}
                <div className="flex items-center gap-2 md:gap-3 w-full">
                  {isPermanentlyLocked ? (
                    <div className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-400 border border-dashed border-gray-300 dark:border-zinc-700 cursor-not-allowed">
                      <LockIcon className="w-3.5 h-3.5" />
                      <span>Resume Locked by Owner</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleDownloadCv}
                      disabled={downloading}
                      className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs font-bold transition active:scale-[97%] cursor-pointer ${isCvLocked
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                      {isCvLocked ? <><HelpCircle className="w-3.5 h-3.5 animate-pulse" /> Unlock to Download</> : <><Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} /> {downloading ? 'Downloading...' : 'Save Resume'}</>}
                    </button>
                  )}
                  <button onClick={handleCopyLink} className="p-2.5 md:p-3 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition cursor-pointer">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bio statement */}
            {profile.bio && (
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-zinc-800">
                <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1.5 md:mb-2 text-gray-500 dark:text-zinc-500">Biography Summary</h5>
                <p className="text-xs md:text-sm leading-relaxed text-gray-600 dark:text-zinc-400 whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Professional Information Section */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-zinc-800">
              <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider mb-3 text-gray-500 dark:text-zinc-500">Professional Information</h5>
              <div className="flex flex-col space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {/* Nursing Council ID */}
                {profile.nursing_council_id && (
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500">Nursing Council ID</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{profile.nursing_council_id}</p>
                    </div>
                  </div>
                )}

                {/* License Expiry Date */}
                {profile.license_expiry_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500">License Expiry Date</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {new Date(profile.license_expiry_date).toLocaleDateString()}
                        {new Date(profile.license_expiry_date) < new Date() && (
                          <span className="ml-2 text-[10px] text-red-600 dark:text-red-400">(Expired)</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Specialty */}
                {profile.specialty && (
                  <div className="flex items-start gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500">Primary Specialty</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{profile.specialty}</p>
                    </div>
                  </div>
                )}

                {/* Nursing Level */}
                {profile.nursing_level && (
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500">Nursing Level</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{profile.nursing_level}</p>
                    </div>
                  </div>
                )}

                {/* Preferred Shift */}
                {profile.preferred_shift && (
                  <div className="flex items-start gap-2">
                    {profile.preferred_shift === 'Night' ? (
                      <Moon className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    ) : profile.preferred_shift === 'Day' ? (
                      <Sun className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500">Preferred Shift</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{profile.preferred_shift}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Health & Insurance Section */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-zinc-800">
              <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider mb-3 text-gray-500 dark:text-zinc-500">Health & Insurance</h5>
              <div className="flex flex-col space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {/* Health Insurance Type */}
                {profile.health_insurance_type && (
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500">Health Insurance</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{profile.health_insurance_type}</p>
                    </div>
                  </div>
                )}

                {/* Blood Type */}
                {profile.blood_type && (
                  <div className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500">Blood Type</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{profile.blood_type}</p>
                    </div>
                  </div>
                )}

                {/* Vaccinations */}
                {profile.vaccinations && profile.vaccinations.length > 0 && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <Syringe className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500">Vaccinations</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile.vaccinations.map((vaccine, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                            {vaccine}
                          </span>
                        ))}
                      </div>
                      {profile.last_vaccination_date && (
                        <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-1">
                          Last vaccination: {new Date(profile.last_vaccination_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact Section */}
            {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-zinc-800">
                <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider mb-3 text-gray-500 dark:text-zinc-500">Emergency Contact</h5>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {profile.emergency_contact_name && (
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{profile.emergency_contact_name}</p>
                      )}
                      {profile.emergency_contact_phone && (
                        <p className="text-xs text-gray-700 dark:text-zinc-300">{profile.emergency_contact_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Languages & Preferences Section */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex flex-col space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {/* Languages Spoken */}
                {profile.languages_spoken && profile.languages_spoken.length > 0 && (
                  <div>
                    <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider mb-2 text-gray-500 dark:text-zinc-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Languages
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {profile.languages_spoken.map((lang, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications Array */}
                {profile.certifications && profile.certifications.length > 0 && (
                  <div>
                    <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider mb-2 text-gray-500 dark:text-zinc-500 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Certifications List
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {profile.certifications.map((cert, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available for Relocation */}
                {profile.available_for_relocation !== null && (
                  <div>
                    <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider mb-2 text-gray-500 dark:text-zinc-500 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Relocation
                    </h5>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${profile.available_for_relocation
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                      {profile.available_for_relocation ? 'Available for Relocation' : 'Not Available for Relocation'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Logbook Section - Only show for students with verified procedures */}
            {profile.role === 'student' && totalVerifiedProcedures > 0 && (
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
                    <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-gray-500 dark:text-zinc-500">Clinical Logbook</h5>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${level.bg}`}>
                    <LevelIcon className={`w-3 h-3 ${level.color}`} />
                    <span className={`text-[9px] font-bold ${level.color}`}>{level.name}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{totalVerifiedProcedures}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Verified Skills</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{clinicalProcedures.length}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Total Logs</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">NCK</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Ready</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {clinicalProcedures.map((proc) => (
                    <div key={proc.id} className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 border border-gray-100 dark:border-zinc-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">{proc.procedure_name}</h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            <span className="text-[9px] text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> {new Date(proc.date_performed).toLocaleDateString()}
                            </span>
                            <span className="text-[9px] text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                              <Award className="w-2.5 h-2.5" /> {proc.competency_level}
                            </span>
                          </div>
                          {proc.facility_name && (
                            <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
                              <Building className="w-2.5 h-2.5" /> {proc.facility_name}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(proc.verification_status)}
                      </div>
                    </div>
                  ))}
                </div>
                {totalVerifiedProcedures >= 20 && (
                  <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center">
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">✓ NCK Logbook Requirements Met!</p>
                  </div>
                )}
              </div>
            )}

            {/* Specialties & Skills */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
              <div>
                <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider mb-2 md:mb-2.5 text-gray-500 dark:text-zinc-500">Medical Specialties</h5>
                <div className="flex flex-wrap gap-1 md:gap-1.5">
                  {profile.specialties && profile.specialties.length > 0 ? (
                    profile.specialties.map((spec) => (
                      <span key={spec} className="text-[10px] md:text-xs px-2 md:px-2.5 py-0.5 md:py-1 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {spec}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] md:text-xs text-gray-400 dark:text-zinc-500 italic">No specialties published yet.</span>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider mb-2 md:mb-2.5 text-gray-500 dark:text-zinc-500">Clinical Skills</h5>
                <div className="flex flex-wrap gap-1 md:gap-1.5">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <span key={skill} className="text-[10px] md:text-xs bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] md:text-xs text-gray-400 dark:text-zinc-500 italic">No clinical skills published yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        {/* Content Sections - All Vertical */}
        <div className="flex flex-col space-y-4 md:space-y-1 mt-0 md:mt-1">
          {/* Work Experience Section */}
          <section className="py-4 px-3 md:p-8 rounded-xl md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white">Clinical Work Experience</h3>
            </div>
            {experiences.length === 0 ? (
              <p className="text-[11px] md:text-xs text-gray-400 dark:text-zinc-500 italic py-3">Work experience details are currently pending update.</p>
            ) : (
              <div className="space-y-0 divide-y divide-gray-50 dark:divide-zinc-800/50 md:divide-y-0 md:space-y-2 md:border-l-2 md:border-gray-200 md:dark:border-zinc-700 md:pl-4 md:ml-2">
                {experiences.map((exp) => (
                  <div key={exp.id} className="py-3 md:py-0 first:pt-0 last:pb-0 md:relative md:group">
                    <span className="hidden md:block absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 bg-gray-400 dark:bg-zinc-600 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400"></span>
                    <div className="flex justify-between items-start flex-wrap gap-1">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{exp.title}</h4>
                        <span className="block text-[11px] md:text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                          <Building className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-80 flex-shrink-0" />
                          <span className="truncate">{exp.facility} {exp.department ? `(${exp.department})` : ''}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 dark:text-zinc-500 text-[10px] md:text-xs flex-shrink-0">
                        <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span>{exp.start_date} &mdash; {exp.current ? 'Present' : exp.end_date}</span>
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-[11px] md:text-xs mt-2 md:mt-3 leading-relaxed text-gray-600 dark:text-zinc-400 max-w-2xl whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Education Section */}
          <section className="py-4 px-3 md:p-8 rounded-xl md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white">Education & Board Degrees</h3>
            </div>
            {educations.length === 0 ? (
              <p className="text-[11px] md:text-xs text-gray-400 dark:text-zinc-500 italic py-3">Educational board parameters are currently pending update.</p>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {educations.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-start flex-wrap gap-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h4 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{edu.degree}</h4>
                      <p className="text-[11px] md:text-xs font-semibold text-indigo-600 dark:text-indigo-400">{edu.field_of_study}</p>
                      <p className="text-[11px] md:text-xs text-gray-500 dark:text-zinc-400 font-medium">{edu.institution}</p>
                    </div>
                    <div className="text-right text-[10px] md:text-xs text-gray-400 dark:text-zinc-500 space-y-1 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span>{edu.start_date} &mdash; {edu.completed ? edu.end_date : 'Ongoing'}</span>
                      </div>
                      {edu.gpa && (
                        <span className="inline-block bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold">GPA: {edu.gpa}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Certifications Section */}
          <section className="py-4 px-3 md:p-8 rounded-xl md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Award className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white">Certifications</h3>
            </div>
            {certifications.length === 0 ? (
              <p className="text-[11px] md:text-xs text-gray-400 dark:text-zinc-500 italic py-3">No credential certifications posted yet.</p>
            ) : (
              <div className="space-y-2 md:space-y-4">
                {certifications.map((cert) => (
                  <div key={cert.id} className="p-3 md:p-3.5 rounded-lg md:rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40">
                    <h4 className="text-[11px] md:text-xs font-bold text-gray-900 dark:text-white leading-snug">{cert.name}</h4>
                    <p className="text-[10px] md:text-[10px] font-semibold text-gray-500 dark:text-zinc-400 mt-1">{cert.issuing_organization}</p>
                    <div className="flex items-center justify-between mt-2 md:mt-3 text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                      <span>Issued: {cert.issue_date}</span>
                      {cert.credential_id && <span className="font-mono">ID: {cert.credential_id}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Research Section */}
          {research.length > 0 && (
            <section className="py-4 px-3 md:p-8 rounded-xl md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white">Clinical Research</h3>
              </div>
              <div className="space-y-3 md:space-y-4">
                {research.map((proj) => (
                  <div key={proj.id} className="space-y-1 md:space-y-2">
                    <h4 className="text-[11px] md:text-xs font-bold text-gray-900 dark:text-white leading-snug">{proj.title}</h4>
                    {proj.journal_or_publisher && (
                      <p className="text-[10px] md:text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{proj.journal_or_publisher} ({proj.publication_date})</p>
                    )}
                    {proj.abstract_text && (
                      <p className="text-[10px] md:text-[11px] leading-relaxed text-gray-600 dark:text-zinc-400 line-clamp-3 italic">
                        "{proj.abstract_text}"
                      </p>
                    )}
                    {proj.project_url && (
                      <a href={proj.project_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-0.5 md:pt-1">
                        <span>Full Study Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Statistics Section */}
          <section className="py-4 px-3 md:p-8 rounded-xl md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white">Profile Statistics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{profile.views_count || 0}</div>
                <div className="text-[9px] text-gray-500 dark:text-zinc-400">Profile Views</div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{profile.downloads_count || 0}</div>
                <div className="text-[9px] text-gray-500 dark:text-zinc-400">Resume Downloads</div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{profile.search_appearances || 0}</div>
                <div className="text-[9px] text-gray-500 dark:text-zinc-400">Search Appearances</div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-xl p-3 text-center">
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-[9px] text-gray-500 dark:text-zinc-400">Member Since</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}