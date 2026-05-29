import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function StreakCandle() {
    const { user } = useAuth();
    const [streakData, setStreakData] = useState<{ count: number; active: boolean } | null>(null);

    useEffect(() => {
        if (user?.id) {
            checkAndUpdateStreak(user.id);
        }
    }, [user?.id]);

    const checkAndUpdateStreak = async (userId: string) => {
        const { data, error } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

        const now = new Date();
        let newCount = data?.streak_count || 1;
        let isActive = true;

        if (data) {
            const lastVisit = new Date(data.last_visit_at);
            const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                setStreakData({ count: data.streak_count, active: data.is_active });
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
                is_active: isActive
            })
            .select()
            .single();

        if (updated) {
            setStreakData({ count: updated.streak_count, active: updated.is_active });
        }
    };

    if (!user || !streakData) return null;

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
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="fixed top-0 pointer-events-none z-[9999] w-80 h-1 bg-gradient-to-r from-transparent via-orange-300 to-transparent blur-md"
                    />
                )}
            </AnimatePresence>

            {/* CANDLE UI */}
            <div className="fixed bottom-32 right-6 z-[100] flex flex-col items-center group">
                <svg
                    width="48"
                    height="90"
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
                            <stop offset="0%" stopColor="#F5F5F5" />
                            <stop offset="100%" stopColor="#E0E0E0" />
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
                            .sc-f1 { transform-origin: 24px 22px; animation: sc-flicker1 1.4s ease-in-out infinite; }
                            .sc-f2 { transform-origin: 24px 25px; animation: sc-flicker2 1.1s ease-in-out infinite; }
                            .sc-f3 { transform-origin: 24px 28px; animation: sc-flicker3 0.9s ease-in-out infinite; }
                            .sc-fc { animation: sc-core-pulse 0.7s ease-in-out infinite; }
                            .sc-amb { animation: sc-ambient 1.4s ease-in-out infinite; }
                            .sc-s1 { animation: sc-smoke 1.8s ease-out infinite; }
                            .sc-s2 { animation: sc-smoke 1.8s ease-out 0.6s infinite; }
                            .sc-s3 { animation: sc-smoke 1.8s ease-out 1.2s infinite; }
                        `}</style>
                    </defs>

                    {streakData.active ? (
                        <>
                            {/* ambient glow */}
                            <ellipse cx="24" cy="68" rx="18" ry="5" fill="#FF6D00" opacity="0.18" className="sc-amb" />

                            {/* candle body */}
                            <rect x="9" y="44" width="30" height="30" rx="3" fill="url(#sc-wax)" stroke="#FFCC80" strokeWidth="0.8" />
                            <rect x="13" y="47" width="5" height="24" rx="2" fill="white" opacity="0.22" />
                            {/* bottom rim */}
                            <rect x="6" y="71" width="36" height="6" rx="2" fill="#FFCC80" stroke="#FFB74D" strokeWidth="0.5" />
                            {/* wax pool */}
                            <ellipse cx="24" cy="44" rx="15" ry="3.5" fill="#FFF9F0" stroke="#FFCC80" strokeWidth="0.5" opacity="0.9" />
                            {/* wick */}
                            <line x1="24" y1="41" x2="24" y2="33" stroke="#4E342E" strokeWidth="1.4" strokeLinecap="round" />
                            {/* ember */}
                            <circle cx="24" cy="32" r="1.5" fill="#FF3D00" opacity="0.9" />

                            {/* radial glow behind flame */}
                            <circle cx="24" cy="22" r="22" fill="url(#sc-glow)" className="sc-amb" />

                            {/* outer flame — deepest orange-red */}
                            <g className="sc-f1">
                                <path
                                    d="M24,4 C18,11 13,20 15,28 C17,34 21,38 24,38 C27,38 31,34 33,28 C35,20 30,11 24,4 Z"
                                    fill="#E64A19" opacity="0.8" filter="url(#sc-fire-blur)"
                                />
                            </g>
                            {/* mid flame — orange */}
                            <g className="sc-f2">
                                <path
                                    d="M24,8 C19,14 15,22 17,29 C18,34 21,37 24,37 C27,37 30,34 31,29 C33,22 29,14 24,8 Z"
                                    fill="#FF6D00" opacity="0.9"
                                />
                            </g>
                            {/* inner flame — amber-yellow */}
                            <g className="sc-f3">
                                <path
                                    d="M24,12 C20,17 18,23 19,29 C19.5,33 22,36 24,36 C26,36 28.5,33 29,29 C30,23 28,17 24,12 Z"
                                    fill="#FFB300" opacity="0.95"
                                />
                            </g>
                            {/* bright core */}
                            <g className="sc-fc">
                                <path
                                    d="M24,17 C22,21 21,25 21.5,29 C22,32 23,34 24,34 C25,34 26,32 26.5,29 C27,25 26,21 24,17 Z"
                                    fill="#FFE57F" opacity="1"
                                />
                                {/* white-hot tip */}
                                <circle cx="24" cy="17" r="2.5" fill="white" opacity="0.85" />
                            </g>
                        </>
                    ) : (
                        <>
                            {/* dead candle body */}
                            <rect x="9" y="44" width="30" height="30" rx="3" fill="url(#sc-wax-dead)" stroke="#BDBDBD" strokeWidth="0.8" />
                            <rect x="13" y="47" width="5" height="24" rx="2" fill="white" opacity="0.15" />
                            <rect x="6" y="71" width="36" height="6" rx="2" fill="#E0E0E0" stroke="#BDBDBD" strokeWidth="0.5" />
                            <ellipse cx="24" cy="44" rx="15" ry="3.5" fill="#F5F5F5" stroke="#BDBDBD" strokeWidth="0.5" />
                            {/* bent spent wick */}
                            <path d="M24,41 Q22,36 23,32" stroke="#757575" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                            {/* smoke wisps */}
                            <g className="sc-s1">
                                <path d="M23,32 Q20,26 23,20 Q26,14 23,8" stroke="#9E9E9E" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
                            </g>
                            <g className="sc-s2">
                                <path d="M24,31 Q27,25 24,19 Q21,13 24,7" stroke="#BDBDBD" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.4" />
                            </g>
                            <g className="sc-s3">
                                <path d="M22,32 Q19,26 21,20" stroke="#9E9E9E" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.3" />
                            </g>
                        </>
                    )}
                </svg>

                <div className="mt-1 bg-black/60 text-[10px] text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                    {streakData.active
                        ? `🔥 Streak: ${streakData.count} day${streakData.count === 1 ? '' : 's'}`
                        : 'Expired'}
                </div>
            </div>
        </>
    );
}