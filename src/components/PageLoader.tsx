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
            className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-7 overflow-hidden"
        >
            {/* Cube Scene */}
            <div className="relative flex items-center justify-center w-40 h-40">

                {/* Ripple ring */}
                <div className="absolute w-24 h-24 rounded-full border border-slate-300 dark:border-zinc-700 animate-[rippleOut_2.5s_ease-out_infinite]" />

                {/* 3D Cube */}
                <div className="w-40 h-40 flex items-center justify-center" style={{ perspective: '500px' }}>
                    <div
                        className="relative w-36 h-36"
                        style={{
                            transformStyle: 'preserve-3d',
                            animation: 'rotateCube 8s linear infinite',
                        }}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/10" style={{ transform: 'translateZ(72px)' }}>
                            <img src="/face1.jpeg" alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-xl" />
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/10" style={{ transform: 'rotateY(180deg) translateZ(72px)' }}>
                            <img src="/face2.jpeg" alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-xl" />
                        </div>

                        {/* Right */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/10" style={{ transform: 'rotateY(90deg) translateZ(72px)' }}>
                            <img src="/face3.jpeg" alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-xl" />
                        </div>

                        {/* Left */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/10" style={{ transform: 'rotateY(-90deg) translateZ(72px)' }}>
                            <img src="/face4.jpeg" alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-xl" />
                        </div>

                        {/* Top */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/10" style={{ transform: 'rotateX(90deg) translateZ(72px)' }}>
                            <img src="/face5.jpeg" alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-xl" />
                        </div>

                        {/* Bottom */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/10" style={{ transform: 'rotateX(-90deg) translateZ(72px)' }}>
                            <img src="/face6.jpeg" alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Label */}
            <div className="text-center">
                <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white tracking-tight">
                    {title}
                </h2>

                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 animate-pulse">
                    {subtitle}
                </p>
            </div>

            {/* Keyframes */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
            @keyframes rotateCube {
              0%   { transform: rotateX(-20deg) rotateY(0deg); }
              100% { transform: rotateX(-20deg) rotateY(360deg); }
            }

            @keyframes rippleOut {
              0%   { transform: scale(0.5); opacity: 0.6; }
              100% { transform: scale(2.2); opacity: 0; }
            }
          `,
                }}
            />
        </div>
    );
}