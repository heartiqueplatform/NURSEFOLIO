/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { locumService, LocumRequest, LocumOffer, LocumUrgency } from '../services/locumService';
import { VerificationBadge } from '../components/VerificationBadge';
import {
    ArrowLeft, Inbox, Users, CheckCircle2, XCircle, MessageSquare,
    Phone, MessageCircle, MapPin, Calendar, Clock, AlertCircle,
    ChevronRight, Loader2
} from 'lucide-react';

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

    // ---------------------------------------------
    // Load user, request, offers
    // ---------------------------------------------
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate('/login');
                    return;
                }
                setCurrentUserId(user.id);

                if (!requestId) {
                    setError('Missing request ID');
                    return;
                }

                // Fetch the request
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

                if (reqErr || !reqData) {
                    setError('Request not found');
                    return;
                }

                // Verify ownership — only the requester can view applicants
                if (reqData.requester_id !== user.id) {
                    setError('Only the requester can view applicants');
                    return;
                }

                setRequest(reqData as LocumRequest);

                // Fetch offers
                const offerData = await locumService.getOffersForRequest(requestId);
                setOffers(offerData);
            } catch (err) {
                console.error('Load applicants error:', err);
                setError('Failed to load applicants');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [requestId, navigate]);

    // ---------------------------------------------
    // Accept
    // ---------------------------------------------
    const handleAccept = async (offerId: string) => {
        if (!currentUserId || !requestId) return;
        setAccepting(offerId);
        try {
            await locumService.acceptOffer(offerId, currentUserId);
            // Refresh offers
            const fresh = await locumService.getOffersForRequest(requestId);
            setOffers(fresh);
            setConfirmAccept(null);
        } catch (err) {
            console.error('Accept offer error:', err);
            alert('Failed to accept. Please try again.');
        } finally {
            setAccepting(null);
        }
    };

    const handleBack = () => {
        navigate('/locum');
    };

    // ---------------------------------------------
    // Loading state
    // ---------------------------------------------
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading applicants...</p>
                </div>
            </div>
        );
    }

    // ---------------------------------------------
    // Error state
    // ---------------------------------------------
    if (error || !request) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
                <div className="max-w-2xl mx-auto px-3 md:px-6 py-4 md:py-8">
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-95 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="bg-white dark:bg-zinc-950 border border-rose-200 dark:border-rose-900 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-rose-500" />
                        </div>
                        <h2 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">
                            {error || 'Something went wrong'}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            You may not have permission to view this page.
                        </p>
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold active:scale-[98%] transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Locum
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const meta = URGENCY_META[request.urgency];
    const acceptedOffer = offers.find(o => o.status === 'accepted');
    const pendingOffers = offers.filter(o => o.status === 'pending');

    // ---------------------------------------------
    // Main render
    // ---------------------------------------------
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
            <div className="max-w-2xl mx-auto px-3 md:px-6 py-4 md:py-8">

                {/* Header */}
                <div className="flex items-center gap-3 mb-5 md:mb-6">
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-95"
                        aria-label="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Applicants
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {offers.length} {offers.length === 1 ? 'nurse applied' : 'nurses applied'}
                        </p>
                    </div>
                </div>

                {/* Request recap card */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-4 md:p-5 mb-5 shadow-sm">
                    <div className="flex items-center gap-2 flex-wrap mb-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${meta.classes}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                        </span>
                        {request.specialty && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                                {request.specialty}
                            </span>
                        )}
                        {request.status !== 'open' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-700">
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

                    <div className="mt-3 bg-slate-50 dark:bg-zinc-900 rounded-xl px-3.5 py-3 border border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-x-4 gap-y-1.5">
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

                {/* Status banner if already accepted */}
                {acceptedOffer && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 mb-5 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
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

                {/* Applicants list */}
                {offers.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-2xl p-8 md:p-16 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-slate-400 mx-auto mb-6 border border-slate-100 dark:border-zinc-800">
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
                            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold active:scale-[98%] transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Locum
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 md:space-y-4">
                        {offers.map(offer => {
                            const isAccepted = offer.status === 'accepted';
                            const isDeclined = offer.status === 'declined';
                            const isWithdrawn = offer.status === 'withdrawn';
                            const isConfirming = confirmAccept === offer.id;
                            const phone = offer.applicant?.phone_number || '';
                            const whatsapp = offer.applicant?.whatsapp_number || '';

                            return (
                                <div
                                    key={offer.id}
                                    className={`rounded-2xl border p-4 md:p-5 transition-all ${isAccepted
                                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                                        : isDeclined || isWithdrawn
                                            ? 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 opacity-60'
                                            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
                                        }`}
                                >
                                    {/* Header: avatar + name + status */}
                                    <div className="flex items-start gap-3">
                                        <img
                                            src={offer.applicant?.avatar_url || '/192.png'}
                                            alt={getApplicantName(offer)}
                                            className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-zinc-700 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-bold text-slate-900 dark:text-white text-base truncate">
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
                                            <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                                                {offer.applicant?.qualification || offer.applicant?.nursing_level || 'Nurse'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    {offer.message && (
                                        <div className="mt-3 bg-slate-50 dark:bg-zinc-900 rounded-lg p-3 border border-slate-100 dark:border-zinc-800">
                                            <div className="flex items-start gap-2">
                                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                    "{offer.message}"
                                                </p>
                                            </div>
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

                                    {/* If another applicant was accepted */}
                                    {acceptedOffer && acceptedOffer.id !== offer.id && !isDeclined && !isWithdrawn && (
                                        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 italic">
                                            Another nurse was accepted for this shift.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}