/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { locumService, LocumRequest, LocumUrgency } from '../services/locumService';
import { VerificationBadge } from '../components/VerificationBadge';
import {
    Search, MapPin, Calendar, Clock, RefreshCw, X, Send, Briefcase,
    MessageSquare, Users, Plus, Sparkles, ChevronRight, Inbox
} from 'lucide-react';

// ==========================================
// CONSTANTS
// ==========================================
const URGENCY_META: Record<LocumUrgency, { label: string; classes: string; dot: string }> = {
    urgent: {
        label: 'Urgent',
        classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400',
        dot: 'bg-rose-500 animate-pulse'
    },
    soon: {
        label: 'Soon',
        classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
        dot: 'bg-amber-500'
    },
    planned: {
        label: 'Planned',
        classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-500'
    }
};

// ==========================================
// HELPERS
// ==========================================
const formatShiftDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getRequesterName = (req: LocumRequest): string => {
    const r = req.requester;
    if (!r) return 'A colleague';
    if (r.full_name && r.full_name !== 'null') return r.full_name;
    if (r.first_name && r.first_name !== 'null') {
        return `${r.first_name} ${r.last_name || ''}`.trim();
    }
    if (r.username && r.username !== 'null') return r.username;
    return 'A colleague';
};

// ==========================================
// SKELETON — flat, edge-to-edge
// ==========================================
const LocumCardSkeleton = React.memo(() => (
    <div className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900 animate-pulse space-y-3">
        <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full" />
            <div className="h-5 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full" />
        </div>
        <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
        <div className="h-14 bg-slate-100 dark:bg-zinc-900 rounded-2xl" />
        <div className="h-10 bg-slate-200 dark:bg-zinc-800 rounded-full w-40" />
    </div>
));

// ==========================================
// LOCUM CARD — memoized, no framer-motion
// ==========================================
const LocumCard = React.memo<{
    req: LocumRequest;
    isOwn: boolean;
    hasApplied: boolean;
    onApply: (req: LocumRequest) => void;
    onViewApplicants?: (req: LocumRequest) => void;
}>(({ req, isOwn, hasApplied, onApply, onViewApplicants }) => {
    const meta = URGENCY_META[req.urgency];

    return (
        <article className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900">
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${meta.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                </span>
                {req.specialty && (
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">
                        {req.specialty}
                    </span>
                )}
                {req.status !== 'open' && (
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                        {req.status === 'filled' ? 'Filled' : 'Cancelled'}
                    </span>
                )}
            </div>

            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {req.facility_name || 'Shift Cover Needed'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{req.facility_location}</span>
            </p>

            <div className="mt-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl px-3.5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    {formatShiftDate(req.shift_date)}
                </span>
                {req.shift_start && req.shift_end && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {req.shift_start} – {req.shift_end}
                    </span>
                )}
            </div>

            {req.notes && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed line-clamp-3">
                    {req.notes}
                </p>
            )}

            <div className="flex items-center gap-2.5 mt-3.5">
                <img
                    src={req.requester?.avatar_url || '/192.png'}
                    alt={getRequesterName(req)}
                    loading="lazy"
                    decoding="async"
                    className="w-8 h-8 rounded-full object-cover bg-slate-100 dark:bg-zinc-900 flex-shrink-0"
                />
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                            {getRequesterName(req)}
                        </span>
                        {req.requester?.verification_status === 'verified' && (
                            <span className="w-3.5 h-3.5 flex-shrink-0">
                                <VerificationBadge status="verified" showText={false} />
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {req.requester?.qualification || 'Colleague'}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {req.offer_count || 0} {req.offer_count === 1 ? 'applicant' : 'applicants'}
                </span>

                {isOwn ? (
                    onViewApplicants ? (
                        <button
                            onClick={() => onViewApplicants(req)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 active:bg-amber-600 text-white text-sm font-bold transition"
                        >
                            <Inbox className="w-4 h-4" />
                            View Applicants
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                            Your request
                        </span>
                    )
                ) : hasApplied ? (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                        <Send className="w-3 h-3 fill-current" />
                        Applied
                    </span>
                ) : req.status === 'open' ? (
                    <button
                        onClick={() => onApply(req)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 active:bg-indigo-700 text-white text-sm font-bold transition"
                    >
                        <Send className="w-4 h-4" />
                        I'm Interested
                    </button>
                ) : null}
            </div>
        </article>
    );
});

LocumCard.displayName = 'LocumCard';

// ==========================================
// APPLY SHEET — no drag, CSS animation
// ==========================================
const ApplySheet = React.memo<{
    isOpen: boolean;
    onClose: () => void;
    request: LocumRequest | null;
    onSubmit: (message: string | null) => Promise<void>;
    isSubmitting: boolean;
}>(({ isOpen, onClose, request, onSubmit, isSubmitting }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMessage('');
            const t = setTimeout(() => textareaRef.current?.focus(), 100);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;
        await onSubmit(message.trim() || null);
    }, [message, isSubmitting, onSubmit]);

    if (!isOpen || !request) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-3xl max-w-md w-full overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                </div>

                <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
                            <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                I'm Interested
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Send your interest to {getRequesterName(request)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full active:bg-slate-100 dark:active:bg-zinc-900 transition"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </button>
                </div>

                <div className="px-4 md:px-5 py-4 space-y-4 overflow-y-auto flex-1">
                    <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3.5">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {request.facility_name || 'Facility'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {request.facility_location}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatShiftDate(request.shift_date)}
                            </span>
                            {request.shift_start && request.shift_end && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {request.shift_start} – {request.shift_end}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4" />
                            Add a message (optional)
                        </label>
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell them why you're a good fit or confirm your availability..."
                            rows={4}
                            className="w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition resize-none"
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                            Keep it short — response time matters for urgent shifts.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 px-4 md:px-5 py-3 md:py-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-semibold active:opacity-70 transition disabled:opacity-50 min-h-[44px]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-2xl bg-indigo-600 active:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send Interest
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
});

ApplySheet.displayName = 'ApplySheet';

// ==========================================
// MAIN PAGE
// ==========================================
export default function LocumPage() {
    const navigate = useNavigate();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [tab, setTab] = useState<'browse' | 'mine'>('browse');

    const [matched, setMatched] = useState<LocumRequest[]>([]);
    const [allRequests, setAllRequests] = useState<LocumRequest[]>([]);
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
    const [myRequests, setMyRequests] = useState<LocumRequest[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [urgencyFilter, setUrgencyFilter] = useState<'all' | LocumUrgency>('all');

    const [applySheet, setApplySheet] = useState<{ isOpen: boolean; request: LocumRequest | null }>({
        isOpen: false,
        request: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadedForUserRef = useRef<string | null>(null);

    // ---------- Auth ----------
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!cancelled) setCurrentUserId(user?.id || null);
        })();
        return () => { cancelled = true; };
    }, []);

    // ---------- Load everything ----------
    const loadAll = useCallback(async (userId: string, forceFresh = false) => {
        try {
            if (forceFresh) setRefreshing(true);
            else setLoading(true);

            const [matchedData, allData, mine] = await Promise.all([
                locumService.getMatches(userId, 20),
                locumService.getAllRequests(userId, 40),
                locumService.getMyRequests(userId)
            ]);

            setMatched(matchedData);
            setAllRequests(allData);
            setMyRequests(mine);

            // ✅ FIXED: was making one query per request (40 requests = 40 roundtrips).
            // Now: one batched query for all offers by this user.
            const allIds = allData.map(r => r.id);
            if (allIds.length > 0) {
                const { data: myOffers } = await supabase
                    .from('locum_offers')
                    .select('request_id, status')
                    .eq('applicant_id', userId)
                    .in('request_id', allIds);

                const applied = new Set(
                    (myOffers || [])
                        .filter(o => o.status !== 'withdrawn')
                        .map(o => o.request_id)
                );
                setAppliedIds(applied);
            } else {
                setAppliedIds(new Set());
            }
        } catch (err) {
            console.error('Load locum data error:', err);
            setMatched([]);
            setAllRequests([]);
            setMyRequests([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (!currentUserId) return;
        if (loadedForUserRef.current === currentUserId) return;
        loadedForUserRef.current = currentUserId;
        loadAll(currentUserId);
    }, [currentUserId, loadAll]);

    // ---------- Apply ----------
    const handleApply = useCallback(async (message: string | null) => {
        if (!currentUserId || !applySheet.request) return;
        setIsSubmitting(true);
        try {
            await locumService.applyToRequest({
                request_id: applySheet.request.id,
                applicant_id: currentUserId,
                message
            });
            setAppliedIds(prev => new Set(prev).add(applySheet.request!.id));
            setApplySheet({ isOpen: false, request: null });
        } catch (err) {
            console.error('Apply error:', err);
            alert('Failed to send interest. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [currentUserId, applySheet.request]);

    const handleRefresh = useCallback(() => {
        if (!currentUserId) return;
        loadAll(currentUserId, true);
    }, [currentUserId, loadAll]);

    const handleOpenApply = useCallback((req: LocumRequest) => {
        setApplySheet({ isOpen: true, request: req });
    }, []);

    const handleViewApplicants = useCallback((req: LocumRequest) => {
        navigate(`/locum/${req.id}/applicants`);
    }, [navigate]);

    // ---------- Filters (memoized) ----------
    const filtered = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        const matches = (r: LocumRequest) => {
            const matchesSearch =
                term === '' ||
                (r.facility_name || '').toLowerCase().includes(term) ||
                (r.facility_location || '').toLowerCase().includes(term) ||
                (r.specialty || '').toLowerCase().includes(term);
            const matchesUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;
            return matchesSearch && matchesUrgency;
        };

        const filteredMatched = matched.filter(matches);
        const matchedIds = new Set(matched.map(m => m.id));
        const filteredAll = allRequests.filter(r => !matchedIds.has(r.id) && matches(r));
        const filteredMine = myRequests.filter(matches);

        return { filteredMatched, filteredAll, filteredMine };
    }, [matched, allRequests, myRequests, searchTerm, urgencyFilter]);

    const totalBrowseVisible = filtered.filteredMatched.length + filtered.filteredAll.length;
    const hasFilters = searchTerm !== '' || urgencyFilter !== 'all';

    // ---------- Render ----------
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto md:px-6 md:py-8 pb-24">

                {/* Header — hidden on mobile */}
                <div className="hidden md:block mb-8">
                    <span className="inline-block text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                        Locum & Cover
                    </span>
                    <h1 className="text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
                        Find or Offer Shift Cover
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
                        Open shifts from facilities and colleagues near you.
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="bg-white dark:bg-zinc-950 p-1 mb-4 flex md:rounded-2xl border-b border-slate-100 dark:border-zinc-900 md:border-0">
                    <button
                        onClick={() => setTab('browse')}
                        className={`flex-1 py-2.5 rounded-full text-sm font-bold transition ${tab === 'browse'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900'
                            }`}
                    >
                        Browse Shifts
                    </button>
                    <button
                        onClick={() => setTab('mine')}
                        className={`flex-1 py-2.5 rounded-full text-sm font-bold transition flex items-center justify-center gap-2 ${tab === 'mine'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900'
                            }`}
                    >
                        My Requests
                        {myRequests.length > 0 && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'mine'
                                ? 'bg-white/20 dark:bg-slate-900/20'
                                : 'bg-slate-200 dark:bg-zinc-800'
                                }`}>
                                {myRequests.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filters (browse only) */}
                {tab === 'browse' && (
                    <div className="bg-white dark:bg-zinc-950 p-4 space-y-4 border-b border-slate-100 dark:border-zinc-900 md:rounded-2xl md:border-0 md:mb-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by facility, location, or specialty..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-900 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setUrgencyFilter('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${urgencyFilter === 'all'
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 active:bg-slate-200 dark:active:bg-zinc-800'
                                    }`}
                            >
                                All
                            </button>
                            {(['urgent', 'soon', 'planned'] as LocumUrgency[]).map(u => (
                                <button
                                    key={u}
                                    onClick={() => setUrgencyFilter(u)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${urgencyFilter === u
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                        : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 active:bg-slate-200 dark:active:bg-zinc-800'
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${URGENCY_META[u].dot}`} />
                                    {URGENCY_META[u].label}
                                </button>
                            ))}

                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 active:opacity-60 transition disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">{refreshing ? 'Refreshing' : 'Refresh'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div>
                        {[1, 2, 3].map(i => <LocumCardSkeleton key={i} />)}
                    </div>
                ) : tab === 'browse' ? (
                    totalBrowseVisible === 0 ? (
                        <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400 mx-auto mb-6">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                                {hasFilters ? 'No matching shifts' : 'No shifts available right now'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
                                {hasFilters
                                    ? 'Try clearing your filters.'
                                    : 'Be the first — post a request and reach nurses near you.'}
                            </p>
                            {!hasFilters && (
                                <button
                                    onClick={() => navigate('/locum/new')}
                                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 active:bg-amber-600 text-white text-sm font-semibold transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    Post a Shift Cover Request
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filtered.filteredMatched.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-3 px-4 md:px-0">
                                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                                            Matched for You
                                        </h2>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                                            · {filtered.filteredMatched.length}
                                        </span>
                                    </div>
                                    <div>
                                        {filtered.filteredMatched.map(r => (
                                            <LocumCard
                                                key={r.id}
                                                req={r}
                                                isOwn={r.requester_id === currentUserId}
                                                hasApplied={appliedIds.has(r.id)}
                                                onApply={handleOpenApply}
                                                onViewApplicants={
                                                    r.requester_id === currentUserId ? handleViewApplicants : undefined
                                                }
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {filtered.filteredAll.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-3 px-4 md:px-0">
                                        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                            <Briefcase className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                                            All Locums
                                        </h2>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                                            · {filtered.filteredAll.length}
                                        </span>
                                    </div>
                                    <div>
                                        {filtered.filteredAll.map(r => (
                                            <LocumCard
                                                key={r.id}
                                                req={r}
                                                isOwn={r.requester_id === currentUserId}
                                                hasApplied={appliedIds.has(r.id)}
                                                onApply={handleOpenApply}
                                                onViewApplicants={
                                                    r.requester_id === currentUserId ? handleViewApplicants : undefined
                                                }
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )
                ) : (
                    // MY REQUESTS TAB
                    filtered.filteredMine.length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400 mx-auto mb-6">
                                <Inbox className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                                No requests posted yet
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
                                When you post a shift cover request, it appears here with applicant tracking.
                            </p>
                            <button
                                onClick={() => navigate('/locum/new')}
                                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 active:bg-amber-600 text-white text-sm font-semibold transition"
                            >
                                <Plus className="w-4 h-4" />
                                Post Your First Request
                            </button>
                        </div>
                    ) : (
                        <div>
                            {filtered.filteredMine.map(r => (
                                <LocumCard
                                    key={r.id}
                                    req={r}
                                    isOwn
                                    hasApplied={false}
                                    onApply={handleOpenApply}
                                    onViewApplicants={handleViewApplicants}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* FAB — smaller, cleaner, no gradient */}
            <button
                onClick={() => navigate('/locum/new')}
                className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full bg-amber-500 active:bg-amber-600 text-white flex items-center justify-center transition-transform active:scale-95"
                aria-label="Post a shift cover request"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Apply sheet */}
            {applySheet.isOpen && applySheet.request && (
                <ApplySheet
                    isOpen={applySheet.isOpen}
                    onClose={() => setApplySheet({ isOpen: false, request: null })}
                    request={applySheet.request}
                    onSubmit={handleApply}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}