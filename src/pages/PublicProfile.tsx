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

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
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
      <div id="profile-loading" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-500">Formulating medical credentials & custom theme...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div id="profile-not-found" className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Portfolio Not Found</h2>
          <p className="text-sm text-slate-500 leading-relaxed font-normal">
            The Nursefolio user <span className="font-semibold text-slate-800">@{username}</span> does not appear to have finalized their registration or public profile links yet.
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
              className="py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Load target theme styles
  const styles: ThemeStyles = THEME_MAPS[profile.profile_theme] || THEME_MAPS.modern;

  return (
    <div className={`min-h-screen pb-20 ${styles.bodyBg} transition-all duration-300`}>
      <header className="max-w-4xl mx-auto pt-6 px-4 flex items-center justify-between">
        <Link
          to="/dashboard"
          className={`text-xs font-semibold hover:opacity-85 flex items-center gap-1.5 ${styles.textPrimary}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal</span>
        </Link>
        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/10 uppercase font-bold`}>
          Mode: Public Preview
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Profile Card Header Block */}
        <div className={`rounded-3xl shadow-md overflow-hidden ${styles.cardBg} ${styles.borderStyle}`}>
          {/* Cover photo - using cover_url from database */}
          {profile.cover_url ? (
            <div className="h-44 md:h-52 relative">
              <img
                src={profile.cover_url}
                alt="Cover Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Handle broken image links
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-slate-950/20"></div>
            </div>
          ) : (
            <div className={`h-44 md:h-52 bg-gradient-to-tr ${styles.bannerGradient} relative`}>
              <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:16px_16px]"></div>
            </div>
          )}

          {/* User Details Panel */}
          <div className="p-6 md:p-8 relative pt-14 md:pt-16">
            {/* Avatar overlay - using avatar_url from database */}
            <div className="absolute -top-16 left-6 md:left-8">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className={`w-28 h-28 object-cover rounded-2xl border-4 shadow bg-white ${profile.profile_theme === 'dark' ? 'border-slate-900' : 'border-white'}`}
                  onError={(e) => {
                    // Fallback to default avatar on error
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200';
                  }}
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1574496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200"
                  alt="Default Avatar"
                  className={`w-28 h-28 object-cover rounded-2xl border-4 shadow bg-white ${profile.profile_theme === 'dark' ? 'border-slate-900' : 'border-white'}`}
                />
              )}
            </div>

            {/* Float availability badges or action pills */}
            <div className="absolute top-4 right-4 md:right-8 flex flex-col sm:flex-row gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${profile.availability_status === 'available'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : profile.availability_status === 'open'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                }`}>
                <span className={`w-2 h-2 rounded-full ${profile.availability_status === 'available' ? 'bg-emerald-400 animate-ping' : profile.availability_status === 'open' ? 'bg-amber-400' : 'bg-slate-400'
                  }`}></span>
                <span className="uppercase tracking-wider">
                  {profile.availability_status === 'available' ? 'Offering Care' : profile.availability_status === 'open' ? 'Open to Offers' : 'Not Available'}
                </span>
              </span>
            </div>

            {/* Basic Info Rows */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={`text-2xl md:text-3.5xl font-extrabold tracking-tight ${styles.textPrimary} ${styles.fontDisplay}`}>
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <VerificationBadge status={profile.verification_status} showText={true} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <span className={`font-semibold ${styles.accentText}`}>
                    {profile.qualification || profile.nursing_level || 'BSN Professional'}
                  </span>
                  <span className={styles.textSecondary}>•</span>
                  <div className={`flex items-center gap-1 ${styles.textSecondary}`}>
                    <MapPin className="w-4 h-4 opacity-70" />
                    <span>{profile.location || 'USA'}</span>
                  </div>
                  <span className={styles.textSecondary}>•</span>
                  <span className={styles.textSecondary}>{profile.years_experience || 0} Years Experience</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  id="pub-btn-download"
                  onClick={handleDownloadCv}
                  disabled={downloading}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-[97%] cursor-pointer ${styles.buttonPrimary}`}
                >
                  <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                  <span>{downloading ? 'Generating CV...' : 'Download Resume'}</span>
                </button>

                <button
                  id="pub-btn-share"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-750 transition cursor-pointer"
                  title="Copy share link to clipboard"
                >
                  {copied ? <Check className="w-4.5 h-4.5 text-emerald-600" /> : <Link2 className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Bio statement */}
            {profile.bio && (
              <div className="mt-6 pt-6 border-t border-slate-100/40">
                <h5 className={`text-xs uppercase font-bold tracking-wider mb-2 ${styles.textSecondary}`}>Biography Summary</h5>
                <p className={`text-sm leading-relaxed ${styles.textSecondary} whitespace-pre-line`}>
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Specialties & Skills */}
            <div className="mt-6 pt-6 border-t border-slate-100/40 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className={`text-xs uppercase font-bold tracking-wider mb-2.5 ${styles.textSecondary}`}>Medical Specialties</h5>
                <div className="flex flex-wrap gap-1.5">
                  {profile.specialties && profile.specialties.length > 0 ? (
                    profile.specialties.map((spec) => (
                      <span key={spec} className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles.accentBg}`}>
                        {spec}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No specialties published yet.</span>
                  )}
                </div>
              </div>

              <div>
                <h5 className={`text-xs uppercase font-bold tracking-wider mb-2.5 ${styles.textSecondary}`}>Clinical Skills</h5>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-slate-100/80 text-slate-755 border border-slate-200/50 px-2.5 py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No clinical skills published yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of your component remains the same... */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Left Column */}
          <div className="md:col-span-8 space-y-6">
            {/* Work Experience Section */}
            <section id="pub-section-exp" className={`p-6 md:p-8 rounded-3xl ${styles.cardBg} ${styles.borderStyle}`}>
              <div className="flex items-center gap-2 mb-6">
                <Briefcase className={`w-5 h-5 ${styles.iconColor}`} />
                <h3 className={`font-bold text-lg ${styles.textPrimary} ${styles.fontDisplay}`}>Clinical Work Experience</h3>
              </div>
              {experiences.length === 0 ? (
                <p className="text-xs text-slate-450 italic py-4">Work experience details are currently pending update.</p>
              ) : (
                <div className="space-y-6 relative border-l border-slate-100 pl-4 ml-2">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="relative group">
                      <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-slate-400 group-hover:bg-indigo-500`}></span>
                      <div className="flex justify-between items-start flex-wrap gap-1">
                        <div>
                          <h4 className={`text-base font-bold ${styles.textPrimary}`}>{exp.title}</h4>
                          <span className={`block text-xs font-semibold ${styles.accentText} mt-0.5 flex items-center gap-1`}>
                            <Building className="w-3.5 h-3.5 opacity-80" />
                            {exp.facility} {exp.department ? `(${exp.department})` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-450 text-xs mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{exp.start_date} &mdash; {exp.current ? 'Present' : exp.end_date}</span>
                        </div>
                      </div>
                      {exp.description && (
                        <p className={`text-xs mt-3 leading-relaxed ${styles.textSecondary} max-w-2xl whitespace-pre-line`}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Education Section */}
            <section id="pub-section-edu" className={`p-6 md:p-8 rounded-3xl ${styles.cardBg} ${styles.borderStyle}`}>
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className={`w-5 h-5 ${styles.iconColor}`} />
                <h3 className={`font-bold text-lg ${styles.textPrimary} ${styles.fontDisplay}`}>Education & Board Degrees</h3>
              </div>
              {educations.length === 0 ? (
                <p className="text-xs text-slate-450 italic py-4">Educational board parameters are currently pending update.</p>
              ) : (
                <div className="space-y-6">
                  {educations.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start flex-wrap gap-4">
                      <div className="space-y-1">
                        <h4 className={`text-base font-bold ${styles.textPrimary}`}>{edu.degree}</h4>
                        <p className={`text-xs font-semibold ${styles.accentText}`}>{edu.field_of_study}</p>
                        <p className="text-xs text-slate-500 font-medium">{edu.institution}</p>
                      </div>
                      <div className="text-right text-xs text-slate-450 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{edu.start_date} &mdash; {edu.completed ? edu.end_date : 'Ongoing'}</span>
                        </div>
                        {edu.gpa && (
                          <span className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">GPA: {edu.gpa}</span>
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
            <section id="pub-section-cert" className={`p-6 rounded-3xl ${styles.cardBg} ${styles.borderStyle}`}>
              <div className="flex items-center gap-2 mb-5">
                <Award className={`w-5 h-5 ${styles.iconColor}`} />
                <h3 className={`font-bold text-base ${styles.textPrimary} ${styles.fontDisplay}`}>Certifications</h3>
              </div>
              {certifications.length === 0 ? (
                <p className="text-xs text-slate-450 italic py-2">No credential certifications posted yet.</p>
              ) : (
                <div className="space-y-4">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40">
                      <h4 className={`text-xs font-bold ${styles.textPrimary} leading-snug`}>{cert.name}</h4>
                      <p className="text-[10px] font-semibold text-slate-500 mt-1">{cert.issuing_organization}</p>
                      <div className="flex items-center justify-between mt-3 text-[10px] text-slate-450 font-medium">
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
              <section id="pub-section-res" className={`p-6 rounded-3xl ${styles.cardBg} ${styles.borderStyle}`}>
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className={`w-5 h-5 ${styles.iconColor}`} />
                  <h3 className={`font-bold text-base ${styles.textPrimary} ${styles.fontDisplay}`}>Clinical Research</h3>
                </div>
                <div className="space-y-4">
                  {research.map((proj) => (
                    <div key={proj.id} className="space-y-2">
                      <h4 className={`text-xs font-bold ${styles.textPrimary} leading-snug`}>{proj.title}</h4>
                      {proj.journal_or_publisher && (
                        <p className="text-[10px] font-semibold text-indigo-600">{proj.journal_or_publisher} ({proj.publication_date})</p>
                      )}
                      {proj.abstract_text && (
                        <p className={`text-[11px] leading-relaxed ${styles.textSecondary} line-clamp-3 italic`}>
                          "{proj.abstract_text}"
                        </p>
                      )}
                      {proj.project_url && (
                        <a
                          href={proj.project_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline pt-1"
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