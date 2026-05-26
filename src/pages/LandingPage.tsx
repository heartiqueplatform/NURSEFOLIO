/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, Search, ShieldCheck, FileText,
  Palette, Smartphone, ArrowRight, HeartHandshake,
  Sun, Moon, MapPin, Briefcase, ChevronRight
} from 'lucide-react';

// --- IMPORTS FOR REAL DATA ---
import { databaseService } from '../services/databaseService';
import { UserProfile } from '../types';
import { VerificationBadge } from '../components/VerificationBadge';
import { useThemeMode } from '../contexts/ThemeContext';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { themeMode, toggleThemeMode } = useThemeMode();

  // --- REAL DATA STATES ---
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleProtectedAction = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/register');
  };

  useEffect(() => {
    const loadNurses = async () => {
      try {
        setLoading(true);
        const data = await databaseService.getProfiles();

        if (!data || data.length === 0) return;

        if (data.length < 10) {
          setProfiles([...data, ...data, ...data, ...data]);
        } else {
          setProfiles([...data, ...data]);
        }
      } catch (err) {
        console.error("Database error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadNurses();
  }, []);

  const goToRegister = () => navigate('/register');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 mt-16 overflow-hidden">

      {/* Theme Toggle Button - Fixed Position */}
      <button
        onClick={toggleThemeMode}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 p-2.5 md:p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-lg hover:shadow-xl transition-all cursor-pointer"
        title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {themeMode === 'dark' ? (
          <Sun className="w-4 h-4 md:w-5 md:h-5" />
        ) : (
          <Moon className="w-4 h-4 md:w-5 md:h-5" />
        )}
      </button>

      {/* Hero Section */}
      <div className="relative pt-6 md:pt-10 pb-16 md:pb-24 lg:pt-16 lg:pb-32 dark:bg-zinc-950">

        {/* Soft floating background orb */}
        <div className="absolute top-20 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-indigo-200/10 dark:bg-indigo-500/5 rounded-full blur-3xl -z-10 animate-pulse duration-[6000ms]"></div>
        <div className="absolute bottom-10 left-1/3 w-60 md:w-80 h-60 md:h-80 bg-indigo-100/10 dark:bg-indigo-400/5 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">

            {/* Left Column Information */}
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-7 lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] md:text-xs font-semibold border border-indigo-100/50 dark:border-indigo-800/50 mb-4 md:mb-6"
              >
                <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Verified Credentials & Portfolios for Healthcare Professionals</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]"
              >
                The premium portfolio and career space for{' '}
                <span className="text-indigo-600 dark:text-indigo-400">Nurses</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-3 md:mt-4 text-sm md:text-base lg:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-normal max-w-xl"
              >
                Build a stunning, shareable digital portfolio designed specifically for nursing boards, hospitals, and medical agencies. Share certifications, verified licenses, and clinical experience in minutes.
              </motion.p>

              {/* Quick Search and CTA */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6 md:mt-8 sm:max-w-lg sm:mx-auto lg:mx-0"
              >
                <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 bg-white dark:bg-zinc-950 p-1.5 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 md:focus-within:ring-4 focus-within:ring-indigo-100/50 transition-all">
                  <div className="hidden sm:flex pl-3 text-slate-400 dark:text-slate-500">
                    <Search className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <input
                    id="hero-search-input"
                    type="text"
                    placeholder="Search by specialty, location, or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 md:py-2 bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg sm:rounded-none"
                  />
                  <button
                    id="hero-submit-btn"
                    type="submit"
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl transition duration-200 shadow-sm whitespace-nowrap active:scale-[97%] cursor-pointer"
                  >
                    Find Nurses
                  </button>
                </form>

                <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs text-slate-400 dark:text-slate-500 pl-1 md:pl-2">
                  <span className="font-semibold">Popular Specialties:</span>
                  <Link to="/explore?specialty=Intensive%20Care" className="hover:text-indigo-600 dark:hover:text-indigo-400 underline">Critical Care</Link>
                  <Link to="/explore?specialty=Pediatrics" className="hover:text-indigo-600 dark:hover:text-indigo-400 underline">Pediatrics</Link>
                  <Link to="/explore?specialty=Gerontology" className="hover:text-indigo-600 dark:hover:text-indigo-400 underline">Geriatrics</Link>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Endless Vertical Marquee */}
            <div className="mt-8 md:mt-12 lg:mt-0 lg:col-span-5 relative">
              <div className="h-[400px] md:h-[500px] overflow-hidden relative rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-zinc-900/30">

                {/* Fade Effect */}
                <div className="absolute top-0 left-0 right-0 h-16 md:h-20 bg-gradient-to-b from-white dark:from-zinc-950 to-transparent z-10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-16 md:h-20 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent z-10"></div>

                {/* The Moving List */}
                <motion.div
                  animate={{ y: ["0%", "-50%"] }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="flex flex-col gap-3 md:gap-4 p-3 md:p-4"
                >
                  {profiles.map((p, index) => (
                    <div
                      key={index}
                      onClick={goToRegister}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm md:shadow-md cursor-pointer hover:border-indigo-400 transition-colors group w-full"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <img
                          src={p.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100'}
                          className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                          alt="Nurse"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate">
                              {p.first_name} {p.last_name}
                            </h4>
                            <VerificationBadge status={p.verification_status} showText={false} />
                          </div>
                          <p className="text-[8px] md:text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
                            {p.qualification || 'Verified Nurse'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 md:mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-slate-400 text-[9px] md:text-[10px]">
                          <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          {p.location || 'USA'}
                        </div>
                        <span className="text-[9px] md:text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 md:px-2 py-0.5 rounded-md">
                          View Profile
                        </span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Showcase Grid Section */}
      <section className="py-12 md:py-16 lg:py-24 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
              Professional features designed for digital medicine
            </h2>
            <p className="mt-1.5 md:mt-2 text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Unlike generic social networks, Nursefolio respects medical certifications, licensing states, and clinical research credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-zinc-950 md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:rounded-2xl md:shadow-sm md:hover:shadow-md transition border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 md:mb-6">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm md:text-base mb-0.5 md:mb-1">Board Verification</h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Add state board licenses or clinical IDs. Once verified, get a badged profile status trusted by acute care centers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-zinc-950 md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:rounded-2xl md:shadow-sm md:hover:shadow-md transition border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 md:mb-6">
                <Palette className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm md:text-base mb-0.5 md:mb-1 font-sans">Multi-theme Portfolios</h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Choose from clinical, modern, minimal, dark or academic formats to match your career pathway.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-zinc-950 md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:rounded-2xl md:shadow-sm md:hover:shadow-md transition border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4 md:mb-6">
                <FileText className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm md:text-base mb-0.5 md:mb-1">Auto-generated CV</h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Input your credentials and download matching PDF style resumes automatically optimized for clinical review teams.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-zinc-950 md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:rounded-2xl md:shadow-sm md:hover:shadow-md transition border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 md:mb-6">
                <Smartphone className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm md:text-base mb-0.5 md:mb-1">Android Ready</h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Optimized mobile designs that wrap smoothly into native APKs using Capacitor. Take your portfolio on medical rounds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Roles segment */}
      <section className="py-12 md:py-16 lg:py-20 bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 lg:gap-12 items-stretch">

            {/* Registered Nurses section */}
            <div className="p-5 md:p-8 rounded-xl md:rounded-xl bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50 flex flex-col justify-between h-full">
              <div>
                <HeartHandshake className="w-8 h-8 md:w-10 md:h-10 text-indigo-600 dark:text-indigo-400 mb-4 md:mb-6" />
                <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white mb-1.5 md:mb-2">For Licensed Professionals</h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 md:mb-6">
                  Perfect for RNs, FNPs, LPNs, and clinical nurse specialists. Aggregate hospital experiences, showcase published health studies, list active ACLS, PALS certifications, and keep recruiters updated on your availability.
                </p>
              </div>
              <Link
                id="cta-professional-btn"
                to="/register?role=nurse"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 md:px-5 py-2.5 md:py-3 rounded-lg md:rounded-xl hover:shadow transition"
              >
                <span>Professional Portfolio SignUp</span>
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Link>
            </div>

            {/* Students section */}
            <div className="p-5 md:p-8 rounded-xl md:rounded-xl bg-indigo-50/10 dark:bg-indigo-950/10 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between h-full">
              <div>
                <Activity className="w-8 h-8 md:w-10 md:h-10 text-indigo-400 dark:text-indigo-400 mb-4 md:mb-6" />
                <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white mb-1.5 md:mb-2">For Nursing Students</h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 md:mb-6">
                  Start mapping your clinical hours, NCLEX preparations, clinical rotations, externships, and school grades. Earn early verification points prior to graduation to give you an upper hand in placement cycles.
                </p>
              </div>
              <Link
                id="cta-student-btn"
                to="/register?role=student"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 md:px-5 py-2.5 md:py-3 rounded-lg md:rounded-xl hover:shadow transition"
              >
                <span>Student Portfolio SignUp</span>
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Trust & CTA Section */}
      <section className="bg-slate-900 dark:bg-zinc-950 text-white py-12 md:py-16 lg:py-24 relative overflow-hidden">
        {/* Soft grid decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] md:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>

        <div className="relative max-w-5xl mx-auto px-3 md:px-4 text-center sm:px-6 lg:px-8 space-y-4 md:space-y-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            Begin presenting your nursing career professionally today
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Join other nurses and student nurse practitioners in digitizing medical CVs, earning verified trust credentials, and sharing career experiences easily.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 pt-2 md:pt-4">
            <Link
              id="cta-trust-signup"
              to="/register"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 font-bold px-6 md:px-8 py-3 md:py-3.5 rounded-lg md:rounded-xl text-white text-sm hover:shadow-lg transition cursor-pointer select-none text-center"
            >
              Build My Nursefolio
            </Link>
            <Link
              id="cta-trust-explore"
              to="/explore"
              className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 rounded-lg md:rounded-xl border border-slate-700 dark:border-slate-700 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-200 hover:text-white text-sm font-semibold transition text-center"
            >
              Explore Registered Specialists
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}