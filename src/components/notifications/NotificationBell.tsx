import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Bell, CheckCheck, X, Heart, MessageSquare, UserPlus, Star, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    type: string;
    post_id?: string;
    profile_id?: string;
    action_url?: string;
    actor_id?: string;
    user_id?: string;
}

interface NotificationBellProps {
    variant?: 'floating' | 'inline';
}

// ---- Cache config ----
const CACHE_KEY = 'notifications_cache_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedNotifications {
    userId: string;
    fetchedAt: number;
    items: Notification[];
}

function readCache(userId: string): Notification[] | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed: CachedNotifications = JSON.parse(raw);
        if (parsed.userId !== userId) return null;
        return parsed.items;
    } catch {
        return null;
    }
}

function writeCache(userId: string, items: Notification[]) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, fetchedAt: Date.now(), items }));
    } catch { /* quota — ignore */ }
}

function isCacheStale(userId: string): boolean {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return true;
        const parsed: CachedNotifications = JSON.parse(raw);
        if (parsed.userId !== userId) return true;
        return Date.now() - parsed.fetchedAt > CACHE_TTL_MS;
    } catch {
        return true;
    }
}

// ==========================================================
// ICON RESOLVER — pure, hoisted
// ==========================================================
function getIcon(type: string) {
    switch (type) {
        case 'like': return <Heart size={14} className="fill-rose-500 text-rose-500" />;
        case 'comment': return <MessageSquare size={14} className="text-sky-500" />;
        case 'follow': return <UserPlus size={14} className="text-violet-500" />;
        case 'endorsement': return <Star size={14} className="fill-amber-500 text-amber-500" />;
        default: return <Info size={14} className="text-teal-500" />;
    }
}

// ==========================================================
// ROW — memoized
// ==========================================================
const NotificationRow = React.memo<{
    n: Notification;
    onClick: (n: Notification) => void;
}>(({ n, onClick }) => (
    <button
        type="button"
        onClick={() => onClick(n)}
        className={`w-full text-left p-4 transition-colors border-0 ${!n.is_read
            ? 'bg-teal-50/60 dark:bg-teal-950/15'
            : 'bg-transparent active:bg-slate-50 dark:active:bg-zinc-900/60'
            }`}
    >
        <div className="flex gap-3">
            <div className="mt-0.5 w-9 h-9 rounded-2xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0">
                {getIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                    <p className={`text-sm flex-1 ${!n.is_read
                        ? 'font-semibold text-slate-900 dark:text-white'
                        : 'font-medium text-slate-600 dark:text-slate-400'
                        }`}>
                        {n.title}
                    </p>
                    {!n.is_read && (
                        <span className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {n.message}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
            </div>
        </div>
    </button>
));
NotificationRow.displayName = 'NotificationRow';

// ==========================================================
// MAIN
// ==========================================================
export default function NotificationBell({ variant = 'floating' }: NotificationBellProps) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toast, setToast] = useState<Notification | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const unreadCount = useMemo(
        () => notifications.reduce((acc, n) => (n.is_read ? acc : acc + 1), 0),
        [notifications]
    );

    // ---- Dark mode observer ----
    useEffect(() => {
        const check = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    // ---- Audio ----
    useEffect(() => {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.7;
        audioRef.current.preload = 'auto';
        audioRef.current.load();

        const enableAudio = () => {
            const a = audioRef.current;
            if (!a) return;
            const p = a.play();
            if (p !== undefined) {
                p.then(() => {
                    a.pause();
                    a.currentTime = 0;
                    setAudioEnabled(true);
                }).catch(() => setAudioEnabled(false));
            }
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };
        document.addEventListener('click', enableAudio);
        document.addEventListener('touchstart', enableAudio);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };
    }, []);

    // ---- Click outside (desktop only) ----
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    // ---- Fetch ----
    const fetchNotifications = useCallback(async (uid: string, opts: { silent?: boolean } = {}) => {
        try {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) {
                setNotifications(data);
                writeCache(uid, data);
            }
        } catch (err) {
            if (!opts.silent) console.error('Failed to fetch notifications:', err);
        }
    }, []);

    // ---- Boot ----
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || cancelled) return;
            setUserId(user.id);

            const cached = readCache(user.id);
            if (cached) setNotifications(cached);

            if (isCacheStale(user.id)) {
                await fetchNotifications(user.id);
            }
        })();
        return () => { cancelled = true; };
    }, [fetchNotifications]);

    // ---- Refresh on tab focus ----
    useEffect(() => {
        if (!userId) return;
        const onVisible = () => {
            if (document.visibilityState === 'visible' && isCacheStale(userId)) {
                fetchNotifications(userId, { silent: true });
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [userId, fetchNotifications]);

    // ---- Navigation ----
    const handleNavigation = useCallback((n: Notification) => {
        if (n.type === 'endorsement') navigate('/dashboard');
        else if ((n.type === 'like' || n.type === 'comment') && n.post_id) navigate(`/feed?post=${n.post_id}`);
        else if (n.type === 'follow' && n.profile_id) navigate(`/nurse/${n.profile_id}`);
        else if (n.action_url) navigate(n.action_url);
    }, [navigate]);

    // ---- Mark as read ----
    const markAsRead = useCallback(async (id: string) => {
        try {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id);
            setNotifications(prev => {
                const next = prev.map(n => (n.id === id ? { ...n, is_read: true } : n));
                if (userId) writeCache(userId, next);
                return next;
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, [userId]);

    const markAllRead = useCallback(async () => {
        if (!userId) return;
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            setNotifications(prev => {
                const next = prev.map(n => ({ ...n, is_read: true }));
                writeCache(userId, next);
                return next;
            });
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }, [userId]);

    const handleClick = useCallback(async (n: Notification) => {
        await markAsRead(n.id);
        setOpen(false);
        setToast(null);
        handleNavigation(n);
    }, [markAsRead, handleNavigation]);

    const closePanel = useCallback(() => setOpen(false), []);

    return (
        <>
            {/* ============================================
                TOAST — no shadow, XL corners, app palette
                ============================================ */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, x: 40, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.96 }}
                        className="fixed top-6 right-4 left-4 md:left-auto md:right-6 md:w-96 z-[9999] cursor-pointer"
                        onClick={() => handleClick(toast)}
                    >
                        <div className="rounded-3xl p-4 relative overflow-hidden bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                            <div className="flex gap-3">
                                <div className="p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 h-fit flex-shrink-0">
                                    {getIcon(toast.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate text-slate-900 dark:text-white">
                                        {toast.title}
                                    </p>
                                    <p className="text-xs mt-0.5 line-clamp-2 text-slate-600 dark:text-slate-400">
                                        {toast.message}
                                    </p>
                                    <p className="text-[10px] mt-1 text-slate-400 dark:text-slate-500">
                                        {formatDistanceToNow(new Date(toast.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setToast(null); }}
                                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1"
                                    aria-label="Dismiss"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <motion.div
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 5, ease: 'linear' }}
                                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-teal-500 to-teal-400"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ============================================
                BELL + PANEL
                ============================================ */}
            <div className={variant === 'floating' ? 'fixed top-14 right-4 z-40' : 'relative'}>
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setOpen(o => !o)}
                    className="relative p-2 rounded-full transition-colors text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-zinc-900"
                    aria-label="Notifications"
                >
                    <Bell size={20} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-950">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </motion.button>

                <AnimatePresence>
                    {open && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 md:bg-black/10 z-[60] md:z-30"
                                onClick={closePanel}
                            />

                            {/* Panel — bottom sheet on phone, dropdown on desktop */}
                            <motion.div
                                ref={overlayRef}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ type: 'spring', damping: 28, stiffness: 340 }}
                                className={[
                                    // Mobile: edge-to-edge bottom sheet
                                    'fixed inset-x-0 bottom-0 z-[70]',
                                    'flex flex-col overflow-hidden',
                                    'rounded-t-3xl',
                                    'h-[85vh]',
                                    // Desktop: anchored dropdown
                                    'md:absolute md:inset-auto md:top-12 md:right-0 md:h-auto md:bottom-auto',
                                    'md:w-96 xl:w-[28rem] md:max-h-[560px] md:rounded-3xl',
                                    // Colors — no shadow, just a hairline border
                                    'bg-white dark:bg-zinc-950',
                                    'border-t border-slate-100 dark:border-zinc-900',
                                    'md:border md:border-slate-100 md:dark:border-zinc-900',
                                ].join(' ')}
                                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                            >
                                {/* Header — flat, no bg tint, hairline divider */}
                                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-slate-100 dark:border-zinc-900">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                                            Notifications
                                        </span>
                                        {unreadCount > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="text-[11px] font-semibold px-2 py-1 rounded-full text-teal-600 dark:text-teal-400 active:bg-teal-50 dark:active:bg-teal-950/40 transition-colors flex items-center gap-1"
                                            >
                                                <CheckCheck size={12} />
                                                <span className="hidden sm:inline">Mark all read</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={closePanel}
                                            className="md:hidden p-1.5 rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition"
                                            aria-label="Close"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="overflow-y-auto flex-1 overscroll-contain">
                                    {notifications.length === 0 ? (
                                        <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                                            <Bell size={32} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-sm font-medium">No notifications yet</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100 dark:divide-zinc-900">
                                            {notifications.map(n => (
                                                <NotificationRow key={n.id} n={n} onClick={handleClick} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}