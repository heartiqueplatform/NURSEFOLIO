/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { StatsCard } from '../components/StatsCard';
import {
  BarChart3, Eye, Download, Search, ArrowRight,
  ShieldAlert, Award, FileSpreadsheet, Palette,
  GraduationCap, Briefcase, ExternalLink, ChevronRight, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CombinedMilestone {
  type: 'experience' | 'education' | 'certification';
  title: string;
  subtitle: string;
  icon: string;
  bgSide: string;
  id: string;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<CombinedMilestone[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

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
          nurseSkills
        ] = await Promise.all([
          databaseService.getExperiences(user.id),
          databaseService.getEducations(user.id),
          databaseService.getCertifications(user.id),
          databaseService.getProfileByUsername(user.username || ''),
          databaseService.getNurseSkills ? databaseService.getNurseSkills(user.id) : Promise.resolve([])
        ]);

        // Set profile data for bio, specialties, etc.
        setProfileData(profileDetails);

        // Build milestones from real data
        const items: CombinedMilestone[] = [];

        // Map experiences (max 2)
        if (exps && exps.length > 0) {
          exps.slice(0, 2).forEach(exp => {
            items.push({
              id: `exp-${exp.id}`,
              type: 'experience',
              title: exp.position || exp.title || 'Clinical Position',
              subtitle: `${exp.hospital_name || exp.facility || 'Healthcare Facility'}${exp.department ? ' • ' + exp.department : ''}`,
              icon: '🏥',
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
              icon: '🎓',
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
              icon: '📜',
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
  const viewsCount = profileData?.views_count || user?.views_count || 0;
  const downloadsCount = profileData?.downloads_count || user?.downloads_count || 0;

  return (
    <div className="space-y-2 font-sans">

      {/* Greetings block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white leading-tight">
            Welcome back, {user.first_name || 'Clinician'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Your clinical portfolio and credential networks are fully active this week.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-full flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <span>Search live index...</span>
            <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono">⌘K</span>
          </div>
        </div>
      </div>

      {/* Verification alerts if unverified */}
      {user.verification_status !== 'verified' && (
        <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {user.verification_status === 'pending' ? 'Verification Sent for Review' : 'Profile Credentials Unverified'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl font-medium leading-relaxed">
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
              className="px-4 py-2 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200/80 dark:hover:bg-amber-800/50 text-amber-900 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-200/30 dark:border-amber-700 whitespace-nowrap transition-colors"
            >
              Verify License Now
            </Link>
          )}
        </div>
      )}

      {/* Bento Grid Panel Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Hero Profile Cell */}
        <div className="md:col-span-8 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-[32px] p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-bl-[100px] -mr-4 -mt-4 -z-0"></div>

          <div className="z-10 flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white dark:border-zinc-800 ring-4 ring-slate-100 dark:ring-zinc-800">
              <img
                src={user.avatar_url || profileData?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                  {user.first_name || profileData?.first_name} {user.last_name || profileData?.last_name}
                </h2>
                {user.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                    <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>VERIFIED RN</span>
                  </span>
                )}
              </div>
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                {user.qualification || profileData?.qualification || user.nursing_level || profileData?.nursing_level || 'Registered ICU Clinician & Scholar'}
              </p>

              {/* Specialties from database */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {profileData?.specialties && profileData.specialties.length > 0 ? (
                  profileData.specialties.slice(0, 4).map((specialty: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-[10px] font-bold tracking-tight">
                      {specialty}
                    </span>
                  ))
                ) : skills.length > 0 ? (
                  skills.slice(0, 4).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-[10px] font-bold tracking-tight">
                      {skill.skill_name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 dark:text-zinc-500 italic">No specialties added yet</span>
                )}
              </div>
            </div>
          </div>

          <div className="z-10 mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 max-w-sm">
              <h4 className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Biography Summary</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed font-medium">
                {user.bio || profileData?.bio || 'Professional practicing clinician with a strong focus on clinical documentation, patient safety, and peer teaching portfolios.'}
              </p>
            </div>
            <a
              id="dashhome-hero-btn"
              href={`/nurse/${user.username || profileData?.username}`}
              className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center gap-1.5 transition-all self-end sm:self-auto"
            >
              <span>View Public Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* views count bento box */}
        <div className="md:col-span-4 bg-indigo-600 dark:bg-indigo-700 rounded-[32px] p-6 sm:p-8 text-white flex flex-col justify-between shadow-lg shadow-indigo-600/10 relative overflow-hidden min-h-[220px]">
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-2xl"></div>

          <div className="flex justify-between items-start z-10">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] bg-white/15 text-white tracking-widest uppercase rounded-md px-2.5 py-1 font-bold">
              MONTHLY TRAFFIC
            </span>
          </div>

          <div className="z-10 mt-4">
            <div className="text-4xl font-display font-bold leading-none">{viewsCount || 0}</div>
            <div className="text-indigo-150 text-xs font-semibold mt-1.5 flex items-center gap-1">
              <span>Portfolio view count</span>
            </div>
          </div>
        </div>

        {/* Milestones / Recent Achievements Box */}
        <div className="md:col-span-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-[32px] p-6 sm:p-8 shadow-sm shadow-slate-100/40 dark:shadow-zinc-900/40">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Key Milestones & Education</h3>
            <Link to="/dashboard/experiences" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center">
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3 py-2 animate-pulse">
                <div className="h-10 bg-slate-50 dark:bg-zinc-800 rounded-xl"></div>
                <div className="h-10 bg-slate-50 dark:bg-zinc-800 rounded-xl"></div>
              </div>
            ) : milestones.length > 0 ? (
              milestones.map((item) => (
                <div key={item.id} className="flex gap-4 items-center p-3 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent hover:border-slate-100 dark:hover:border-zinc-700 rounded-2xl transition-all">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${item.bgSide}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{item.title}</h4>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium truncate mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-2 text-center">
                <p className="text-slate-400 dark:text-zinc-500 text-xs">No work experience or degree items added yet.</p>
                <Link to="/dashboard/experiences" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-2 inline-block">
                  Add Milestones Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Skills Bento Progress Panel */}
        <div className="md:col-span-3 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-[32px] p-6 sm:p-8 shadow-sm">
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-6">
            Top Specialties
          </h3>

          <div className="space-y-2">
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
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      <span className="truncate max-w-[120px] dark:text-zinc-400">
                        {skill.skill_name}
                      </span>

                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {percentage}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bgColors[index] || 'bg-indigo-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic">
                No specialties added yet
              </p>
            )}
          </div>
        </div>
        {/* Theme Settings Cell */}
        <div className="md:col-span-3 bg-zinc-900 dark:bg-zinc-800 rounded-xl p-6 text-white flex flex-col justify-between shadow-lg h-full min-h-[260px]">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-300 dark:text-zinc-400">Theme Profile</h3>
              <Palette className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              <div
                className={`aspect-square bg-indigo-600 rounded-xl cursor-default border-2 ${currentTheme === 'modern' ? 'border-white shrink-0 scale-105' : 'border-transparent opacity-60'}`}
                title="Modern Indigo"
              ></div>
              <div
                className={`aspect-square bg-sky-500 rounded-xl cursor-default border-2 ${currentTheme === 'clinical' ? 'border-white shrink-0 scale-105' : 'border-transparent opacity-60'}`}
                title="Clinical Blue"
              ></div>
              <div
                className={`aspect-square bg-zinc-700 dark:bg-zinc-600 rounded-xl cursor-default border-2 ${currentTheme === 'dark' ? 'border-white shrink-0 scale-105' : 'border-transparent opacity-60'}`}
                title="Obsidian Dark"
              ></div>
              <div
                className={`aspect-square bg-emerald-600 rounded-xl cursor-default border-2 ${currentTheme === 'minimal' ? 'border-white shrink-0 scale-105' : 'border-transparent opacity-60'}`}
                title="Minimal Mint"
              ></div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/80 dark:border-zinc-700/80">
            <Link
              id="dashhome-theme-btn"
              to="/dashboard/theme"
              className="w-full py-2.5 bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold text-center block transition-all"
            >
              Configure Theme Layout
            </Link>
          </div>
        </div>

      </div>

      {/* Grid bottom fast links row */}
      <div className="space-y-4 pt-4">
        <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Direct Management Operations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          <Link
            id="shortcut-edit-prof"
            to="/dashboard/edit-profile"
            className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex items-start gap-4"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/40 dark:border-indigo-800">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm">Specialties & Biography</h4>
              <p className="text-slate-500 dark:text-zinc-400 text-xs">Update practicing tags, medical items or write bio statement.</p>
            </div>
          </Link>

          <Link
            id="shortcut-experiences"
            to="/dashboard/experiences"
            className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex items-start gap-4"
          >
            <div className="p-3 bg-indigo-55/10 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/20 dark:border-indigo-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm">Clinical Hours & History</h4>
              <p className="text-slate-500 dark:text-zinc-400 text-xs">Register nursing credentials, medical wards or degrees.</p>
            </div>
          </Link>

          <Link
            id="shortcut-theme"
            to="/dashboard/theme"
            className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex items-start gap-4"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/40 dark:border-indigo-800">
              <Palette className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm">Configure Portfolio Theme</h4>
              <p className="text-slate-500 dark:text-zinc-400 text-xs">Alter portfolio coloring schemes, typography, and banners.</p>
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}