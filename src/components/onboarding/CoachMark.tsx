/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { OnboardingStep } from './OnboardingSteps';

interface CoachMarkProps {
  step: OnboardingStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const CoachMark: React.FC<CoachMarkProps> = ({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}) => {
  const { targetSelector, title, description, placement, badgeText } = step;
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!targetSelector) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Give comfortable padding around the component
        const padding = 8;
        
        // Prevent negative values if element is touching edges
        const top = Math.max(0, rect.top - padding);
        const left = Math.max(0, rect.left - padding);
        
        setCoords({
          top,
          left,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
      } else {
        // If element is not currently in the DOM, default gracefully to center viewport placement
        setCoords(null);
      }
    };

    updateCoords();

    // Listen to window size and scrolling events for reactive calculations
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);

    // Timeout listener fallback for slower dynamic DOM updates
    const timer = setTimeout(updateCoords, 300);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
      clearTimeout(timer);
    };
  }, [targetSelector, currentStepIndex]);

  // Position calculation for the dialog card
  const getTooltipStyle = () => {
    if (!coords) {
      // Center placement modal
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const,
        zIndex: 100,
        width: 'calc(100% - 32px)',
        maxWidth: '440px',
      };
    }

    const spaceBelow = window.innerHeight - (coords.top + coords.height);
    const spaceAbove = coords.top;
    const spaceRight = window.innerWidth - (coords.left + coords.width);
    const spaceLeft = coords.left;

    // Default card dimensions width estimates
    const cardWidth = 340;

    let style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 100,
      width: `${cardWidth}px`,
    };

    // Mobile screens override to always place modal centered in the viewport
    if (window.innerWidth < 640) {
      return {
        bottom: '24px',
        left: '16px',
        right: '16px',
        position: 'fixed' as const,
        zIndex: 100,
        width: 'auto',
      };
    }

    // Advanced placement lookup with collision defenses
    if (placement === 'right' && spaceRight > cardWidth + 24) {
      style.top = Math.min(window.innerHeight - 260, Math.max(16, coords.top + coords.height / 2 - 100));
      style.left = coords.left + coords.width + 16;
    } else if (placement === 'left' && spaceLeft > cardWidth + 24) {
      style.top = Math.min(window.innerHeight - 260, Math.max(16, coords.top + coords.height / 2 - 100));
      style.left = coords.left - cardWidth - 16;
    } else if (placement === 'bottom' && spaceBelow > 260) {
      style.top = coords.top + coords.height + 16;
      style.left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, coords.left + coords.width / 2 - cardWidth / 2));
    } else if (spaceAbove > 260) {
      // Default auto placement above
      style.top = coords.top - 240;
      style.left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, coords.left + coords.width / 2 - cardWidth / 2));
    } else {
      // Ultimate centered viewport fallback
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const,
        zIndex: 100,
        width: 'calc(100% - 32px)',
        maxWidth: '380px',
      };
    }

    return style;
  };

  const tooltipStyle = getTooltipStyle();
  const isCentered = !coords || window.innerWidth < 640;

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden select-none">
      
      {/* SVG Absolute Overlay Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="coachmark-cutout-mask">
            {/* Direct pure white background covering full window */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Direct black mask rectangle to punch hole in overlay */}
            {coords && (
              <rect
                x={coords.left}
                y={coords.top}
                width={coords.width}
                height={coords.height}
                rx={12}
                ry={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        
        {/* Semi-transparent dark overlay */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(8, 12, 30, 0.78)"
          mask="url(#coachmark-cutout-mask)"
          className="pointer-events-auto cursor-default"
        />
      </svg>

      {/* Glow Highlight Ring Overlay */}
      {coords && (
        <div
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            height: coords.height,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className="rounded-xl border-2 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.7)] animate-pulse transition-all duration-300"
        />
      )}

      {/* Interactive Tooltip Card Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          style={tooltipStyle}
          initial={isCentered ? { scale: 0.92, opacity: 0 } : { y: 10, opacity: 0 }}
          animate={isCentered ? { scale: 1, opacity: 1 } : { y: 0, opacity: 1 }}
          exit={isCentered ? { scale: 0.92, opacity: 0 } : { y: -10, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-xl p-6 pointer-events-auto select-text flex flex-col gap-4.5"
        >
          {/* Header row with Optional Badge and Exit Control */}
          <div className="flex items-center justify-between">
            {badgeText && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-150/20">
                <Sparkles className="w-3 h-3 text-indigo-500 animate-spin" style={{ animationDuration: '4s' }} />
                <span>{badgeText}</span>
              </span>
            )}
            
            <button
              id="coachmark-btn-dismiss"
              onClick={onSkip}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Skip Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main content block */}
          <div className="space-y-2">
            <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white leading-tight tracking-tight">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-slate-605 dark:text-slate-350 leading-relaxed font-normal">
              {description}
            </p>
          </div>

          {/* Steps Progress Line */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-1">
            
            {/* Left Button group or skip */}
            {currentStepIndex > 0 ? (
              <button
                id="coachmark-btn-prev"
                onClick={onPrev}
                className="flex items-center gap-1.5 px-4 py-2 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer border border-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                id="coachmark-btn-skip"
                onClick={onSkip}
                className="px-4 py-2 font-bold text-xs text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Skip Tour
              </button>
            )}

            {/* Right Button action: Next, Finish or Get Started */}
            <button
              id="coachmark-btn-next"
              onClick={onNext}
              className="flex items-center gap-1.5 px-5 py-2.5 font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/15 transition select-none cursor-pointer"
            >
              <span>
                {currentStepIndex === 0
                  ? "Start Tour"
                  : currentStepIndex === totalSteps - 1
                  ? "Get Started"
                  : "Next Step"}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
