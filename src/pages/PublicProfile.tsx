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
  Briefcase, GraduationCap, Award, BookOpen, MapPin,
  Calendar, Building, Download, Link2, Check, ExternalLink, HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeMode } from '../contexts/ThemeContext';

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { themeMode } = useThemeMode();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [research, setResearch] = useState<ResearchProject[]>([]);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const p = await databaseService.getProfileByUsername(username);
        if (p) {
          setProfile(p);
          // Look in the document table for the CV link
          const latestCv = await databaseService.getPublicCV(p.id);
          setCvUrl(latestCv);
          // Load corresponding credentials
          const [exp, edu, cert, res] = await Promise.all([
            databaseService.getExperiences(p.id),
            databaseService.getEducations(p.id),
            databaseService.getCertifications(p.id),
            databaseService.getResearchProjects(p.id),
            // Track profile view asynchronously
            databaseService.recordProfileView(p.id)
          ]);
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
    return (
      <div id="profile-loading" className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-zinc-800 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-gray-600 dark:text-zinc-400">Formulating medical credentials & custom theme...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div id="profile-not-found" className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-10 max-w-md w-full text-center border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Not Found</h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed font-normal">
            The Nursefolio user <span className="font-semibold text-gray-800 dark:text-zinc-200">@{username}</span> does not appear to have finalized their registration or public profile links yet.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Link
              id="notfound-all-nurses"
              to="/explore"
              className="py-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold transition"
            >
              Browse Registry
            </Link>
            <Link
              id="notfound-landing"
              to="/"
              className="py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800"
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
    bodyBg: themeMode === 'dark' ? 'bg-zinc-950' : 'bg-white',
    cardBg: themeMode === 'dark' ? 'bg-zinc-900' : 'bg-white',
    borderStyle: themeMode === 'dark' ? 'border border-zinc-800' : 'border border-gray-200',
  };

  return (
    <div className={`min-h-screen pb-20 ${styles.bodyBg} transition-all duration-300`}>
      <header className="max-w-4xl mx-auto pt-6 px-4 flex items-center justify-between">
        <Link
          to="/dashboard"
          className={`text-xs font-semibold hover:opacity-85 flex items-center gap-1.5 text-gray-700 dark:text-zinc-300`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal</span>
        </Link>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 uppercase font-bold text-gray-700 dark:text-zinc-300">
          Mode: Public Preview
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Profile Card Header Block */}
        <div className={`rounded-xl shadow-sm overflow-hidden ${styles.cardBg} ${styles.borderStyle}`}>
          {/* Cover photo - using cover_url from database */}
          {profile.cover_url ? (
            <div className="h-44 md:h-52 relative">
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
            <div className={`h-44 md:h-52 bg-gradient-to-tr ${baseStyles.bannerGradient} relative`}>
              <div className="absolute inset-0 bg-white/5 dark:bg-black/20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] bg-[size:16px_16px]"></div>
            </div>
          )}

          {/* User Details Panel */}
          <div className="p-6 md:p-8 relative pt-14 md:pt-16">
            {/* Avatar overlay */}
            <div className="absolute -top-16 left-6 md:left-8">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="w-28 h-28 object-cover rounded-xl border-4 shadow bg-white dark:bg-zinc-900 border-white dark:border-zinc-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200';
                  }}
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1574496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200"
                  alt="Default Avatar"
                  className="w-28 h-28 object-cover rounded-xl border-4 shadow bg-white dark:bg-zinc-900 border-white dark:border-zinc-800"
                />
              )}
            </div>

            {/* Availability badges */}
            <div className="absolute top-4 right-4 md:right-8 flex flex-col sm:flex-row gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${profile.availability_status === 'available'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : profile.availability_status === 'open'
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
                }`}>
                <span className={`w-2 h-2 rounded-full ${profile.availability_status === 'available'
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

            {/* Basic Info Rows */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <VerificationBadge status={profile.verification_status} showText={true} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {profile.qualification || profile.nursing_level || 'BSN Professional'}
                  </span>
                  <span className="text-gray-400 dark:text-zinc-600">•</span>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-zinc-400">
                    <MapPin className="w-4 h-4 opacity-70" />
                    <span>{profile.location || 'USA'}</span>
                  </div>
                  <span className="text-gray-400 dark:text-zinc-600">•</span>
                  <span className="text-gray-600 dark:text-zinc-400">{profile.years_experience || 0} Years Experience</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  id="pub-btn-download"
                  onClick={handleDownloadCv}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-[97%] cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                  <span>{downloading ? 'Generating CV...' : 'Download Resume'}</span>
                </button>

                <button
                  id="pub-btn-share"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition cursor-pointer"
                  title="Copy share link to clipboard"
                >
                  {copied ? <Check className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" /> : <Link2 className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Bio statement */}
            {profile.bio && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                <h5 className="text-xs uppercase font-bold tracking-wider mb-2 text-gray-500 dark:text-zinc-500">Biography Summary</h5>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400 whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Specialties & Skills */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-xs uppercase font-bold tracking-wider mb-2.5 text-gray-500 dark:text-zinc-500">Medical Specialties</h5>
                <div className="flex flex-wrap gap-1.5">
                  {profile.specialties && profile.specialties.length > 0 ? (
                    profile.specialties.map((spec) => (
                      <span key={spec} className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {spec}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-zinc-500 italic">No specialties published yet.</span>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-xs uppercase font-bold tracking-wider mb-2.5 text-gray-500 dark:text-zinc-500">Clinical Skills</h5>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 px-2.5 py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-zinc-500 italic">No clinical skills published yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Left Column */}
          <div className="md:col-span-8 space-y-2">
            {/* Work Experience Section */}
            <section className={`p-6 md:p-8 rounded-xl ${styles.cardBg} ${styles.borderStyle}`}>
              <div className="flex items-center gap-2 mb-6">
                <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Clinical Work Experience</h3>
              </div>
              {experiences.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-zinc-500 italic py-4">Work experience details are currently pending update.</p>
              ) : (
                <div className="space-y-2 relative border-l-2 border-gray-200 dark:border-zinc-700 pl-4 ml-2">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="relative group">
                      <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 bg-gray-400 dark:bg-zinc-600 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400"></span>
                      <div className="flex justify-between items-start flex-wrap gap-1">
                        <div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">{exp.title}</h4>
                          <span className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 opacity-80" />
                            {exp.facility} {exp.department ? `(${exp.department})` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 dark:text-zinc-500 text-xs mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{exp.start_date} &mdash; {exp.current ? 'Present' : exp.end_date}</span>
                        </div>
                      </div>
                      {exp.description && (
                        <p className="text-xs mt-3 leading-relaxed text-gray-600 dark:text-zinc-400 max-w-2xl whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Education Section */}
            <section className={`p-6 md:p-8 rounded-xl ${styles.cardBg} ${styles.borderStyle}`}>
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Education & Board Degrees</h3>
              </div>
              {educations.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-zinc-500 italic py-4">Educational board parameters are currently pending update.</p>
              ) : (
                <div className="space-y-6">
                  {educations.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start flex-wrap gap-4">
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white">{edu.degree}</h4>
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{edu.field_of_study}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{edu.institution}</p>
                      </div>
                      <div className="text-right text-xs text-gray-400 dark:text-zinc-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{edu.start_date} &mdash; {edu.completed ? edu.end_date : 'Ongoing'}</span>
                        </div>
                        {edu.gpa && (
                          <span className="inline-block bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-1.5 py-0.5 rounded text-[10px] font-bold">GPA: {edu.gpa}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="md:col-span-4 space-y-6">
            {/* Certifications Section */}
            <section className={`p-6 rounded-xl ${styles.cardBg} ${styles.borderStyle}`}>
              <div className="flex items-center gap-2 mb-5">
                <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Certifications</h3>
              </div>
              {certifications.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-zinc-500 italic py-2">No credential certifications posted yet.</p>
              ) : (
                <div className="space-y-4">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{cert.name}</h4>
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-zinc-400 mt-1">{cert.issuing_organization}</p>
                      <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
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
              <section className={`p-6 rounded-xl ${styles.cardBg} ${styles.borderStyle}`}>
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Clinical Research</h3>
                </div>
                <div className="space-y-4">
                  {research.map((proj) => (
                    <div key={proj.id} className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{proj.title}</h4>
                      {proj.journal_or_publisher && (
                        <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{proj.journal_or_publisher} ({proj.publication_date})</p>
                      )}
                      {proj.abstract_text && (
                        <p className="text-[11px] leading-relaxed text-gray-600 dark:text-zinc-400 line-clamp-3 italic">
                          "{proj.abstract_text}"
                        </p>
                      )}
                      {proj.project_url && (
                        <a
                          href={proj.project_url}

                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
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