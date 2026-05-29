/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { databaseService } from '../services/databaseService';
import { UserProfile, Experience, Education, Certification, ResearchProject } from '../types';
import { THEME_MAPS, ThemeStyles } from '../utils/themeMap';
import { VerificationBadge } from '../components/VerificationBadge';
import {
  Briefcase, GraduationCap, Award, BookOpen, MapPin, Lock as LockIcon,
  Calendar, Building, Download, Link2, Check, ExternalLink, HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeMode } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from '../components/PageLoader';

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
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Put this near line 38 with the other [state, setState] lines
  const [isCvLocked, setIsCvLocked] = useState(true);
  // Find your state area and add this:
  const [isPermanentlyLocked, setIsPermanentlyLocked] = useState(true);
  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const p = await databaseService.getProfileByUsername(username);
        if (p) {
          setProfile(p);

          // 1. Get the CV Data from the database
          const cvData = await databaseService.getPublicCV(p.id);

          if (cvData) {
            // If cvData is an object { file_url, is_locked }
            setCvUrl(cvData.file_url);
            setIsPermanentlyLocked(cvData.is_locked); // This comes from your new SQL column!
          }

          // Load everything else
          const [exp, edu, cert, res] = await Promise.all([
            databaseService.getExperiences(p.id),
            databaseService.getEducations(p.id),
            databaseService.getCertifications(p.id),
            databaseService.getResearchProjects(p.id),
          ]);

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
    // 1. If it's locked, unlock it and stop there
    if (isCvLocked) {
      setIsCvLocked(false);
      return;
    }

    // 2. If we reach here, it's unlocked! Now we do the download
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
            <Link
              id="notfound-all-nurses"
              to="/explore"
              className="py-2.5 rounded-lg md:rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold transition"
            >
              Browse Registry
            </Link>
            <Link
              id="notfound-landing"
              to="/"
              className="py-2.5 rounded-lg md:rounded-xl border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Load target theme styles - combine with dark mode awareness
  const baseStyles: ThemeStyles = THEME_MAPS[profile.profile_theme] || THEME_MAPS.modern;

  // Enhance styles with dark mode awareness using zinc-950
  const styles: ThemeStyles = {
    ...baseStyles,
  };
  return (
    <div className="min-h-screen pb-16 md:pb-20 bg-white dark:bg-zinc-950 transition-all duration-300">
      {/* Header - compact on mobile, spacious on desktop */}
      <header className="max-w-4xl mx-auto pt-4 md:pt-6 px-3 md:px-4 flex items-center justify-between">
        <Link
          to="/dashboard"
          className="text-xs font-semibold hover:opacity-85 flex items-center gap-1.5 text-gray-700 dark:text-zinc-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Portal</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <span className="text-[9px] md:text-[10px] font-mono px-2 md:px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 uppercase font-bold text-gray-700 dark:text-zinc-300">
          Public Preview
        </span>
      </header>

      <div className="max-w-4xl mx-auto mt-4 md:mt-6">
        {/* Profile Header Block - full width on mobile, card on desktop */}
        <div className={`
          md:rounded-xl md:shadow-sm md:overflow-hidden md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800
        `}>
          {/* Cover photo */}
          {profile.cover_url ? (
            <div className="h-32 md:h-52 relative">
              <img
                src={profile.cover_url}
                alt="Cover Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
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
                <img
                  src={profile.avatar_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl border-3 md:border-4 shadow bg-white dark:bg-zinc-900 border-white dark:border-zinc-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/192.png';
                  }}
                />
              ) : (
                <img
                  src="/192.png"
                  alt="Default Avatar"
                  className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl border-3 md:border-4 shadow bg-white dark:bg-zinc-900 border-white dark:border-zinc-800"
                />
              )}
            </div>

            {/* Availability badge - compact on mobile */}
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

            {/* Basic Info Rows - stacked on mobile */}
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
                  <span className="text-gray-600 dark:text-zinc-400">{profile.years_of_experience || 0} Years Exp</span>
                </div>
              </div>

              {/* Action Buttons - full width on mobile */}
              {/* Action Buttons Container */}
              <div className="flex flex-col gap-4 w-full md:w-auto">

                {/* OWNER'S PRIVACY MANAGEMENT BOX */}
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
                          className={`mt-3 w-full py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
              ${isPermanentlyLocked
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                              : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 dark:bg-red-950/30 dark:border-red-900'
                            }`}
                        >
                          {isPermanentlyLocked ? (
                            <><Check className="w-4 h-4" /> Make Resume Public</>
                          ) : (
                            <><LockIcon className="w-4 h-4" /> Revoke Public Access</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* VISITOR INTERACTION BUTTONS */}
                <div className="flex items-center gap-2 md:gap-3 w-full">
                  {/* Download Logic */}
                  {isPermanentlyLocked ? (
                    <div className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-400 border border-dashed border-gray-300 dark:border-zinc-700 cursor-not-allowed">
                      <LockIcon className="w-3.5 h-3.5" />
                      <span>Resume Locked by Owner</span>
                    </div>
                  ) : (
                    <button
                      id="pub-btn-download"
                      onClick={handleDownloadCv}
                      disabled={downloading}
                      className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs font-bold transition active:scale-[97%] cursor-pointer
          ${isCvLocked
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                      {isCvLocked ? (
                        <><HelpCircle className="w-3.5 h-3.5 animate-pulse" /> Unlock to Download</>
                      ) : (
                        <><Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} /> {downloading ? 'Downloading...' : 'Save Resume'}</>
                      )}
                    </button>
                  )}

                  {/* Share Button */}
                  <button
                    id="pub-btn-share"
                    onClick={handleCopyLink}
                    className="p-2.5 md:p-3 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition cursor-pointer"
                    title="Copy Profile Link"
                  >
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
            {/* Contact Section */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-zinc-800">
              <h5 className="text-[10px] md:text-xs uppercase font-bold tracking-wider mb-2 text-gray-500 dark:text-zinc-500">Contact Professional</h5>
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800">
                  <p className="text-[10px] text-gray-500 dark:text-zinc-500 mb-1">Direct Email</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {profile.email || 'Email not provided'}
                  </p>
                </div>
                <a
                  href={`mailto:${profile.email}`}
                  className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
            {/* Specialties & Skills - single column on mobile */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

        {/* Content Sections - feed-like on mobile, grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 mt-0 md:mt-6">
          {/* Left Column - continuous feed sections on mobile */}
          <div className="md:col-span-8 divide-y divide-gray-100 dark:divide-zinc-800 md:divide-y-0 md:space-y-2">
            {/* Work Experience Section */}
            <section className={`
              py-4 px-3 md:p-8 md:rounded-xl md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800
            `}>
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
            <section className={`
              py-4 px-3 md:p-8 md:rounded-xl md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800
            `}>
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
          </div>

          {/* Right Column - full width feed sections on mobile, sidebar on desktop */}
          <div className="md:col-span-4">
            {/* Certifications Section */}
            <section className={`
              py-4 px-3 md:p-6 md:rounded-xl md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800
              border-t border-gray-100 dark:border-zinc-800 md:border-t md:border-gray-200 md:dark:border-zinc-800
            `}>
              <div className="flex items-center gap-2 mb-4 md:mb-5">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">Certifications</h3>
              </div>
              {certifications.length === 0 ? (
                <p className="text-[11px] md:text-xs text-gray-400 dark:text-zinc-500 italic py-2">No credential certifications posted yet.</p>
              ) : (
                <div className="space-y-2 md:space-y-4">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-3 md:p-3.5 rounded-lg md:rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40">
                      <h4 className="text-[11px] md:text-xs font-bold text-gray-900 dark:text-white leading-snug">{cert.name}</h4>
                      <p className="text-[10px] md:text-[10px] font-semibold text-gray-500 dark:text-zinc-400 mt-1">{cert.issuing_organization}</p>
                      <div className="flex items-center justify-between mt-2 md:mt-3 text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                        <span>Issued: {cert.issue_date}</span>
                        {cert.credential_id && (
                          <span className="font-mono">ID: {cert.credential_id}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Research Section */}
            {research.length > 0 && (
              <section className={`
                py-4 px-3 md:p-6 md:rounded-xl md:bg-white md:dark:bg-zinc-900 md:border md:border-gray-200 md:dark:border-zinc-800 md:mt-6
                border-t border-gray-100 dark:border-zinc-800 md:border-t md:border-gray-200 md:dark:border-zinc-800
              `}>
                <div className="flex items-center gap-2 mb-4 md:mb-5">
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">Clinical Research</h3>
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
                        <a
                          href={proj.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-0.5 md:pt-1"
                        >
                          <span>Full Study Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}