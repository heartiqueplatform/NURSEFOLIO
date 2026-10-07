/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// ==========================================================
// TYPES
// ==========================================================
interface PageLoaderProps {
    title?: string;
    subtitle?: string;
}

// ==========================================================
// MAIN
// ==========================================================
export default function PageLoader({
    title = 'Loading',
    subtitle,
}: PageLoaderProps) {
    return (
        <div
            id="protected-route-loading"
            className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-6"
        >
            {/* Three pulsing dots — same pattern as index.html */}
            <div className="flex items-center gap-2">
                <span className="page-loader-dot" />
                <span className="page-loader-dot" />
                <span className="page-loader-dot" />
            </div>

            {/* Label */}
            <div className="text-center px-6">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        {subtitle}
                    </p>
                )}
            </div>

            <style>{`
        .page-loader-dot {
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background-color: #0d9488;
          opacity: 0.4;
          animation: page-loader-pulse 1.4s ease-in-out infinite;
        }

        .page-loader-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .page-loader-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        :is(.dark) .page-loader-dot {
          background-color: #2dd4bf;
        }

        @keyframes page-loader-pulse {
          0%, 80%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          40% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .page-loader-dot {
            animation: none;
            opacity: 0.7;
          }
        }
      `}</style>
        </div>
    );
}