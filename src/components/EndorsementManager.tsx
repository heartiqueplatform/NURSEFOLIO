import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
    X, ThumbsUp, MessageSquare, Tag, Calendar, Trash2, Send, Pencil, Loader2
} from 'lucide-react';

// ==========================================================
// TYPES
// ==========================================================
interface Endorsement {
    id: string;
    endorser_id: string;
    profile_id: string;
    specialty: string | null;
    message: string | null;
    created_at: string;
    endorser_name?: string;
    endorser_avatar?: string;
    endorser_title?: string;
}

interface EndorsementManagerProps {
    isOpen: boolean;
    onClose: () => void;
    profileId: string;
    profileName: string;
    currentUserId: string;
    onEndorsementChange?: () => void;
}

// ==========================================================
// CONSTANTS
// ==========================================================
const QUICK_MESSAGES = [
    "Great clinical skills",
    "Excellent teamwork",
    "Strong leadership in patient care",
    "Very helpful in training students",
    "Reliable and professional nurse",
    "Compassionate and dedicated",
    "Always goes above and beyond",
    "Wonderful mentor to new nurses",
];

const ENDORSEMENT_SPECIALTIES = [
    "ICU", "Emergency", "Pediatrics", "Oncology", "Cardiology",
    "Neurology", "Student Helper", "Mentor", "Peer Support",
    "Clinical Excellence", "Patient Safety", "Infection Control",
];

// ==========================================================
// HELPERS
// ==========================================================
function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(iso);
}

// ==========================================================
// ENDORSEMENT ROW — flat, edge-to-edge
// ==========================================================
const EndorsementRow = React.memo<{
    endorsement: Endorsement;
    isMine: boolean;
    isConfirming: boolean;
    isDeleting: boolean;
    onRequestDelete: (id: string) => void;
    onCancelDelete: () => void;
    onConfirmDelete: (id: string) => void;
}>(({
    endorsement,
    isMine,
    isConfirming,
    isDeleting,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
}) => {
    const initial = endorsement.endorser_name?.charAt(0)?.toUpperCase() || 'P';

    return (
        <article className="px-4 py-4 border-b border-slate-100 dark:border-zinc-900 last:border-b-0">
            <div className="flex items-start gap-3">
                {endorsement.endorser_avatar ? (
                    <img
                        src={endorsement.endorser_avatar}
                        alt={endorsement.endorser_name}
                        loading="lazy"
                        decoding="async"
                        className="w-11 h-11 rounded-full object-cover bg-slate-100 dark:bg-zinc-900 flex-shrink-0"
                    />
                ) : (
                    <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-sm flex-shrink-0">
                        {initial}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                    {endorsement.endorser_name}
                                </h4>
                                {isMine && (
                                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                        You
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {endorsement.endorser_title}
                            </p>
                        </div>

                        {isMine && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {isConfirming ? (
                                    <>
                                        <button
                                            onClick={() => onConfirmDelete(endorsement.id)}
                                            disabled={isDeleting}
                                            className="text-xs font-bold text-white bg-rose-600 active:bg-rose-700 px-3 py-1.5 rounded-full transition disabled:opacity-50 min-h-[32px] flex items-center gap-1.5"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                'Confirm'
                                            )}
                                        </button>
                                        <button
                                            onClick={onCancelDelete}
                                            disabled={isDeleting}
                                            className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full active:bg-slate-100 dark:active:bg-zinc-900 transition"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => onRequestDelete(endorsement.id)}
                                        className="p-1.5 rounded-full text-slate-400 dark:text-slate-500 active:bg-rose-50 dark:active:bg-rose-950/30 active:text-rose-600 dark:active:text-rose-400 transition"
                                        aria-label="Delete endorsement"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {endorsement.specialty && (
                        <div className="mt-2">
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full font-semibold">
                                <Tag className="w-3 h-3" />
                                {endorsement.specialty}
                            </span>
                        </div>
                    )}

                    {endorsement.message && (
                        <div className="mt-2.5 bg-slate-100 dark:bg-zinc-900 rounded-2xl px-3.5 py-2.5">
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                "{endorsement.message}"
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {relativeTime(endorsement.created_at)}
                    </p>
                </div>
            </div>
        </article>
    );
});
EndorsementRow.displayName = 'EndorsementRow';

// ==========================================================
// SKELETON
// ==========================================================
const EndorsementSkeleton = React.memo(() => (
    <div className="px-4 py-4 border-b border-slate-100 dark:border-zinc-900 animate-pulse">
        <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
            </div>
        </div>
    </div>
));
EndorsementSkeleton.displayName = 'EndorsementSkeleton';

// ==========================================================
// MAIN
// ==========================================================
export const EndorsementManager: React.FC<EndorsementManagerProps> = ({
    isOpen,
    onClose,
    profileId,
    profileName,
    currentUserId,
    onEndorsementChange,
}) => {
    const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const [customMessage, setCustomMessage] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hasEndorsedBefore, setHasEndorsedBefore] = useState(false);

    // ----------------------------------------------------------
    // Fetch
    // ----------------------------------------------------------
    const fetchEndorsements = useCallback(async () => {
        if (!profileId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profile_endorsements')
                .select(`
                    *,
                    endorser:profiles!endorser_id (
                        full_name,
                        first_name,
                        last_name,
                        username,
                        avatar_url,
                        qualification,
                        nursing_level
                    )
                `)
                .eq('profile_id', profileId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted: Endorsement[] = (data || []).map((endorsement: any) => {
                const p = endorsement.endorser;
                let name = 'A Colleague';
                if (p?.full_name && p.full_name !== 'null') {
                    name = p.full_name;
                } else if (p?.first_name && p.first_name !== 'null') {
                    name = `${p.first_name} ${p.last_name || ''}`.trim();
                } else if (p?.username && p.username !== 'null') {
                    name = p.username;
                }
                return {
                    ...endorsement,
                    endorser_name: name,
                    endorser_avatar: p?.avatar_url,
                    endorser_title: p?.qualification || p?.nursing_level || 'Healthcare Professional',
                };
            });

            setEndorsements(formatted);
        } catch (err) {
            console.error('Error fetching endorsements:', err);
        } finally {
            setLoading(false);
        }
    }, [profileId]);

    const checkIfUserHasEndorsed = useCallback(async () => {
        if (!currentUserId || !profileId) {
            setHasEndorsedBefore(false);
            return;
        }
        try {
            const { data } = await supabase
                .from('profile_endorsements')
                .select('id')
                .eq('profile_id', profileId)
                .eq('endorser_id', currentUserId)
                .maybeSingle();
            setHasEndorsedBefore(!!data);
        } catch {
            setHasEndorsedBefore(false);
        }
    }, [currentUserId, profileId]);

    // ----------------------------------------------------------
    // Reset form on close
    // ----------------------------------------------------------
    const resetForm = useCallback(() => {
        setSelectedMessages([]);
        setCustomMessage('');
        setSelectedSpecialty('');
        setShowForm(false);
        setIsEditing(false);
    }, []);

    useEffect(() => {
        if (isOpen && profileId) {
            fetchEndorsements();
            checkIfUserHasEndorsed();
        } else {
            resetForm();
            setConfirmDeleteId(null);
        }
    }, [isOpen, profileId, fetchEndorsements, checkIfUserHasEndorsed, resetForm]);

    // Escape key closes panel
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // ----------------------------------------------------------
    // Delete
    // ----------------------------------------------------------
    const handleDeleteEndorsement = useCallback(async (endorsementId: string) => {
        setDeleting(endorsementId);
        try {
            const { error } = await supabase
                .from('profile_endorsements')
                .delete()
                .eq('id', endorsementId);
            if (error) throw error;

            // Optimistic removal
            setEndorsements(prev => prev.filter(e => e.id !== endorsementId));
            setConfirmDeleteId(null);
            setHasEndorsedBefore(false);
            onEndorsementChange?.();
        } catch (err) {
            console.error('Error deleting endorsement:', err);
            alert('Failed to delete endorsement. Please try again.');
        } finally {
            setDeleting(null);
        }
    }, [onEndorsementChange]);

    const handleRequestDelete = useCallback((id: string) => setConfirmDeleteId(id), []);
    const handleCancelDelete = useCallback(() => setConfirmDeleteId(null), []);

    // ----------------------------------------------------------
    // Form
    // ----------------------------------------------------------
    const handleMessageToggle = useCallback((message: string) => {
        setSelectedMessages(prev =>
            prev.includes(message) ? prev.filter(m => m !== message) : [...prev, message]
        );
    }, []);

    const handleStartEdit = useCallback(() => {
        const mine = endorsements.find(e => e.endorser_id === currentUserId);
        if (mine) {
            setCustomMessage(mine.message || '');
            setSelectedSpecialty(mine.specialty || '');
            setSelectedMessages([]);
        }
        setIsEditing(true);
        setShowForm(true);
    }, [endorsements, currentUserId]);

    const canSubmit = useMemo(() => {
        return selectedMessages.length > 0 || customMessage.trim().length > 0;
    }, [selectedMessages, customMessage]);

    const handleSubmitEndorsement = useCallback(async () => {
        if (!currentUserId || !profileId) return;

        const combined = [...selectedMessages];
        if (customMessage.trim()) combined.push(customMessage.trim());
        const message = combined.length > 0 ? combined.join('. ') : null;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('profile_endorsements')
                .upsert(
                    {
                        endorser_id: currentUserId,
                        profile_id: profileId,
                        specialty: selectedSpecialty || null,
                        message,
                    },
                    { onConflict: 'endorser_id,profile_id' }
                );

            if (error) throw error;

            resetForm();
            await fetchEndorsements();
            await checkIfUserHasEndorsed();
            onEndorsementChange?.();
        } catch (err) {
            console.error('Error submitting endorsement:', err);
            alert('Failed to submit endorsement. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }, [
        currentUserId, profileId, selectedMessages, customMessage, selectedSpecialty,
        resetForm, fetchEndorsements, checkIfUserHasEndorsed, onEndorsementChange,
    ]);

    if (!isOpen) return null;

    // ----------------------------------------------------------
    // Render
    // ----------------------------------------------------------
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[92vh] md:max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle (mobile) */}
                <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 dark:border-zinc-900 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
                            <ThumbsUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                                Endorsements
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {loading
                                    ? 'Loading...'
                                    : `${endorsements.length} for ${profileName}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full active:bg-slate-100 dark:active:bg-zinc-900 transition flex-shrink-0"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </button>
                </div>

                {/* ============================================
                    ENDORSE CTA — if user hasn't endorsed yet
                    ============================================ */}
                {currentUserId && !hasEndorsedBefore && !showForm && (
                    <div className="px-4 md:px-5 py-4 border-b border-slate-100 dark:border-zinc-900 flex-shrink-0">
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full py-3.5 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition flex items-center justify-center gap-2 min-h-[48px]"
                        >
                            <ThumbsUp className="w-4 h-4" />
                            Endorse {profileName}
                        </button>
                    </div>
                )}

                {/* ============================================
                    ENDORSE FORM
                    ============================================ */}
                {currentUserId && showForm && (
                    <div className="px-4 md:px-5 py-4 border-b border-slate-100 dark:border-zinc-900 flex-shrink-0 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                {isEditing ? 'Edit your endorsement' : 'Write your endorsement'}
                            </h4>
                            <button
                                onClick={resetForm}
                                className="text-xs font-semibold text-slate-500 dark:text-slate-400 active:opacity-70 px-2 py-1"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Quick praise chips */}
                        <div className="mb-4">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Quick praise
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_MESSAGES.map((msg) => {
                                    const selected = selectedMessages.includes(msg);
                                    return (
                                        <button
                                            key={msg}
                                            type="button"
                                            onClick={() => handleMessageToggle(msg)}
                                            className={`text-xs px-3 py-2 rounded-full transition-colors font-semibold ${selected
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-zinc-800'
                                                }`}
                                        >
                                            {msg}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom message */}
                        <div className="mb-4">
                            <label htmlFor="endorse-message" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                Personal note <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                            </label>
                            <textarea
                                id="endorse-message"
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Write something meaningful about their skills or character..."
                                rows={3}
                                className="w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition resize-none"
                            />
                        </div>

                        {/* Specialty */}
                        <div className="mb-4">
                            <label htmlFor="endorse-specialty" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                <Tag className="w-3.5 h-3.5 inline mr-1" />
                                Specialty <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                            </label>
                            <select
                                id="endorse-specialty"
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value)}
                                className="w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-700 dark:text-slate-300 transition"
                            >
                                <option value="">Select a specialty</option>
                                {ENDORSEMENT_SPECIALTIES.map((spec) => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleSubmitEndorsement}
                            disabled={submitting || !canSubmit}
                            className="w-full py-3.5 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    {isEditing ? 'Update endorsement' : 'Submit endorsement'}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* ============================================
                    ALREADY ENDORSED STATE
                    ============================================ */}
                {currentUserId && hasEndorsedBefore && !showForm && (
                    <div className="px-4 md:px-5 py-3 bg-emerald-50 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between gap-3 flex-shrink-0">
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2 flex-1 min-w-0">
                            <ThumbsUp className="w-4 h-4 fill-current flex-shrink-0" />
                            <span className="truncate">You endorsed {profileName}</span>
                        </p>
                        <button
                            onClick={handleStartEdit}
                            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 active:opacity-70 flex items-center gap-1.5 px-3 py-1.5 rounded-full active:bg-emerald-100 dark:active:bg-emerald-900/40 transition flex-shrink-0"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </button>
                    </div>
                )}

                {/* ============================================
                    LIST
                    ============================================ */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {loading ? (
                        <>
                            <EndorsementSkeleton />
                            <EndorsementSkeleton />
                            <EndorsementSkeleton />
                        </>
                    ) : endorsements.length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                <ThumbsUp className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                No endorsements yet
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                                {!hasEndorsedBefore
                                    ? `Be the first to vouch for ${profileName}.`
                                    : 'Your endorsement will appear here.'}
                            </p>
                        </div>
                    ) : (
                        endorsements.map((endorsement) => (
                            <EndorsementRow
                                key={endorsement.id}
                                endorsement={endorsement}
                                isMine={endorsement.endorser_id === currentUserId}
                                isConfirming={confirmDeleteId === endorsement.id}
                                isDeleting={deleting === endorsement.id}
                                onRequestDelete={handleRequestDelete}
                                onCancelDelete={handleCancelDelete}
                                onConfirmDelete={handleDeleteEndorsement}
                            />
                        ))
                    )}
                </div>

                {/* ============================================
                    FOOTER
                    ============================================ */}
                <div
                    className="px-4 md:px-5 py-3 border-t border-slate-100 dark:border-zinc-900 flex-shrink-0"
                    style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
                >
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};