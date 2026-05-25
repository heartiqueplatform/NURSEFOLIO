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
    <div className="bg-slate-50/50 dark:bg-slate-950/50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page title header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
              Nurse Registry
            </span>
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
              Discover Certified Clinicians
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Verify licenses, specialties, and connect with peer leaders or nursing students.
            </p>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl px-3.5 py-1.5 shadow-xs">
            Showing <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{filteredProfiles.length}</span> of {profiles.length} available members
          </div>
        </div>

        {/* Filter Toolbar Area */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800 p-4 sm:p-6 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

            {/* Search Input bar */}
            <div className="md:col-span-4 relative">
              <div className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-input-field"
                type="text"
                placeholder="Search by name, tags, keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 transition"
              />
            </div>

            {/* Specialty filter dropdown */}
            <div className="md:col-span-3">
              <select
                id="specialty-dropdown-filter"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-750 dark:text-slate-300 transition"
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
                className="w-full text-sm px-3 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-705 dark:text-slate-300 transition"
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
                className="w-full text-sm px-3 py-2 bg-slate-50/60 dark:bg-slate-800/60 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-705 dark:text-slate-300 transition font-semibold text-indigo-700 dark:text-indigo-400"
              >
                <option value="all">Everyone</option>
                <option value="nurse">Professionals Only</option>
                <option value="student">Graduate Students</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Checkbox verified */}
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                id="only-verified-cb"
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:ring-offset-0 animate-none dark:bg-slate-800"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Nurses List Container Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">Querying nurse registries...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-16 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-405 dark:text-slate-500 mx-auto mb-6 border border-slate-100 dark:border-slate-700">
              <Search className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">No Results Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
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
              className="mt-6 px-4 py-2 rounded-xl text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((p) => {
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={p.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[24px] shadow-sm hover:shadow-md transition duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <img
                        src={p.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150'}
                        alt={p.username}
                        className="w-14 h-14 object-cover rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                      />
                      <VerificationBadge status={p.verification_status} showText={false} />
                    </div>

                    {/* Basic Info */}
                    <div className="mt-4">
                      <h4 className="font-sans font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {p.first_name} {p.last_name}
                      </h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1 font-mono uppercase tracking-tight">
                        {p.qualification || p.nursing_level || 'Nursing Colleague'}
                      </p>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed line-clamp-3 font-medium">
                      {p.bio || 'Professional nurse portfolio of this qualified healthcare team associate.'}
                    </p>

                    {/* Specialties List */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {(p.specialties || []).slice(0, 3).map((spec) => (
                        <span key={spec} className="text-[10px] bg-slate-55/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold px-2.5 py-0.5 rounded-lg">
                          {spec}
                        </span>
                      ))}
                      {(p.specialties || []).length > 3 && (
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg font-bold font-mono">
                          +{(p.specialties || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Footer Block */}
                  <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {p.location || 'USA'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {p.years_of_experience || 0} yrs exp
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <button
                        id={`explore-preview-${p.username}`}
                        onClick={async () => {
                          setActivePreview(p);
                          await analyticsService.recordProfileView(p.id);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                      >
                        Preview
                      </button>
                      <span className="text-slate-200 dark:text-slate-700">|</span>
                      <Link
                        id={`explore-view-${p.username}`}
                        to={`/nurse/${p.username}`}
                        onClick={() => analyticsService.recordProfileView(p.id)}
                        className="text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 font-bold flex items-center gap-0.5"
                      >
                        Hub
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Profile quick preview Drawer/Modal */}
      <AnimatePresence>
        {activePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePreview(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xs"
            ></motion.div>

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden w-full max-w-sm relative shadow-xl border border-slate-200/60 dark:border-slate-800 z-10"
            >
              {/* Colored header cover block fallback */}
              <div className="h-24 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-4 relative">
                <button
                  id="preview-panel-close"
                  onClick={() => setActivePreview(null)}
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition cursor-pointer"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 relative pt-10">
                {/* Avatar positioning overlay */}
                <div className="absolute -top-10 left-6">
                  <img
                    src={activePreview.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150'}
                    alt="Quick preview avatar"
                    className="w-20 h-20 object-cover rounded-2xl border-4 border-white dark:border-slate-900 shadow-md bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Info block */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white">{activePreview.first_name} {activePreview.last_name}</h3>
                      <VerificationBadge status={activePreview.verification_status} showText={false} />
                    </div>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                      {activePreview.qualification || activePreview.nursing_level || 'Nursing Student'}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {activePreview.bio || 'Excellent clinically active Nursefolio candidate profiles.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 dark:border-slate-800 py-3 mt-4">
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] font-mono">Location</span>
                      <span className="block text-slate-750 dark:text-slate-300 font-semibold mt-0.5">{activePreview.location || 'USA'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] font-mono">Role Grade</span>
                      <span className="block text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 capitalize">{activePreview.role}</span>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div>
                    <span className="block text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] font-mono mb-1.5">Focus Areas</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePreview.specialties.map((spec) => (
                        <span key={spec} className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-705 dark:text-slate-400 px-2.5 py-1 rounded-lg font-bold">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      id="preview-panel-dismiss"
                      onClick={() => setActivePreview(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <Link
                      id="preview-panel-view"
                      to={`/nurse/${activePreview.username}`}
                      className="flex-1 py-2.5 rounded-xl text-center text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-extrabold transition shadow-md shadow-indigo-600/10 cursor-pointer"
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