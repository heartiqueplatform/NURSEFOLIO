/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { EndorsementManager } from '../components/EndorsementManager';
import {
    Heart, Share2, ThumbsUp, Send, Loader2, MessageCircle,
    Clock, CheckCircle2, X, Eye, Sparkles, TrendingUp, Users,
    Lightbulb, Smile, Target, Coffee, HeartHandshake,
    GraduationCap, Link2
} from 'lucide-react';

// ==========================================================
// TYPES
// ==========================================================
interface NursePost {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    author?: {
        id: string;
        first_name: string;
        full_name?: string;
        last_name: string;
        username: string;
        avatar_url: string | null;
        qualification: string | null;
        verification_status: string;
        endorsement_count?: number;
    };
    like_count: number;
    share_count: number;
    is_liked_by_user: boolean;
}

interface LikeState {
    [postId: string]: {
        count: number;
        isLiked: boolean;
    };
}

// ==========================================================
// PROMPT TEMPLATES
// ==========================================================
const PROMPT_TEMPLATES = [
    {
        id: 'career',
        title: 'Career Growth',
        icon: TrendingUp,
        prompts: [
            'Today I learned a new skill in the ICU...',
            'Just completed my critical care certification!',
            'Applying for a leadership position taught me...',
            'My 5-year career goal as a nurse is...',
            'The best career advice I received was...'
        ]
    },
    {
        id: 'shift',
        title: 'Shift Experience',
        icon: Clock,
        prompts: [
            "Today's shift was challenging because...",
            'A patient taught me that...',
            'The most rewarding moment today was...',
            'Handling an emergency taught me...',
            'My night shift reflection: ...'
        ]
    },
    {
        id: 'feelings',
        title: 'How I Feel',
        icon: Smile,
        prompts: [
            'I feel proud when...',
            'Burnout is real, today I coped by...',
            'What keeps me going is...',
            "I'm grateful for...",
            'A small win today: ...'
        ]
    },
    {
        id: 'encourage',
        title: 'Encourage Others',
        icon: HeartHandshake,
        prompts: [
            'To my fellow nurses: You are enough because...',
            'Remember that...',
            'A message to new nurses: ...',
            'We rise by lifting others, today I...',
            'To the nurse struggling today: ...'
        ]
    },
    {
        id: 'kenya',
        title: 'Kenya Nursing',
        icon: Users,
        prompts: [
            'As a Kenyan nurse, I face...',
            'The nursing situation in my county...',
            'A suggestion for KNUN: ...',
            'Working in a Kenyan public hospital taught me...',
            'Telemedicine in Kenya: My experience...'
        ]
    },
    {
        id: 'learning',
        title: 'Clinical Learning',
        icon: GraduationCap,
        prompts: [
            'Interesting case I handled today: ...',
            'New protocol I learned about...',
            'CPR save story: ...',
            'Medication error prevention tip: ...',
            'Infection control observation: ...'
        ]
    },
    {
        id: 'wellness',
        title: 'Nurse Wellness',
        icon: Coffee,
        prompts: [
            'Self-care tip for nurses: ...',
            'How I maintain work-life balance...',
            'Mental health check-in: ...',
            'What I do after a tough shift...',
            'Support system that helps me...'
        ]
    }
];

// ==========================================================
// HELPERS
// ==========================================================
const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return postDate.toLocaleDateString();
};

const getAuthorDisplayName = (author: NursePost['author']): string => {
    if (!author) return 'Anonymous Nurse';
    if (author.full_name && author.full_name !== 'null') return author.full_name;
    if (author.first_name && author.first_name !== 'null') {
        return `${author.first_name} ${author.last_name !== 'null' ? author.last_name : ''}`.trim();
    }
    if (author.username && author.username !== 'null') return author.username;
    return 'Healthcare Professional';
};

// ==========================================================
// SKELETON
// ==========================================================
const PostSkeleton = () => (
    <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200/60 md:dark:border-zinc-800 p-4 md:p-5 animate-pulse border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60">
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/4" />
                <div className="space-y-1.5 mt-3">
                    <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-5/6" />
                    <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
                </div>
                <div className="flex gap-3 mt-4">
                    <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded-lg w-16" />
                    <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded-lg w-16" />
                </div>
            </div>
        </div>
    </div>
);

// ==========================================================
// POST CARD
// ==========================================================
const PostCard: React.FC<{
    post: NursePost;
    currentUserId: string;
    likeState: LikeState;
    onLike: (postId: string) => Promise<void>;
    onShare: (postId: string, content: string) => void;
    onEndorse: (author: NursePost['author']) => void;
}> = ({ post, currentUserId, likeState, onLike, onShare, onEndorse }) => {
    const currentLikeState = likeState[post.id] || {
        count: post.like_count || 0,
        isLiked: post.is_liked_by_user || false
    };

    const isOwnPost = currentUserId === post.user_id;
    const [shareFeedback, setShareFeedback] = useState<string | null>(null);

    const handleShareTap = async () => {
        // Prefer native share sheet (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Nursefolio Post',
                    text: `"${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}"`,
                    url: `${window.location.origin}/feed?postId=${post.id}`
                });
                onShare(post.id, post.content);
                return;
            } catch {
                // user cancelled — fall through to copy
            }
        }

        // Fallback: copy link
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/feed?postId=${post.id}`);
            setShareFeedback('Link copied');
            setTimeout(() => setShareFeedback(null), 2000);
            onShare(post.id, post.content);
        } catch {
            setShareFeedback('Could not share');
            setTimeout(() => setShareFeedback(null), 2000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200/60 md:dark:border-zinc-800 md:hover:border-indigo-200 dark:md:hover:border-indigo-900 md:hover:shadow-sm transition-all duration-200 overflow-hidden border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60"
        >
            <div className="p-4 md:p-5">
                {/* Author Row */}
                <div className="flex items-start gap-3 mb-3">
                    <img
                        src={post.author?.avatar_url || '/192.png'}
                        alt={getAuthorDisplayName(post.author)}
                        className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover border border-slate-200 dark:border-zinc-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                {getAuthorDisplayName(post.author)}
                            </h3>
                            {post.author?.verification_status === 'verified' && (
                                <CheckCircle2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                                {post.author?.qualification || 'Registered Nurse'}
                            </span>
                            <span className="text-slate-300 dark:text-zinc-700">·</span>
                            <span className="text-slate-500 dark:text-slate-400 flex-shrink-0">
                                {getRelativeTime(post.created_at)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">
                    {post.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                    {/* Like */}
                    <button
                        onClick={() => onLike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-semibold active:scale-[97%] ${currentLikeState.isLiked
                            ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${currentLikeState.isLiked ? 'fill-current' : ''}`} />
                        <span>{currentLikeState.count}</span>
                    </button>

                    {/* Share */}
                    <div className="relative">
                        <button
                            onClick={handleShareTap}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-[97%]"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>{post.share_count || 0}</span>
                        </button>
                        {shareFeedback && (
                            <div className="absolute bottom-full left-0 mb-2 bg-slate-900 dark:bg-zinc-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg z-10">
                                {shareFeedback}
                            </div>
                        )}
                    </div>

                    {/* Endorse (hide on own post) */}
                    {!isOwnPost && post.author && (
                        <button
                            onClick={() => onEndorse(post.author)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 active:scale-[97%] ml-auto"
                        >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="hidden sm:inline">Endorse</span>
                            <span>{post.author.endorsement_count || 0}</span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================================
// POST COMPOSER MODAL
// ==========================================================
const PostComposerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (content: string) => Promise<void>;
    submitting: boolean;
}> = ({ isOpen, onClose, onSubmit, submitting }) => {
    const [content, setContent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        await onSubmit(content);
        setContent('');
        setSelectedCategory(null);
        onClose();
    };

    const handlePromptClick = (prompt: string) => {
        setContent(prev => (prev ? `${prev} ${prompt}` : prompt));
        textareaRef.current?.focus();
    };

    const handleClose = () => {
        setContent('');
        setSelectedCategory(null);
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
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 120 || info.velocity.y > 500) handleClose();
                }}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-2xl max-h-[92vh] md:max-h-[90vh] overflow-hidden flex flex-col md:border md:border-slate-200/60 md:dark:border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle (mobile) */}
                <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 dark:border-zinc-800/80 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                            Share Your Thought
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-4">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind today? Share your nursing journey, experiences, or encouragement..."
                        rows={5}
                        className="w-full text-[15px] px-4 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition resize-none"
                    />

                    <div className="text-right text-xs text-slate-400 dark:text-slate-500">
                        {content.length} characters
                    </div>

                    {/* Prompt library */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Get Inspired
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {PROMPT_TEMPLATES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition ${selectedCategory === cat.id
                                        ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    <cat.icon className="w-3.5 h-3.5" />
                                    {cat.title}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {selectedCategory && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-3 space-y-2">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Tap any prompt to add to your post
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {PROMPT_TEMPLATES.find(c => c.id === selectedCategory)?.prompts.map((prompt, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handlePromptClick(prompt)}
                                                    className="text-left px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition border border-slate-200 dark:border-zinc-700"
                                                >
                                                    {prompt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-4 md:px-5 py-3 md:py-4 border-t border-slate-100 dark:border-zinc-800/80 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || submitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[98%] min-h-[44px]"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Posting
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Share Post
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ==========================================================
// MAIN FEED COMPONENT
// ==========================================================
export default function NurseFeed() {
    const [posts, setPosts] = useState<NursePost[]>([]);
    const [likeState, setLikeState] = useState<LikeState>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [endorsementModal, setEndorsementModal] = useState<{
        isOpen: boolean;
        profile: UserProfile | null;
    }>({ isOpen: false, profile: null });

    // Track which post IDs have been view-recorded in this session
    // so we don't double-record on re-renders.
    const recordedViewIds = useRef<Set<string>>(new Set());

    const feedEndRef = useRef<HTMLDivElement>(null);

    // ---------------------------------------------
    // Auth
    // ---------------------------------------------
    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        getCurrentUser();
    }, []);

    // ---------------------------------------------
    // Record views — batch insert
    // ---------------------------------------------
    const recordViews = useCallback(async (postIds: string[], userId: string) => {
        // Filter out anything already recorded this session
        const newIds = postIds.filter(id => !recordedViewIds.current.has(id));
        if (newIds.length === 0) return;

        // Mark as recorded immediately (prevents double-fire)
        newIds.forEach(id => recordedViewIds.current.add(id));

        try {
            await supabase.from('post_views').insert(
                newIds.map(post_id => ({
                    post_id,
                    user_id: userId,
                    view_type: 'shown'
                }))
            );
        } catch (err) {
            console.warn('Failed to record views:', err);
            // Don't roll back the recordedViewIds set — recording again would be worse
        }
    }, []);

    // ---------------------------------------------
    // Load feed — batch cache → RPC → posts
    // ---------------------------------------------
    const loadFeed = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            let postIds: string[] = [];

            // 1. Check for a fresh cached batch
            const { data: existingBatch } = await supabase
                .from('feed_batches')
                .select('post_ids, expires_at')
                .eq('user_id', userId)
                .gt('expires_at', new Date().toISOString())
                .order('expires_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingBatch?.post_ids && existingBatch.post_ids.length > 0) {
                postIds = existingBatch.post_ids;
            } else {
                // 2. Generate a fresh batch via RPC
                const { data: fresh, error: rpcErr } = await supabase
                    .rpc('get_feed_batch', {
                        p_user_id: userId,
                        p_limit: 20,
                        p_view_window_days: 7
                    });

                if (rpcErr) throw rpcErr;

                postIds = (fresh || []).map((row: any) => row.post_id);

                // 3. Persist the batch for 4 hours (fire-and-forget)
                if (postIds.length > 0) {
                    supabase
                        .rpc('save_feed_batch', {
                            p_user_id: userId,
                            p_post_ids: postIds,
                            p_ttl_hours: 4
                        })
                        .then(({ error }) => {
                            if (error) console.warn('Could not save feed batch:', error);
                        });
                }
            }

            if (postIds.length === 0) {
                setPosts([]);
                setLoading(false);
                return;
            }

            // 4. Fetch full post rows for those IDs
            const { data: postsData, error: postsError } = await supabase
                .from('nurse_posts')
                .select(`
          *,
          author:profiles (
            id,
            full_name,
            first_name,
            last_name,
            username,
            avatar_url,
            qualification,
            verification_status
          )
        `)
                .in('id', postIds);

            if (postsError) throw postsError;

            // 5. Fetch likes + shares + endorsement counts for these posts only
            const [{ data: likesData }, { data: sharesData }, { data: endorsementsData }] = await Promise.all([
                supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
                supabase.from('post_shares').select('post_id').in('post_id', postIds),
                supabase.from('profile_endorsements').select('profile_id')
            ]);

            const likesMap = new Map<string, number>();
            const sharesMap = new Map<string, number>();
            const userLikesSet = new Set<string>();

            likesData?.forEach(l => {
                likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1);
                if (l.user_id === userId) userLikesSet.add(l.post_id);
            });

            sharesData?.forEach(s => {
                sharesMap.set(s.post_id, (sharesMap.get(s.post_id) || 0) + 1);
            });

            const endorsementCountsMap = new Map<string, number>();
            endorsementsData?.forEach(e => {
                endorsementCountsMap.set(e.profile_id, (endorsementCountsMap.get(e.profile_id) || 0) + 1);
            });

            // 6. Preserve the batch order (important — batch is pre-shuffled)
            const orderedPosts = postIds
                .map(id => postsData?.find(p => p.id === id))
                .filter(Boolean)
                .map((post: any) => ({
                    ...post,
                    author: {
                        ...post.author,
                        endorsement_count: endorsementCountsMap.get(post.user_id) || 0
                    },
                    like_count: likesMap.get(post.id) || 0,
                    share_count: sharesMap.get(post.id) || 0,
                    is_liked_by_user: userLikesSet.has(post.id)
                }));

            setPosts(orderedPosts);

            // 7. Seed like state
            const newLikeState: LikeState = {};
            orderedPosts.forEach(p => {
                newLikeState[p.id] = { count: p.like_count, isLiked: p.is_liked_by_user };
            });
            setLikeState(newLikeState);

            // 8. Record views (fire and forget)
            recordViews(postIds, userId);
        } catch (err) {
            console.error('Error loading feed:', err);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, [recordViews]);

    useEffect(() => {
        if (currentUserId) loadFeed(currentUserId);
    }, [currentUserId, loadFeed]);

    // ---------------------------------------------
    // Create post
    // ---------------------------------------------
    const handleCreatePost = async (content: string) => {
        if (!currentUserId || !content.trim()) return;
        setSubmitting(true);

        // Optimistic insert
        const tempId = `temp-${Date.now()}`;
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('full_name, first_name, last_name, username, avatar_url, qualification, verification_status')
            .eq('id', currentUserId)
            .single();

        const tempPost: NursePost = {
            id: tempId,
            user_id: currentUserId,
            content: content.trim(),
            created_at: new Date().toISOString(),
            author: {
                id: currentUserId,
                first_name: myProfile?.first_name || 'You',
                last_name: myProfile?.last_name || '',
                full_name: myProfile?.full_name,
                username: myProfile?.username || '',
                avatar_url: myProfile?.avatar_url || null,
                qualification: myProfile?.qualification || null,
                verification_status: myProfile?.verification_status || 'unverified'
            },
            like_count: 0,
            share_count: 0,
            is_liked_by_user: false
        };

        setPosts(prev => [tempPost, ...prev]);

        try {
            const { data, error } = await supabase
                .from('nurse_posts')
                .insert({ user_id: currentUserId, content: content.trim() })
                .select()
                .single();

            if (error) throw error;

            setPosts(prev =>
                prev.map(p => (p.id === tempId ? { ...tempPost, id: data.id, created_at: data.created_at } : p))
            );

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error creating post:', err);
            setPosts(prev => prev.filter(p => p.id !== tempId));
            alert('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ---------------------------------------------
    // Like / Unlike
    // ---------------------------------------------
    const handleLike = async (postId: string) => {
        if (!currentUserId) return;
        const current = likeState[postId];
        const newIsLiked = !current?.isLiked;
        const newCount = Math.max(0, (current?.count || 0) + (newIsLiked ? 1 : -1));

        // Optimistic update
        setLikeState(prev => ({
            ...prev,
            [postId]: { count: newCount, isLiked: newIsLiked }
        }));
        setPosts(prev =>
            prev.map(p =>
                p.id === postId
                    ? { ...p, like_count: newCount, is_liked_by_user: newIsLiked }
                    : p
            )
        );

        try {
            if (newIsLiked) {
                const { error } = await supabase
                    .from('post_likes')
                    .insert({ post_id: postId, user_id: currentUserId });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', currentUserId);
                if (error) throw error;
            }
        } catch (err) {
            console.error('Like toggle failed:', err);
            // Roll back
            setLikeState(prev => ({
                ...prev,
                [postId]: current || { count: 0, isLiked: false }
            }));
            setPosts(prev =>
                prev.map(p =>
                    p.id === postId
                        ? { ...p, like_count: current?.count || 0, is_liked_by_user: current?.isLiked || false }
                        : p
                )
            );
        }
    };

    // ---------------------------------------------
    // Share
    // ---------------------------------------------
    const handleShare = async (postId: string, _content: string) => {
        if (!currentUserId) return;
        try {
            await supabase.from('post_shares').insert({
                post_id: postId,
                user_id: currentUserId,
                platform: navigator.share ? 'native' : 'copy'
            });
            setPosts(prev =>
                prev.map(p =>
                    p.id === postId ? { ...p, share_count: (p.share_count || 0) + 1 } : p
                )
            );
        } catch (err) {
            console.warn('Share tracking failed:', err);
        }
    };

    // ---------------------------------------------
    // Endorse
    // ---------------------------------------------
    const handleEndorse = (author: NursePost['author']) => {
        if (!author) return;
        const profile: UserProfile = {
            id: author.id,
            first_name: author.first_name,
            full_name: author.full_name,
            last_name: author.last_name,
            username: author.username,
            avatar_url: author.avatar_url,
            qualification: author.qualification,
            verification_status: author.verification_status as any,
            bio: null,
            location: null,
            specialties: [],
            role: 'nurse',
            years_of_experience: null,
            nursing_level: null
        };
        setEndorsementModal({ isOpen: true, profile });
    };

    // ---------------------------------------------
    // Pull-to-refresh — clears batch and regenerates
    // ---------------------------------------------
    const handleRefresh = async () => {
        if (!currentUserId) return;
        // Clear the current batch so a fresh one is generated
        await supabase.from('feed_batches').delete().eq('user_id', currentUserId);
        recordedViewIds.current.clear();
        loadFeed(currentUserId);
    };

    // ---------------------------------------------
    // Render
    // ---------------------------------------------
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto px-0 md:px-4 py-4 md:py-8">
                {/* Header */}
                <div className="mb-4 md:mb-6 px-4 md:px-0">
                    <h1 className="text-2xl md:text-3xl text-center font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Nurse Daily Pulse
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
                        A personalized feed of what nurses are sharing today
                    </p>
                </div>

                {/* Composer Trigger */}
                <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200/60 md:dark:border-zinc-800 p-3 md:p-4 mb-0 md:mb-6 md:shadow-sm border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60">
                    <button
                        onClick={() => setIsComposerOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 text-left text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[99%]"
                    >
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span>Share your nursing journey today...</span>
                    </button>
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="space-y-0 md:space-y-4">
                        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                    </div>
                ) : posts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12 md:py-16 mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-200/60 md:dark:border-zinc-800"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 text-lg">
                            You're all caught up
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto px-4">
                            You've seen everything fresh for now. Share something to start the next wave, or check back later.
                        </p>
                        <button
                            onClick={handleRefresh}
                            className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition active:scale-[98%]"
                        >
                            Refresh Feed
                        </button>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        <div className="space-y-0 md:space-y-4">
                            {posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={currentUserId || ''}
                                    likeState={likeState}
                                    onLike={handleLike}
                                    onShare={handleShare}
                                    onEndorse={handleEndorse}
                                />
                            ))}
                            <div ref={feedEndRef} />
                        </div>
                    </AnimatePresence>
                )}
            </div>

            {/* Composer Modal */}
            <PostComposerModal
                isOpen={isComposerOpen}
                onClose={() => setIsComposerOpen(false)}
                onSubmit={handleCreatePost}
                submitting={submitting}
            />

            {/* Endorsement Manager */}
            <AnimatePresence>
                {endorsementModal.isOpen && endorsementModal.profile && currentUserId && (
                    <EndorsementManager
                        isOpen={endorsementModal.isOpen}
                        onClose={() => setEndorsementModal({ isOpen: false, profile: null })}
                        profileId={endorsementModal.profile.id}
                        profileName={getAuthorDisplayName({
                            id: endorsementModal.profile.id,
                            first_name: endorsementModal.profile.first_name || '',
                            last_name: endorsementModal.profile.last_name || '',
                            full_name: endorsementModal.profile.full_name,
                            username: endorsementModal.profile.username || '',
                            avatar_url: endorsementModal.profile.avatar_url,
                            qualification: endorsementModal.profile.qualification,
                            verification_status: endorsementModal.profile.verification_status
                        })}
                        currentUserId={currentUserId}
                        onEndorsementChange={() => {
                            if (currentUserId) loadFeed(currentUserId);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}