/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ClinicalProcedure } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
    Check, X, FileSignature, UserCheck, Calendar, Hospital,
    Award, AlertCircle, ThumbsUp, ThumbsDown, Send,
    ShieldAlert, LogIn, Search, ChevronLeft, ChevronRight,
    RefreshCw, Loader2, User, ArrowLeft
} from 'lucide-react';

// ==========================================================
// UUID VALIDATOR
// ==========================================================
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ==========================================================
// HELPERS
// ==========================================================
function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

// ==========================================================
// MAIN
// ==========================================================
export default function VerifyProcedure() {
    const { procedureId } = useParams<{ procedureId: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [procedure, setProcedure] = useState<ClinicalProcedure | null>(null);
    const [pendingList, setPendingList] = useState<ClinicalProcedure[]>([]);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Verification form
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [comment, setComment] = useState('');
    const [signature, setSignature] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // ----------------------------------------------------------
    // Fetch role
    // ----------------------------------------------------------
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setUserRole(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (error) throw error;
                if (!cancelled) setUserRole(data?.role || null);
            } catch (err) {
                console.error('Failed to load role:', err);
                if (!cancelled) setUserRole(null);
            }
        })();

        return () => { cancelled = true; };
    }, [user?.id, authLoading]);

    // ----------------------------------------------------------
    // Fetch pending list (nurses only)
    // ----------------------------------------------------------
    const fetchPendingList = useCallback(async () => {
        if (userRole !== 'nurse') return;
        setListLoading(true);
        try {
            const { data, error } = await supabase
                .from('clinical_procedures')
                .select(`
                    *,
                    profiles:user_id (
                        id, first_name, last_name, username, avatar_url
                    )
                `)
                .eq('verification_status', 'pending')
                .order('date_performed', { ascending: false })
                .limit(100);

            if (error) throw error;
            setPendingList((data || []) as ClinicalProcedure[]);
        } catch (err) {
            console.error('Failed to load pending list:', err);
        } finally {
            setListLoading(false);
        }
    }, [userRole]);

    useEffect(() => {
        if (userRole === 'nurse') fetchPendingList();
    }, [userRole, fetchPendingList]);

    // ----------------------------------------------------------
    // Fetch current procedure
    // ----------------------------------------------------------
    useEffect(() => {
        if (authLoading) return;

        // Not a nurse → skip
        if (userRole !== 'nurse') {
            setLoading(false);
            return;
        }

        // Route is `/verify/pending` (no valid UUID) → redirect to first pending
        if (!procedureId || !UUID_REGEX.test(procedureId)) {
            if (pendingList.length > 0) {
                navigate(`/verify/${pendingList[0].id}`, { replace: true });
            } else if (!listLoading) {
                setLoading(false);
            }
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);

                const { data, error } = await supabase
                    .from('clinical_procedures')
                    .select(`
                        *,
                        profiles:user_id (
                            id, first_name, last_name, username, avatar_url
                        )
                    `)
                    .eq('id', procedureId)
                    .maybeSingle();

                if (cancelled) return;
                if (error) throw error;
                if (!data) {
                    setError('This procedure could not be found.');
                    return;
                }

                // 🔴 FIX: Supervisors can't verify their own procedures
                if (data.user_id === user?.id) {
                    setError('You cannot verify your own procedures.');
                    return;
                }

                setProcedure(data as ClinicalProcedure);

                if (data.verification_status === 'verified') {
                    setError('This procedure has already been verified.');
                } else if (data.verification_status === 'rejected') {
                    setError('This procedure was already reviewed and needs revision.');
                }
            } catch (err) {
                console.error('Failed to load procedure:', err);
                if (!cancelled) setError('Could not load this procedure.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [procedureId, userRole, user?.id, authLoading, pendingList, listLoading, navigate]);

    // Reset form when procedure changes
    useEffect(() => {
        setAction(null);
        setComment('');
        setSignature('');
    }, [procedureId]);

    // ----------------------------------------------------------
    // Filtered list
    // ----------------------------------------------------------
    const filteredProcedures = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return pendingList;
        return pendingList.filter(proc => {
            const name = `${proc.profiles?.first_name || ''} ${proc.profiles?.last_name || ''}`.toLowerCase();
            const username = (proc.profiles?.username || '').toLowerCase();
            const procedureName = (proc.procedure_name || '').toLowerCase();
            return name.includes(q) || username.includes(q) || procedureName.includes(q);
        });
    }, [pendingList, searchQuery]);

    const currentIndex = useMemo(
        () => filteredProcedures.findIndex(p => p.id === procedure?.id),
        [filteredProcedures, procedure?.id]
    );

    // ----------------------------------------------------------
    // Navigation
    // ----------------------------------------------------------
    const goTo = useCallback((id: string) => {
        navigate(`/verify/${id}`);
    }, [navigate]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) goTo(filteredProcedures[currentIndex - 1].id);
    }, [currentIndex, filteredProcedures, goTo]);

    const handleNext = useCallback(() => {
        if (currentIndex < filteredProcedures.length - 1) {
            goTo(filteredProcedures[currentIndex + 1].id);
        }
    }, [currentIndex, filteredProcedures, goTo]);

    // ----------------------------------------------------------
    // Submit
    // ----------------------------------------------------------
    const canSubmit = useMemo(() => {
        if (!action || submitting) return false;
        if (!signature.trim()) return false;
        if (action === 'reject' && !comment.trim()) return false;
        return true;
    }, [action, submitting, signature, comment]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!action || !procedure) return;

        if (!signature.trim()) return;
        if (action === 'reject' && !comment.trim()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('clinical_procedures')
                .update({
                    verification_status: action === 'approve' ? 'verified' : 'rejected',
                    supervisor_comment: comment.trim() || null,
                    supervisor_signature: signature.trim(),
                    verified_at: new Date().toISOString(),
                })
                .eq('id', procedure.id);

            if (error) throw error;

            // Remove from local pending list
            setPendingList(prev => prev.filter(p => p.id !== procedure.id));

            // Navigate to next pending, or dashboard
            const next = filteredProcedures.find(p => p.id !== procedure.id);
            if (next) {
                goTo(next.id);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Submit failed:', err);
            setError('Could not submit verification. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }, [action, procedure, signature, comment, filteredProcedures, goTo, navigate]);

    // ----------------------------------------------------------
    // GUARD SCREENS
    // ----------------------------------------------------------
    if (authLoading || (loading && userRole === 'nurse')) {
        return <CenteredLoader />;
    }

    if (!user) {
        return (
            <GuardScreen
                icon={LogIn}
                tone="amber"
                title="Sign in to verify"
                body="You need to be logged in as a registered nurse to verify procedures."
                primaryLabel="Sign in"
                onPrimary={() => navigate('/login')}
            />
        );
    }

    if (userRole !== 'nurse') {
        return (
            <GuardScreen
                icon={ShieldAlert}
                tone="rose"
                title="Nurses only"
                body="Only registered nurses can verify student procedures."
                primaryLabel="Go to dashboard"
                onPrimary={() => navigate('/dashboard')}
            />
        );
    }

    if (error && !procedure) {
        return (
            <GuardScreen
                icon={AlertCircle}
                tone="rose"
                title="Can't open this"
                body={error}
                primaryLabel="Go to dashboard"
                onPrimary={() => navigate('/dashboard')}
                secondaryLabel="Back to list"
                onSecondary={() => navigate('/verify/pending')}
            />
        );
    }

    if (pendingList.length === 0 && !listLoading) {
        return (
            <GuardScreen
                icon={Check}
                tone="emerald"
                title="All caught up"
                body="No pending procedures waiting for verification right now."
                primaryLabel="Go to dashboard"
                onPrimary={() => navigate('/dashboard')}
            />
        );
    }

    const currentStudent = procedure?.profiles;

    // ==========================================================
    // RENDER
    // ==========================================================
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">

            {/* ============================================
                STICKY HEADER
                ============================================ */}
            <header className="sticky top-0 z-30 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition"
                            aria-label="Back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                Verify procedure
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {pendingList.length} pending · {currentIndex + 1} of {filteredProcedures.length} shown
                            </p>
                        </div>
                        <button
                            onClick={fetchPendingList}
                            disabled={listLoading}
                            className="p-2 rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition disabled:opacity-50"
                            aria-label="Refresh list"
                        >
                            <RefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">

                {/* ============================================
                    PENDING PICKER
                    ============================================ */}
                {pendingList.length > 1 && (
                    <section>
                        <div className="relative mb-3">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search student or procedure"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-sm pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-900 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                            />
                        </div>

                        <div className="relative">
                            {currentIndex > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 z-10 w-8 h-8 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center active:opacity-70 transition"
                                    aria-label="Previous"
                                >
                                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                </button>
                            )}

                            <div className="overflow-x-auto scrollbar-hide px-3">
                                <div className="flex gap-2 pb-2 min-w-max">
                                    {filteredProcedures.map(proc => {
                                        const student = proc.profiles;
                                        const isActive = procedure?.id === proc.id;
                                        const initials = `${student?.first_name?.[0] || ''}${student?.last_name?.[0] || ''}`;
                                        return (
                                            <button
                                                key={proc.id}
                                                onClick={() => goTo(proc.id)}
                                                aria-pressed={isActive}
                                                className={`flex flex-col items-center gap-1.5 flex-shrink-0 transition ${isActive ? 'opacity-100' : 'opacity-60'
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${isActive
                                                    ? 'bg-teal-600 ring-2 ring-teal-500/30'
                                                    : 'bg-slate-400 dark:bg-zinc-700'
                                                    }`}>
                                                    {initials || <User className="w-5 h-5" />}
                                                </div>
                                                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 max-w-[64px] truncate">
                                                    {student?.first_name || 'Unknown'}
                                                </span>
                                                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                                    {formatDate(proc.date_performed)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {currentIndex < filteredProcedures.length - 1 && (
                                <button
                                    onClick={handleNext}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 z-10 w-8 h-8 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center active:opacity-70 transition"
                                    aria-label="Next"
                                >
                                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* ============================================
                    PROCEDURE DETAILS
                    ============================================ */}
                {procedure && currentStudent && (
                    <>
                        {/* Student card */}
                        <section className="bg-white dark:bg-zinc-950 rounded-3xl p-5">
                            <div className="flex items-center gap-3">
                                {currentStudent.avatar_url ? (
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800 flex-shrink-0">
                                        <img
                                            src={currentStudent.avatar_url}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {currentStudent.first_name?.[0]}{currentStudent.last_name?.[0]}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {currentStudent.first_name} {currentStudent.last_name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        @{currentStudent.username}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Procedure card */}
                        <section className="bg-white dark:bg-zinc-950 rounded-3xl p-5">
                            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">
                                {procedure.procedure_name}
                            </h2>

                            <div className="space-y-3">
                                <DetailRow icon={Calendar} label="Date performed" value={formatDate(procedure.date_performed)} />
                                <DetailRow icon={Award} label="Competency" value={procedure.competency_level} />
                                <DetailRow
                                    icon={Hospital}
                                    label="Facility"
                                    value={procedure.facility_name || 'Not specified'}
                                />
                                {procedure.department && (
                                    <DetailRow icon={Hospital} label="Department" value={procedure.department} />
                                )}
                                {procedure.attempts_count > 1 && (
                                    <DetailRow icon={Award} label="Attempt" value={`${procedure.attempts_count}`} />
                                )}
                            </div>

                            {/* Reflection */}
                            {(procedure.student_notes || procedure.challenges_faced || procedure.improvement_plan) && (
                                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-zinc-900">
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                                        Student's reflection
                                    </p>
                                    <div className="space-y-3">
                                        {procedure.student_notes && (
                                            <ReflectionBlock label="What I learned" body={procedure.student_notes} tone="neutral" />
                                        )}
                                        {procedure.challenges_faced && (
                                            <ReflectionBlock label="Challenges" body={procedure.challenges_faced} tone="amber" />
                                        )}
                                        {procedure.improvement_plan && (
                                            <ReflectionBlock label="Improvement plan" body={procedure.improvement_plan} tone="teal" />
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* ============================================
                            VERIFICATION FORM
                            ============================================ */}
                        {!error && (
                            <section className="bg-white dark:bg-zinc-950 rounded-3xl p-5">
                                <h2 className="text-base font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                    Your verification
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-5">

                                    {/* Decision */}
                                    <div>
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                                            Decision <span className="text-rose-500">*</span>
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setAction('approve')}
                                                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition min-h-[52px] ${action === 'approve'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-zinc-800'
                                                    }`}
                                            >
                                                <ThumbsUp className="w-4 h-4" />
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAction('reject')}
                                                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition min-h-[52px] ${action === 'reject'
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-zinc-800'
                                                    }`}
                                            >
                                                <ThumbsDown className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label htmlFor="verify-comment" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                            Comments {action === 'reject' && <span className="text-rose-500">*</span>}
                                        </label>
                                        <textarea
                                            id="verify-comment"
                                            rows={3}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder={
                                                action === 'approve'
                                                    ? 'Optional — add positive feedback'
                                                    : action === 'reject'
                                                        ? 'Explain what needs revision'
                                                        : 'Select a decision first'
                                            }
                                            disabled={!action}
                                            className="w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition resize-none disabled:opacity-60"
                                        />
                                        {action === 'reject' && !comment.trim() && (
                                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">
                                                A comment is required when rejecting
                                            </p>
                                        )}
                                    </div>

                                    {/* Signature */}
                                    <div>
                                        <label htmlFor="verify-signature" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                            Your signature <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            id="verify-signature"
                                            type="text"
                                            value={signature}
                                            onChange={(e) => setSignature(e.target.value)}
                                            placeholder="Type your full name"
                                            autoComplete="name"
                                            className="w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                                        />
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                            Your name will be recorded against this verification
                                        </p>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className="w-full py-3.5 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[52px]"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Submitting
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Submit verification
                                            </>
                                        )}
                                    </button>
                                </form>
                            </section>
                        )}

                        {/* Status message if procedure was already processed */}
                        {error && procedure && (
                            <section className="bg-amber-50 dark:bg-amber-950/30 rounded-3xl p-5 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                        {error}
                                    </p>
                                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                                        {procedure.verification_status === 'verified'
                                            ? 'This procedure already carries a verified badge.'
                                            : 'This procedure was rejected. The student can revise and resubmit.'}
                                    </p>
                                    {currentIndex < filteredProcedures.length - 1 && (
                                        <button
                                            onClick={handleNext}
                                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-600 active:bg-amber-700 text-white text-xs font-bold transition"
                                        >
                                            Next pending
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* Loading state while list refreshes */}
                {listLoading && !procedure && (
                    <div className="text-center py-12">
                        <Loader2 className="w-6 h-6 text-teal-600 dark:text-teal-400 animate-spin mx-auto" />
                    </div>
                )}

            </div>
        </div>
    );
}

// ==========================================================
// SUBCOMPONENTS
// ==========================================================
const CenteredLoader = React.memo(() => (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin" />
    </div>
));
CenteredLoader.displayName = 'CenteredLoader';

const GuardScreen = React.memo<{
    icon: any;
    tone: 'emerald' | 'amber' | 'rose';
    title: string;
    body: string;
    primaryLabel: string;
    onPrimary: () => void;
    secondaryLabel?: string;
    onSecondary?: () => void;
}>(({ icon: Icon, tone, title, body, primaryLabel, onPrimary, secondaryLabel, onSecondary }) => {
    const tones = {
        emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
        amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
        rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    };
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4">
            <div className="max-w-sm w-full text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${tones[tone]}`}>
                    <Icon className="w-7 h-7" />
                </div>
                <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                    {title}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {body}
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                    <button
                        onClick={onPrimary}
                        className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[48px]"
                    >
                        {primaryLabel}
                    </button>
                    {secondaryLabel && onSecondary && (
                        <button
                            onClick={onSecondary}
                            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
                        >
                            {secondaryLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});
GuardScreen.displayName = 'GuardScreen';

const DetailRow = React.memo<{
    icon: any;
    label: string;
    value: string;
}>(({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {label}
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {value}
            </p>
        </div>
    </div>
));
DetailRow.displayName = 'DetailRow';

const ReflectionBlock = React.memo<{
    label: string;
    body: string;
    tone: 'neutral' | 'amber' | 'teal';
}>(({ label, body, tone }) => {
    const tones = {
        neutral: 'bg-slate-100 dark:bg-zinc-900',
        amber: 'bg-amber-50 dark:bg-amber-950/30',
        teal: 'bg-teal-50 dark:bg-teal-950/30',
    };
    return (
        <div className={`rounded-2xl p-3.5 ${tones[tone]}`}>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {label}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {body}
            </p>
        </div>
    );
});
ReflectionBlock.displayName = 'ReflectionBlock';