/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { locumService, LocumRequest, LocumOffer, LocumUrgency } from '../services/locumService';
import { VerificationBadge } from '../components/VerificationBadge';
import {
    ArrowLeft, Users, CheckCircle2, MessageSquare,
    Phone, MessageCircle, MapPin, Calendar, Clock,
    Loader2
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

const normalizeWhatsApp = (raw: string | null | undefined): string => {
    if (!raw) return '';
    const digits = raw.replace(/[^\d]/g, '');
    if (digits.startsWith('0')) return '254' + digits.slice(1);
    return digits;
};

// ==========================================
// SKELETON
// ==========================================
const ApplicantSkeleton = React.memo(() => (
    <div className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900 animate-pulse">
        <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
            </div>
        </div>
        <div className="mt-3 h-14 bg-slate-100 dark:bg-zinc-900 rounded-2xl" />
        <div className="mt-3 h-10 bg-slate-200 dark:bg-zinc-800 rounded-full" />
    </div>
));

// ==========================================
// APPLICANT CARD
// ==========================================
const ApplicantCard = React.memo<{
    offer: LocumOffer;
    isAccepted: boolean;
    anotherAccepted: boolean;
    isConfirming: boolean;
    isAccepting: boolean;
    onStartConfirm: (id: string) => void;
    onCancelConfirm: () => void;
    onConfirmAccept: (id: string) => void;
}>(({
    offer,
    isAccepted,
    anotherAccepted,
    isConfirming,
    isAccepting,
    onStartConfirm,
    onCancelConfirm,
    onConfirmAccept
}) => {
    const isDeclined = offer.status === 'declined';
    const isWithdrawn = offer.status === 'withdrawn';
    const phone = offer.applicant?.phone_number || '';
    const whatsapp = offer.applicant?.whatsapp_number || '';
    const inactive = isDeclined || isWithdrawn;

    return (
        <article
            className={`bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900 ${inactive ? 'opacity-60' : ''
                }`}
        >
            {/* Status ribbon for accepted */}
            {isAccepted && (
                <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accepted
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-3">
                <img
                    src={offer.applicant?.avatar_url || '/192.png'}
                    alt={getApplicantName(offer)}
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-12 rounded-full object-cover bg-slate-100 dark:bg-zinc-900 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-base truncate">
                            {getApplicantName(offer)}
                        </span>
                        {offer.applicant?.verification_status === 'verified' && (
                            <span className="w-4 h-4 flex-shrink-0">
                                <VerificationBadge status="verified" showText={false} />
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
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                        {offer.applicant?.qualification || offer.applicant?.nursing_level || 'Nurse'}
                    </p>
                </div>
            </div>

            {/* Message */}
            {offer.message && (
                <div className="mt-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3">
                    <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            "{offer.message}"
                        </p>
                    </div>
                </div>
            )}

            {/* Contact — only if accepted */}
            {isAccepted && (phone || whatsapp) && (
                <div className="mt-3 flex gap-2">
                    {whatsapp && (
                        <a
                            href={`https://wa.me/${normalizeWhatsApp(whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 active:bg-emerald-600 text-white text-sm font-bold transition min-h-[44px]"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </a>
                    )}
                    {phone && (
                        <a
                            href={`tel:${phone}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 active:bg-indigo-700 text-white text-sm font-bold transition min-h-[44px]"
                        >
                            <Phone className="w-4 h-4" />
                            Call
                        </a>
                    )}
                </div>
            )}

            {/* Accept / Confirm */}
            {!isAccepted && !inactive && !anotherAccepted && (
                <div className="mt-3">
                    {isConfirming ? (
                        <div className="flex gap-2">
                            <button
                                onClick={onCancelConfirm}
                                disabled={isAccepting}
                                className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-semibold active:opacity-70 transition min-h-[44px] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onConfirmAccept(offer.id)}
                                disabled={isAccepting}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-emerald-500 active:bg-emerald-600 text-white text-sm font-bold transition min-h-[44px] disabled:opacity-50"
                            >
                                {isAccepting ? (
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
                            onClick={() => onStartConfirm(offer.id)}
                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-emerald-500 active:bg-emerald-600 text-white text-sm font-bold transition min-h-[44px]"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Accept this Nurse
                        </button>
                    )}
                </div>
            )}

            {/* Someone else already accepted */}
            {anotherAccepted && !inactive && (
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 italic">
                    Another nurse was accepted for this shift.
                </p>
            )}
        </article>
    );
});

ApplicantCard.displayName = 'ApplicantCard';

// ==========================================
// MAIN PAGE
// ==========================================
export default function LocumApplicants() {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [request, setRequest] = useState<LocumRequest | null>(null);
    const [offers, setOffers] = useState<LocumOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [accepting, setAccepting] = useState<string | null>(null);
    const [confirmAccept, setConfirmAccept] = useState<string | null>(null);

    const handleBack = useCallback(() => {
        navigate('/locum');
    }, [navigate]);

    // ---------------------------------------------
    // Load
    // ---------------------------------------------
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (cancelled) return;
                if (!user) {
                    navigate('/login');
                    return;
                }
                setCurrentUserId(user.id);

                if (!requestId) {
                    setError('Missing request ID');
                    return;
                }

                const { data: reqData, error: reqErr } = await supabase
                    .from('locum_requests')
                    .select(`
                        *,
                        requester:profiles!requester_id (
                            id, first_name, last_name, full_name, username,
                            avatar_url, qualification, verification_status
                        )
                    `)
                    .eq('id', requestId)
                    .single();

                if (cancelled) return;

                if (reqErr || !reqData) {
                    setError('Request not found');
                    return;
                }

                if (reqData.requester_id !== user.id) {
                    setError('Only the requester can view applicants');
                    return;
                }

                setRequest(reqData as LocumRequest);

                const offerData = await locumService.getOffersForRequest(requestId);
                if (cancelled) return;
                setOffers(offerData);
            } catch (err) {
                console.error('Load applicants error:', err);
                if (!cancelled) setError('Failed to load applicants');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [requestId, navigate]);

    // ---------------------------------------------
    // Accept
    // ---------------------------------------------
    const handleAccept = useCallback(async (offerId: string) => {
        if (!currentUserId || !requestId) return;
        setAccepting(offerId);
        try {
            await locumService.acceptOffer(offerId, currentUserId);

            // ✅ OPTIMISTIC: patch state locally instead of refetching all offers
            setOffers(prev =>
                prev.map(o => {
                    if (o.id === offerId) return { ...o, status: 'accepted' as const };
                    if (o.status === 'pending') return { ...o, status: 'declined' as const };
                    return o;
                })
            );

            // Update request status locally
            setRequest(prev => (prev ? { ...prev, status: 'filled' as const } : prev));

            setConfirmAccept(null);
        } catch (err) {
            console.error('Accept offer error:', err);
            alert('Failed to accept. Please try again.');
        } finally {
            setAccepting(null);
        }
    }, [currentUserId, requestId]);

    const handleStartConfirm = useCallback((id: string) => setConfirmAccept(id), []);
    const handleCancelConfirm = useCallback(() => setConfirmAccept(null), []);

    // ---------------------------------------------
    // Derived
    // ---------------------------------------------
    const { acceptedOffer, pendingOffers } = useMemo(() => {
        return {
            acceptedOffer: offers.find(o => o.status === 'accepted'),
            pendingOffers: offers.filter(o => o.status === 'pending')
        };
    }, [offers]);

    const meta = request ? URGENCY_META[request.urgency] : null;

    // ---------------------------------------------
    // Loading
    // ---------------------------------------------
    if (loading) {
        return (
            <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
                <div className="max-w-2xl mx-auto md:px-6 md:py-8">
                    <div className="p-4 border-b border-slate-100 dark:border-zinc-900">
                        <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded w-32 animate-pulse" />
                    </div>
                    {[1, 2, 3].map(i => <ApplicantSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    // ---------------------------------------------
    // Error
    // ---------------------------------------------
    if (error || !request || !meta) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
                <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-8">
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition mb-4"
                        aria-label="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center py-12 px-6">
                        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-rose-500" />
                        </div>
                        <h2 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">
                            {error || 'Something went wrong'}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            You may not have permission to view this page.
                        </p>
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 active:bg-amber-600 text-white text-sm font-semibold transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Locum
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ---------------------------------------------
    // Main
    // ---------------------------------------------
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
            <div className="max-w-2xl mx-auto md:px-6 md:py-8">

                {/* Header */}
                <div className="flex items-center gap-3 px-4 md:px-0 py-4 md:py-0 md:mb-6 border-b border-slate-100 dark:border-zinc-900 md:border-0">
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition"
                        aria-label="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Applicants
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {offers.length} {offers.length === 1 ? 'nurse applied' : 'nurses applied'}
                        </p>
                    </div>
                </div>

                {/* Request recap — flat, edge-to-edge on mobile */}
                <div className="bg-white dark:bg-zinc-950 px-4 py-4 border-b border-slate-100 dark:border-zinc-900 md:rounded-2xl md:border-0 md:mb-6">
                    <div className="flex items-center gap-2 flex-wrap mb-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${meta.classes}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                        </span>
                        {request.specialty && (
                            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">
                                {request.specialty}
                            </span>
                        )}
                        {request.status !== 'open' && (
                            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                                {request.status === 'filled' ? 'Filled' : 'Cancelled'}
                            </span>
                        )}
                    </div>

                    <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {request.facility_name || 'Shift Cover Needed'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{request.facility_location}</span>
                    </p>

                    <div className="mt-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl px-3.5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            {formatShiftDate(request.shift_date)}
                        </span>
                        {request.shift_start && request.shift_end && (
                            <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                {request.shift_start} – {request.shift_end}
                            </span>
                        )}
                    </div>
                </div>

                {/* Accepted banner */}
                {acceptedOffer && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 px-4 py-4 flex items-start gap-3 border-b border-emerald-100 dark:border-emerald-900/50 md:rounded-2xl md:border-0 md:mb-6">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                                Shift covered
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                You accepted {getApplicantName(acceptedOffer)} for this shift.
                                {pendingOffers.length > 0 && ` ${pendingOffers.length} other ${pendingOffers.length === 1 ? 'applicant was' : 'applicants were'} automatically declined.`}
                            </p>
                        </div>
                    </div>
                )}

                {/* List */}
                {offers.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400 mx-auto mb-6">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                            No applications yet
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
                            Your request is live. Nurses nearby will see it and can apply.
                        </p>
                        <button
                            onClick={handleBack}
                            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 active:bg-amber-600 text-white text-sm font-semibold transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Locum
                        </button>
                    </div>
                ) : (
                    <div>
                        {offers.map(offer => (
                            <ApplicantCard
                                key={offer.id}
                                offer={offer}
                                isAccepted={offer.status === 'accepted'}
                                anotherAccepted={!!acceptedOffer && acceptedOffer.id !== offer.id}
                                isConfirming={confirmAccept === offer.id}
                                isAccepting={accepting === offer.id}
                                onStartConfirm={handleStartConfirm}
                                onCancelConfirm={handleCancelConfirm}
                                onConfirmAccept={handleAccept}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}