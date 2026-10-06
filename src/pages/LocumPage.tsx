/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { locumService, LocumRequest, LocumUrgency, LocumOffer } from '../services/locumService';
import { VerificationBadge } from '../components/VerificationBadge';
import {
    Search, MapPin, Calendar, Clock, RefreshCw, X, Send, Briefcase,
    MessageSquare, Users, Plus, AlertCircle, Sparkles, CheckCircle2,
    Phone, MessageCircle, ChevronRight, Inbox
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';

// ==========================================
// CONSTANTS
// ==========================================
const URGENCY_META: Record<LocumUrgency, { label: string; classes: string; dot: string }> = {
    urgent: {
        label: 'Urgent',
        classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
        dot: 'bg-rose-500 animate-pulse'
    },
    soon: {
        label: 'Soon',
        classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
        dot: 'bg-amber-500'
    },
    planned: {
        label: 'Planned',
        classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
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

const getApplicantName = (offer: LocumOffer): string => {
    const a = offer.applicant;
    if (!a) return 'A colleague';
    if (a.full_name && a.full_name !== 'null') return a.full_name;
    if (a.first_name && a.first_name !== 'null') {
        return `${a.first_name} ${a.last_name || ''}`.trim();
    }
    if (a.username && a.username !== 'null') return a.username;
    return 'A colleague';
};

// Normalize phone for WhatsApp (digits only, with country code assumption)
const normalizeWhatsApp = (raw: string | null | undefined): string => {
    if (!raw) return '';
    const digits = raw.replace(/[^\d]/g, '');
    // If starts with 0, prepend Kenya country code (254)
    if (digits.startsWith('0')) return '254' + digits.slice(1);
    return digits;
};

// ==========================================
// SKELETON
// ==========================================
const LocumCardSkeleton = () => (
    <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200/60 md:dark:border-zinc-800 md:shadow-sm overflow-hidden border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60 animate-pulse">
        <div className="p-4 md:p-5 space-y-3">
            <div className="flex items-center gap-2">
                <div className="h-6 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full" />
            </div>
            <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
            <div className="h-14 bg-slate-100 dark:bg-zinc-900 rounded-xl" />
            <div className="h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl w-40" />
        </div>
    </div>
);

// ==========================================
// LOCUM CARD (shared renderer)
// ==========================================
const LocumCard: React.FC<{
    req: LocumRequest;
    isOwn: boolean;
    hasApplied: boolean;
    onApply: (req: LocumRequest) => void;
    onViewApplicants?: (req: LocumRequest) => void;
}> = ({ req, isOwn, hasApplied, onApply, onViewApplicants }) => {
    const meta = URGENCY_META[req.urgency];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200/60 md:dark:border-zinc-800 md:shadow-sm md:hover:border-amber-200 dark:md:hover:border-amber-900 transition-all overflow-hidden border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60"
        >
            <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 flex-wrap mb-2.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${meta.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                    </span>
                    {req.specialty && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                            {req.specialty}
                        </span>
                    )}
                    {req.status !== 'open' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-700">
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

                <div className="mt-3 bg-slate-50 dark:bg-zinc-900 rounded-xl px-3.5 py-3 border border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-x-4 gap-y-1.5">
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
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-zinc-700 flex-shrink-0"
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

                <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {req.offer_count || 0} {req.offer_count === 1 ? 'applicant' : 'applicants'}
                    </span>

                    {isOwn ? (
                        onViewApplicants ? (
                            <button
                                onClick={() => onViewApplicants(req)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-sm shadow-amber-500/20 active:scale-[97%] transition"
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
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-900 inline-flex items-center gap-1.5">
                            <Send className="w-3 h-3 fill-current" />
                            Applied
                        </span>
                    ) : req.status === 'open' ? (
                        <button
                            onClick={() => onApply(req)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm shadow-indigo-600/20 active:scale-[97%] transition"
                        >
                            <Send className="w-4 h-4" />
                            I'm Interested
                        </button>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================
// APPLY SHEET
// ==========================================
const ApplySheet = ({
    isOpen,
    onClose,
    request,
    onSubmit,
    isSubmitting
}: {
    isOpen: boolean;
    onClose: () => void;
    request: LocumRequest | null;
    onSubmit: (message: string | null) => Promise<void>;
    isSubmitting: boolean;
}) => {
    const [message, setMessage] = useState('');
    const sheetY = useMotionValue(0);
    const sheetOpacity = useTransform(sheetY, [0, 200], [1, 0.4]);

    useEffect(() => {
        if (isOpen) setMessage('');
    }, [isOpen]);

    const handleSubmit = async () => {
        await onSubmit(message.trim() || null);
    };

    const handleClose = () => {
        sheetY.set(0);
        onClose();
    };

    if (!isOpen || !request) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999999999] flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
        >
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                style={{ y: sheetY, opacity: sheetOpacity }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 120 || info.velocity.y > 500) handleClose();
                    else sheetY.set(0);
                }}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col md:border md:border-slate-200/60 md:dark:border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                </div>

                <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 dark:border-zinc-800/80 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
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
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </button>
                </div>

                <div className="px-4 md:px-5 py-4 space-y-4 overflow-y-auto flex-1">
                    <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-3.5 border border-slate-100 dark:border-zinc-800">
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
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell them why you're a good fit or confirm your availability..."
                            rows={4}
                            className="w-full text-sm px-3.5 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition resize-none"
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                            Keep it short — response time matters for urgent shifts.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 px-4 md:px-5 py-3 md:py-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[98%] min-h-[44px]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[98%] min-h-[44px]"
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
            </motion.div>
        </motion.div>
    );
};

// ==========================================
// APPLICANTS INBOX (bottom sheet)
// ==========================================
const ApplicantsInbox = ({
    isOpen,
    onClose,
    request,
    currentUserId,
    onAccepted
}: {
    isOpen: boolean;
    onClose: () => void;
    request: LocumRequest | null;
    currentUserId: string | null;
    onAccepted: () => void;
}) => {
    const [offers, setOffers] = useState<LocumOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState<string | null>(null);
    const [confirmAccept, setConfirmAccept] = useState<string | null>(null);

    const sheetY = useMotionValue(0);
    const sheetOpacity = useTransform(sheetY, [0, 200], [1, 0.4]);

    useEffect(() => {
        if (isOpen && request) {
            setLoading(true);
            locumService.getOffersForRequest(request.id)
                .then(setOffers)
                .finally(() => setLoading(false));
        } else {
            setOffers([]);
            setConfirmAccept(null);
        }
    }, [isOpen, request]);

    const handleAccept = async (offerId: string) => {
        if (!currentUserId) return;
        setAccepting(offerId);
        try {
            await locumService.acceptOffer(offerId, currentUserId);
            // Refresh offers to reflect new states
            if (request) {
                const fresh = await locumService.getOffersForRequest(request.id);
                setOffers(fresh);
            }
            onAccepted();
            setConfirmAccept(null);
        } catch (err) {
            console.error('Accept offer error:', err);
            alert('Failed to accept. Please try again.');
        } finally {
            setAccepting(null);
        }
    };

    const handleClose = () => {
        sheetY.set(0);
        onClose();
    };

    if (!isOpen || !request) return null;

    const acceptedOffer = offers.find(o => o.status === 'accepted');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999999999] flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
        >
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                style={{ y: sheetY, opacity: sheetOpacity }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 120 || info.velocity.y > 500) handleClose();
                    else sheetY.set(0);
                }}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col md:border md:border-slate-200/60 md:dark:border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                </div>

                <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 dark:border-zinc-800/80 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                            <Inbox className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                                Applicants
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {offers.length} {offers.length === 1 ? 'nurse applied' : 'nurses applied'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition flex-shrink-0"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-3">
                    {loading ? (
                        <>
                            {[1, 2].map(i => (
                                <div key={i} className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-4 animate-pulse">
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-zinc-800" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
                                            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : offers.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                            </div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-base">
                                No applications yet
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                                Your request is live. Nurses nearby will see it and can apply.
                            </p>
                        </div>
                    ) : (
                        offers.map(offer => {
                            const isAccepted = offer.status === 'accepted';
                            const isDeclined = offer.status === 'declined';
                            const isWithdrawn = offer.status === 'withdrawn';
                            const isConfirming = confirmAccept === offer.id;

                            const phone = offer.applicant?.phone_number || '';
                            const whatsapp = offer.applicant?.whatsapp_number || '';

                            return (
                                <div
                                    key={offer.id}
                                    className={`rounded-2xl border p-4 transition-all ${isAccepted
                                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                                        : isDeclined || isWithdrawn
                                            ? 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 opacity-60'
                                            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <img
                                            src={offer.applicant?.avatar_url || '/192.png'}
                                            alt={getApplicantName(offer)}
                                            className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-zinc-700 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                                    {getApplicantName(offer)}
                                                </span>
                                                {offer.applicant?.verification_status === 'verified' && (
                                                    <CheckCircle2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                                                )}
                                                {isAccepted && (
                                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                                        Accepted
                                                    </span>
                                                )}
                                                {isDeclined && (
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                                        Declined
                                                    </span>
                                                )}
                                                {isWithdrawn && (
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                                        Withdrawn
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                                                {offer.applicant?.qualification || offer.applicant?.nursing_level || 'Nurse'}
                                            </p>
                                        </div>
                                    </div>

                                    {offer.message && (
                                        <div className="mt-3 bg-slate-50 dark:bg-zinc-900 rounded-lg p-3 border border-slate-100 dark:border-zinc-800">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                "{offer.message}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Contact unlock when accepted */}
                                    {isAccepted && (phone || whatsapp) && (
                                        <div className="mt-3 flex gap-2">
                                            {whatsapp && (
                                                <a
                                                    href={`https://wa.me/${normalizeWhatsApp(whatsapp)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition active:scale-[98%] min-h-[44px]"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    WhatsApp
                                                </a>
                                            )}
                                            {phone && (
                                                <a
                                                    href={`tel:${phone}`}
                                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition active:scale-[98%] min-h-[44px]"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    Call
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Accept / Confirm bar */}
                                    {!isAccepted && !isDeclined && !isWithdrawn && !acceptedOffer && (
                                        <div className="mt-3">
                                            {isConfirming ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setConfirmAccept(null)}
                                                        disabled={accepting === offer.id}
                                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 text-sm font-semibold transition active:scale-[98%] min-h-[44px]"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleAccept(offer.id)}
                                                        disabled={accepting === offer.id}
                                                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition active:scale-[98%] min-h-[44px] disabled:opacity-50"
                                                    >
                                                        {accepting === offer.id ? (
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                Confirm
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmAccept(offer.id)}
                                                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition active:scale-[98%] min-h-[44px] shadow-md shadow-emerald-500/20"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Accept this Nurse
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* If someone else was accepted, this offer is closed */}
                                    {acceptedOffer && acceptedOffer.id !== offer.id && !isDeclined && !isWithdrawn && (
                                        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 italic">
                                            Another nurse was accepted for this shift.
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="px-4 md:px-5 py-3 md:py-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        className="w-full py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition active:scale-[98%] min-h-[48px]"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ==========================================
// MAIN PAGE
// ==========================================
export default function LocumPage() {
    const navigate = useNavigate();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Tab
    const [tab, setTab] = useState<'browse' | 'mine'>('browse');

    // Browse data
    const [matched, setMatched] = useState<LocumRequest[]>([]);
    const [allRequests, setAllRequests] = useState<LocumRequest[]>([]);
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

    // My requests
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

    const [inboxOpen, setInboxOpen] = useState<{ isOpen: boolean; request: LocumRequest | null }>({
        isOpen: false,
        request: null
    });

    // Auth
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        getUser();
    }, []);

    // Load everything
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

            // Determine applied
            const myOffers: string[] = [];
            for (const r of allData) {
                const offer = await locumService.getMyOfferForRequest(r.id, userId);
                if (offer && offer.status !== 'withdrawn') myOffers.push(r.id);
            }
            setAppliedIds(new Set(myOffers));
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
        if (currentUserId) loadAll(currentUserId);
    }, [currentUserId, loadAll]);

    // Apply
    const handleApply = async (message: string | null) => {
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
    };

    const handleRefresh = () => {
        if (!currentUserId) return;
        loadAll(currentUserId, true);
    };

    // Filters
    const applyFilters = (list: LocumRequest[]) => list.filter(r => {
        const matchesSearch = searchTerm === '' ||
            (r.facility_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.facility_location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;

        return matchesSearch && matchesUrgency;
    });

    const filteredMatched = applyFilters(matched);
    const filteredAll = applyFilters(
        allRequests.filter(r => !matched.some(m => m.id === r.id))
    );
    const filteredMine = applyFilters(myRequests);

    const totalBrowseVisible = filteredMatched.length + filteredAll.length;

    // Render card wrapper
    const renderCard = (req: LocumRequest, options?: { my?: boolean }) => (
        <LocumCard
            key={req.id}
            req={req}
            isOwn={req.requester_id === currentUserId}
            hasApplied={appliedIds.has(req.id)}
            onApply={(r) => setApplySheet({ isOpen: true, request: r })}
            onViewApplicants={
                options?.my || req.requester_id === currentUserId
                    ? (r) => setInboxOpen({ isOpen: true, request: r })
                    : undefined
            }
        />
    );

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto px-3 md:px-6 py-4 md:py-8 pb-24">

                {/* Header */}
                <div className="mb-5 md:mb-8">
                    <span className="inline-block text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                        Locum & Cover
                    </span>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
                        Find or Offer Shift Cover
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-1">
                        Open shifts from facilities and colleagues near you.
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-1 shadow-sm mb-4 flex">
                    <button
                        onClick={() => setTab('browse')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${tab === 'browse'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
                            }`}
                    >
                        Browse Shifts
                    </button>
                    <button
                        onClick={() => setTab('mine')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${tab === 'mine'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
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

                {/* Filters (only on browse) */}
                {tab === 'browse' && (
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-4 md:p-5 shadow-sm mb-4 md:mb-6 space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by facility, location, or specialty..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                            />
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setUrgencyFilter('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${urgencyFilter === 'all'
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
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
                                        : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${URGENCY_META[u].dot}`} />
                                    {URGENCY_META[u].label}
                                </button>
                            ))}

                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition disabled:opacity-50 active:scale-[97%]"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">{refreshing ? 'Refreshing' : 'Refresh'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="space-y-3 md:space-y-4">
                        {[1, 2, 3].map(i => <LocumCardSkeleton key={i} />)}
                    </div>
                ) : tab === 'browse' ? (
                    totalBrowseVisible === 0 ? (
                        <div className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-2xl p-8 md:p-16 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-slate-400 mx-auto mb-6 border border-slate-100 dark:border-zinc-800">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                                {searchTerm || urgencyFilter !== 'all' ? 'No matching shifts' : 'No shifts available right now'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
                                {searchTerm || urgencyFilter !== 'all'
                                    ? 'Try clearing your filters.'
                                    : 'Be the first — post a request and reach nurses near you.'}
                            </p>
                            {!searchTerm && urgencyFilter === 'all' && (
                                <button
                                    onClick={() => navigate('/locum/new')}
                                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold active:scale-[98%] transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    Post a Shift Cover Request
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {filteredMatched.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                                            Matched for You
                                        </h2>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                                            · {filteredMatched.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        {filteredMatched.map(r => renderCard(r))}
                                    </div>
                                </div>
                            )}

                            {filteredAll.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                            <Briefcase className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                                            All Locums
                                        </h2>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                                            · {filteredAll.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        {filteredAll.map(r => renderCard(r))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    // MY REQUESTS TAB
                    filteredMine.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-2xl p-8 md:p-16 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-slate-400 mx-auto mb-6 border border-slate-100 dark:border-zinc-800">
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
                                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold active:scale-[98%] transition"
                            >
                                <Plus className="w-4 h-4" />
                                Post Your First Request
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 md:space-y-4">
                            {filteredMine.map(r => renderCard(r, { my: true }))}
                        </div>
                    )
                )}
            </div>

            {/* FAB */}
            <button
                onClick={() => navigate('/locum/new')}
                className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-2xl shadow-amber-500/40 flex items-center justify-center transition-all active:scale-95 group"
                aria-label="Post a shift cover request"
                title="Post a shift cover request"
            >
                <Plus className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Apply bottom sheet */}
            <AnimatePresence>
                {applySheet.isOpen && applySheet.request && (
                    <ApplySheet
                        isOpen={applySheet.isOpen}
                        onClose={() => setApplySheet({ isOpen: false, request: null })}
                        request={applySheet.request}
                        onSubmit={handleApply}
                        isSubmitting={isSubmitting}
                    />
                )}
            </AnimatePresence>

            {/* Applicants Inbox bottom sheet */}
            <AnimatePresence>
                {inboxOpen.isOpen && inboxOpen.request && (
                    <ApplicantsInbox
                        isOpen={inboxOpen.isOpen}
                        onClose={() => setInboxOpen({ isOpen: false, request: null })}
                        request={inboxOpen.request}
                        currentUserId={currentUserId}
                        onAccepted={() => {
                            if (currentUserId) loadAll(currentUserId, true);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}