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
    Heart,
    Share2,
    ThumbsUp,
    Send,
    Loader2,
    MessageCircle,
    Clock,
    Award,
    CheckCircle2,
    Copy,
    Check
} from 'lucide-react';

// Types
interface NursePost {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    author?: {
        id: string;
        first_name: string;
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

// Helper: Format relative time
const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
};

// Skeleton Loader Component
const PostSkeleton = () => (
    <div className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-slate-200/60 md:dark:border-zinc-800 p-3 md:p-4 animate-pulse border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60">
        <div className="flex items-start gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex-1 space-y-1.5 md:space-y-2">
                <div className="h-3.5 md:h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                <div className="h-2.5 md:h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                <div className="space-y-1 mt-1.5 md:mt-2">
                    <div className="h-2.5 md:h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-2.5 md:h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                </div>
                <div className="flex gap-3 md:gap-4 mt-2 md:mt-3">
                    <div className="h-7 md:h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-14 md:w-16"></div>
                    <div className="h-7 md:h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-14 md:w-16"></div>
                    <div className="h-7 md:h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-16 md:w-20"></div>
                </div>
            </div>
        </div>
    </div>
);

// Post Card Component
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
    const [showShareTooltip, setShowShareTooltip] = useState(false);

    const handleCopyLink = async () => {
        const shareUrl = `${window.location.origin}/feed?postId=${post.id}`;
        await navigator.clipboard.writeText(shareUrl);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
    };

    const handleWhatsAppShare = () => {
        const text = encodeURIComponent(`Check out this post from ${post.author?.first_name} on Nursefolio: "${post.content.slice(0, 100)}..."`);
        const url = encodeURIComponent(`${window.location.origin}/feed?postId=${post.id}`);
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-slate-200/60 md:dark:border-zinc-800 md:hover:shadow-md transition-all duration-200 overflow-hidden border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60"
        >
            <div className="p-3 md:p-4">
                {/* Author Info */}
                <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="flex items-start gap-2 md:gap-3">
                        <img
                            src={post.author?.avatar_url || '/192.png'}
                            alt={post.author?.first_name}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-slate-200 dark:border-zinc-700"
                        />
                        <div>
                            <div className="flex items-center gap-1 md:gap-1.5 flex-wrap">
                                <h3 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm">
                                    {post.author?.first_name} {post.author?.last_name}
                                </h3>
                                {post.author?.verification_status === 'verified' && (
                                    <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-500 dark:text-indigo-400" />
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                                <p className="text-[9px] md:text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                    {post.author?.qualification || 'Registered Nurse'}
                                </p>
                                <span className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500">•</span>
                                <div className="flex items-center gap-0.5 md:gap-1">
                                    <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-400 dark:text-slate-500" />
                                    <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400">
                                        {getRelativeTime(post.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3 md:mb-4 whitespace-pre-wrap">
                    {post.content}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 md:gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    {/* Like Button */}
                    <button
                        onClick={() => onLike(post.id)}
                        className={`flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-1 rounded-lg transition-all duration-200 text-[10px] md:text-xs font-semibold ${currentLikeState.isLiked
                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${currentLikeState.isLiked ? 'fill-current' : ''}`} />
                        <span>{currentLikeState.count}</span>
                    </button>

                    {/* Share Button */}
                    <div className="relative">
                        <button
                            onClick={() => onShare(post.id, post.content)}
                            className="flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-1 rounded-lg transition-all duration-200 text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span>{post.share_count || 0}</span>
                        </button>

                        {showShareTooltip && (
                            <div className="absolute bottom-full left-0 mb-2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] md:text-xs rounded-lg px-2 md:px-3 py-1 md:py-1.5 whitespace-nowrap z-10">
                                Link copied!
                            </div>
                        )}
                    </div>

                    {/* Endorse Button - Only show for other nurses */}
                    {!isOwnPost && post.author && (
                        <button
                            onClick={() => onEndorse(post.author)}
                            className="flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-1 rounded-lg transition-all duration-200 text-[10px] md:text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                        >
                            <ThumbsUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span>Endorse ({post.author.endorsement_count || 0})</span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Main Component
export default function NurseFeed() {
    const [posts, setPosts] = useState<NursePost[]>([]);
    const [likeState, setLikeState] = useState<LikeState>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [endorsementModal, setEndorsementModal] = useState<{
        isOpen: boolean;
        profile: UserProfile | null;
    }>({ isOpen: false, profile: null });

    const feedEndRef = useRef<HTMLDivElement>(null);

    // Get current user on mount
    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        getCurrentUser();
    }, []);

    // Fetch posts with author info and like status
    const fetchPosts = useCallback(async () => {
        if (!currentUserId) return;

        try {
            setLoading(true);

            const { data: postsData, error: postsError } = await supabase
                .from('nurse_posts')
                .select(`
          *,
          author:profiles (
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            qualification,
            verification_status
          )
        `)
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            const { data: likesData, error: likesError } = await supabase
                .from('post_likes')
                .select('post_id, user_id');

            if (likesError) throw likesError;

            const { data: sharesData, error: sharesError } = await supabase
                .from('post_shares')
                .select('post_id');

            if (sharesError) throw sharesError;

            const { data: endorsementsData, error: endorsementsError } = await supabase
                .from('profile_endorsements')
                .select('profile_id');

            if (endorsementsError) throw endorsementsError;

            const endorsementCountsMap = new Map<string, number>();
            endorsementsData?.forEach(endorsement => {
                endorsementCountsMap.set(
                    endorsement.profile_id,
                    (endorsementCountsMap.get(endorsement.profile_id) || 0) + 1
                );
            });

            const likesMap = new Map<string, number>();
            const sharesMap = new Map<string, number>();
            const userLikesSet = new Set<string>();

            likesData?.forEach(like => {
                likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1);
                if (like.user_id === currentUserId) {
                    userLikesSet.add(like.post_id);
                }
            });

            sharesData?.forEach(share => {
                sharesMap.set(share.post_id, (sharesMap.get(share.post_id) || 0) + 1);
            });

            const enrichedPosts: NursePost[] = (postsData || []).map(post => ({
                ...post,
                author: {
                    ...post.author,
                    endorsement_count: endorsementCountsMap.get(post.user_id) || 0
                },
                like_count: likesMap.get(post.id) || 0,
                share_count: sharesMap.get(post.id) || 0,
                is_liked_by_user: userLikesSet.has(post.id)
            }));
            setPosts(enrichedPosts);

            const newLikeState: LikeState = {};
            enrichedPosts.forEach(post => {
                newLikeState[post.id] = {
                    count: post.like_count,
                    isLiked: post.is_liked_by_user
                };
            });
            setLikeState(newLikeState);

        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        if (currentUserId) {
            fetchPosts();
        }
    }, [currentUserId, fetchPosts]);

    // Handle creating a new post
    const handleCreatePost = async () => {
        if (!currentUserId || !newPostContent.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const tempPost: NursePost = {
            id: tempId,
            user_id: currentUserId,
            content: newPostContent.trim(),
            created_at: new Date().toISOString(),
            author: {
                id: currentUserId,
                first_name: 'You',
                last_name: '',
                username: '',
                avatar_url: null,
                qualification: null,
                verification_status: 'unverified'
            },
            like_count: 0,
            share_count: 0,
            is_liked_by_user: false
        };

        setPosts(prev => [tempPost, ...prev]);
        setNewPostContent('');
        setSubmitting(true);

        try {
            const { data, error } = await supabase
                .from('nurse_posts')
                .insert({
                    user_id: currentUserId,
                    content: newPostContent.trim()
                })
                .select()
                .single();

            if (error) throw error;

            const { data: authorData } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, username, avatar_url, qualification, verification_status')
                .eq('id', currentUserId)
                .single();

            setPosts(prev =>
                prev.map(post =>
                    post.id === tempId
                        ? { ...data, author: authorData, like_count: 0, share_count: 0, is_liked_by_user: false }
                        : post
                )
            );

            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            console.error('Error creating post:', err);
            setPosts(prev => prev.filter(post => post.id !== tempId));
            alert('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle like/unlike with optimistic update
    const handleLike = async (postId: string) => {
        if (!currentUserId) return;

        const currentState = likeState[postId];
        const newIsLiked = !currentState?.isLiked;
        const newCount = (currentState?.count || 0) + (newIsLiked ? 1 : -1);

        setLikeState(prev => ({
            ...prev,
            [postId]: {
                count: Math.max(0, newCount),
                isLiked: newIsLiked
            }
        }));

        setPosts(prev =>
            prev.map(post =>
                post.id === postId
                    ? {
                        ...post,
                        like_count: Math.max(0, newCount),
                        is_liked_by_user: newIsLiked
                    }
                    : post
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
            console.error('Error toggling like:', err);
            setLikeState(prev => ({
                ...prev,
                [postId]: currentState || { count: 0, isLiked: false }
            }));
            setPosts(prev =>
                prev.map(post =>
                    post.id === postId
                        ? {
                            ...post,
                            like_count: currentState?.count || 0,
                            is_liked_by_user: currentState?.isLiked || false
                        }
                        : post
                )
            );
        }
    };

    // Handle share
    const handleShare = async (postId: string, content: string) => {
        if (!currentUserId) {
            alert('Please sign in to share posts.');
            return;
        }

        const shareUrl = `${window.location.origin}/feed?postId=${postId}`;
        const shareText = `Check out this post from a nurse on Nursefolio: "${content.slice(0, 100)}..."`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Nursefolio Post',
                    text: shareText,
                    url: shareUrl
                });

                await supabase
                    .from('post_shares')
                    .insert({
                        post_id: postId,
                        user_id: currentUserId,
                        platform: 'native'
                    });

                setPosts(prev =>
                    prev.map(post =>
                        post.id === postId
                            ? { ...post, share_count: (post.share_count || 0) + 1 }
                            : post
                    )
                );
            } catch (err) {
                console.log('Share cancelled or failed');
            }
        } else {
            await navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');

            await supabase
                .from('post_shares')
                .insert({
                    post_id: postId,
                    user_id: currentUserId,
                    platform: 'copy'
                });

            setPosts(prev =>
                prev.map(post =>
                    post.id === postId
                        ? { ...post, share_count: (post.share_count || 0) + 1 }
                        : post
                )
            );
        }
    };

    // Handle opening endorsement modal
    const handleEndorse = (author: NursePost['author']) => {
        if (!author) return;

        const profile: UserProfile = {
            id: author.id,
            first_name: author.first_name,
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

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto px-0 md:px-4 py-4 md:py-8">
                {/* Header */}
                <div className="mb-4 md:mb-6 px-4 md:px-0">
                    <h1 className="text-xl md:text-2xl lg:text-3xl text-center font-display font-bold text-slate-900 dark:text-white">
                        Nurse Daily Pulse
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 text-center dark:text-slate-400 mt-0.5 md:mt-1">
                        Share what you learned, experienced, or observed in the ward today
                    </p>
                </div>

                {/* Post Composer - full width on mobile */}
                <div className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-slate-200/60 md:dark:border-zinc-800 p-3 md:p-4 mb-0 md:mb-6 md:shadow-sm border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-200/60">
                    <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="What did you learn today in the ward?"
                        rows={2}
                        className="w-full text-xs md:text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 transition resize-none"
                    />
                    <div className="flex justify-end mt-2 md:mt-3">
                        <button
                            onClick={handleCreatePost}
                            disabled={!newPostContent.trim() || submitting}
                            className="w-full md:w-auto flex items-center justify-center gap-1.5 md:gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs md:text-sm font-semibold transition md:shadow-md md:shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    Post
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Feed List */}
                {loading ? (
                    <div className="space-y-0 md:space-y-4">
                        {[1, 2, 3].map(i => (
                            <PostSkeleton key={i} />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12 md:py-16 mx-3 md:mx-0 bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-slate-200/60 md:dark:border-zinc-800"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mb-3 md:mb-4">
                            <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 text-base md:text-lg">
                            No posts yet
                        </h3>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 md:mt-2 max-w-sm mx-auto">
                            Be the first nurse to share what you learned today in the ward!
                        </p>
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

            {/* Endorsement Modal */}
            <AnimatePresence>
                {endorsementModal.isOpen && endorsementModal.profile && currentUserId && (
                    <EndorsementManager
                        isOpen={endorsementModal.isOpen}
                        onClose={() => setEndorsementModal({ isOpen: false, profile: null })}
                        profileId={endorsementModal.profile.id}
                        profileName={`${endorsementModal.profile.first_name} ${endorsementModal.profile.last_name}`}
                        currentUserId={currentUserId}
                        onEndorsementChange={() => {
                            console.log('Endorsement added/removed');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}