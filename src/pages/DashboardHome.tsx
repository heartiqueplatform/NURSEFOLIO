/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { supabase } from '../lib/supabase';
import {
  Eye, ArrowRight, ShieldAlert, Award, FileSpreadsheet, Palette,
  GraduationCap, Hospital, ExternalLink, ChevronRight, CheckCircle2,
  Star, UserCheck, Sparkles, TrendingUp, Flame, Target, Lock
} from 'lucide-react';

// ==========================================================
// TYPES
// ==========================================================
interface CombinedMilestone {
  type: 'experience' | 'education' | 'certification';
  title: string;
  subtitle: string;
  icon: any;
  bgSide: string;
  id: string;
}

interface Endorsement {
  id: string;
  endorser_id: string;
  profile_id: string;
  specialty: string;
  message: string;
  created_at: string;
  endorser_name?: string;
  endorser_avatar?: string;
  endorser_title?: string;
}

// ==========================================================
// RETENTION HELPERS
// ==========================================================

// Compute a "profile strength" score → drives the progress bar
function computeProfileStrength(user: any, profileData: any, milestoneCount: number, endorsementCount: number): {
  score: number;
  missing: string[];
} {
  const checks: Array<{ label: string; done: boolean; weight: number }> = [
    { label: 'Add a profile photo', done: !!user?.avatar_url, weight: 10 },
    { label: 'Write a bio', done: !!user?.bio && user.bio.length > 20, weight: 15 },
    { label: 'Add specialties', done: (profileData?.specialties?.length || 0) > 0, weight: 10 },
    { label: 'Verify your license', done: user?.verification_status === 'verified', weight: 25 },
    { label: 'Add work experience', done: milestoneCount > 0, weight: 15 },
    { label: 'Add education', done: milestoneCount > 1, weight: 10 },
    { label: 'Get your first endorsement', done: endorsementCount > 0, weight: 15 },
  ];

  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.filter(c => c.done).reduce((sum, c) => sum + c.weight, 0);
  const score = Math.round((earned / total) * 100);
  const missing = checks.filter(c => !c.done).map(c => c.label);

  return { score, missing };
}

// Next-best-action: one clear CTA ranked by impact
function computeNextAction(user: any, profileStrength: ReturnType<typeof computeProfileStrength>): {
  label: string;
  sublabel: string;
  to: string;
  icon: any;
  tone: 'urgent' | 'growth' | 'social';
} | null {
  if (user?.verification_status === 'unverified') {
    return {
      label: 'Verify your license',
      sublabel: 'Verified nurses appear 4× more in search',
      to: '/dashboard/settings',
      icon: ShieldAlert,
      tone: 'urgent',
    };
  }
  if (!user?.avatar_url) {
    return {
      label: 'Add a profile photo',
      sublabel: 'Profiles with photos get 3× more endorsements',
      to: '/dashboard/edit-profile',
      icon: Sparkles,
      tone: 'growth',
    };
  }
  if (profileStrength.score < 100 && profileStrength.missing[0]) {
    return {
      label: profileStrength.missing[0],
      sublabel: `You're ${profileStrength.score}% complete — finish your profile`,
      to: '/dashboard/edit-profile',
      icon: Target,
      tone: 'growth',
    };
  }
  return null;
}

// ==========================================================
// SUB-COMPONENTS
// ==========================================================

const ProgressBar = React.memo(({ value, tone = 'indigo' }: { value: number; tone?: 'indigo' | 'amber' | 'emerald' }) => {
  const tones = {
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
  };
  return (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${tones[tone]} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
});
ProgressBar.displayName = 'ProgressBar';

// ==========================================================
// MAIN
// ==========================================================
export default function DashboardHome() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<CombinedMilestone[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [endorsementsLoading, setEndorsementsLoading] = useState(true);
  const [realViewsCount, setRealViewsCount] = useState(0);
  const [realDownloadsCount, setRealDownloadsCount] = useState(0);
  const [weeklyViews, setWeeklyViews] = useState<number>(0);

  // ----------------------------------------------------------
  // DATA FETCH — with the N+1 bug fixed
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Batched parallel fetch — everything in one round trip
        const [
          exps,
          edus,
          certs,
          profileDetails,
          nurseSkills,
          endorsementsRaw,
          viewsRes,
          downloadsRes,
        ] = await Promise.all([
          databaseService.getExperiences(user.id),
          databaseService.getEducations(user.id),
          databaseService.getCertifications(user.id),
          databaseService.getProfileByUsername(user.username || ''),
          databaseService.getNurseSkills ? databaseService.getNurseSkills(user.id) : Promise.resolve([]),
          // ✅ FIXED: fetch endorsements AND their endorser profiles in ONE query
          // using Supabase foreign key joins instead of N+1 loop
          supabase
            .from('profile_endorsements')
            .select(`
                            id, endorser_id, profile_id, specialty, message, created_at,
                            endorser:profiles!endorser_id (
                                id, first_name, last_name, full_name, username,
                                avatar_url, qualification, nursing_level
                            )
                        `)
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase.from('profile_views').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
          supabase.from('cv_downloads').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
        ]);

        if (cancelled) return;

        setRealViewsCount(viewsRes.count || 0);
        setRealDownloadsCount(downloadsRes.count || 0);
        setProfileData(profileDetails);

        // Map joined endorsements
        if (endorsementsRaw.data) {
          const mapped: Endorsement[] = endorsementsRaw.data.map((e: any) => {
            const endorser = e.endorser;
            const name = endorser?.full_name && endorser.full_name !== 'null'
              ? endorser.full_name
              : endorser?.first_name
                ? `${endorser.first_name} ${endorser.last_name || ''}`.trim()
                : endorser?.username || 'A Colleague';
            return {
              id: e.id,
              endorser_id: e.endorser_id,
              profile_id: e.profile_id,
              specialty: e.specialty,
              message: e.message,
              created_at: e.created_at,
              endorser_name: name,
              endorser_avatar: endorser?.avatar_url,
              endorser_title: endorser?.qualification || endorser?.nursing_level || 'Healthcare Professional',
            };
          });
          setEndorsements(mapped);
        }
        setEndorsementsLoading(false);

        // Milestones
        const items: CombinedMilestone[] = [];

        (exps || []).slice(0, 2).forEach((exp: any) => {
          items.push({
            id: `exp-${exp.id}`,
            type: 'experience',
            title: exp.position || exp.title || 'Clinical Position',
            subtitle: `${exp.hospital_name || exp.facility || 'Healthcare Facility'}${exp.department ? ' • ' + exp.department : ''}`,
            icon: Hospital,
            bgSide: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
          });
        });

        (edus || []).slice(0, 2).forEach((edu: any) => {
          items.push({
            id: `edu-${edu.id}`,
            type: 'education',
            title: edu.course || edu.degree || 'Degree Program',
            subtitle: `${edu.institution || 'Academic Institution'}${edu.field_of_study ? ' · ' + edu.field_of_study : ''}`,
            icon: GraduationCap,
            bgSide: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400',
          });
        });

        (certs || []).slice(0, 1).forEach((cert: any) => {
          items.push({
            id: `cert-${cert.id}`,
            type: 'certification',
            title: cert.title || cert.name || 'Certification',
            subtitle: cert.issuer || cert.issuing_organization || 'Issuing Organization',
            icon: Award,
            bgSide: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
          });
        });

        setMilestones(items);

        // Skills
        if (nurseSkills && nurseSkills.length > 0) {
          setSkills(nurseSkills.map((s: any) => ({
            skill_name: s.skill_name,
            proficiency: s.proficiency,
          })));
        } else if (profileDetails?.specialties?.length) {
          setSkills(profileDetails.specialties);
        } else {
          setSkills([]);
        }

        // Weekly views for the delta signal
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { count: weeklyCount } = await supabase
          .from('profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', user.id)
          .gte('created_at', weekAgo);

        if (!cancelled) setWeeklyViews(weeklyCount || 0);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
        if (!cancelled) {
          setMilestones([]);
          setSkills([]);
          setEndorsements([]);
          setEndorsementsLoading(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => { cancelled = true; };
  }, [user?.id, user?.username]);

  // ----------------------------------------------------------
  // DERIVED
  // ----------------------------------------------------------
  const validThemes = ['modern', 'clinical', 'dark', 'minimal'];
  const currentTheme = user?.profile_theme && validThemes.includes(user.profile_theme)
    ? user.profile_theme
    : 'modern';

  const profileStrength = useMemo(
    () => computeProfileStrength(user, profileData, milestones.length, endorsements.length),
    [user, profileData, milestones.length, endorsements.length]
  );

  const nextAction = useMemo(
    () => computeNextAction(user, profileStrength),
    [user, profileStrength]
  );

  // The "hook" — proximity to next milestone
  const nextMilestone = useMemo(() => {
    const total = realViewsCount;
    const milestonesList = [10, 50, 100, 500, 1000, 5000];
    const next = milestonesList.find(m => m > total);
    if (!next) return null;
    const remaining = next - total;
    const progress = (total / next) * 100;
    return { next, remaining, progress };
  }, [realViewsCount]);

  if (!user) return null;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto md:px-4 md:py-6 pb-24">

        {/* ============================================
                    HERO — welcome + next best action
                    ============================================ */}
        <section className="px-4 md:px-0 pt-4 md:pt-0 pb-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900 dark:text-white leading-tight mt-1">
            {getGreeting()}, {user.first_name || 'Clinician'}
          </h1>

          {/* Next best action — the ONE thing to do next */}
          {nextAction && (
            <Link
              to={nextAction.to}
              className={`mt-4 flex items-center gap-3 p-3.5 rounded-2xl active:opacity-80 transition ${nextAction.tone === 'urgent'
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                : nextAction.tone === 'growth'
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                }`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${nextAction.tone === 'urgent'
                ? 'bg-amber-100 dark:bg-amber-900/50'
                : nextAction.tone === 'growth'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50'
                  : 'bg-emerald-100 dark:bg-emerald-900/50'
                }`}>
                <nextAction.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{nextAction.label}</p>
                <p className="text-xs opacity-80 mt-0.5 truncate">{nextAction.sublabel}</p>
              </div>
              <ArrowRight className="w-4 h-4 opacity-60 flex-shrink-0" />
            </Link>
          )}
        </section>

        {/* ============================================
                    PROFILE STRENGTH — progress scaffolding
                    ============================================ */}
        {profileStrength.score < 100 && (
          <section className="px-4 md:px-0 py-4 border-t border-slate-100 dark:border-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Profile strength
                </span>
              </div>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                {profileStrength.score}%
              </span>
            </div>
            <ProgressBar value={profileStrength.score} tone="indigo" />
            {profileStrength.missing[0] && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Next step:
                </span>{' '}
                {profileStrength.missing[0]}
              </p>
            )}
          </section>
        )}

        {/* ============================================
                    STATS ROW — 3 columns, flat
                    ============================================ */}
        <section className="grid grid-cols-3 border-t border-slate-100 dark:border-zinc-900">
          <StatTile
            icon={Eye}
            label="Views"
            value={realViewsCount}
            delta={weeklyViews > 0 ? `+${weeklyViews} this week` : null}
            tone="indigo"
          />
          <StatTile
            icon={FileSpreadsheet}
            label="Downloads"
            value={realDownloadsCount}
            tone="emerald"
          />
          <StatTile
            icon={UserCheck}
            label="Endorsements"
            value={endorsements.length}
            tone="amber"
          />
        </section>

        {/* ============================================
                    MILESTONE HOOK — proximity effect
                    ============================================ */}
        {nextMilestone && (
          <section className="px-4 md:px-0 py-4 border-t border-slate-100 dark:border-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {nextMilestone.remaining} views to {nextMilestone.next}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {realViewsCount} / {nextMilestone.next}
              </span>
            </div>
            <ProgressBar value={nextMilestone.progress} tone="emerald" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Share your profile link to hit this milestone faster.
            </p>
          </section>
        )}

        {/* ============================================
                    UNVERIFIED BANNER — only if not verified
                    ============================================ */}
        {user.verification_status !== 'verified' && (
          <section className="px-4 md:px-0 py-4 border-t border-slate-100 dark:border-zinc-900">
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                  {user.verification_status === 'pending'
                    ? 'Verification under review'
                    : 'Verify your license'}
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                  {user.verification_status === 'pending'
                    ? 'Audit admins are reviewing your license — usually under 1 business day.'
                    : 'Verified nurses are 4× more likely to appear in search results.'}
                </p>
                {user.verification_status === 'unverified' && (
                  <Link
                    to="/dashboard/settings"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-900 dark:text-amber-200 active:opacity-70"
                  >
                    Start verification
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ============================================
                    ENDORSEMENTS — social proof first
                    ============================================ */}
        <section className="px-4 md:px-0 py-4 border-t border-slate-100 dark:border-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Peer endorsements
              </h2>
              {endorsements.length > 0 && (
                <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  {endorsements.length}
                </span>
              )}
            </div>
            {endorsements.length > 3 && (
              <Link to="/dashboard/endorsements" className="text-xs font-bold text-amber-600 dark:text-amber-400 active:opacity-70">
                View all
              </Link>
            )}
          </div>

          {endorsementsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : endorsements.length > 0 ? (
            <div className="space-y-2">
              {endorsements.slice(0, 3).map((endorsement) => (
                <div
                  key={endorsement.id}
                  className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {endorsement.endorser_avatar ? (
                        <img
                          src={endorsement.endorser_avatar}
                          alt=""
                          loading="lazy"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        endorsement.endorser_name?.charAt(0) || 'P'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {endorsement.endorser_name}
                        </p>
                        {endorsement.specialty && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-1.5 py-0.5 rounded-full">
                            {endorsement.specialty}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {endorsement.endorser_title}
                      </p>
                      {endorsement.message && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2 italic">
                          "{endorsement.message}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-950/30 rounded-full flex items-center justify-center mb-3">
                <UserCheck className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                No endorsements yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Share your public profile to collect peer endorsements.
              </p>
              <Link
                to={`/nurse/${user.username || ''}`}
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 active:opacity-70"
              >
                View public page
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </section>

        {/* ============================================
                    MILESTONES / CV
                    ============================================ */}
        <section className="px-4 md:px-0 py-4 border-t border-slate-100 dark:border-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Career timeline
              </h2>
            </div>
            <Link
              to="/dashboard/experiences"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 active:opacity-70"
            >
              Manage
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-14 bg-slate-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
              <div className="h-14 bg-slate-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
            </div>
          ) : milestones.length > 0 ? (
            <div className="space-y-2">
              {milestones.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 items-center p-2 rounded-2xl active:bg-slate-100 dark:active:bg-zinc-900 transition"
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.bgSide}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No work or education added yet.
              </p>
              <Link
                to="/dashboard/experiences"
                className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 active:opacity-70"
              >
                Add your first milestone
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </section>

        {/* ============================================
                    SPECIALTIES (progress bars)
                    ============================================ */}
        {skills.length > 0 && (
          <section className="px-4 md:px-0 py-4 border-t border-slate-100 dark:border-zinc-900">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Top specialties
              </h2>
            </div>
            <div className="space-y-3">
              {skills.slice(0, 4).map((skill: any, index: number) => {
                const proficiencyMap: Record<string, number> = {
                  Beginner: 25,
                  Intermediate: 50,
                  Advanced: 75,
                  Expert: 100,
                };
                const percentage = proficiencyMap[skill.proficiency] || 50;
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                        {skill.skill_name}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {percentage}%
                      </span>
                    </div>
                    <ProgressBar value={percentage} tone="emerald" />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================
                    QUICK LINKS — 4 flat rows, iOS-Settings style
                    ============================================ */}
        <section className="px-4 md:px-0 py-4 border-t border-slate-100 dark:border-zinc-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Manage your profile
          </h2>
          <div className="space-y-0">
            <QuickLink
              to="/dashboard/edit-profile"
              icon={Award}
              label="Specialties & Biography"
              subtitle="Tags, bio, contact info"
            />
            <QuickLink
              to="/dashboard/experiences"
              icon={FileSpreadsheet}
              label="Clinical Hours & History"
              subtitle="Experience, education, certs"
            />
            <QuickLink
              to="/dashboard/theme"
              icon={Palette}
              label="Portfolio theme"
              subtitle="Colours, typography, banner"
            />
            <QuickLink
              to={`/nurse/${user.username || ''}`}
              icon={ExternalLink}
              label="View public page"
              subtitle="See what colleagues see"
              external
            />
          </div>
        </section>

        {/* ============================================
                    FOOTER SIGNAL — return cue
                    ============================================ */}
        <section className="px-4 md:px-0 py-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Flame className="w-3.5 h-3.5" />
            <span>
              Come back tomorrow to grow your streak
            </span>
          </div>
        </section>

      </div>
    </div>
  );
}

// ==========================================================
// SUB-COMPONENTS
// ==========================================================

const StatTile = React.memo<{
  icon: any;
  label: string;
  value: number;
  delta?: string | null;
  tone: 'indigo' | 'emerald' | 'amber';
}>(({ icon: Icon, label, value, delta, tone }) => {
  const toneStyles = {
    indigo: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="px-3 py-4 text-center border-r border-slate-100 dark:border-zinc-900 last:border-r-0">
      <Icon className={`w-4 h-4 mx-auto mb-1.5 ${toneStyles[tone]}`} />
      <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white leading-none">
        {value}
      </div>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
        {label}
      </p>
      {delta && (
        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
          {delta}
        </p>
      )}
    </div>
  );
});
StatTile.displayName = 'StatTile';

const QuickLink = React.memo<{
  to: string;
  icon: any;
  label: string;
  subtitle: string;
  external?: boolean;
}>(({ to, icon: Icon, label, subtitle, external }) => {
  const content = (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-zinc-900 active:bg-slate-100 dark:active:bg-zinc-900 transition rounded-none last:border-b-0">
      <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {label}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
    </div>
  );
  if (external) {
    return <a href={to}>{content}</a>;
  }
  return <Link to={to}>{content}</Link>;
});
QuickLink.displayName = 'QuickLink';

// ==========================================================
// HELPERS
// ==========================================================
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}