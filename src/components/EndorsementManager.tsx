import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, ThumbsUp, MessageSquare, Tag, Calendar, User, Trash2, Send, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

// Quick message templates
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

// Predefined specialty options
const ENDORSEMENT_SPECIALTIES = [
    "ICU",
    "Emergency",
    "Pediatrics",
    "Oncology",
    "Cardiology",
    "Neurology",
    "Student Helper",
    "Mentor",
    "Peer Support",
    "Clinical Excellence",
    "Patient Safety",
    "Infection Control"
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

    // New endorsement form state
    const [showForm, setShowForm] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const [customMessage, setCustomMessage] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [hasEndorsedBefore, setHasEndorsedBefore] = useState(false);

    useEffect(() => {
        if (isOpen && profileId) {
            fetchEndorsements();
            checkIfUserHasEndorsed();
        }
    }, [isOpen, profileId]);

    const fetchEndorsements = async () => {
        setLoading(true);
        try {
            // Fetch endorsements and JOIN with profiles in ONE step
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

            const formatted = (data || []).map((endorsement: any) => {
                const p = endorsement.endorser;

                // Logic to prevent "null" strings appearing in the list
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
        try {
            const { data, error } = await supabase
                .from('profile_endorsements')
                .select('id')
                .eq('profile_id', profileId)
                .eq('endorser_id', currentUserId)
                .maybeSingle();
            setHasEndorsedBefore(!!data);
        } catch (err) {
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

            // Refresh the list
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
            prev.includes(message)
                ? prev.filter(m => m !== message)
                : [...prev, message]
        );
    };

    const getFinalMessage = (): string | null => {
        const combined = [...selectedMessages];
        if (customMessage.trim()) {
            combined.push(customMessage.trim());
        }
        return combined.length > 0 ? combined.join('. ') : null;
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
                    message: message,
                }, { onConflict: 'endorser_id,profile_id' });

            if (error) throw error;

            // Reset form
            setSelectedMessages([]);
            setCustomMessage('');
            setSelectedSpecialty('');
            setShowForm(false);

            // Refresh endorsements
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
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <ThumbsUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <h3 className="font-display font-bold text-slate-900 dark:text-white">
                                Endorsements for {profileName}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {endorsements.length} peer endorsement{endorsements.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Add Endorsement Button (if user hasn't endorsed yet) */}
                {!hasEndorsedBefore && currentUserId && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                        {!showForm ? (
                            <button
                                onClick={() => setShowForm(true)}
                                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                            >
                                <Star className="w-4 h-4" />
                                Endorse {profileName}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                        Write your endorsement
                                    </h4>
                                    <button
                                        onClick={resetForm}
                                        className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                {/* Quick Message Templates */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Quick praise (select one or more)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_MESSAGES.map((msg) => (
                                            <button
                                                key={msg}
                                                type="button"
                                                onClick={() => handleMessageToggle(msg)}
                                                className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${selectedMessages.includes(msg)
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-transparent'
                                                    } border`}
                                            >
                                                {msg}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Message Input */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                        Add personal note (optional)
                                    </label>
                                    <textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="Write something meaningful about their skills or character..."
                                        rows={2}
                                        className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 transition resize-none"
                                    />
                                </div>

                                {/* Specialty Selector */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                        <Tag className="w-3.5 h-3.5" />
                                        Specialty category (optional)
                                    </label>
                                    <select
                                        value={selectedSpecialty}
                                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                                        className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                                    >
                                        <option value="">Select a specialty (optional)</option>
                                        {ENDORSEMENT_SPECIALTIES.map((spec) => (
                                            <option key={spec} value={spec}>{spec}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmitEndorsement}
                                    disabled={submitting || (selectedMessages.length === 0 && !customMessage.trim())}
                                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Endorsement
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Show message if user already endorsed */}
                {hasEndorsedBefore && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800/30">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center flex items-center justify-center gap-2">
                            <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                            You've already endorsed {profileName}. You can manage your endorsement below.
                        </p>
                    </div>
                )}

                {/* Modal Body - Endorsements List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        // Loading skeletons
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 animate-pulse">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : endorsements.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <ThumbsUp className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300">No endorsements yet</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {!hasEndorsedBefore ? 'Be the first to endorse!' : 'No one has endorsed yet.'}
                            </p>
                        </div>
                    ) : (
                        endorsements.map((endorsement) => (
                            <div
                                key={endorsement.id}
                                className={`bg-white dark:bg-zinc-900 border rounded-xl p-4 hover:shadow-md transition-all ${endorsement.endorser_id === currentUserId
                                    ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/10'
                                    : 'border-slate-200 dark:border-slate-800'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {endorsement.endorser_name?.charAt(0) || 'P'}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                        {endorsement.endorser_name}
                                                    </h4>
                                                    {endorsement.endorser_id === currentUserId && (
                                                        <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                    {endorsement.endorser_title}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {endorsement.specialty && (
                                                    <span className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Tag className="w-2.5 h-2.5" />
                                                        {endorsement.specialty}
                                                    </span>
                                                )}
                                                {endorsement.endorser_id === currentUserId && (
                                                    <button
                                                        onClick={() => handleDeleteEndorsement(endorsement.id)}
                                                        disabled={deleting === endorsement.id}
                                                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition disabled:opacity-50"
                                                        title="Delete your endorsement"
                                                    >
                                                        {deleting === endorsement.id ? (
                                                            <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Message */}
                                        {endorsement.message && (
                                            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                <div className="flex items-start gap-1.5">
                                                    <MessageSquare className="w-3 h-3 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        {endorsement.message}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Date */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                {new Date(endorsement.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};