import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    X, ThumbsUp, MessageSquare, Tag, Calendar, Trash2, Send, Star, Pencil
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';

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
    "Neurology", "Student Helper", "Mentor", "Peer Support",
    "Clinical Excellence", "Patient Safety", "Infection Control"
];

export const EndorsementManager: React.FC<EndorsementManagerProps> = ({
    isOpen,
    onClose,
    profileId,
    profileName,
    currentUserId,
    onEndorsementChange
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

    const sheetY = useMotionValue(0);
    const sheetOpacity = useTransform(sheetY, [0, 200], [1, 0.4]);

    useEffect(() => {
        if (isOpen && profileId) {
            fetchEndorsements();
            checkIfUserHasEndorsed();
        } else {
            setShowForm(false);
            setIsEditing(false);
            setSelectedMessages([]);
            setCustomMessage('');
            setSelectedSpecialty('');
            setConfirmDeleteId(null);
        }
    }, [isOpen, profileId]);

    const fetchEndorsements = async () => {
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
                    endorser_title: p?.qualification || p?.nursing_level || 'Healthcare Professional'
                };
            });

            setEndorsements(formatted);
        } catch (err) {
            console.error('Error fetching endorsements:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkIfUserHasEndorsed = async () => {
        if (!currentUserId) {
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
    };

    const handleDeleteEndorsement = async (endorsementId: string) => {
        setDeleting(endorsementId);
        try {
            const { error } = await supabase
                .from('profile_endorsements')
                .delete()
                .eq('id', endorsementId);
            if (error) throw error;

            setConfirmDeleteId(null);
            await fetchEndorsements();
            await checkIfUserHasEndorsed();
            onEndorsementChange?.();
        } catch (err) {
            console.error('Error deleting endorsement:', err);
            alert('Failed to delete endorsement. Please try again.');
        } finally {
            setDeleting(null);
        }
    };

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

    const handleStartEdit = () => {
        const mine = endorsements.find(e => e.endorser_id === currentUserId);
        if (mine) {
            setCustomMessage(mine.message || '');
            setSelectedSpecialty(mine.specialty || '');
            setSelectedMessages([]);
        }
        setIsEditing(true);
        setShowForm(true);
    };

    const handleSubmitEndorsement = async () => {
        if (!currentUserId || !profileId) return;
        const message = getFinalMessage();

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('profile_endorsements')
                .upsert({
                    endorser_id: currentUserId,
                    profile_id: profileId,
                    specialty: selectedSpecialty || null,
                    message
                }, { onConflict: 'endorser_id,profile_id' });

            if (error) throw error;

            setSelectedMessages([]);
            setCustomMessage('');
            setSelectedSpecialty('');
            setShowForm(false);
            setIsEditing(false);

            await fetchEndorsements();
            await checkIfUserHasEndorsed();
            onEndorsementChange?.();
        } catch (err) {
            console.error('Error submitting endorsement:', err);
            alert('Failed to submit endorsement. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedMessages([]);
        setCustomMessage('');
        setSelectedSpecialty('');
        setShowForm(false);
        setIsEditing(false);
    };

    const handleClose = () => {
        sheetY.set(0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
        >
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                style={{ y: sheetY, opacity: sheetOpacity }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 120 || info.velocity.y > 500) {
                        handleClose();
                    } else {
                        sheetY.set(0);
                    }
                }}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[92vh] md:max-h-[85vh] shadow-2xl overflow-hidden flex flex-col md:border md:border-slate-200/60 md:dark:border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle (mobile only) */}
                <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 dark:border-zinc-800/80 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
                            <ThumbsUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                                Endorsements
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                {endorsements.length} for {profileName}
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

                {/* Add / Edit form */}
                {currentUserId && !hasEndorsedBefore && (
                    <div className="px-4 md:px-5 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/10 flex-shrink-0">
                        {!showForm ? (
                            <button
                                onClick={() => setShowForm(true)}
                                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-[98%] min-h-[48px]"
                            >
                                <Star className="w-4 h-4" />
                                Endorse {profileName}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                                        Write your endorsement
                                    </h4>
                                    <button
                                        onClick={resetForm}
                                        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
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
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                        Add a personal note (optional)
                                    </label>
                                    <textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="Write something meaningful about their skills or character..."
                                        rows={3}
                                        className="w-full text-sm px-3.5 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                        <Tag className="w-4 h-4" />
                                        Specialty (optional)
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

                                <button
                                    onClick={handleSubmitEndorsement}
                                    disabled={submitting || (selectedMessages.length === 0 && !customMessage.trim())}
                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[98%] min-h-[48px]"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            {isEditing ? 'Update Endorsement' : 'Submit Endorsement'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Already endorsed state */}
                {currentUserId && hasEndorsedBefore && !showForm && (
                    <div className="px-4 md:px-5 py-3 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800/30 flex items-center justify-between gap-3 flex-shrink-0">
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2 flex-1">
                            <ThumbsUp className="w-4 h-4 fill-current flex-shrink-0" />
                            <span>You endorsed {profileName}</span>
                        </p>
                        <button
                            onClick={handleStartEdit}
                            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </button>
                    </div>
                )}

                {/* Body — endorsements list */}
                <div className="flex-1 overflow-y-auto px-3 md:px-5 py-4 space-y-3">
                    {loading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-4 animate-pulse">
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-zinc-800"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3"></div>
                                            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-full"></div>
                                            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : endorsements.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                <ThumbsUp className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                            </div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-base">
                                No endorsements yet
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                                {!hasEndorsedBefore
                                    ? `Be the first to vouch for ${profileName}.`
                                    : 'Your endorsement will appear here.'}
                            </p>
                        </div>
                    ) : (
                        endorsements.map((endorsement) => {
                            const isMine = endorsement.endorser_id === currentUserId;
                            const isConfirming = confirmDeleteId === endorsement.id;
                            return (
                                <div
                                    key={endorsement.id}
                                    className={`bg-white dark:bg-zinc-900 border rounded-xl p-4 transition-all ${isMine
                                        ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/10'
                                        : 'border-slate-100 dark:border-zinc-800'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {endorsement.endorser_avatar ? (
                                            <img
                                                src={endorsement.endorser_avatar}
                                                alt={endorsement.endorser_name}
                                                className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-zinc-700 flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {endorsement.endorser_name?.charAt(0) || 'P'}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">
                                                            {endorsement.endorser_name}
                                                        </h4>
                                                        {isMine && (
                                                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                                                        {endorsement.endorser_title}
                                                    </p>
                                                </div>

                                                {isMine && (
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        {isConfirming ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleDeleteEndorsement(endorsement.id)}
                                                                    disabled={deleting === endorsement.id}
                                                                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition disabled:opacity-50 active:scale-[98%]"
                                                                >
                                                                    {deleting === endorsement.id ? 'Deleting' : 'Confirm'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmDeleteId(null)}
                                                                    disabled={deleting === endorsement.id}
                                                                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => setConfirmDeleteId(endorsement.id)}
                                                                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                                                                title="Delete your endorsement"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {endorsement.specialty && (
                                                <div className="mt-2">
                                                    <span className="inline-flex text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full items-center gap-1 font-semibold">
                                                        <Tag className="w-3 h-3" />
                                                        {endorsement.specialty}
                                                    </span>
                                                </div>
                                            )}

                                            {endorsement.message && (
                                                <div className="mt-2.5 p-3 bg-slate-50 dark:bg-zinc-950/50 rounded-lg">
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                        "{endorsement.message}"
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-400 dark:text-slate-500">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    {new Date(endorsement.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
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