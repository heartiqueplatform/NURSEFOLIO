import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Wind,
    Sparkles,
    BookOpen,
    ArrowRightLeft,
    Droplet,
    MessageCircle,
    X,
    Flame,
    HeartHandshake,
    Activity
} from 'lucide-react';

// Nursing intervention options
const RESUSCITATION_STEPS = [
    { id: 1, text: "Blow gently on the wick", icon: Wind },
    { id: 2, text: "Flick a spark from your fingertips", icon: Sparkles },
    { id: 3, text: "Recite an ancient fire mantra", icon: BookOpen },
    { id: 4, text: "Transfer energy from another candle", icon: ArrowRightLeft },
    { id: 5, text: "Drop wax from a living flame", icon: Droplet },
    { id: 6, text: "Whisper encouragement to the ember", icon: MessageCircle },
];

interface StreakCandleProps {
    variant?: 'floating' | 'sidebar' | 'mobile';
}

// ---- Cache ----
const STREAK_CACHE_KEY = 'streak_cache_v1';

interface CachedStreak {
    userId: string;
    fetchedAt: number;
    count: number;
    active: boolean;
    lastVisitAt: string;
}

function readStreakCache(userId: string): CachedStreak | null {
    try {
        const raw = localStorage.getItem(STREAK_CACHE_KEY);
        if (!raw) return null;
        const parsed: CachedStreak = JSON.parse(raw);
        if (parsed.userId !== userId) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeStreakCache(c: CachedStreak) {
    try {
        localStorage.setItem(STREAK_CACHE_KEY, JSON.stringify(c));
    } catch {
        /* quota — ignore */
    }
}

function isSameCalendarDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export default function StreakCandle({ variant = 'floating' }: StreakCandleProps) {
    const { user } = useAuth();
    const [streakData, setStreakData] = useState<{ count: number; active: boolean } | null>(null);
    const [showResuscitateModal, setShowResuscitateModal] = useState(false);
    const [resuscitationProgress, setResuscitationProgress] = useState(0);
    const [selectedSteps, setSelectedSteps] = useState<number[]>([]);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // ---- Dark mode observer ----
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // ---- syncStreak ----
    const syncStreak = useCallback(async (userId: string, cancelled: boolean) => {
        const { data } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (cancelled) return;

        const now = new Date();
        let newCount = data?.streak_count || 1;
        let isActive = true;

        if (data) {
            const lastVisit = new Date(data.last_visit_at);
            const diffDays = Math.floor(
                Math.abs(now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 0) {
                setStreakData({ count: data.streak_count, active: data.is_active });
                writeStreakCache({
                    userId,
                    fetchedAt: Date.now(),
                    count: data.streak_count,
                    active: data.is_active,
                    lastVisitAt: data.last_visit_at,
                });
                return;
            }

            if (diffDays <= 3) {
                newCount = data.streak_count + 1;
            } else {
                newCount = 0;
                isActive = false;
            }
        }

        const { data: updated } = await supabase
            .from('user_streaks')
            .upsert({
                user_id: userId,
                streak_count: newCount,
                last_visit_at: now.toISOString(),
                is_active: isActive,
            })
            .select()
            .single();

        if (cancelled || !updated) return;

        setStreakData({ count: updated.streak_count, active: updated.is_active });
        writeStreakCache({
            userId,
            fetchedAt: Date.now(),
            count: updated.streak_count,
            active: updated.is_active,
            lastVisitAt: updated.last_visit_at,
        });
    }, []);

    // ---- Boot: cache-first ----
    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        const userId = user.id;

        (async () => {
            const cached = readStreakCache(userId);
            if (cached) {
                if (cancelled) return;
                setStreakData({ count: cached.count, active: cached.active });
                const last = new Date(cached.lastVisitAt);
                if (isSameCalendarDay(last, new Date())) return;
            }
            await syncStreak(userId, cancelled);
        })();

        return () => {
            cancelled = true;
        };
    }, [user?.id, syncStreak]);

    const handleCandleTap = useCallback(() => {
        if (!streakData?.active) {
            setShowResuscitateModal(true);
            setResuscitationProgress(0);
            setSelectedSteps([]);
        }
    }, [streakData?.active]);

    const resuscitateCandle = useCallback(async () => {
        if (!user?.id) return;
        const userId = user.id;
        const now = new Date();

        const { data: updated } = await supabase
            .from('user_streaks')
            .upsert({
                user_id: userId,
                streak_count: 1,
                last_visit_at: now.toISOString(),
                is_active: true,
            })
            .select()
            .single();

        if (updated) {
            setStreakData({ count: updated.streak_count, active: updated.is_active });
            writeStreakCache({
                userId,
                fetchedAt: Date.now(),
                count: updated.streak_count,
                active: updated.is_active,
                lastVisitAt: updated.last_visit_at,
            });
            setShowResuscitateModal(false);
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
        }
    }, [user?.id]);

    const handleResuscitateAction = useCallback((step: typeof RESUSCITATION_STEPS[0]) => {
        setSelectedSteps(prev => {
            if (prev.includes(step.id)) return prev;
            const next = [...prev, step.id];
            setResuscitationProgress(Math.min(next.length / 3, 1));
            if (next.length >= 3) {
                setTimeout(() => resuscitateCandle(), 600);
            }
            return next;
        });
    }, [resuscitateCandle]);

    const resuscitationMessage = useMemo(() => {
        if (resuscitationProgress === 0) return "The candle is dying... Choose a nursing action to revive it";
        if (resuscitationProgress < 0.5) return "A faint warmth returns... Continue your care";
        if (resuscitationProgress < 1) return "Almost there! One more intervention will bring it back";
        return "The flame flickers back to life!";
    }, [resuscitationProgress]);

    if (!user || !streakData) return null;

    // Wrapper positioning per variant — mobile now HORIZONTAL to fit beside candle
    const wrapperClass =
        variant === 'floating'
            ? 'fixed bottom-16 right-3 z-[40] flex flex-col items-center cursor-pointer select-none'
            : variant === 'sidebar'
                ? 'flex flex-col items-center cursor-pointer py-2 select-none'
                : 'flex flex-row items-center justify-center gap-1 cursor-pointer select-none';

    const svgW = variant === 'mobile' ? 18 : 28;
    const svgH = variant === 'mobile' ? 38 : 60;

    return (
        <>
            {/* FLOATING LIGHT STREAK */}
            <AnimatePresence>
                {streakData.active && (
                    <motion.div
                        initial={{ x: "-100vw", opacity: 0 }}
                        animate={{
                            x: "100vw",
                            y: [200, 150, 250, 200],
                            opacity: [0, 1, 1, 0],
                        }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="fixed top-0 pointer-events-none z-[9999] w-80 h-1 bg-gradient-to-r from-transparent via-orange-300 to-transparent blur-md"
                    />
                )}
            </AnimatePresence>

            {/* SUCCESS TOAST */}
            <AnimatePresence>
                {showSuccessMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-40 right-6 z-[200] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                    >
                        <Flame className="w-4 h-4" />
                        Candle revived! Streak restored to 1 day
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CANDLE UI */}
            <div className={wrapperClass} onClick={handleCandleTap}>
                <svg
                    className="candle-svg"
                    width={svgW}
                    height={svgH}
                    viewBox="0 0 48 90"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        <radialGradient id="sc-glow" cx="50%" cy="70%" r="50%">
                            <stop offset="0%" stopColor="#FFF176" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#FF6D00" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="sc-wax" cx="50%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#FFF8F0" />
                            <stop offset="100%" stopColor="#FFE0B2" />
                        </radialGradient>
                        <radialGradient id="sc-wax-dead" cx="50%" cy="30%" r="70%">
                            <stop offset="0%" stopColor={isDarkMode ? "#2a2a2a" : "#F5F5F5"} />
                            <stop offset="100%" stopColor={isDarkMode ? "#1a1a1a" : "#E0E0E0"} />
                        </radialGradient>
                        <filter id="sc-fire-blur">
                            <feGaussianBlur stdDeviation="1.2" />
                        </filter>

                        <style>{`
                            @keyframes sc-flicker1 {
                                0%,100% { transform: scaleX(1) scaleY(1) translateY(0); }
                                20%     { transform: scaleX(0.82) scaleY(1.1) translateY(-2px); }
                                40%     { transform: scaleX(1.12) scaleY(0.94) translateY(1px); }
                                60%     { transform: scaleX(0.88) scaleY(1.06) translateY(-1px); }
                                80%     { transform: scaleX(1.06) scaleY(0.97) translateY(0px); }
                            }
                            @keyframes sc-flicker2 {
                                0%,100% { transform: scaleX(1) scaleY(1); opacity: 0.92; }
                                25%     { transform: scaleX(1.14) scaleY(0.91); opacity: 1; }
                                50%     { transform: scaleX(0.86) scaleY(1.12); opacity: 0.84; }
                                75%     { transform: scaleX(1.06) scaleY(0.95); opacity: 0.96; }
                            }
                            @keyframes sc-flicker3 {
                                0%,100% { transform: scaleX(1) scaleY(1) rotate(0deg); opacity: 1; }
                                33%     { transform: scaleX(0.78) scaleY(1.16) rotate(-2.5deg); opacity: 0.78; }
                                66%     { transform: scaleX(1.16) scaleY(0.88) rotate(2.5deg); opacity: 0.96; }
                            }
                            @keyframes sc-core-pulse {
                                0%,100% { opacity: 0.95; }
                                50%     { opacity: 0.6; }
                            }
                            @keyframes sc-ambient {
                                0%,100% { opacity: 0.3; }
                                50%     { opacity: 0.55; }
                            }
                            @keyframes sc-smoke {
                                0%   { transform: translateY(0) scaleX(1); opacity: 0.45; }
                                100% { transform: translateY(-20px) scaleX(1.6); opacity: 0; }
                            }
                            @keyframes candle-pulse {
                                0%,100% { filter: drop-shadow(0 0 0 rgba(255,109,0,0)); transform: scale(1); }
                                50% { filter: drop-shadow(0 0 15px rgba(255,109,0,0.8)); transform: scale(1.05); }
                            }
                            .sc-f1 { transform-origin: 24px 22px; animation: sc-flicker1 1.4s ease-in-out infinite; }
                            .sc-f2 { transform-origin: 24px 25px; animation: sc-flicker2 1.1s ease-in-out infinite; }
                            .sc-f3 { transform-origin: 24px 28px; animation: sc-flicker3 0.9s ease-in-out infinite; }
                            .sc-fc { animation: sc-core-pulse 0.7s ease-in-out infinite; }
                            .sc-amb { animation: sc-ambient 1.4s ease-in-out infinite; }
                            .sc-s1 { animation: sc-smoke 1.8s ease-out infinite; }
                            .sc-s2 { animation: sc-smoke 1.8s ease-out 0.6s infinite; }
                            .sc-s3 { animation: sc-smoke 1.8s ease-out 1.2s infinite; }
                            .candle-pulse { animation: candle-pulse 0.5s ease-in-out !important; }
                            .candle-svg { transition: filter 0.3s ease; }
                        `}</style>
                    </defs>

                    {streakData.active ? (
                        <>
                            <ellipse cx="24" cy="68" rx="18" ry="5" fill="#FF6D00" opacity="0.18" className="sc-amb" />
                            <rect x="9" y="44" width="30" height="30" rx="3" fill="url(#sc-wax)" stroke="#FFCC80" strokeWidth="0.8" />
                            <rect x="13" y="47" width="5" height="24" rx="2" fill="white" opacity="0.22" />
                            <rect x="6" y="71" width="36" height="6" rx="2" fill="#FFCC80" stroke="#FFB74D" strokeWidth="0.5" />
                            <ellipse cx="24" cy="44" rx="15" ry="3.5" fill="#FFF9F0" stroke="#FFCC80" strokeWidth="0.5" opacity="0.9" />
                            <line x1="24" y1="41" x2="24" y2="33" stroke="#4E342E" strokeWidth="1.4" strokeLinecap="round" />
                            <circle cx="24" cy="32" r="1.5" fill="#FF3D00" opacity="0.9" />
                            <circle cx="24" cy="22" r="22" fill="url(#sc-glow)" className="sc-amb" />
                            <g className="sc-f1">
                                <path d="M24,4 C18,11 13,20 15,28 C17,34 21,38 24,38 C27,38 31,34 33,28 C35,20 30,11 24,4 Z" fill="#E64A19" opacity="0.8" filter="url(#sc-fire-blur)" />
                            </g>
                            <g className="sc-f2">
                                <path d="M24,8 C19,14 15,22 17,29 C18,34 21,37 24,37 C27,37 30,34 31,29 C33,22 29,14 24,8 Z" fill="#FF6D00" opacity="0.9" />
                            </g>
                            <g className="sc-f3">
                                <path d="M24,12 C20,17 18,23 19,29 C19.5,33 22,36 24,36 C26,36 28.5,33 29,29 C30,23 28,17 24,12 Z" fill="#FFB300" opacity="0.95" />
                            </g>
                            <g className="sc-fc">
                                <path d="M24,17 C22,21 21,25 21.5,29 C22,32 23,34 24,34 C25,34 26,32 26.5,29 C27,25 26,21 24,17 Z" fill="#FFE57F" opacity="1" />
                                <circle cx="24" cy="17" r="2.5" fill="white" opacity="0.85" />
                            </g>
                        </>
                    ) : (
                        <>
                            <rect x="9" y="44" width="30" height="30" rx="3" fill="url(#sc-wax-dead)" stroke={isDarkMode ? "#4a4a4a" : "#BDBDBD"} strokeWidth="0.8" />
                            <rect x="13" y="47" width="5" height="24" rx="2" fill="white" opacity={isDarkMode ? "0.05" : "0.15"} />
                            <rect x="6" y="71" width="36" height="6" rx="2" fill={isDarkMode ? "#2a2a2a" : "#E0E0E0"} stroke={isDarkMode ? "#4a4a4a" : "#BDBDBD"} strokeWidth="0.5" />
                            <ellipse cx="24" cy="44" rx="15" ry="3.5" fill={isDarkMode ? "#2a2a2a" : "#F5F5F5"} stroke={isDarkMode ? "#4a4a4a" : "#BDBDBD"} strokeWidth="0.5" />
                            <path d="M24,41 Q22,36 23,32" stroke={isDarkMode ? "#9a9a9a" : "#757575"} strokeWidth="1.4" strokeLinecap="round" fill="none" />
                            <g className="sc-s1">
                                <path d="M23,32 Q20,26 23,20 Q26,14 23,8" stroke={isDarkMode ? "#6a6a6a" : "#9E9E9E"} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
                            </g>
                            <g className="sc-s2">
                                <path d="M24,31 Q27,25 24,19 Q21,13 24,7" stroke={isDarkMode ? "#7a7a7a" : "#BDBDBD"} strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.4" />
                            </g>
                            <g className="sc-s3">
                                <path d="M22,32 Q19,26 21,20" stroke={isDarkMode ? "#6a6a6a" : "#9E9E9E"} strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.3" />
                            </g>
                        </>
                    )}
                </svg>

                {/* Streak label — only on floating + sidebar */}
                {variant !== 'mobile' && (
                    <div className="-mt-2 bg-white/80 dark:bg-zinc-900/80 text-slate-800 dark:text-white text-[8px] px-1.5 py-0.5 rounded-full backdrop-blur-md whitespace-nowrap flex items-center gap-1 border-0">
                        {streakData.active ? (
                            <>
                                <Flame className="w-2.5 h-2.5" />
                                Streak: {streakData.count} day{streakData.count === 1 ? '' : 's'}
                            </>
                        ) : (
                            <>
                                <HeartHandshake className="w-2.5 h-2.5" />
                                Tap to resuscitate
                            </>
                        )}
                    </div>
                )}

                {/* Mobile — compact pill SIDE-BY-SIDE with candle (no overlap) */}
                {variant === 'mobile' && (
                    <span
                        className={`text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full whitespace-nowrap border-0 ${streakData.active
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                            : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                            }`}
                    >
                        <Flame className="w-2.5 h-2.5" />
                        {streakData.active ? `${streakData.count}d` : 'Off'}
                    </span>
                )}
            </div>

            {/* RESUSCITATION MODAL — no shadows, XL corners, app palette */}
            <AnimatePresence>
                {showResuscitateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowResuscitateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-zinc-950 rounded-3xl max-w-md w-full border border-slate-100 dark:border-zinc-900 max-h-[90vh] flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center pt-6 pb-4 px-6 flex-shrink-0">
                                <div className="flex justify-center mb-2">
                                    <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                                        <Activity className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Resuscitate the Candle
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">
                                    {resuscitationMessage}
                                </p>
                            </div>

                            <div className="px-6 mb-4 flex-shrink-0">
                                <div className="h-2 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${resuscitationProgress * 100}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <p className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                    {Math.floor(resuscitationProgress * 100)}% revived
                                </p>
                            </div>

                            <div className="space-y-2 overflow-y-auto flex-1 mb-4 px-6">
                                {RESUSCITATION_STEPS.map((step) => {
                                    const Icon = step.icon;
                                    const isSelected = selectedSteps.includes(step.id);
                                    return (
                                        <button
                                            key={step.id}
                                            onClick={() => handleResuscitateAction(step)}
                                            disabled={isSelected}
                                            className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-200 flex items-center gap-3 border-0 ${isSelected
                                                ? 'bg-emerald-50 dark:bg-emerald-950/30 cursor-not-allowed'
                                                : 'bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
                                            <span className={`text-sm flex-1 ${isSelected ? 'text-slate-500 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {step.text}
                                            </span>
                                            {isSelected && (
                                                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">done</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setShowResuscitateModal(false)}
                                className="flex-shrink-0 mx-6 mb-6 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 text-sm font-semibold active:bg-slate-200 dark:active:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}