/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { databaseService } from '../services/databaseService';
import { analyticsService } from '../services/analyticsService';
import { UserProfile } from '../types';
import { VerificationBadge } from '../components/VerificationBadge';
import { Search, MapPin, Briefcase, Filter, Sparkles, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Skeleton Card Component - responsive dimensions
const NurseCardSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 md:rounded-xl md:shadow-sm overflow-hidden flex flex-col justify-between border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60"
    >
      <div className="p-4 md:p-6">
        {/* Header Row - Avatar + Badge */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse"></div>
          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
        </div>

        {/* Basic Info */}
        <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2">
          <div className="h-4 md:h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 animate-pulse"></div>
          <div className="h-2.5 md:h-3 bg-indigo-100 dark:bg-indigo-900/50 rounded w-1/2 animate-pulse"></div>
        </div>

        {/* Bio Snippet */}
        <div className="mt-2 md:mt-3 space-y-1 md:space-y-1.5">
          <div className="h-2.5 md:h-3 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
          <div className="h-2.5 md:h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
          <div className="h-2.5 md:h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6 animate-pulse"></div>
        </div>

        {/* Specialties Tags */}
        <div className="flex flex-wrap gap-1 md:gap-1.5 mt-3 md:mt-4">
          <div className="h-4 md:h-5 w-14 md:w-16 bg-slate-200 dark:bg-slate-700 rounded-md md:rounded-lg animate-pulse"></div>
          <div className="h-4 md:h-5 w-16 md:w-20 bg-slate-200 dark:bg-slate-700 rounded-md md:rounded-lg animate-pulse"></div>
          <div className="h-4 md:h-5 w-12 md:w-14 bg-slate-200 dark:bg-slate-700 rounded-md md:rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Footer Block */}
      <div className="px-4 md:px-6 py-2.5 md:py-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-2.5 md:h-3 w-14 md:w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="h-2.5 md:h-3 w-10 md:w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="h-2.5 md:h-3 w-10 md:w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="h-2.5 md:h-3 w-6 md:w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>
    </motion.div>
  );
};

export default function ExploreNurses() {
  const [searchParams] = useSearchParams();
  const qSearch = searchParams.get('search') || '';
  const qSpecialty = searchParams.get('specialty') || '';

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState(qSearch);
  const [selectedSpecialty, setSelectedSpecialty] = useState(qSpecialty);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'nurse' | 'student'>('all');

  // Preview Drawer/Modal State
  const [activePreview, setActivePreview] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const data = await databaseService.getProfiles();
        setProfiles(data);
      } catch (err) {
        console.error('Failed to load profiles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  // Sync state with query parameters if they change
  useEffect(() => {
    if (qSearch) setSearchTerm(qSearch);
    if (qSpecialty) setSelectedSpecialty(qSpecialty);
  }, [qSearch, qSpecialty]);

  // Aggregate current specialties for quick dropdown
  const allSpecialties = Array.from(
    new Set(profiles.flatMap((p) => p.specialties || []))
  );

  // Aggregate locations for quick dropdown
  const allLocations = Array.from(
    new Set(profiles.map((p) => p.location).filter(Boolean) as string[])
  );

  // Filtered profiles selector logic
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.bio || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === '' ||
      (p.specialties || []).some(
        (s) => s.toLowerCase() === selectedSpecialty.toLowerCase()
      );

    const matchesLocation =
      selectedLocation === '' ||
      (p.location || '').toLowerCase() === selectedLocation.toLowerCase();

    const matchesVerification = !onlyVerified || p.verification_status === 'verified';

    const matchesRole = roleFilter === 'all' || p.role === roleFilter;

    return matchesSearch && matchesSpecialty && matchesLocation && matchesVerification && matchesRole;
  });

  return (
    <div className="w-full py-0 md:py-6">
      <div className="max-w-7xl mx-auto">

        {/* Page title header - compact on mobile */}
        <div className="flex flex-col mt-2 md:mt-2 md:flex-row md:items-end justify-between gap-2 md:gap-2 mb-4 md:mb-8 px-3 md:px-0">
          <div>
            <span className="text-[10px] md:text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-wider font-mono">
              Nurse Registry
            </span>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5 md:mt-2">
              Discover Certified Clinicians
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-0.5 md:mt-1">
              Verify licenses, specialties, and connect with peer leaders.
            </p>
          </div>
          <div className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 font-semibold bg-white dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 rounded-lg md:rounded-xl px-3 md:px-3.5 py-1 md:py-1.5 md:shadow-xs">
            Showing <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{filteredProfiles.length}</span> of {profiles.length}
          </div>
        </div>

        {/* Filter Toolbar Area - full width on mobile */}
        <div className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-slate-200/60 md:dark:border-zinc-800 p-3 md:p-6 md:shadow-sm mb-0 md:mb-8 space-y-3 md:space-y-4 border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">

            {/* Search Input bar */}
            <div className="md:col-span-4 relative">
              <div className="absolute inset-y-0 left-2.5 md:left-3 flex items-center text-slate-400 dark:text-slate-500">
                <Search className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
              <input
                id="search-input-field"
                type="text"
                placeholder="Search by name, tags, keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs md:text-sm pl-8 md:pl-10 pr-3 md:pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 transition"
              />
            </div>

            {/* Specialty filter dropdown */}
            <div className="md:col-span-3">
              <select
                id="specialty-dropdown-filter"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full text-xs md:text-sm px-2.5 md:px-3 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <option value="">All Specialties</option>
                {allSpecialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Location filter dropdown */}
            <div className="md:col-span-3">
              <select
                id="location-dropdown-filter"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full text-xs md:text-sm px-2.5 md:px-3 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <option value="">All Locations</option>
                {allLocations.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Role select list */}
            <div className="md:col-span-2">
              <select
                id="role-dropdown-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full text-xs md:text-sm px-2.5 md:px-3 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-700 dark:text-slate-300 transition font-semibold text-indigo-700 dark:text-indigo-400"
              >
                <option value="all">Everyone</option>
                <option value="nurse">Professionals Only</option>
                <option value="student">Graduate Students</option>
              </select>
            </div>
          </div>

          <div className="pt-2 md:pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 md:gap-4">
            {/* Checkbox verified */}
            <label className="inline-flex items-center gap-1.5 md:gap-2 cursor-pointer select-none">
              <input
                id="only-verified-cb"
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 md:w-4.5 md:h-4.5 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:ring-offset-0 dark:bg-slate-800"
              />
              <span className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-600 dark:text-indigo-400" />
                Only show verified profiles
              </span>
            </label>

            {/* Clear filters Button */}
            <button
              id="clear-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialty('');
                setSelectedLocation('');
                setOnlyVerified(false);
                setRoleFilter('all');
              }}
              className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Nurses List Container - feed on mobile, grid on desktop */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 md:gap-6 -mx-3 md:mx-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <NurseCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="md:bg-white md:dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 md:rounded-2xl p-8 md:p-16 text-center max-w-lg mx-auto md:shadow-sm">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-4 md:mb-6 border border-slate-100 dark:border-slate-700">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base md:text-lg">No Results Found</h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 md:mt-2 leading-relaxed">
              We couldn't find any nurse or nursing student matching those exact constraints. Try broadening your keywords.
            </p>
            <button
              id="zero-state-reset-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialty('');
                setSelectedLocation('');
                setOnlyVerified(false);
                setRoleFilter('all');
              }}
              className="mt-4 md:mt-6 px-3 md:px-4 py-2 rounded-lg md:rounded-xl text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 md:gap-6 -mx-3 md:mx-0">
            {filteredProfiles.map((p) => {
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={p.id}
                  className="bg-white dark:bg-zinc-950 md:border md:border-slate-200/60 md:dark:border-zinc-800 md:rounded-xl md:shadow-sm md:hover:shadow-md transition duration-300 overflow-hidden flex flex-col justify-between group border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60"
                >
                  <div className="p-4 md:p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <img
                        src={p.avatar_url || '/192.png'}
                        alt={p.username}
                        className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                      />
                      <VerificationBadge status={p.verification_status} showText={false} />
                    </div>

                    {/* Basic Info */}
                    <div className="mt-3 md:mt-4">
                      <h4 className="font-sans font-bold text-slate-900 dark:text-white text-sm md:text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {p.first_name} {p.last_name}
                      </h4>
                      <p className="text-[10px] md:text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 md:mt-1 font-mono uppercase tracking-tight">
                        {p.qualification || p.nursing_level || 'Nursing Colleague'}
                      </p>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-2 md:mt-3 leading-relaxed line-clamp-3 font-medium">
                      {p.bio || 'Professional nurse portfolio of this qualified healthcare team associate.'}
                    </p>

                    {/* Specialties List */}
                    <div className="flex flex-wrap gap-1 md:gap-1.5 mt-3 md:mt-4">
                      {(p.specialties || []).slice(0, 3).map((spec) => (
                        <span key={spec} className="text-[9px] md:text-[10px] bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold px-2 md:px-2.5 py-0.5 rounded-md md:rounded-lg">
                          {spec}
                        </span>
                      ))}
                      {(p.specialties || []).length > 3 && (
                        <span className="text-[9px] md:text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 px-2 md:px-2.5 py-0.5 rounded-md md:rounded-lg font-bold font-mono">
                          +{(p.specialties || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Footer Block */}
                  <div className="px-4 md:px-6 py-2.5 md:py-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] md:text-[11px] font-semibold">
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="flex items-center gap-0.5 md:gap-1">
                        <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400 dark:text-slate-500" />
                        {p.location || 'USA'}
                      </span>
                      <span className="flex items-center gap-0.5 md:gap-1">
                        <Briefcase className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400 dark:text-slate-500" />
                        {p.years_of_experience || 0} yrs
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2 text-xs font-bold">
                      <button
                        id={`explore-preview-${p.username}`}
                        onClick={async () => {
                          setActivePreview(p);
                          await analyticsService.recordProfileView(p.id);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer text-[10px] md:text-xs"
                      >
                        Preview
                      </button>
                      <span className="text-slate-200 dark:text-slate-700">|</span>
                      <Link
                        id={`explore-view-${p.username}`}
                        to={`/nurse/${p.username}`}
                        onClick={() => analyticsService.recordProfileView(p.id)}
                        className="text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 font-bold flex items-center gap-0.5 text-[10px] md:text-xs"
                      >
                        Hub
                        <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Profile quick preview Drawer/Modal - bottom sheet on mobile */}
      <AnimatePresence>
        {activePreview && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
            {/* Backdrop filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePreview(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-zinc-950/80 backdrop-blur-xs"
            ></motion.div>

            {/* Panel - bottom sheet on mobile, modal on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300
              }}
              className="bg-white dark:bg-zinc-950 md:rounded-[32px] rounded-t-[32px] overflow-hidden w-full md:max-w-sm relative shadow-xl md:border md:border-slate-200/60 md:dark:border-zinc-800 z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Colored header cover block fallback */}
              <div className="h-20 md:h-24 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-4 relative">
                {/* Drag handle for mobile */}
                <div className="md:hidden flex justify-center mb-2">
                  <div className="w-8 h-1 bg-white/20 rounded-full"></div>
                </div>
                <button
                  id="preview-panel-close"
                  onClick={() => setActivePreview(null)}
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition cursor-pointer"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-4 md:p-6 relative pt-8 md:pt-10">
                {/* Avatar positioning overlay */}
                <div className="absolute -top-8 md:-top-10 left-4 md:left-6">
                  <img
                    src={activePreview.avatar_url || '/192.png'}
                    alt="Quick preview avatar"
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl md:rounded-2xl border-3 md:border-4 border-white dark:border-slate-900 shadow-md bg-white dark:bg-zinc-950"
                  />
                </div>

                {/* Info block */}
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-lg md:text-xl font-display font-extrabold text-slate-900 dark:text-white">{activePreview.first_name} {activePreview.last_name}</h3>
                      <VerificationBadge status={activePreview.verification_status} showText={false} />
                    </div>
                    <p className="text-xs md:text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 md:mt-1">
                      {activePreview.qualification || activePreview.nursing_level || 'Nursing Student'}
                    </p>
                  </div>

                  <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {activePreview.bio || 'Excellent clinically active Nursefolio candidate profiles.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs border-y border-slate-100 dark:border-slate-800 py-2.5 md:py-3 mt-3 md:mt-4">
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px] md:text-[9px] font-mono">Location</span>
                      <span className="block text-slate-700 dark:text-slate-300 font-semibold mt-0.5 text-[10px] md:text-xs">{activePreview.location || 'USA'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px] md:text-[9px] font-mono">Role Grade</span>
                      <span className="block text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 capitalize text-[10px] md:text-xs">{activePreview.role}</span>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div>
                    <span className="block text-[9px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px] md:text-[9px] font-mono mb-1 md:mb-1.5">Focus Areas</span>
                    <div className="flex flex-wrap gap-1 md:gap-1.5">
                      {activePreview.specialties.map((spec) => (
                        <span key={spec} className="text-[9px] md:text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-400 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg font-bold">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 md:pt-4 flex gap-2 md:gap-3">
                    <button
                      id="preview-panel-dismiss"
                      onClick={() => setActivePreview(null)}
                      className="flex-1 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs md:text-sm font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <Link
                      id="preview-panel-view"
                      to={`/nurse/${activePreview.username}`}
                      className="flex-1 py-2 md:py-2.5 rounded-lg md:rounded-xl text-center text-white bg-indigo-600 hover:bg-indigo-700 text-xs md:text-sm font-extrabold transition shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      Visit Hub
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}