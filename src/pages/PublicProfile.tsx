/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { databaseService } from '../services/databaseService';
import { skillService } from '../services/skillService';
import {
  UserProfile, Experience, Education, Certification, ResearchProject,
  ClinicalProcedure, NurseSkill,
} from '../types';
import { THEME_MAPS, ThemeStyles } from '../utils/themeMap';
import { VerificationBadge } from '../components/VerificationBadge';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from '../components/PageLoader';
import {
  Briefcase, GraduationCap, Award, BookOpen, MapPin, Lock as LockIcon,
  Calendar, Building, Download, Link2, Check, ExternalLink, HelpCircle,
  ArrowLeft, Stethoscope, FileSignature, Clock, TrendingUp, Target, Flame, Crown,
  Heart, Syringe, FileText, Shield, Users, Globe, Truck, Moon, Sun,
  AlertCircle, Edit3, Share2, ChevronRight, Loader2, Quote, Sparkles,
} from 'lucide-react';

// ==========================================================
// HELPERS
// ==========================================================
function getStudentLevel(count: number) {
  if (count >= 300) return { name: 'Nurse Guru', icon: Crown, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950/40' };
  if (count >= 200) return { name: 'Premium Nurse', icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950/40' };
  if (count >= 100) return { name: 'Advanced Nurse', icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/40' };
  if (count >= 50) return { name: 'Intermediate Nurse', icon: Target, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-950/40' };
  return { name: 'Beginner Nurse', icon: Award, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-zinc-900' };
}

function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function yearsBetween(start: string | null | undefined, end?: string | null | undefined): number {
  if (!start) return 0;
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  if (isNaN(startDate.getTime())) return 0;
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12
    + (endDate.getMonth() - startDate.getMonth());
  return Math.max(0, Math.floor(months / 12));
}

interface EndorsementWithAuthor {
  id: string;
  specialty: string | null;
  message: string | null;
  created_at: string;
  endorser: {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    username: string;
    avatar_url: string | null;
    qualification: string | null;
    nursing_level: string | null;
  } | null;
}

function endorsementAuthorName(e: EndorsementWithAuthor): string {
  const p = e.endorser;
  if (!p) return 'A colleague';
  if (p.full_name) return p.full_name;
  const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
  if (name) return name;
  return p.username || 'A colleague';
}

// ==========================================================
// SHARED SUBCOMPONENTS
// ==========================================================
const SectionHeading = React.memo<{
  icon: any;
  title: string;
  count?: number;
}>(({ icon: Icon, title, count }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div className="w-8 h-8 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
    </div>
    <h2 className="text-base md:text-lg font-display font-bold text-slate-900 dark:text-white">
      {title}
    </h2>
    {typeof count === 'number' && count > 0 && (
      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums">
        {count}
      </span>
    )}
  </div>
));
SectionHeading.displayName = 'SectionHeading';

const EmptySection = React.memo<{ message: string }>(({ message }) => (
  <p className="text-sm text-slate-400 dark:text-slate-500 italic py-3">
    {message}
  </p>
));
EmptySection.displayName = 'EmptySection';

// ==========================================================
// MAIN
// ==========================================================
export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [research, setResearch] = useState<ResearchProject[]>([]);
  const [clinicalProcedures, setClinicalProcedures] = useState<ClinicalProcedure[]>([]);
  const [skills, setSkills] = useState<NurseSkill[]>([]);
  const [endorsements, setEndorsements] = useState<EndorsementWithAuthor[]>([]);

  // CV state
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [isCvPublic, setIsCvPublic] = useState(false);
  const [unlockedThisSession, setUnlockedThisSession] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showOwnerBanner, setShowOwnerBanner] = useState(true);
  const [togglingCv, setTogglingCv] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');

  const isOwner = !!(user && profile && user.id === profile.id);

  // ----------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------
  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const p = await databaseService.getProfileByUsername(username);
        if (cancelled) return;

        if (!p) {
          setNotFound(true);
          return;
        }
        setProfile(p);

        // Everything in parallel
        const [
          cvData,
          exp,
          edu,
          cert,
          res,
          skillsData,
          endorsementsData,
          procedures,
        ] = await Promise.all([
          databaseService.getPublicCV(p.id),
          databaseService.getExperiences(p.id),
          databaseService.getEducations(p.id),
          databaseService.getCertifications(p.id),
          databaseService.getResearchProjects(p.id),
          skillService.getSkills(p.id),
          databaseService.getProfileEndorsements(p.id),
          p.role === 'student'
            ? skillService.getVerifiedProcedures(p.id, 20)
            : Promise.resolve([]),
        ]);

        if (cancelled) return;

        if (cvData) {
          setCvUrl(cvData.file_url);
          setIsCvPublic(!cvData.is_locked);
        }

        setExperiences(exp || []);
        setEducations(edu || []);
        setCertifications(cert || []);
        setResearch(res || []);
        setSkills(skillsData || []);
        setEndorsements((endorsementsData || []) as EndorsementWithAuthor[]);
        setClinicalProcedures(procedures || []);

        // View tracking — only for non-owners, once per session
        if (user?.id !== p.id) {
          const viewKey = `viewed_profile_${p.id}`;
          if (!sessionStorage.getItem(viewKey)) {
            databaseService.recordProfileView(p.id);
            sessionStorage.setItem(viewKey, 'true');
          }
        }
      } catch (err) {
        console.error('Error fetching public portfolio:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // ----------------------------------------------------------
  // MISSING SECTIONS (owner banner)
  // ----------------------------------------------------------
  const missingSections = useMemo(() => {
    if (!profile || !isOwner) return [];
    const missing: string[] = [];
    if (!profile.bio) missing.push('Bio');
    if (!profile.location) missing.push('Location');
    if (!profile.specialty) missing.push('Specialty');
    if (!profile.nursing_council_id) missing.push('NCK ID');
    if (!profile.license_expiry_date) missing.push('License expiry');
    if (!profile.avatar_url) missing.push('Photo');
    if (skills.length === 0) missing.push('Skills');
    if (experiences.length === 0) missing.push('Work experience');
    if (educations.length === 0) missing.push('Education');
    if (certifications.length === 0) missing.push('Certifications');
    return missing;
  }, [profile, isOwner, experiences.length, educations.length, certifications.length, skills.length]);

  // ----------------------------------------------------------
  // DERIVED
  // ----------------------------------------------------------
  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username
    : '';

  const totalYearsExperience = useMemo(() => {
    if ((profile?.years_experience || 0) > 0) return profile!.years_experience!;
    // Fallback: sum up experience entries
    return experiences.reduce(
      (total, exp) => total + yearsBetween(exp.start_date, exp.current ? null : exp.end_date),
      0
    );
  }, [profile, experiences]);

  const level = getStudentLevel(clinicalProcedures.length);
  const LevelIcon = level.icon;
  const baseStyles: ThemeStyles = profile ? (THEME_MAPS[profile.profile_theme] || THEME_MAPS.modern) : THEME_MAPS.modern;

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!profile) return;
    const shareData = {
      title: `${displayName} — Nursefolio`,
      text: `Check out ${displayName}'s professional nursing portfolio on Nursefolio.`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled — fall through
      }
    }
    handleCopyLink();
    setShareFeedback('Link copied');
    setTimeout(() => setShareFeedback(''), 2000);
  }, [profile, displayName, handleCopyLink]);

  const handleDownloadCv = useCallback(async () => {
    if (!profile) return;

    // First tap: reveal the download action
    if (!unlockedThisSession) {
      setUnlockedThisSession(true);
      return;
    }

    if (!cvUrl) return;

    setDownloading(true);
    try {
      await databaseService.recordCvDownload(profile.id, cvUrl);
      const link = document.createElement('a');
      link.href = cvUrl;
      link.download = `${profile.first_name || 'nurse'}_${profile.last_name || 'cv'}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Could not download the CV. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [profile, cvUrl, unlockedThisSession]);

  const handleToggleCvVisibility = useCallback(async () => {
    if (!profile || togglingCv) return;
    setTogglingCv(true);
    try {
      const nextIsLocked = isCvPublic;
      await databaseService.toggleCvLock(profile.id, nextIsLocked);
      setIsCvPublic(!nextIsLocked);
    } catch (err) {
      console.error('Toggle CV lock failed:', err);
    } finally {
      setTogglingCv(false);
    }
  }, [profile, isCvPublic, togglingCv]);

  // ----------------------------------------------------------
  // STATES
  // ----------------------------------------------------------
  if (loading) return <PageLoader />;
  if (notFound || !profile) return <ProfileNotFound username={username} />;

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-20">

      {/* ============================================
          TOP BAR
          ============================================ */}
      <header className="max-w-3xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 active:opacity-70 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {isOwner ? 'Your public view' : 'Public profile'}
        </span>
      </header>

      {/* ============================================
          OWNER COMPLETION BANNER
          ============================================ */}
      {isOwner && showOwnerBanner && missingSections.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {missingSections.length} things visitors can't see yet
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                Missing: {missingSections.slice(0, 4).join(', ')}
                {missingSections.length > 4 && ` +${missingSections.length - 4} more`}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Link
                  to="/dashboard/edit-profile"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-600 active:bg-amber-700 text-white text-xs font-bold transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Complete profile
                </Link>
                <button
                  onClick={() => setShowOwnerBanner(false)}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 active:opacity-70 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 mt-6">

        {/* ============================================
            HERO
            ============================================ */}
        <section>
          {/* Cover */}
          <div className="relative md:rounded-3xl overflow-hidden">
            <div className="h-32 md:h-44 bg-slate-200 dark:bg-zinc-800">
              {profile.cover_url ? (
                <img
                  src={profile.cover_url}
                  alt=""
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${baseStyles.bannerGradient}`} />
              )}
            </div>
          </div>

          {/* Avatar + Name + Actions */}
          <div className="relative px-4 md:px-6 -mt-12 md:-mt-14">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex items-end gap-4">
                {profile.avatar_url ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-zinc-950 bg-slate-100 dark:bg-zinc-900 flex-shrink-0">
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-zinc-950 bg-teal-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </div>
                )}

                <div className="pb-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-display font-extrabold text-slate-900 dark:text-white truncate">
                      {displayName}
                    </h1>
                    <VerificationBadge status={profile.verification_status} showText={false} size="sm" />
                  </div>
                  <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 mt-0.5 truncate">
                    {profile.qualification || profile.nursing_level || 'Registered Nurse'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {profile.location}
                      </span>
                    )}
                    {totalYearsExperience > 0 && (
                      <span>{totalYearsExperience} {totalYearsExperience === 1 ? 'year' : 'years'} experience</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-xs font-bold active:opacity-70 transition"
                  aria-label="Copy profile link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      Copy link
                    </>
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-teal-600 active:bg-teal-700 text-white text-xs font-bold transition"
                  aria-label="Share profile"
                >
                  {shareFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {shareFeedback}
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Availability pill */}
            <div className="mt-4">
              <AvailabilityPill status={profile.availability_status} />
            </div>
          </div>
        </section>

        {/* ============================================
            TRUST BAR — quick stats
            ============================================ */}
        {(endorsements.length > 0 || certifications.length > 0 || experiences.length > 0 || clinicalProcedures.length > 0) && (
          <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickStat
              icon={Briefcase}
              value={experiences.length}
              label={experiences.length === 1 ? 'Role' : 'Roles'}
              tone="teal"
            />
            <QuickStat
              icon={Award}
              value={certifications.length}
              label={certifications.length === 1 ? 'Certification' : 'Certifications'}
              tone="amber"
            />
            <QuickStat
              icon={Users}
              value={endorsements.length}
              label={endorsements.length === 1 ? 'Endorsement' : 'Endorsements'}
              tone="indigo"
            />
            {profile.role === 'student' ? (
              <QuickStat
                icon={FileSignature}
                value={clinicalProcedures.length}
                label="Verified procedures"
                tone="emerald"
              />
            ) : (
              <QuickStat
                icon={BookOpen}
                value={research.length}
                label={research.length === 1 ? 'Publication' : 'Publications'}
                tone="emerald"
              />
            )}
          </section>
        )}

        {/* ============================================
            OWNER: CV VISIBILITY CONTROL
            ============================================ */}
        {isOwner && (
          <section className="mt-6 bg-slate-100 dark:bg-zinc-900 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isCvPublic
                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                }`}>
                {isCvPublic ? <ExternalLink className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  CV: {isCvPublic ? 'Visible to visitors' : 'Hidden from visitors'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {isCvPublic
                    ? 'Anyone with this link can download your CV.'
                    : 'Visitors see a "locked" state. Enable to let recruiters download your CV.'}
                </p>
                <button
                  onClick={handleToggleCvVisibility}
                  disabled={togglingCv}
                  className={`mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition disabled:opacity-50 ${isCvPublic
                    ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 active:bg-rose-200'
                    : 'bg-emerald-600 active:bg-emerald-700 text-white'
                    }`}
                >
                  {togglingCv && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isCvPublic ? 'Hide from visitors' : 'Make CV visible'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ============================================
            VISITOR: CV DOWNLOAD
            ============================================ */}
        {!isOwner && isCvPublic && cvUrl && (
          <section className="mt-6">
            {!unlockedThisSession ? (
              <button
                onClick={handleDownloadCv}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition"
              >
                <Download className="w-4 h-4" />
                Download CV
              </button>
            ) : (
              <button
                onClick={handleDownloadCv}
                disabled={downloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download CV
                  </>
                )}
              </button>
            )}
          </section>
        )}

        {/* ============================================
            BIO
            ============================================ */}
        {profile.bio && (
          <section className="mt-8">
            <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </section>
        )}

        {/* ============================================
            ENDORSEMENTS — social proof, shown early
            ============================================ */}
        {endorsements.length > 0 && (
          <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
            <SectionHeading icon={Users} title="Peer endorsements" count={endorsements.length} />
            <div className="space-y-3">
              {endorsements.slice(0, 3).map(e => (
                <EndorsementCard key={e.id} endorsement={e} />
              ))}
            </div>
            {endorsements.length > 3 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                + {endorsements.length - 3} more endorsement{endorsements.length - 3 === 1 ? '' : 's'}
              </p>
            )}
          </section>
        )}

        {/* ============================================
            PROFESSIONAL DETAILS
            ============================================ */}
        {(profile.nursing_council_id || profile.license_expiry_date || profile.specialty || profile.preferred_shift) && (
          <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
            <SectionHeading icon={Shield} title="Professional details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.nursing_council_id && (
                <InfoRow
                  label="NCK license ID"
                  value={profile.nursing_council_id}
                  icon={Shield}
                  tone="teal"
                />
              )}
              {profile.license_expiry_date && (
                <InfoRow
                  label="License expires"
                  value={formatMonthYear(profile.license_expiry_date)}
                  icon={Calendar}
                  tone={new Date(profile.license_expiry_date) < new Date() ? 'danger' : 'neutral'}
                  suffix={new Date(profile.license_expiry_date) < new Date() ? 'Expired' : undefined}
                />
              )}
              {profile.specialty && (
                <InfoRow
                  label="Primary specialty"
                  value={profile.specialty}
                  icon={Stethoscope}
                  tone="teal"
                />
              )}
              {profile.preferred_shift && (
                <InfoRow
                  label="Preferred shift"
                  value={profile.preferred_shift}
                  icon={
                    profile.preferred_shift === 'Night' ? Moon :
                      profile.preferred_shift === 'Day' ? Sun : Clock
                  }
                  tone="neutral"
                />
              )}
            </div>
          </section>
        )}

        {/* ============================================
            SPECIALTIES & SKILLS
            ============================================ */}
        {(profile.specialties?.length || skills.length > 0) && (
          <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
            <SectionHeading icon={Award} title="Specialties & skills" />
            <div className="space-y-5">
              {profile.specialties && profile.specialties.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Focus areas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.map(spec => (
                      <span
                        key={spec}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skills.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Clinical skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <span
                        key={skill.id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300"
                      >
                        {skill.skill_name}
                        {skill.proficiency && skill.proficiency !== 'Intermediate' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                            {skill.proficiency}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================
            WORK EXPERIENCE
            ============================================ */}
        <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
          <SectionHeading icon={Briefcase} title="Work experience" count={experiences.length} />
          {experiences.length === 0 ? (
            <EmptySection message="No work experience added yet." />
          ) : (
            <div className="space-y-6">
              {experiences.map(exp => (
                <article key={exp.id} className="relative pl-6">
                  {/* Timeline dot */}
                  <span className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-50 dark:ring-teal-950/40" />
                  <span className="absolute left-[5px] top-5 bottom-[-24px] w-0.5 bg-slate-100 dark:bg-zinc-900 last:hidden" />

                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                      {exp.title}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {formatMonthYear(exp.start_date)} — {exp.current ? 'Present' : formatMonthYear(exp.end_date)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {exp.facility}{exp.department ? ` · ${exp.department}` : ''}
                    </span>
                  </p>
                  {exp.location && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {exp.location}
                    </p>
                  )}
                  {exp.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2 whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ============================================
            EDUCATION
            ============================================ */}
        <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
          <SectionHeading icon={GraduationCap} title="Education" count={educations.length} />
          {educations.length === 0 ? (
            <EmptySection message="No education history added yet." />
          ) : (
            <div className="space-y-5">
              {educations.map(edu => (
                <div key={edu.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                      {edu.degree}{edu.field_of_study ? ` · ${edu.field_of_study}` : ''}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {formatMonthYear(edu.start_date)} — {edu.completed ? formatMonthYear(edu.end_date) : 'Ongoing'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {edu.institution}
                    {edu.gpa && <span className="text-slate-400 dark:text-slate-500"> · GPA {edu.gpa}</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============================================
            CERTIFICATIONS
            ============================================ */}
        <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
          <SectionHeading icon={Award} title="Certifications" count={certifications.length} />
          {certifications.length === 0 ? (
            <EmptySection message="No certifications added yet." />
          ) : (
            <div className="space-y-3">
              {certifications.map(cert => (
                <div key={cert.id} className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {cert.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                        {cert.issuing_organization}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Issued {formatMonthYear(cert.issue_date)}
                        {cert.expiration_date && ` · Expires ${formatMonthYear(cert.expiration_date)}`}
                        {cert.credential_id && ` · ID ${cert.credential_id}`}
                      </p>
                    </div>
                    {cert.verification_url && (
                      <a
                        href={cert.verification_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 active:opacity-70 flex-shrink-0"
                      >
                        Verify
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============================================
            RESEARCH
            ============================================ */}
        {research.length > 0 && (
          <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
            <SectionHeading icon={BookOpen} title="Research & publications" count={research.length} />
            <div className="space-y-5">
              {research.map(proj => (
                <article key={proj.id}>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {proj.title}
                  </h3>
                  {proj.journal_or_publisher && (
                    <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
                      {proj.journal_or_publisher}
                      {proj.publication_date && ` · ${formatMonthYear(proj.publication_date)}`}
                    </p>
                  )}
                  {proj.co_authors && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      With {proj.co_authors}
                    </p>
                  )}
                  {proj.abstract_text && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2 italic line-clamp-4">
                      "{proj.abstract_text}"
                    </p>
                  )}
                  {proj.project_url && (
                    <a
                      href={proj.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 active:opacity-70 mt-2"
                    >
                      Read paper
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ============================================
            CLINICAL LOGBOOK (students)
            ============================================ */}
        {profile.role === 'student' && clinicalProcedures.length > 0 && (
          <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <SectionHeading icon={FileSignature} title="Clinical logbook" />
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${level.bg} ${level.color}`}>
                <LevelIcon className="w-3.5 h-3.5" />
                {level.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <StatTile value={clinicalProcedures.length} label="Verified procedures" tone="teal" />
              <StatTile value={totalYearsExperience} label="Years of study" tone="indigo" />
              <StatTile value={clinicalProcedures.length >= 20 ? '✓' : `${clinicalProcedures.length}/20`} label="NCK logbook" tone="amber" />
            </div>

            <div className="space-y-2">
              {clinicalProcedures.slice(0, 10).map(proc => (
                <div key={proc.id} className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {proc.procedure_name}
                      </h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatMonthYear(proc.date_performed)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {proc.competency_level}
                        </span>
                        {proc.facility_name && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {proc.facility_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {clinicalProcedures.length >= 20 && (
              <div className="mt-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-3.5 text-center">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  ✓ NCK logbook requirements met
                </p>
              </div>
            )}
          </section>
        )}

        {/* ============================================
            LANGUAGES & MOBILITY
            ============================================ */}
        {(profile.languages_spoken?.length || profile.available_for_relocation !== null) && (
          <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
            <SectionHeading icon={Globe} title="Languages & mobility" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.languages_spoken && profile.languages_spoken.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Languages
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages_spoken.map(lang => (
                      <span
                        key={lang}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile.available_for_relocation !== null && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Relocation
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${profile.available_for_relocation
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400'
                    }`}>
                    <Truck className="w-3.5 h-3.5" />
                    {profile.available_for_relocation ? 'Open to relocation' : 'Not relocating'}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================
            HEALTH INFO (owner OR publicly shared)
            ============================================ */}
        {(profile.vaccinations?.length || profile.blood_type || profile.health_insurance_type) && (
          <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
            <SectionHeading icon={Heart} title="Health information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.blood_type && (
                <InfoRow label="Blood type" value={profile.blood_type} icon={Heart} tone="danger" />
              )}
              {profile.health_insurance_type && (
                <InfoRow label="Health insurance" value={profile.health_insurance_type} icon={Shield} tone="neutral" />
              )}
              {profile.vaccinations && profile.vaccinations.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Vaccinations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.vaccinations.map(v => (
                      <span
                        key={v}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1"
                      >
                        <Syringe className="w-3 h-3" />
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================
            EMERGENCY CONTACT (owner only)
            ============================================ */}
        {isOwner && (profile.emergency_contact_name || profile.emergency_contact_phone) && (
          <section className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-900">
            <SectionHeading icon={Heart} title="Emergency contact" />
            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
                Private — visible only to you
              </p>
              {profile.emergency_contact_name && (
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {profile.emergency_contact_name}
                </p>
              )}
              {profile.emergency_contact_phone && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                  {profile.emergency_contact_phone}
                </p>
              )}
            </div>
          </section>
        )}

        {/* ============================================
            FOOTER CTA (non-owner only) — SELLS THE APP
            ============================================ */}
        {!isOwner && (
          <section className="mt-12 pt-8 border-t border-slate-100 dark:border-zinc-900">
            <div className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-6 md:p-8 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg md:text-xl font-display font-bold text-slate-900 dark:text-white">
                Your career deserves its own home.
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-3 max-w-md mx-auto">
                Get a professional portfolio like this one. Free for every nurse and
                nursing student. Set up in ten minutes.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[48px]"
                >
                  Create your portfolio
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/explore"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white dark:bg-zinc-950 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
                >
                  Browse other nurses
                </Link>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

// ==========================================================
// SUBCOMPONENTS
// ==========================================================
const AvailabilityPill = React.memo<{ status?: string | null }>(({ status }) => {
  if (!status) return null;
  const map = {
    available: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      label: 'Available for hire',
    },
    open: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      label: 'Open to offers',
    },
    busy: {
      bg: 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400',
      dot: 'bg-slate-400',
      label: 'Not available',
    },
  } as const;
  const tone = map[status as keyof typeof map] || map.busy;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${tone.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  );
});
AvailabilityPill.displayName = 'AvailabilityPill';

const QuickStat = React.memo<{
  icon: any;
  value: number;
  label: string;
  tone: 'teal' | 'emerald' | 'amber' | 'indigo';
}>(({ icon: Icon, value, label, tone }) => {
  const tones = {
    teal: 'text-teal-600 dark:text-teal-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  };
  return (
    <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1.5 ${tones[tone]}`} />
      <p className="text-lg font-display font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">
        {value}
      </p>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  );
});
QuickStat.displayName = 'QuickStat';

const InfoRow = React.memo<{
  label: string;
  value: string;
  icon: any;
  tone: 'teal' | 'danger' | 'neutral';
  suffix?: string;
}>(({ label, value, icon: Icon, tone, suffix }) => {
  const toneStyles = {
    teal: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    neutral: 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400',
  };
  return (
    <div className="flex items-start gap-3">
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${toneStyles[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
          {value}
          {suffix && <span className="ml-2 text-xs text-rose-600 dark:text-rose-400 font-bold">{suffix}</span>}
        </p>
      </div>
    </div>
  );
});
InfoRow.displayName = 'InfoRow';

const StatTile = React.memo<{
  value: number | string;
  label: string;
  tone: 'teal' | 'indigo' | 'amber';
}>(({ value, label, tone }) => {
  const tones = {
    teal: 'text-teal-600 dark:text-teal-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3 text-center">
      <p className={`text-xl font-display font-extrabold ${tones[tone]} tabular-nums`}>
        {value}
      </p>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  );
});
StatTile.displayName = 'StatTile';

const EndorsementCard = React.memo<{ endorsement: EndorsementWithAuthor }>(
  ({ endorsement }) => {
    const name = endorsementAuthorName(endorsement);
    const author = endorsement.endorser;
    const initial = name.charAt(0).toUpperCase();
    const role = author?.qualification || author?.nursing_level || 'Nurse';

    return (
      <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          {author?.avatar_url ? (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800 flex-shrink-0">
              <img
                src={author.avatar_url}
                alt={name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {name}
              </p>
              {endorsement.specialty && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400">
                  {endorsement.specialty}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {role}
            </p>

            {endorsement.message && (
              <div className="mt-2.5 flex gap-2">
                <Quote className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  {endorsement.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
EndorsementCard.displayName = 'EndorsementCard';

// ==========================================================
// NOT FOUND
// ==========================================================
function ProfileNotFound({ username }: { username?: string }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mx-auto mb-5">
          <HelpCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">
          Profile not found
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          The profile <span className="font-semibold text-slate-700 dark:text-slate-300">@{username}</span> doesn't
          exist or hasn't been made public.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/explore"
            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[44px]"
          >
            Browse nurses
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[44px]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}