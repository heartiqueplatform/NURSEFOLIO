import React, { useEffect, useRef, useState } from 'react';
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

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toast, setToast] = useState<Notification | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastSoundTime = useRef<number>(0);
    const overlayRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Detect dark/light mode
    useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    // Initialize audio with better handling
    useEffect(() => {
        // Create audio element
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.7;
        audioRef.current.preload = 'auto';

        // Load the audio file
        audioRef.current.load();

        // Test if audio can play
        const testAudio = () => {
            if (audioRef.current) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // Audio can play, pause it immediately
                        audioRef.current?.pause();
                        audioRef.current!.currentTime = 0;
                        setAudioEnabled(true);
                    }).catch(() => {
                        setAudioEnabled(false);
                    });
                }
            }
        };

        // Try to test audio on user interaction
        const enableAudio = () => {
            testAudio();
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

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    // Play sound function with better error handling
    const playNotificationSound = async () => {
        const now = Date.now();
        if (now - lastSoundTime.current < 2000) return;
        lastSoundTime.current = now;

        if (!audioRef.current || !audioEnabled) {
            console.log('Audio not ready or disabled');
            return;
        }

        try {
            // Reset and play
            audioRef.current.currentTime = 0;
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                await playPromise;
            }
        } catch (error) {
            console.log('Audio play failed:', error);
            setAudioEnabled(false);
        }
    };

    // Show toast with sound and vibration
    const showToast = async (notification: Notification) => {
        setToast(notification);

        // Play sound
        await playNotificationSound();

        // Vibrate if supported
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }

        // Auto hide after 5 seconds
        setTimeout(() => {
            setToast(prev => prev === notification ? null : prev);
        }, 5000);
    };

    // Handle notification click
    const handleNavigation = (n: Notification) => {
        if (n.type === 'endorsement') {
            navigate('/dashboard');
        }
        else if ((n.type === 'like' || n.type === 'comment') && n.post_id) {
            navigate(`/feed?post=${n.post_id}`);
        }
        else if (n.type === 'follow' && n.profile_id) {
            navigate(`/nurse/${n.profile_id}`);
        }
        else if (n.action_url) {
            navigate(n.action_url);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleClick = async (n: Notification) => {
        await markAsRead(n.id);
        setOpen(false);
        setToast(null);
        handleNavigation(n);
    };

    const markAllRead = async () => {
        if (!userId) return;

        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Fetch notifications and setup realtime subscription
    useEffect(() => {
        let subscription: any;

        const initializeNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserId(user.id);

            // Fetch initial notifications
            const { data: initialData, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching notifications:', error);
            } else if (initialData) {
                setNotifications(initialData);
            }

            // Setup realtime subscription
            subscription = supabase
                .channel(`notifications-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    async (payload) => {
                        const newNotification = payload.new as Notification;

                        // Add to notifications list
                        setNotifications(prev => [newNotification, ...prev]);

                        // Show toast for new notification
                        await showToast(newNotification);
                    }
                )
                .subscribe();
        };

        initializeNotifications();

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'like':
                return <Heart size={14} className="fill-red-500 text-red-500" />;
            case 'comment':
                return <MessageSquare size={14} className="text-blue-500" />;
            case 'follow':
                return <UserPlus size={14} className="text-purple-500" />;
            case 'endorsement':
                return <Star size={14} className="fill-yellow-500 text-yellow-500" />;
            default:
                return <Info size={14} className="text-teal-500" />;
        }
    };

    return (
        <>
            {/* Toast Notification - Light/Dark Mode Compatible */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className="fixed top-6 right-6 z-[9999] w-80 md:w-96 cursor-pointer"
                        onClick={() => handleClick(toast)}
                    >
                        <div className={`
                            rounded-2xl p-4 relative overflow-hidden shadow-xl
                            ${isDarkMode
                                ? 'bg-gray-800 border border-gray-700'
                                : 'bg-white border border-gray-200'
                            }
                        `}>
                            <div className="flex gap-3">
                                <div className={`
                                    p-2 rounded-xl h-fit
                                    ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}
                                `}>
                                    {getIcon(toast.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`
                                        font-bold text-sm truncate
                                        ${isDarkMode ? 'text-white' : 'text-gray-900'}
                                    `}>
                                        {toast.title}
                                    </p>
                                    <p className={`
                                        text-xs mt-0.5 line-clamp-2
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                                    `}>
                                        {toast.message}
                                    </p>
                                    <p className={`
                                        text-[10px] mt-1
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                                    `}>
                                        {formatDistanceToNow(new Date(toast.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setToast(null);
                                    }}
                                    className={`
                                        transition-colors
                                        ${isDarkMode
                                            ? 'text-gray-500 hover:text-gray-300'
                                            : 'text-gray-400 hover:text-gray-600'
                                        }
                                    `}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-teal-500 to-teal-400"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Bell Button */}
            <div className="fixed bottom-16 right-6 z-50">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setOpen(!open)}
                    className="relative bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white p-4 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-200"
                >
                    <Bell size={24} className={unreadCount > 0 ? "animate-bounce" : ""} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </motion.button>

                {/* Notification Panel */}
                <AnimatePresence>
                    {open && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/20 z-40"
                                onClick={() => setOpen(false)}
                            />

                            {/* Panel Content */}
                            <motion.div
                                ref={overlayRef}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                className={`
                                    absolute bottom-20 right-0 w-80 md:w-96 max-h-[500px]
                                    rounded-3xl flex flex-col overflow-hidden z-50 shadow-2xl
                                    ${isDarkMode
                                        ? 'bg-gray-900 border border-gray-800'
                                        : 'bg-white border border-gray-200'
                                    }
                                `}
                            >
                                {/* Header */}
                                <div className={`
                                    p-4 border-b flex justify-between items-center
                                    ${isDarkMode
                                        ? 'border-gray-800 bg-gray-800/50'
                                        : 'border-gray-100 bg-gray-50/50'
                                    }
                                `}>
                                    <div className="flex items-center gap-2">
                                        <span className={`
                                            font-semibold text-sm
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}
                                        `}>
                                            Notifications
                                        </span>
                                        {unreadCount > 0 && (
                                            <span className="text-xs bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors flex items-center gap-1"
                                        >
                                            <CheckCheck size={12} /> Mark all read
                                        </button>
                                    )}
                                </div>

                                {/* Notifications List */}
                                <div className="overflow-y-auto flex-1 max-h-[400px]">
                                    {notifications.length === 0 ? (
                                        <div className={`
                                            p-10 text-center text-sm
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                                        `}>
                                            <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleClick(notification)}
                                                className={`
                                                    p-4 cursor-pointer border-b transition-all duration-200
                                                    ${isDarkMode
                                                        ? 'border-gray-800 hover:bg-gray-800/50'
                                                        : 'border-gray-100 hover:bg-gray-50'
                                                    }
                                                    ${!notification.is_read && (
                                                        isDarkMode
                                                            ? 'bg-teal-900/10 border-l-4 border-l-teal-500'
                                                            : 'bg-teal-50/50 border-l-4 border-l-teal-500'
                                                    )}
                                                `}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`
                                                        mt-1 p-2 rounded-lg transition-transform group-hover:scale-110
                                                        ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}
                                                    `}>
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`
                                                            text-sm
                                                            ${!notification.is_read
                                                                ? `font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                                                                : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                                                            }
                                                        `}>
                                                            {notification.title}
                                                        </p>
                                                        <p className={`
                                                            text-xs mt-0.5 line-clamp-2
                                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}
                                                        `}>
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-2">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    {!notification.is_read && (
                                                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 animate-pulse" />
                                                    )}
                                                </div>
                                            </div>
                                        ))
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