/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { supabase } from '../lib/supabase'; // <--- We need this to talk to the database directly
import { StatsCard } from '../components/StatsCard';
import {
  BarChart3, Eye, Download, Search, ArrowRight,
  ShieldAlert, Award, FileSpreadsheet, Palette,
  GraduationCap, Hospital, Briefcase, ExternalLink, ChevronRight, CheckCircle2, Star, UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
interface CombinedMilestone {
  type: 'experience' | 'education' | 'certification';
  title: string;
  subtitle: string;
  icon: any; // Changed from string to any
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
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) return;
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [
          exps,
          edus,
          certs,
          profileDetails,
          nurseSkills,
          endorsementsData,
          viewsRes,      // Added this
          downloadsRes   // Added this
        ] = await Promise.all([
          databaseService.getExperiences(user.id),
          databaseService.getEducations(user.id),
          databaseService.getCertifications(user.id),
          databaseService.getProfileByUsername(user.username || ''),
          databaseService.getNurseSkills ? databaseService.getNurseSkills(user.id) : Promise.resolve([]),
          databaseService.getProfileEndorsements ? databaseService.getProfileEndorsements(user.id) : Promise.resolve([]),
          supabase.from('profile_views').select('*', { count: 'exact', head: true }).eq('profile_id', user.id), // Fetch real views
          supabase.from('cv_downloads').select('*', { count: 'exact', head: true }).eq('profile_id', user.id)   // Fetch real downloads
        ]);

        // Put the real numbers into your state
        setRealViewsCount(viewsRes.count || 0);
        setRealDownloadsCount(downloadsRes.count || 0);

        // Set profile data for bio, specialties, etc.
        setProfileData(profileDetails);

        // Process endorsements with endorser info
        if (endorsementsData && endorsementsData.length > 0) {
          // Fetch endorser details for each endorsement
          const endorsementsWithDetails = await Promise.all(
            endorsementsData.map(async (endorsement: any) => {
              try {
                const endorserProfile = await databaseService.getProfileById(endorsement.endorser_id);
                return {
                  ...endorsement,
                  endorser_name: endorserProfile?.first_name && endorserProfile?.last_name
                    ? `${endorserProfile.first_name} ${endorserProfile.last_name}`
                    : endorserProfile?.username || 'A Colleague',
                  endorser_avatar: endorserProfile?.avatar_url,
                  endorser_title: endorserProfile?.qualification || endorserProfile?.nursing_level || 'Healthcare Professional'
                };
              } catch (err) {
                console.error('Error fetching endorser details:', err);
                return {
                  ...endorsement,
                  endorser_name: 'A Colleague',
                  endorser_title: 'Healthcare Professional'
                };
              }
            })
          );
          setEndorsements(endorsementsWithDetails);
        }
        setEndorsementsLoading(false);

        // Build milestones from real data
        const items: CombinedMilestone[] = [];


        // ... inside your function ...

        // Map experiences (max 2)
        if (exps && exps.length > 0) {
          exps.slice(0, 2).forEach(exp => {
            items.push({
              id: `exp-${exp.id}`,
              type: 'experience',
              title: exp.position || exp.title || 'Clinical Position',
              subtitle: `${exp.hospital_name || exp.facility || 'Healthcare Facility'}${exp.department ? ' • ' + exp.department : ''}`,
              icon: Hospital, // Changed from '🏥'
              bgSide: 'bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-100 dark:border-amber-800',
            });
          });
        }

        // Map educations (max 2)
        if (edus && edus.length > 0) {
          edus.slice(0, 2).forEach(edu => {
            items.push({
              id: `edu-${edu.id}`,
              type: 'education',
              title: edu.course || edu.degree || 'Degree Program',
              subtitle: `${edu.institution || 'Academic Institution'}${edu.field_of_study ? ' • ' + edu.field_of_study : ''}`,
              icon: GraduationCap, // Changed from '🎓'
              bgSide: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 border border-indigo-100/40 dark:border-indigo-800',
            });
          });
        }

        // Map certifications (max 1)
        if (certs && certs.length > 0) {
          certs.slice(0, 1).forEach(cert => {
            items.push({
              id: `cert-${cert.id}`,
              type: 'certification',
              title: cert.title || cert.name || 'Certification',
              subtitle: cert.issuer || cert.issuing_organization || 'Issuing Organization',
              icon: Award, // Changed from '📜'
              bgSide: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800',
            });
          });
        }
        setMilestones(items);

        // Fetch skills from nurse_skills table or use specialties from profile
        if (nurseSkills && nurseSkills.length > 0) {
          setSkills(nurseSkills.map((s: any) => ({
            skill_name: s.skill_name,
            proficiency: s.proficiency
          })));
        } else if (profileDetails?.specialties && profileDetails.specialties.length > 0) {
          setSkills(profileDetails.specialties);
        } else {
          setSkills([]);
        }

      } catch (err) {
        console.error('Error fetching dashboard milestones', err);
        // Set empty arrays to avoid undefined errors
        setMilestones([]);
        setSkills([]);
        setEndorsements([]);
        setEndorsementsLoading(false);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user?.id, user?.username]);

  // Validate theme preference
  const validThemes = ['modern', 'clinical', 'dark', 'minimal'];
  const currentTheme = user?.profile_theme && validThemes.includes(user.profile_theme)
    ? user.profile_theme
    : 'modern';

  if (!user) return null;

  // Calculate views from profile data or user object
  // Use the real-time counts we just fetched from the database
  const viewsCount = realViewsCount;
  const downloadsCount = realDownloadsCount;
  const endorsementsCount = endorsements.length;
  return (
    <div className="space-y-0 md:space-y-2 font-sans">

      {/* Greetings block - compact on mobile */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center px-0 md:px-0 py-2 md:py-0">
        <div className="space-y-0.5">
          <h1 className="text-xl md:text-3xl font-display font-bold text-slate-900 dark:text-white leading-tight">
            Welcome back, {user.first_name || 'Clinician'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">
            Your clinical portfolio and credential networks are fully active this week.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-full flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <span>Search live index...</span>
            <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono">⌘K</span>
          </div>
        </div>
      </div>

      {/* Verification alerts if unverified - full width on mobile */}
      {user.verification_status !== 'verified' && (
        <div className="bg-amber-50/60 dark:bg-amber-950/30 border-t border-b md:border md:border-amber-200/50 md:dark:border-amber-800/50 md:rounded-2xl p-3 md:p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 -mx-3 md:mx-0">
          <div className="flex items-start gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="space-y-0.5 md:space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm">
                {user.verification_status === 'pending' ? 'Verification Sent for Review' : 'Profile Credentials Unverified'}
              </h4>
              <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 max-w-xl font-medium leading-relaxed">
                {user.verification_status === 'pending'
                  ? "Audit admins are reviewing your practicing licenses or board registrations. Verification resolves in under one business day."
                  : "Upload license numbers or graduation files to claim a Verified Practitioner badge. Verified nurses are prioritized in clinical searches."}
              </p>
            </div>
          </div>
          {user.verification_status === 'unverified' && (
            <Link
              id="dashhome-verify-link"
              to="/dashboard/settings"
              className="px-3 md:px-4 py-1.5 md:py-2 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200/80 dark:hover:bg-amber-800/50 text-amber-900 dark:text-amber-300 font-bold text-[10px] md:text-xs rounded-lg md:rounded-xl border border-amber-200/30 dark:border-amber-700 whitespace-nowrap transition-colors w-full sm:w-auto text-center"
            >
              Verify License Now
            </Link>
          )}
        </div>
      )}

      {/* Bento Grid Panel Area - feed on mobile, grid on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 -mx-3 md:mx-0">

        {/* Hero Profile Cell - full width feed on mobile */}
        <div className="md:col-span-8 bg-white dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 md:rounded-[32px] p-4 md:p-6 md:shadow-sm relative overflow-hidden flex flex-col justify-between border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60">
          <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-bl-[80px] md:rounded-bl-[100px] -mr-4 -mt-4 -z-0"></div>

          <div className="z-10 flex flex-col sm:flex-row gap-4 md:gap-6 items-start">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden shadow-lg border-2 border-white dark:border-zinc-800 ring-4 ring-slate-100 dark:ring-zinc-800">
              <img
                src={user.avatar_url || profileData?.avatar_url || '/192.png'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg md:text-2xl font-display font-bold text-slate-900 dark:text-white">
                  {user.first_name || profileData?.first_name} {user.last_name || profileData?.last_name}
                </h2>
                {user.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                    <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>VERIFIED RN</span>
                  </span>
                )}
              </div>
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs md:text-sm">
                {user.qualification || profileData?.qualification || user.nursing_level || profileData?.nursing_level || 'Registered ICU Clinician & Scholar'}
              </p>

              {/* Specialties from database */}
              <div className="flex flex-wrap gap-1 md:gap-1.5 pt-1.5">
                {profileData?.specialties && profileData.specialties.length > 0 ? (
                  profileData.specialties.slice(0, 4).map((specialty: string, idx: number) => (
                    <span key={idx} className="px-2 md:px-2.5 py-0.5 md:py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-md md:rounded-lg text-[9px] md:text-[10px] font-bold tracking-tight">
                      {specialty}
                    </span>
                  ))
                ) : skills.length > 0 ? (
                  skills.slice(0, 4).map((skill, idx) => (
                    <span key={idx} className="px-2 md:px-2.5 py-0.5 md:py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-md md:rounded-lg text-[9px] md:text-[10px] font-bold tracking-tight">
                      {skill.skill_name}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] md:text-xs text-slate-400 dark:text-zinc-500 italic">No specialties added yet</span>
                )}
              </div>
            </div>
          </div>

          <div className="z-10 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
            <div className="flex-1 max-w-sm">
              <h4 className="text-[9px] md:text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Biography Summary</h4>
              <p className="text-[11px] md:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 md:mt-1 line-clamp-2 leading-relaxed font-medium">
                {user.bio || profileData?.bio || 'Professional practicing clinician with a strong focus on clinical documentation, patient safety, and peer teaching portfolios.'}
              </p>
            </div>
            <a
              id="dashhome-hero-btn"
              href={`/nurse/${user.username || profileData?.username}`}
              className="w-full sm:w-auto px-4 md:px-5 py-2 md:py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg md:rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 transition-all"
            >
              <span>View Public Page</span>
              <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </a>
          </div>
        </div>

        {/* views count bento box - full width on mobile */}
        <div className="md:col-span-4 bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 md:rounded-[32px] p-4 md:p-6 text-white flex flex-row md:flex-col justify-between md:justify-between items-center md:items-stretch shadow-lg shadow-indigo-600/10 relative overflow-hidden border-b border-indigo-500/20 md:border-b-0">
          <div className="absolute top-0 right-0 w-32 md:w-44 h-32 md:h-44 bg-white/5 rounded-full blur-2xl"></div>

          <div className="flex md:flex-col md:justify-between md:h-full items-center md:items-start gap-4 md:gap-0 z-10 w-full">
            <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-0">
              <div className="p-2 md:p-3 bg-white/10 rounded-lg md:rounded-2xl border border-white/10">
                <Eye className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-[9px] md:text-[10px] bg-white/15 text-white tracking-widest uppercase rounded-md px-2 py-0.5 md:px-2.5 md:py-1 font-bold md:mt-4 md:self-start">
                MONTHLY TRAFFIC
              </span>
            </div>

            <div className="text-right md:text-left">
              <div className="text-2xl md:text-4xl font-display font-bold leading-none">{viewsCount || 0}</div>
              <div className="text-indigo-150 text-[10px] md:text-xs font-semibold mt-0.5 md:mt-1.5 flex items-center gap-1 justify-end md:justify-start">
                <span>Portfolio view count</span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones / Recent Achievements Box - feed style on mobile */}
        <div className="md:col-span-5 bg-white dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 md:rounded-[32px] p-4 md:p-6 md:shadow-sm shadow-slate-100/40 dark:shadow-zinc-900/40 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm md:text-base">Key Milestones & Education</h3>
            <Link to="/dashboard/experiences" className="text-[10px] md:text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center">
              <span>Manage</span>
              <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </Link>
          </div>

          <div className="space-y-2 md:space-y-4">
            {loading ? (
              <div className="space-y-2 md:space-y-3 py-1 animate-pulse">
                <div className="h-8 md:h-10 bg-slate-50 dark:bg-zinc-800 rounded-lg md:rounded-xl"></div>
                <div className="h-8 md:h-10 bg-slate-50 dark:bg-zinc-800 rounded-lg md:rounded-xl"></div>
              </div>
            ) : milestones.length > 0 ? (
              milestones.map((item) => {
                // 1. Create a Capitalized reference to the icon component
                const Icon = item.icon;

                return (
                  <div key={item.id} className="flex gap-3 md:gap-4 items-center p-2 md:p-3 hover:bg-slate-50 dark:hover:bg-zinc-800 md:border md:border-transparent md:hover:border-slate-100 md:dark:hover:border-zinc-700 rounded-xl md:rounded-2xl transition-all">
                    <div className={`w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${item.bgSide}`}>
                      {/* 2. Render it as a component tag */}
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm truncate">{item.title}</h4>
                      <p className="text-[10px] md:text-xs text-slate-400 dark:text-zinc-500 font-medium truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-2 text-center">
                <p className="text-slate-400 dark:text-zinc-500 text-[11px] md:text-xs">No work experience or degree items added yet.</p>
                <Link to="/dashboard/experiences" className="text-[10px] md:text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-1 md:mt-2 inline-block">
                  Add Milestones Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Endorsements Panel - New! */}
        <div className="md:col-span-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 md:border md:border-amber-200/60 md:dark:border-amber-800/40 md:rounded-[32px] p-4 md:p-6 md:shadow-sm border-b border-amber-100 dark:border-amber-800/30 md:border-b md:border-amber-200/60">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <UserCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              </div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm md:text-base">Peer Endorsements</h3>
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full">
              {endorsementsCount}
            </span>
          </div>

          <div className="space-y-3 md:space-y-4">
            {endorsementsLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-16 bg-white/50 dark:bg-white/5 rounded-xl"></div>
                <div className="h-16 bg-white/50 dark:bg-white/5 rounded-xl"></div>
              </div>
            ) : endorsements.length > 0 ? (
              endorsements.slice(0, 3).map((endorsement) => (
                <div key={endorsement.id} className="bg-white/60 dark:bg-zinc-900/40 rounded-xl p-3 md:p-4 hover:shadow-md transition-all border border-amber-200/40 dark:border-amber-800/30">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {endorsement.endorser_name?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm truncate">
                          {endorsement.endorser_name}
                        </h4>
                        <span className="text-[9px] md:text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded-full">
                          {endorsement.specialty || 'Clinical Skill'}
                        </span>
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                        {endorsement.message || `Endorsed your expertise in ${endorsement.specialty || 'clinical practice'}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500">Endorsement</span>
                        </div>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                          {new Date(endorsement.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 md:py-8">
                <div className="w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-3">
                  <UserCheck className="w-6 h-6 text-amber-400 dark:text-amber-500" />
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-xs md:text-sm">No endorsements yet</p>
                <p className="text-slate-400 dark:text-zinc-500 text-[10px] md:text-xs mt-1">Share your profile to receive peer endorsements</p>
              </div>
            )}

            {endorsementsCount > 3 && (
              <Link
                to="/dashboard/endorsements"
                className="block text-center text-[10px] md:text-xs text-amber-700 dark:text-amber-400 font-bold hover:underline mt-2"
              >
                View all {endorsementsCount} endorsements →
              </Link>
            )}
          </div>
        </div>

        {/* Skills Bento Progress Panel - full width on mobile */}
        <div className="md:col-span-3 bg-white dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 md:rounded-[32px] p-4 md:p-6 md:shadow-sm border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60">
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm md:text-base mb-4 md:mb-6">
            Top Specialties
          </h3>

          <div className="space-y-1.5 md:space-y-2">
            {skills.length > 0 ? (
              skills.slice(0, 4).map((skill: any, index) => {
                const proficiencyMap: any = {
                  Beginner: 25,
                  Intermediate: 50,
                  Advanced: 75,
                  Expert: 100
                };

                const percentage = proficiencyMap[skill.proficiency] || 50;

                const bgColors = [
                  'bg-emerald-500',
                  'bg-indigo-500',
                  'bg-sky-500',
                  'bg-indigo-600'
                ];

                return (
                  <div key={index} className="space-y-0.5 md:space-y-1">
                    <div className="flex justify-between items-center text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      <span className="truncate max-w-[120px] dark:text-zinc-400">
                        {skill.skill_name}
                      </span>
                      <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-zinc-400">
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 md:h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bgColors[index] || 'bg-indigo-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] md:text-xs text-slate-400 dark:text-zinc-500 italic">
                No specialties added yet
              </p>
            )}
          </div>
        </div>

        {/* Theme Settings Cell - full width on mobile */}
        <div className="md:col-span-3 bg-white dark:bg-zinc-900 md:rounded-xl p-4 md:p-6 text-slate-800 dark:text-white flex flex-col justify-between shadow-lg border-t md:border md:border-slate-200 dark:border-zinc-800 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200 h-full md:min-h-[260px]">
          <div>
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-bold font-display uppercase tracking-wider text-slate-500 dark:text-zinc-400">Theme Profile</h3>
              <Palette className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500 dark:text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            <div className="grid grid-cols-4 gap-1.5 md:gap-2 mt-3 md:mt-4">
              <div
                className={`aspect-square bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg md:rounded-xl cursor-default transition-all duration-200 ${currentTheme === 'modern'
                  ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-teal-500 scale-105 shadow-lg'
                  : 'opacity-60 hover:opacity-80'
                  }`}
                title="Modern Premium"
              ></div>
              <div
                className={`aspect-square bg-gradient-to-br from-blue-500 to-sky-400 rounded-lg md:rounded-xl cursor-default transition-all duration-200 ${currentTheme === 'clinical'
                  ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-blue-500 scale-105 shadow-lg'
                  : 'opacity-60 hover:opacity-80'
                  }`}
                title="Clinical Clean"
              ></div>
              <div
                className={`aspect-square bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 rounded-lg md:rounded-xl cursor-default transition-all duration-200 ${currentTheme === 'dark'
                  ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-slate-600 scale-105 shadow-lg'
                  : 'opacity-60 hover:opacity-80'
                  }`}
                title="Obsidian Night"
              ></div>
              <div
                className={`aspect-square bg-gradient-to-br from-stone-400 to-stone-600 dark:from-stone-500 dark:to-stone-700 rounded-lg md:rounded-xl cursor-default transition-all duration-200 ${currentTheme === 'minimal'
                  ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-stone-500 scale-105 shadow-lg'
                  : 'opacity-60 hover:opacity-80'
                  }`}
                title="Sleek Minimal"
              ></div>
            </div>
          </div>

          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-200 dark:border-zinc-800">
            <Link
              id="dashhome-theme-btn"
              to="/dashboard/theme"
              className="w-full py-2 md:py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold text-center block transition-all"
            >
              Customize Theme Settings
            </Link>
          </div>
        </div>

      </div>

      {/* Grid bottom fast links row - stacked on mobile, grid on desktop */}
      <div className="space-y-3 md:space-y-4 pt-2 md:pt-4">
        <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm md:text-base px-0">Direct Management Operations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-0 md:gap-6 -mx-3 md:mx-0">

          <Link
            id="shortcut-edit-prof"
            to="/dashboard/edit-profile"
            className="bg-white dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 md:rounded-xl p-3 md:p-5 hover:border-indigo-300 dark:hover:border-indigo-700 md:hover:shadow-md transition-all flex items-start gap-3 md:gap-4 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60"
          >
            <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg md:rounded-xl border border-indigo-100/40 dark:border-indigo-800">
              <Award className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs md:text-sm">Specialties & Biography</h4>
              <p className="text-slate-500 dark:text-zinc-400 text-[10px] md:text-xs">Update practicing tags, medical items or write bio statement.</p>
            </div>
          </Link>

          <Link
            id="shortcut-experiences"
            to="/dashboard/experiences"
            className="bg-white dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 md:rounded-xl p-3 md:p-5 hover:border-indigo-300 dark:hover:border-indigo-700 md:hover:shadow-md transition-all flex items-start gap-3 md:gap-4 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60"
          >
            <div className="p-2 md:p-3 bg-indigo-55/10 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg md:rounded-xl border border-indigo-100/20 dark:border-indigo-800">
              <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs md:text-sm">Clinical Hours & History</h4>
              <p className="text-slate-500 dark:text-zinc-400 text-[10px] md:text-xs">Register nursing credentials, medical wards or degrees.</p>
            </div>
          </Link>

          <Link
            id="shortcut-endorsements"
            to="/explore"
            className="bg-white dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 md:rounded-xl p-3 md:p-5 hover:border-amber-300 dark:hover:border-amber-700 md:hover:shadow-md transition-all flex items-start gap-3 md:gap-4 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60"
          >
            <div className="p-2 md:p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg md:rounded-xl border border-amber-100/40 dark:border-amber-800">
              <UserCheck className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs md:text-sm">Peer Endorsements</h4>
              <p className="text-slate-500 dark:text-zinc-400 text-[10px] md:text-xs">View and manage endorsements from colleagues.</p>
            </div>
          </Link>

          <Link
            id="shortcut-theme"
            to="/dashboard/theme"
            className="bg-white dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 md:rounded-xl p-3 md:p-5 hover:border-indigo-300 dark:hover:border-indigo-700 md:hover:shadow-md transition-all flex items-start gap-3 md:gap-4 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60"
          >
            <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg md:rounded-xl border border-indigo-100/40 dark:border-indigo-800">
              <Palette className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs md:text-sm">Configure Portfolio Theme</h4>
              <p className="text-slate-500 dark:text-zinc-400 text-[10px] md:text-xs">Alter portfolio coloring schemes, typography, and banners.</p>
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}