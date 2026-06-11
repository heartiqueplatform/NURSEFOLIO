import React from 'react';

interface PageLoaderProps {
    title?: string;
    subtitle?: string;
}

export default function PageLoader({
    title = 'Assembling the Team',
    subtitle = 'Nursefolio Huddle in progress...',
}: PageLoaderProps) {
    return (
        <div
            id="protected-route-loading"
            className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-10 overflow-hidden"
        >
            {/* Gooey Loader Container */}
            <div className="relative flex items-center justify-center">
                <div className="goo-container relative w-40 h-40">
                    <div className="dot dot-1 bg-indigo-600 dark:bg-indigo-500"></div>
                    <div className="dot dot-2 bg-indigo-600 dark:bg-indigo-500"></div>
                    <div className="dot dot-3 bg-indigo-600 dark:bg-indigo-500"></div>
                </div>

                {/* The SVG Filter - This creates the "melting" effect */}
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute invisible">
                    <defs>
                        <filter id="goo">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                            <feColorMatrix
                                in="blur"
                                mode="matrix"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7"
                                result="goo"
                            />
                            <feBlend in="SourceGraphic" in2="goo" />
                        </filter>
                    </defs>
                </svg>
            </div>

            {/* Label */}
            <div className="text-center z-10">
                <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white tracking-tight">
                    {title}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 animate-pulse">
                    {subtitle}
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .goo-container {
                    filter: url('#goo');
                    position: relative;
                    width: 120px;
                    height: 120px;
                }

                .dot {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 32px;
                    height: 32px;
                    margin-top: -16px;
                    margin-left: -16px;
                    border-radius: 50%;
                    animation-iteration-count: infinite;
                    animation-duration: 3s;
                    animation-timing-function: ease-in-out;
                }

                .dot-1 {
                    animation-name: dot-1-move;
                }

                .dot-2 {
                    animation-name: dot-2-move;
                }

                .dot-3 {
                    animation-name: dot-3-move;
                }

                @keyframes dot-1-move {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-40px, -20px) scale(1.2); }
                    66% { transform: translate(30px, 40px) scale(0.8); }
                }

                @keyframes dot-2-move {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(40px, -20px) scale(0.9); }
                    66% { transform: translate(-30px, 40px) scale(1.1); }
                }

                @keyframes dot-3-move {
                    0%, 100% { transform: translate(0, 0) scale(1.2); }
                    33% { transform: translate(0px, 50px) scale(0.8); }
                    66% { transform: translate(0px, -50px) scale(1); }
                }
                `
            }} />
        </div>
    );
}