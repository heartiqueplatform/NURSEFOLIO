/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { UserProfile } from '../types';
import { VerificationBadge } from '../components/VerificationBadge';
import {
  Search, MapPin, Briefcase, Sparkles, ChevronRight, Eye, X,
  ThumbsUp, MessageSquare, Tag, RefreshCw, Users
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { supabase } from '../lib/supabase';
import { EndorsementManager } from '../components/EndorsementManager';

// ==========================================
// TYPES
// ==========================================
interface EndorsementState {
  [profileId: string]: {
    count: number;
    isEndorsedByCurrentUser: boolean;
    topQuote?: string | null;
    topQuoteAuthor?: string | null;
  };
}

interface EndorsementModalData {
  profile: UserProfile;
  isOpen: boolean;
}

const QUICK_MESSAGES = [
  "Great clinical skills",
  "Excellent teamwork",
  "Strong leadership in patient care",
  "Very helpful in training students",
  "Reliable and professional nurse",
  "Compassionate and dedicated",
  "Always goes above and beyond",
  "Wonderful mentor to new nurses"
];

const ENDORSEMENT_SPECIALTIES = [
  "ICU", "Emergency", "Pediatrics", "Oncology", "Cardiology",
  "Neurology", "Student Helper", "Mentor", "Peer Support"
];

// ==========================================
// SKELETON
// ==========================================
const NurseCardSkeleton = () => (
  <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200/60 md:dark:border-zinc-800 md:shadow-sm overflow-hidden border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60 animate-pulse">
    <div className="p-4 md:p-5">
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
        </div>
      </div>
      <div className="mt-4 h-16 bg-slate-100 dark:bg-zinc-900 rounded-xl" />
      <div className="mt-4 flex items-center gap-3">
        <div className="h-9 w-32 bg-slate-200 dark:bg-zinc-800 rounded-full" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-24" />
      </div>
    </div>
  </div>
);

// ==========================================
// ENDORSEMENT MODAL
// ==========================================
const EndorsementModal = ({
  isOpen,
  onClose,
  onSubmit,
  profile,
  isUpdating = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string | null, specialty: string | null) => Promise<void>;
  profile: UserProfile;
  isUpdating?: boolean;
}) => {
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedMessages([]);
      setCustomMessage('');
      setSelectedSpecialty('');
    }
  }, [isOpen]);

  const handleMessageToggle = (message: string) => {
    setSelectedMessages(prev =>
      prev.includes(message) ? prev.filter(m => m !== message) : [...prev, message]
    );
  };

  const getFinalMessage = (): string | null => {
    const combined = [...selectedMessages];
    if (customMessage.trim()) combined.push(customMessage.trim());
    return combined.length > 0 ? combined.join('. ') : null;
  };

  const handleSubmit = async () => {
    await onSubmit(getFinalMessage(), selectedSpecialty || null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:border md:border-slate-200/60 md:dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 dark:border-zinc-800/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Endorse {profile.first_name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share what makes them exceptional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <div className="px-4 md:px-5 py-4 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Quick praise
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  type="button"
                  onClick={() => handleMessageToggle(msg)}
                  className={`text-sm px-3.5 py-2 rounded-full transition-all duration-200 border ${selectedMessages.includes(msg)
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-semibold'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
              Add a personal note (optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Write something meaningful..."
              rows={3}
              className="w-full text-sm px-3.5 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              Specialty category (optional)
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full text-sm px-3.5 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="">Select a specialty</option>
              {ENDORSEMENT_SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 px-4 md:px-5 py-3 md:py-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[98%] min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUpdating}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[98%] min-h-[44px]"
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting
              </>
            ) : (
              <>
                <ThumbsUp className="w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
export default function ExploreNurses() {
  const [searchParams] = useSearchParams();
  const qSearch = searchParams.get('search') || '';
  const qSpecialty = searchParams.get('specialty') || '';

  const [endorsementManagerOpen, setEndorsementManagerOpen] = useState<{ isOpen: boolean; profile: UserProfile | null }>({ isOpen: false, profile: null });
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [endorsements, setEndorsements] = useState<EndorsementState>({});
  const [totalProfiles, setTotalProfiles] = useState<number>(0);

  const [endorsementModal, setEndorsementModal] = useState<EndorsementModalData>({ profile: null as any, isOpen: false });
  const [isSubmittingEndorsement, setIsSubmittingEndorsement] = useState(false);

  const [searchTerm, setSearchTerm] = useState(qSearch);
  const [selectedSpecialty, setSelectedSpecialty] = useState(qSpecialty);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'nurse' | 'student'>('all');

  const [activePreview, setActivePreview] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ==========================================
  // SESSION-SCOPED VIEW TRACKING
  // ==========================================
  // Profiles the user has explicitly engaged with (viewed / endorsed)
  // during this session. Hidden locally to prevent duplicate display
  // without invalidating the DB batch.
  const [sessionHidden, setSessionHidden] = useState<Set<string>>(new Set());

  const sheetY = useMotionValue(0);
  const sheetOpacity = useTransform(sheetY, [0, 200], [1, 0.4]);

  // ==========================================
  // DEV OVERRIDE FLAG
  // ==========================================
  // ⚠️ SET TO false BEFORE PUBLISHING TO PRODUCTION.
  const INCLUDE_ENDORSED_DEV = false;

  const handleViewAllEndorsements = (profile: UserProfile) => {
    setEndorsementManagerOpen({ isOpen: true, profile });
  };

  // Auth
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load batch
  const loadBatch = useCallback(async (userId: string, forceFresh = false) => {
    try {
      if (forceFresh) setRefreshing(true);
      else setLoading(true);

      let profileIds: string[] = [];

      if (!forceFresh) {
        const { data: cached } = await supabase
          .from('explore_batches')
          .select('profile_ids, expires_at')
          .eq('user_id', userId)
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cached?.profile_ids && cached.profile_ids.length > 0) {
          profileIds = cached.profile_ids;
        }
      }

      if (profileIds.length === 0) {
        const { data: fresh, error: rpcErr } = await supabase
          .rpc('get_explore_batch', {
            p_user_id: userId,
            p_limit: 20,
            p_include_endorsed: INCLUDE_ENDORSED_DEV
          });

        if (rpcErr) throw rpcErr;
        profileIds = (fresh || []).map((r: any) => r.profile_id);

        if (profileIds.length > 0) {
          // 1-hour TTL: batch refreshes every hour so users get
          // fresh faces multiple times a day instead of one static batch.
          supabase
            .rpc('save_explore_batch', {
              p_user_id: userId,
              p_profile_ids: profileIds,
              p_ttl_hours: 1
            })
            .then(({ error }) => {
              if (error) console.warn('Save explore batch failed:', error);
            });
        }
      }

      if (profileIds.length === 0) {
        setProfiles([]);
        return;
      }

      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .in('id', profileIds);

      if (profilesErr) throw profilesErr;

      const ordered: UserProfile[] = profileIds
        .map(id => profilesData?.find((p: any) => p.id === id))
        .filter(Boolean)
        .map((p: any) => ({
          id: p.id,
          username: p.username,
          email: p.email || '',
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          full_name: p.full_name,
          role: p.role || 'nurse',
          avatar_url: p.avatar_url || '',
          cover_url: p.cover_url || '',
          bio: p.bio,
          qualification: p.qualification,
          nursing_level: p.nursing_level,
          specialties: p.specialty ? [p.specialty] : [],
          skills: [],
          location: p.location,
          years_of_experience: p.years_experience,
          availability_status: p.availability_status || 'available',
          verification_status: p.verification_status || 'unverified',
          profile_theme: p.profile_theme || 'modern',
          created_at: p.created_at,
          views_count: p.views_count || 0,
          downloads_count: p.downloads_count || 0,
          search_appearances: p.search_appearances || 0,
          onboarding_completed: p.onboarding_completed,
          years_experience: p.years_experience,
          specialty: p.specialty,
          theme: p.theme,
          verified: p.verified
        } as UserProfile));

      setProfiles(ordered);
      await fetchEndorsementData(profileIds);
    } catch (err) {
      console.error('Explore batch load failed:', err);
      setProfiles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    loadBatch(currentUserId);
  }, [currentUserId, loadBatch]);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      setTotalProfiles(count || 0);
    };
    fetchCount();
  }, []);

  // Endorsement data
  const fetchEndorsementData = async (profileIds: string[]) => {
    if (!profileIds.length) return;
    try {
      const { data: countsData } = await supabase!
        .from('profile_endorsement_counts')
        .select('profile_id, endorsement_count');

      const countsMap: Record<string, number> = {};
      countsData?.forEach((item: any) => { countsMap[item.profile_id] = item.endorsement_count; });

      const topQuoteMap: Record<string, { message: string; author: string }> = {};
      const { data: allWithMessages } = await supabase!
        .from('profile_endorsements')
        .select('profile_id, message, endorser_id, created_at')
        .not('message', 'is', null)
        .order('created_at', { ascending: false });

      if (allWithMessages) {
        const seen = new Set<string>();
        const endorserIds = new Set<string>();
        allWithMessages.forEach((row: any) => {
          if (!seen.has(row.profile_id) && row.message && row.message.trim()) {
            topQuoteMap[row.profile_id] = { message: row.message, author: row.endorser_id };
            seen.add(row.profile_id);
            if (row.endorser_id) endorserIds.add(row.endorser_id);
          }
        });

        if (endorserIds.size > 0) {
          const { data: authors } = await supabase!
            .from('profiles')
            .select('id, first_name')
            .in('id', Array.from(endorserIds));

          if (authors) {
            const authorMap = new Map(authors.map((a: any) => [a.id, a.first_name]));
            Object.keys(topQuoteMap).forEach(pid => {
              const authorId = topQuoteMap[pid].author;
              topQuoteMap[pid].author = authorMap.get(authorId) || 'A colleague';
            });
          }
        }
      }

      let userEndorsementsMap: Record<string, { endorsed: boolean }> = {};
      if (currentUserId) {
        const { data: userEndorsements } = await supabase!
          .from('profile_endorsements')
          .select('profile_id')
          .eq('endorser_id', currentUserId);

        if (userEndorsements) {
          userEndorsements.forEach((end: any) => {
            userEndorsementsMap[end.profile_id] = { endorsed: true };
          });
        }
      }

      const newEndorsements: EndorsementState = {};
      profileIds.forEach(id => {
        const userEndorsement = userEndorsementsMap[id];
        const topQuote = topQuoteMap[id];
        newEndorsements[id] = {
          count: countsMap[id] || 0,
          isEndorsedByCurrentUser: userEndorsement?.endorsed || false,
          topQuote: topQuote?.message || null,
          topQuoteAuthor: topQuote?.author || null
        };
      });
      setEndorsements(newEndorsements);
    } catch (err) {
      console.error('Failed to fetch endorsement data:', err);
    }
  };

  // Endorse
  const handleEndorseClick = (profile: UserProfile) => {
    if (!currentUserId) {
      alert('Please sign in to endorse nurses.');
      return;
    }
    setEndorsementModal({ profile, isOpen: true });
  };

  const handleEndorsementSubmit = async (message: string | null, specialty: string | null) => {
    if (!currentUserId || !endorsementModal.profile) return;
    const profile = endorsementModal.profile;
    const currentState = endorsements[profile.id];
    const currentCount = currentState?.count || 0;

    setEndorsements(prev => ({
      ...prev,
      [profile.id]: {
        ...prev[profile.id],
        count: currentCount + 1,
        isEndorsedByCurrentUser: true
      }
    }));

    setIsSubmittingEndorsement(true);
    try {
      const { error: insertError } = await supabase!
        .from('profile_endorsements')
        .upsert({
          endorser_id: currentUserId,
          profile_id: profile.id,
          specialty,
          message
        }, { onConflict: 'endorser_id,profile_id' });

      if (insertError) throw insertError;

      // Hide this profile for the rest of the session
      setSessionHidden(prev => new Set(prev).add(profile.id));

      // Remove locally — server-side batch invalidation happens
      // naturally on next load (we don't force a refresh here)
      setProfiles(prev => prev.filter(p => p.id !== profile.id));
      await fetchEndorsementData(profiles.map(p => p.id).filter(id => id !== profile.id));
    } catch (err) {
      console.error('Endorsement submission failed:', err);
      setEndorsements(prev => ({
        ...prev,
        [profile.id]: {
          ...prev[profile.id],
          count: currentCount,
          isEndorsedByCurrentUser: false
        }
      }));
      alert('Failed to submit endorsement. Please try again.');
    } finally {
      setIsSubmittingEndorsement(false);
      setEndorsementModal({ profile: null as any, isOpen: false });
    }
  };

  // Shuffle — force a fresh batch + clear session-hidden
  const handleShuffle = async () => {
    if (!currentUserId) return;
    // Clear session-hidden so the new batch has full choice of profiles
    setSessionHidden(new Set());
    // Invalidate cached batch so RPC picks fresh profiles
    await supabase.from('explore_batches').delete().eq('user_id', currentUserId);
    await loadBatch(currentUserId, true);
  };

  useEffect(() => {
    if (qSearch) setSearchTerm(qSearch);
    if (qSpecialty) setSelectedSpecialty(qSpecialty);
  }, [qSearch, qSpecialty]);

  const allSpecialties = Array.from(new Set(profiles.flatMap(p => p.specialties || [])));

  const filteredProfiles = profiles.filter((p) => {
    // Skip profiles hidden this session (viewed or endorsed)
    if (sessionHidden.has(p.id)) return false;

    const matchesSearch =
      searchTerm === '' ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.bio || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === '' ||
      (p.specialties || []).some(s => s.toLowerCase() === selectedSpecialty.toLowerCase());

    const matchesVerification = !onlyVerified || p.verification_status === 'verified';
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;

    return matchesSearch && matchesSpecialty && matchesVerification && matchesRole;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-3 md:px-6 py-4 md:py-8">

        {/* Page Header */}
        <div className="mb-5 md:mb-8">
          <span className="inline-block text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            Nurse Registry
          </span>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
            Discover Certified Clinicians
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-1">
            A personalized mix of nurses you haven't met yet.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-4 md:p-5 shadow-sm mb-4 md:mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <div className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-input-field"
                type="text"
                placeholder="Search this batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
              />
            </div>

            <div className="md:col-span-4">
              <select
                id="specialty-dropdown-filter"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full text-sm px-3 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300 transition"
              >
                <option value="">All Specialties</option>
                {allSpecialties.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                id="role-dropdown-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full text-sm px-3 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300 transition font-semibold"
              >
                <option value="all">Everyone</option>
                <option value="nurse">Professionals</option>
                <option value="student">Students</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                id="only-verified-cb"
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-zinc-600 focus:ring-indigo-500 dark:bg-zinc-800"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Only verified
              </span>
            </label>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold hidden sm:inline">
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{filteredProfiles.length}</span> shown · {totalProfiles} total
              </span>
              <button
                onClick={handleShuffle}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition disabled:opacity-50 active:scale-[97%]"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Shuffling' : 'Shuffle'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3, 4].map((i) => <NurseCardSkeleton key={i} />)}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-2xl p-8 md:p-16 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-slate-400 mx-auto mb-6 border border-slate-100 dark:border-zinc-800">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
              {searchTerm || selectedSpecialty || onlyVerified ? 'No matches in this batch' : 'You\'ve seen everyone'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
              {searchTerm || selectedSpecialty || onlyVerified
                ? 'Try resetting your filters, or shuffle to see a new batch.'
                : 'You\'ve viewed or endorsed everyone in this batch. Shuffle to discover more.'}
            </p>
            <button
              onClick={handleShuffle}
              disabled={refreshing}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold active:scale-[98%] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Shuffling' : 'Shuffle Batch'}
            </button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredProfiles.map((p) => {
              const ed = endorsements[p.id] || {
                count: 0,
                isEndorsedByCurrentUser: false,
                topQuote: null,
                topQuoteAuthor: null
              };

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  key={p.id}
                  className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200/60 md:dark:border-zinc-800 md:shadow-sm md:hover:border-indigo-200 dark:md:hover:border-indigo-900 transition-all overflow-hidden border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60"
                >
                  <div className="p-4 md:p-5">
                    <Link to={`/nurse/${p.username}`} className="flex items-start gap-3.5 group/header">
                      <img
                        src={p.avatar_url || '/192.png'}
                        alt={`${p.first_name} ${p.last_name}`}
                        className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-full border-2 border-white dark:border-zinc-800 shadow-md flex-shrink-0 group-hover/header:scale-[1.03] transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate group-hover/header:text-indigo-600 dark:group-hover/header:text-indigo-400 transition-colors">
                            {p.first_name} {p.last_name}
                          </h4>
                          <VerificationBadge status={p.verification_status} showText={false} />
                        </div>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 truncate">
                          {p.qualification || p.nursing_level || 'Nursing Colleague'}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {p.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{p.location}</span>
                            </span>
                          )}
                          {p.years_of_experience ? (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3 flex-shrink-0" />
                              {p.years_of_experience} yrs
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>

                    <div className="mt-3.5">
                      {ed.topQuote ? (
                        <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-3.5 border border-slate-100 dark:border-zinc-800">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                            "{ed.topQuote}"
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2">
                            — {ed.topQuoteAuthor}
                            {ed.count > 1 && (
                              <span className="text-slate-400 dark:text-slate-500 font-normal">
                                {' '}and {ed.count - 1} {ed.count - 1 === 1 ? 'other' : 'others'}
                              </span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-50/60 dark:bg-zinc-900/60 rounded-xl p-3.5 border border-dashed border-slate-200 dark:border-zinc-800">
                          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                            No endorsements yet — be the first to vouch for {p.first_name}.
                          </p>
                        </div>
                      )}
                    </div>

                    {(p.specialties && p.specialties.length > 0) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
                        {p.specialties.slice(0, 4).join(' · ')}
                        {p.specialties.length > 4 && (
                          <span className="text-slate-400 dark:text-slate-500"> · +{p.specialties.length - 4}</span>
                        )}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                      <button
                        onClick={() => {
                          if (ed.isEndorsedByCurrentUser) {
                            handleViewAllEndorsements(p);
                          } else {
                            handleEndorseClick(p);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-200 font-semibold text-sm active:scale-[97%] ${ed.isEndorsedByCurrentUser
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-900'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20'
                          }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${ed.isEndorsedByCurrentUser ? 'fill-current' : ''}`} />
                        <span>{ed.isEndorsedByCurrentUser ? 'Endorsed' : 'Endorse'}</span>
                        {ed.count > 0 && <span className="opacity-80">· {ed.count}</span>}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (!currentUserId || currentUserId === p.id) return;
                            setActivePreview(p);
                            setSessionHidden(prev => new Set(prev).add(p.id));
                            analyticsService.recordProfileView(p.id);
                          }}
                          disabled={currentUserId === p.id}
                          className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Quick look"
                          title="Quick look"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <Link
                          to={`/nurse/${p.username}`}
                          onClick={() => setSessionHidden(prev => new Set(prev).add(p.id))}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                        >
                          <span>Profile</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* QUICK-LOOK BOTTOM SHEET */}
      <AnimatePresence>
        {activePreview && (
          <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => { setActivePreview(null); sheetY.set(0); }}
              className="absolute inset-0 bg-slate-900/60 dark:bg-zinc-950/90 backdrop-blur-sm"
              transition={{ duration: 0.2 }}
            />

            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              style={{ y: sheetY, opacity: sheetOpacity }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 500) {
                  setActivePreview(null);
                  sheetY.set(0);
                } else {
                  sheetY.set(0);
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="bg-white dark:bg-zinc-950 md:rounded-3xl rounded-t-3xl overflow-hidden w-full md:max-w-md relative shadow-2xl md:border md:border-slate-200/60 md:dark:border-zinc-800 max-h-[92vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm pt-3 pb-1 md:hidden">
                <div className="flex justify-center">
                  <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                </div>
              </div>

              <div className="h-20 md:h-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative">
                <button
                  onClick={() => { setActivePreview(null); sheetY.set(0); }}
                  className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors shadow-lg backdrop-blur-sm active:scale-95"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 md:px-6 pb-6 relative">
                <div className="absolute -top-10 left-5 md:left-6">
                  <img
                    src={activePreview.avatar_url || '/192.png'}
                    alt={`${activePreview.first_name} ${activePreview.last_name}`}
                    className="w-20 h-20 object-cover rounded-full border-4 border-white dark:border-zinc-950 shadow-lg bg-white dark:bg-zinc-950"
                  />
                </div>

                <div className="pt-12 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {activePreview.first_name} {activePreview.last_name}
                      </h3>
                      <VerificationBadge status={activePreview.verification_status} showText={false} />
                    </div>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {activePreview.qualification || activePreview.nursing_level || 'Nursing Student'}
                    </p>
                  </div>

                  {activePreview.bio && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">
                      {activePreview.bio}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 border-y border-slate-100 dark:border-zinc-800 py-3">
                    <div>
                      <span className="block text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Location</span>
                      <span className="block text-sm text-slate-700 dark:text-slate-300 font-semibold mt-0.5 truncate">
                        {activePreview.location || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Role</span>
                      <span className="block text-sm text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 capitalize">
                        {activePreview.role}
                      </span>
                    </div>
                  </div>

                  {activePreview.specialties?.length > 0 && (
                    <div>
                      <span className="block text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">
                        Focus Areas
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activePreview.specialties.slice(0, 6).map((spec) => (
                          <span
                            key={spec}
                            className="text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-slate-400 px-2.5 py-1 rounded-lg font-semibold"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {endorsements[activePreview.id]?.topQuote && (
                    <div className="bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl p-3.5 border border-indigo-100 dark:border-indigo-900/50">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        "{endorsements[activePreview.id].topQuote}"
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5">
                        — {endorsements[activePreview.id].topQuoteAuthor}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { setActivePreview(null); sheetY.set(0); }}
                      className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 text-sm font-bold active:bg-slate-100 dark:active:bg-zinc-800 transition min-h-[48px]"
                    >
                      Close
                    </button>
                    <Link
                      to={`/nurse/${activePreview.username}`}
                      onClick={() => { setActivePreview(null); sheetY.set(0); }}
                      className="flex-1 py-3 rounded-xl text-center text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-bold transition shadow-md shadow-indigo-600/20 min-h-[48px] flex items-center justify-center active:scale-[98%]"
                    >
                      View Full Profile
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Endorsement Manager Modal */}
      <AnimatePresence>
        {endorsementManagerOpen.isOpen && endorsementManagerOpen.profile && (
          <EndorsementManager
            isOpen={endorsementManagerOpen.isOpen}
            onClose={() => setEndorsementManagerOpen({ isOpen: false, profile: null })}
            profileId={endorsementManagerOpen.profile.id}
            profileName={`${endorsementManagerOpen.profile.first_name} ${endorsementManagerOpen.profile.last_name}`}
            currentUserId={currentUserId || ''}
            onEndorsementChange={() => fetchEndorsementData(profiles.map(p => p.id))}
          />
        )}
      </AnimatePresence>

      {/* Endorsement Modal */}
      <AnimatePresence>
        {endorsementModal.isOpen && endorsementModal.profile && (
          <EndorsementModal
            isOpen={endorsementModal.isOpen}
            onClose={() => setEndorsementModal({ profile: null as any, isOpen: false })}
            onSubmit={handleEndorsementSubmit}
            profile={endorsementModal.profile}
            isUpdating={isSubmittingEndorsement}
          />
        )}
      </AnimatePresence>
    </div>
  );
}