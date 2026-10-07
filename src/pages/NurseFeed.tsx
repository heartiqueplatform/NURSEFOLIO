/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { EndorsementManager } from '../components/EndorsementManager';
import {
    Heart, Share2, ThumbsUp, Send, Loader2, MessageCircle,
    Clock, CheckCircle2, X, Sparkles, TrendingUp, Users,
    Lightbulb, Smile, Coffee, HeartHandshake,
    GraduationCap, Eye,
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
    view_count: number;
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

const formatViewCount = (n: number): string => {
    if (n < 1000) return `${n}`;
    if (n < 1000000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}K`;
    return `${(n / 1000000).toFixed(1)}M`;
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
const PostSkeleton = React.memo(() => (
    <div className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-100 dark:border-zinc-900 animate-pulse">
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
                    <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded-full w-16" />
                    <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded-full w-16" />
                </div>
            </div>
        </div>
    </div>
));

// ==========================================================
// POST CARD — with IntersectionObserver view tracking
// ==========================================================
const PostCard: React.FC<{
    post: NursePost;
    currentUserId: string;
    likeState: LikeState;
    onLike: (postId: string) => void;
    onShare: (postId: string) => void;
    onEndorse: (author: NursePost['author']) => void;
    onView: (postId: string) => void;
}> = React.memo(({ post, currentUserId, likeState, onLike, onShare, onEndorse, onView }) => {
    const currentLikeState = likeState[post.id] || {
        count: post.like_count || 0,
        isLiked: post.is_liked_by_user || false
    };

    const isOwnPost = currentUserId === post.user_id;
    const [shareFeedback, setShareFeedback] = useState<string | null>(null);
    const feedbackTimerRef = useRef<number | null>(null);

    // View tracking — only count if 50% visible for 2 seconds
    const cardRef = useRef<HTMLElement | null>(null);
    const hasReportedViewRef = useRef(false);

    useEffect(() => {
        if (hasReportedViewRef.current) return;
        if (!cardRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !hasReportedViewRef.current) {
                        hasReportedViewRef.current = true;
                        onView(post.id);
                        observer.disconnect(); // done — one view per card per session
                    }
                });
            },
            { threshold: 0.3 } // 30% visible is enough
        );

        observer.observe(cardRef.current);

        return () => observer.disconnect();
    }, [post.id, post.user_id, currentUserId, onView]);

    const showFeedback = useCallback((msg: string) => {
        setShareFeedback(msg);
        if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = window.setTimeout(() => setShareFeedback(null), 2000);
    }, []);

    useEffect(() => {
        return () => {
            if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
        };
    }, []);

    const handleShareTap = useCallback(async () => {
        const url = `${window.location.origin}/feed?postId=${post.id}`;
        const preview = post.content.slice(0, 100) + (post.content.length > 100 ? '...' : '');

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Nursefolio Post', text: `"${preview}"`, url });
                onShare(post.id);
                return;
            } catch { /* cancelled */ }
        }

        try {
            await navigator.clipboard.writeText(url);
            showFeedback('Link copied');
            onShare(post.id);
        } catch {
            showFeedback('Could not share');
        }
    }, [post.id, post.content, onShare, showFeedback]);

    return (
        <article
            ref={cardRef as any}
            className="bg-white dark:bg-zinc-950 px-4 py-4 border-b border-slate-100 dark:border-zinc-900 md:last:border-0"
        >
            {/* Author */}
            <div className="flex items-start gap-3 mb-3">
                <img
                    src={post.author?.avatar_url || '/192.png'}
                    alt={getAuthorDisplayName(post.author)}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover bg-slate-100 dark:bg-zinc-900 flex-shrink-0"
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
                        <span className="ml-auto flex items-center gap-1 text-slate-400 dark:text-slate-500 flex-shrink-0">
                            <Eye className="w-3 h-3" />
                            {formatViewCount(post.view_count)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-3">
                {post.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onLike(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors text-sm font-semibold active:opacity-60 ${currentLikeState.isLiked
                        ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20'
                        : 'text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900'
                        }`}
                    aria-label={currentLikeState.isLiked ? 'Unlike' : 'Like'}
                >
                    <Heart className={`w-4 h-4 ${currentLikeState.isLiked ? 'fill-current' : ''}`} />
                    <span>{currentLikeState.count}</span>
                </button>

                <div className="relative">
                    <button
                        onClick={handleShareTap}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors text-sm font-semibold text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900"
                        aria-label="Share"
                    >
                        <Share2 className="w-4 h-4" />
                        <span>{post.share_count || 0}</span>
                    </button>
                    {shareFeedback && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 dark:bg-zinc-800 text-white text-xs rounded-full px-3 py-1.5 whitespace-nowrap z-10">
                            {shareFeedback}
                        </div>
                    )}
                </div>

                {!isOwnPost && post.author && (
                    <button
                        onClick={() => onEndorse(post.author)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors text-sm font-semibold text-indigo-600 dark:text-indigo-400 active:bg-indigo-50 dark:active:bg-indigo-950/30 ml-auto"
                        aria-label="Endorse"
                    >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="hidden sm:inline">Endorse</span>
                        <span>{post.author.endorsement_count || 0}</span>
                    </button>
                )}
            </div>
        </article>
    );
});

PostCard.displayName = 'PostCard';

// ==========================================================
// COMPOSER MODAL
// ==========================================================
const PostComposerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (content: string) => Promise<void>;
    submitting: boolean;
}> = React.memo(({ isOpen, onClose, onSubmit, submitting }) => {
    const [content, setContent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            const t = setTimeout(() => textareaRef.current?.focus(), 100);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    const reset = useCallback(() => {
        setContent('');
        setSelectedCategory(null);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!content.trim() || submitting) return;
        await onSubmit(content);
        reset();
        onClose();
    }, [content, submitting, onSubmit, reset, onClose]);

    const handlePromptClick = useCallback((prompt: string) => {
        setContent(prev => (prev ? `${prev} ${prompt}` : prompt));
        textareaRef.current?.focus();
    }, []);

    const handleClose = useCallback(() => {
        reset();
        onClose();
    }, [reset, onClose]);

    if (!isOpen) return null;

    const activeTemplate = selectedCategory
        ? PROMPT_TEMPLATES.find(c => c.id === selectedCategory)
        : null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 bg-black/60"
            onClick={handleClose}
        >
            <div
                className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[92vh] md:max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                </div>

                <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                            Share Your Thought
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full text-slate-400 dark:text-slate-500 active:bg-slate-100 dark:active:bg-zinc-900 transition"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-4">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind today? Share your nursing journey, experiences, or encouragement..."
                        rows={5}
                        className="w-full text-[15px] px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition resize-none"
                    />

                    <div className="text-right text-xs text-slate-400 dark:text-slate-500">
                        {content.length} characters
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Get Inspired
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {PROMPT_TEMPLATES.map(cat => {
                                const selected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(selected ? null : cat.id)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${selected
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 active:bg-slate-200 dark:active:bg-zinc-800'
                                            }`}
                                    >
                                        <cat.icon className="w-3.5 h-3.5" />
                                        {cat.title}
                                    </button>
                                );
                            })}
                        </div>

                        {activeTemplate && (
                            <div className="bg-slate-50 dark:bg-zinc-900 rounded-2xl p-3 space-y-2 animate-in fade-in duration-150">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Tap any prompt to add to your post
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {activeTemplate.prompts.map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handlePromptClick(prompt)}
                                            className="text-left px-3 py-2 bg-white dark:bg-zinc-800 rounded-full text-xs text-slate-700 dark:text-slate-300 active:bg-indigo-50 dark:active:bg-indigo-950/30 transition"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-4 md:px-5 py-3 md:py-4 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 rounded-full transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || submitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 active:bg-indigo-700 text-white rounded-full text-sm font-semibold transition disabled:opacity-50 min-h-[44px]"
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
            </div>
        </div>
    );
});

PostComposerModal.displayName = 'PostComposerModal';

// ==========================================================
// MAIN FEED — Pull-to-refresh + Load More button
// ==========================================================
export default function NurseFeed() {
    const [posts, setPosts] = useState<NursePost[]>([]);
    const [likeState, setLikeState] = useState<LikeState>({});
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [endorsementModal, setEndorsementModal] = useState<{
        isOpen: boolean;
        profile: UserProfile | null;
    }>({ isOpen: false, profile: null });

    // Pull-to-refresh state
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const touchStartYRef = useRef<number>(0);
    const isPullingRef = useRef(false);

    const recordedViewIds = useRef<Set<string>>(new Set());
    const loadedForUserRef = useRef<string | null>(null);
    const loadedPostIdsRef = useRef<Set<string>>(new Set());

    const PAGE_SIZE = 20;
    const PULL_THRESHOLD = 70;

    // ---------- Auth ----------
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!cancelled) setCurrentUserId(user?.id || null);
        })();
        return () => { cancelled = true; };
    }, []);

    // ---------- Per-post view recording ----------
    // ---------- Per-post view recording (batched, instant) ----------
    // ---------- Per-post view recording (throttled batch) ----------
    const pendingViewsRef = useRef<Set<string>>(new Set());
    const flushViewsTimerRef = useRef<number | null>(null);
    const firstPendingViewTimeRef = useRef<number | null>(null);

    const flushPendingViews = useCallback(async () => {
        const ids = Array.from(pendingViewsRef.current);
        pendingViewsRef.current.clear();
        firstPendingViewTimeRef.current = null;
        if (ids.length === 0 || !currentUserId) return;

        // Verify live session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            console.warn('flushPendingViews: no live session');
            return;
        }

        const payload = ids.map(post_id => ({
            post_id,
            user_id: session.user.id,
            view_type: 'shown',      // ← must match CHECK constraint: 'shown' or 'read'
        }));

        const { error } = await supabase
            .from('post_views')
            .upsert(payload, { onConflict: 'post_id,user_id', ignoreDuplicates: true });

        if (error) {
            console.error('post_views upsert failed:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                payload,
            });
        }
    }, [currentUserId]);

    const recordView = useCallback((postId: string) => {
        if (!currentUserId) return;
        if (recordedViewIds.current.has(postId)) return;

        recordedViewIds.current.add(postId);
        pendingViewsRef.current.add(postId);

        if (firstPendingViewTimeRef.current === null) {
            firstPendingViewTimeRef.current = Date.now();
        }

        // Optimistic local bump
        setPosts(prev =>
            prev.map(p =>
                p.id === postId ? { ...p, view_count: (p.view_count || 0) + 1 } : p
            )
        );

        // Throttle: schedule flush if none pending
        if (flushViewsTimerRef.current === null) {
            flushViewsTimerRef.current = window.setTimeout(() => {
                flushViewsTimerRef.current = null;
                flushPendingViews();
            }, 2000);
        }

        // Safety: force flush after 5s of accumulation
        const firstTime = firstPendingViewTimeRef.current;
        if (firstTime !== null && Date.now() - firstTime > 5000) {
            if (flushViewsTimerRef.current !== null) {
                window.clearTimeout(flushViewsTimerRef.current);
                flushViewsTimerRef.current = null;
            }
            flushPendingViews();
        }
    }, [currentUserId, flushPendingViews]);

    // ---------- Load one page ----------
    const loadPage = useCallback(async (userId: string, isFirstPage: boolean) => {
        if (isFirstPage) setLoading(true);
        else setLoadingMore(true);

        try {
            const { data: batch, error: rpcErr } = await supabase.rpc('get_feed_batch', {
                p_user_id: userId,
                p_limit: PAGE_SIZE,
                p_view_window_days: 7,
            });
            if (rpcErr) throw rpcErr;

            const freshIds = (batch || [])
                .map((row: any) => row.post_id)
                .filter((id: string) => !loadedPostIdsRef.current.has(id));

            if (freshIds.length === 0) {
                setHasMore(false);
                if (isFirstPage) setPosts([]);
                return;
            }

            freshIds.forEach((id: string) => loadedPostIdsRef.current.add(id));

            const { data: postsData, error: postsError } = await supabase
                .from('nurse_posts')
                .select(`
                    *,
                    author:profiles (
                        id, full_name, first_name, last_name, username,
                        avatar_url, qualification, verification_status
                    )
                `)
                .in('id', freshIds);
            if (postsError) throw postsError;

            const authorIds = Array.from(
                new Set((postsData || []).map((p: any) => p.user_id).filter(Boolean))
            );

            const [likesRes, sharesRes, endorsementsRes, viewsRes] = await Promise.all([
                supabase.from('post_likes').select('post_id, user_id').in('post_id', freshIds),
                supabase.from('post_shares').select('post_id').in('post_id', freshIds),
                authorIds.length > 0
                    ? supabase.from('profile_endorsements').select('profile_id').in('profile_id', authorIds)
                    : Promise.resolve({ data: [] as { profile_id: string }[] }),
                supabase.from('post_views').select('post_id').in('post_id', freshIds),
            ]);

            const likesMap = new Map<string, number>();
            const sharesMap = new Map<string, number>();
            const viewsMap = new Map<string, number>();
            const userLikesSet = new Set<string>();

            likesRes.data?.forEach((l: any) => {
                likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1);
                if (l.user_id === userId) userLikesSet.add(l.post_id);
            });

            sharesRes.data?.forEach((s: any) => {
                sharesMap.set(s.post_id, (sharesMap.get(s.post_id) || 0) + 1);
            });

            viewsRes.data?.forEach((v: any) => {
                viewsMap.set(v.post_id, (viewsMap.get(v.post_id) || 0) + 1);
            });

            const endorsementCountsMap = new Map<string, number>();
            endorsementsRes.data?.forEach((e: any) => {
                endorsementCountsMap.set(
                    e.profile_id,
                    (endorsementCountsMap.get(e.profile_id) || 0) + 1
                );
            });

            const orderedPosts: NursePost[] = freshIds
                .map((id: string) => postsData?.find((p: any) => p.id === id))
                .filter(Boolean)
                .map((post: any) => ({
                    ...post,
                    author: post.author
                        ? {
                            ...post.author,
                            endorsement_count: endorsementCountsMap.get(post.user_id) || 0,
                        }
                        : undefined,
                    like_count: likesMap.get(post.id) || 0,
                    share_count: sharesMap.get(post.id) || 0,
                    view_count: viewsMap.get(post.id) || 0,
                    is_liked_by_user: userLikesSet.has(post.id),
                }));

            setPosts(prev => isFirstPage ? orderedPosts : [...prev, ...orderedPosts]);

            setLikeState(prev => {
                const next = { ...prev };
                orderedPosts.forEach(p => {
                    next[p.id] = { count: p.like_count, isLiked: p.is_liked_by_user };
                });
                return next;
            });

            if (orderedPosts.length < PAGE_SIZE) {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Error loading feed page:', err);
            if (isFirstPage) setPosts([]);
        } finally {
            if (isFirstPage) setLoading(false);
            else setLoadingMore(false);
        }
    }, []);

    // ---------- Boot: first page ----------
    useEffect(() => {
        if (!currentUserId) return;
        if (loadedForUserRef.current === currentUserId) return;
        loadedForUserRef.current = currentUserId;

        loadedPostIdsRef.current = new Set();
        recordedViewIds.current = new Set();
        setHasMore(true);

        loadPage(currentUserId, true);
    }, [currentUserId, loadPage]);

    // ---------- Refresh ----------
    const handleRefresh = useCallback(async () => {
        if (!currentUserId) return;
        await supabase.from('feed_batches').delete().eq('user_id', currentUserId);
        recordedViewIds.current = new Set();
        loadedPostIdsRef.current = new Set();
        setHasMore(true);
        await loadPage(currentUserId, true);
    }, [currentUserId, loadPage]);
    // ---------- Cleanup debounce timer on unmount ----------
    // ---------- Cleanup: flush pending views before unmount ----------
    useEffect(() => {
        return () => {
            if (flushViewsTimerRef.current !== null) {
                window.clearTimeout(flushViewsTimerRef.current);
                flushViewsTimerRef.current = null;
            }
            if (pendingViewsRef.current.size > 0) {
                flushPendingViews();
            }
        };
    }, [flushPendingViews]);
    // ---------- Pull-to-refresh handlers ----------
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Only start a pull gesture if the user is at the top of the page
        if (window.scrollY > 5) return;
        if (isPulling) return;
        touchStartYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
    }, [isPulling]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPullingRef.current) return;
        const delta = e.touches[0].clientY - touchStartYRef.current;
        if (delta > 0) {
            // Resistance curve — feels like native pull-to-refresh
            setPullDistance(Math.min(delta * 0.5, 100));
        }
    }, []);

    const handleTouchEnd = useCallback(async () => {
        if (!isPullingRef.current) return;
        isPullingRef.current = false;

        if (pullDistance >= PULL_THRESHOLD && currentUserId && !isPulling) {
            setIsPulling(true);
            setPullDistance(0);
            try {
                await handleRefresh();
            } finally {
                setIsPulling(false);
            }
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, currentUserId, isPulling, handleRefresh]);

    // ---------- Load more (manual) ----------
    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !currentUserId) return;
        setLoadingMore(true);
        try {
            await loadPage(currentUserId, false);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, currentUserId, loadPage]);

    // ---------- Create post ----------
    const handleCreatePost = useCallback(async (content: string) => {
        if (!currentUserId || !content.trim()) return;
        setSubmitting(true);

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
            view_count: 0,
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
                prev.map(p =>
                    p.id === tempId
                        ? { ...tempPost, id: data.id, created_at: data.created_at }
                        : p
                )
            );
            loadedPostIdsRef.current.add(data.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error creating post:', err);
            setPosts(prev => prev.filter(p => p.id !== tempId));
            alert('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }, [currentUserId]);

    // ---------- Like ----------
    const handleLike = useCallback(async (postId: string) => {
        if (!currentUserId) return;
        const current = likeState[postId];
        const newIsLiked = !current?.isLiked;
        const newCount = Math.max(0, (current?.count || 0) + (newIsLiked ? 1 : -1));

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
            setLikeState(prev => ({
                ...prev,
                [postId]: current || { count: 0, isLiked: false }
            }));
            setPosts(prev =>
                prev.map(p =>
                    p.id === postId
                        ? {
                            ...p,
                            like_count: current?.count || 0,
                            is_liked_by_user: current?.isLiked || false
                        }
                        : p
                )
            );
        }
    }, [currentUserId, likeState]);

    // ---------- Share ----------
    const handleShare = useCallback(async (postId: string) => {
        if (!currentUserId) return;
        setPosts(prev =>
            prev.map(p =>
                p.id === postId ? { ...p, share_count: (p.share_count || 0) + 1 } : p
            )
        );
        try {
            await supabase.from('post_shares').insert({
                post_id: postId,
                user_id: currentUserId,
                platform: navigator.share ? 'native' : 'copy'
            });
        } catch (err) {
            console.warn('Share tracking failed:', err);
        }
    }, [currentUserId]);

    // ---------- Endorse ----------
    const handleEndorse = useCallback((author: NursePost['author']) => {
        if (!author || !currentUserId) return;
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
    }, [currentUserId]);

    const endorsementDisplayName = useMemo(() => {
        if (!endorsementModal.profile) return '';
        return getAuthorDisplayName({
            id: endorsementModal.profile.id,
            first_name: endorsementModal.profile.first_name || '',
            last_name: endorsementModal.profile.last_name || '',
            full_name: endorsementModal.profile.full_name,
            username: endorsementModal.profile.username || '',
            avatar_url: endorsementModal.profile.avatar_url,
            qualification: endorsementModal.profile.qualification,
            verification_status: endorsementModal.profile.verification_status
        });
    }, [endorsementModal.profile]);

    // ---------- Render ----------
    return (
        <div
            className="min-h-screen bg-slate-50 dark:bg-zinc-950"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull-to-refresh indicator */}
            <div
                className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
                style={{ height: isPulling ? 60 : pullDistance }}
            >
                {isPulling ? (
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                ) : pullDistance > 0 ? (
                    <div
                        className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-zinc-700 border-t-indigo-500 transition-transform"
                        style={{
                            transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)`,
                            opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
                        }}
                    />
                ) : null}
            </div>

            <div className="max-w-2xl mx-auto md:px-4 md:py-8">
                <div className="hidden md:block mb-6">
                    <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Nurse Daily Pulse
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        A personalized feed of what nurses are sharing today
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-950 p-3 border-b border-slate-100 dark:border-zinc-900 md:border-0 md:mb-6">
                    <button
                        onClick={() => setIsComposerOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-full text-left text-slate-500 dark:text-slate-400 text-sm active:bg-slate-200 dark:active:bg-zinc-800 transition"
                    >
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span>Share your nursing journey today...</span>
                    </button>
                </div>

                {/* Feed */}
                {loading ? (
                    <div>
                        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <div className="w-16 h-16 mx-auto bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 text-lg">
                            You're all caught up
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                            You've seen everything fresh for now. Share something to start the next wave, or check back later.
                        </p>
                        <button
                            onClick={handleRefresh}
                            className="mt-5 px-5 py-2.5 rounded-full bg-indigo-600 active:bg-indigo-700 text-white text-sm font-semibold transition"
                        >
                            Refresh Feed
                        </button>
                    </div>
                ) : (
                    <div>
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUserId={currentUserId || ''}
                                likeState={likeState}
                                onLike={handleLike}
                                onShare={handleShare}
                                onEndorse={handleEndorse}
                                onView={recordView}
                            />
                        ))}

                        {/* Load more button / all-caught-up message */}
                        {posts.length > 0 && (
                            <div className="py-8 px-6 flex justify-center">
                                {hasMore ? (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition disabled:opacity-50 min-h-[44px]"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading
                                            </>
                                        ) : (
                                            'Load more posts'
                                        )}
                                    </button>
                                ) : (
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        You're all caught up — check back later for new posts
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PostComposerModal
                isOpen={isComposerOpen}
                onClose={() => setIsComposerOpen(false)}
                onSubmit={handleCreatePost}
                submitting={submitting}
            />

            {endorsementModal.isOpen && endorsementModal.profile && currentUserId && (
                <EndorsementManager
                    isOpen={endorsementModal.isOpen}
                    onClose={() => setEndorsementModal({ isOpen: false, profile: null })}
                    profileId={endorsementModal.profile.id}
                    profileName={endorsementDisplayName}
                    currentUserId={currentUserId}
                    onEndorsementChange={() => {
                        if (currentUserId) loadPage(currentUserId, true);
                    }}
                />
            )}
        </div>
    );
}