/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, Loader2 } from 'lucide-react';
import { OnboardingStep } from './OnboardingSteps';

// ==========================================================
// TYPES
// ==========================================================
interface CoachMarkProps {
  step: OnboardingStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface Coords {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 340;
const CARD_MIN_HEIGHT = 220;
const EDGE_PADDING = 12;
const CUTOUT_PADDING = 8;

// ==========================================================
// MAIN
// ==========================================================
export const CoachMark: React.FC<CoachMarkProps> = ({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}) => {
  const { targetSelector, title, description, placement, badgeText } = step;

  const [coords, setCoords] = useState<Coords | null>(null);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // ----------------------------------------------------------
  // Viewport tracking
  // ----------------------------------------------------------
  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = viewport.width < 640;

  // ----------------------------------------------------------
  // Target element coordinates
  // ----------------------------------------------------------
  useEffect(() => {
    if (!targetSelector || isMobile) {
      setCoords(null);
      return;
    }

    let rafId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const update = () => {
      const el = document.querySelector(targetSelector);
      if (!el) {
        setCoords(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setCoords({
        top: Math.max(0, rect.top - CUTOUT_PADDING),
        left: Math.max(0, rect.left - CUTOUT_PADDING),
        width: rect.width + CUTOUT_PADDING * 2,
        height: rect.height + CUTOUT_PADDING * 2,
      });
    };

    // Throttle scroll/resize updates to next animation frame
    const schedule = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    };

    update();

    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    // Some elements (avatars, images) render after a delay. Re-check once.
    timeoutId = setTimeout(update, 350);

    return () => {
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [targetSelector, currentStepIndex, isMobile]);

  // ----------------------------------------------------------
  // Escape key = skip
  // ----------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  // ----------------------------------------------------------
  // Lock body scroll while tour is active
  // ----------------------------------------------------------
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ----------------------------------------------------------
  // Tooltip position
  // ----------------------------------------------------------
  const tooltipStyle = useMemo<React.CSSProperties>(() => {
    // Mobile → bottom sheet
    if (isMobile) {
      return {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100000,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      };
    }

    // No target → centered
    if (!coords) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100000,
        width: `min(${CARD_WIDTH}px, calc(100vw - ${EDGE_PADDING * 2}px))`,
      };
    }

    const spaceBelow = viewport.height - (coords.top + coords.height);
    const spaceAbove = coords.top;
    const spaceRight = viewport.width - (coords.left + coords.width);
    const spaceLeft = coords.left;
    const GAP = 16;

    // Try preferred placement first
    const canFitRight = spaceRight > CARD_WIDTH + GAP + EDGE_PADDING;
    const canFitLeft = spaceLeft > CARD_WIDTH + GAP + EDGE_PADDING;
    const canFitBelow = spaceBelow > CARD_MIN_HEIGHT + GAP + EDGE_PADDING;
    const canFitAbove = spaceAbove > CARD_MIN_HEIGHT + GAP + EDGE_PADDING;

    let top = 0;
    let left = 0;
    let placed = false;

    // Preferred
    if (placement === 'right' && canFitRight) {
      left = coords.left + coords.width + GAP;
      top = coords.top + coords.height / 2 - CARD_MIN_HEIGHT / 2;
      placed = true;
    } else if (placement === 'left' && canFitLeft) {
      left = coords.left - CARD_WIDTH - GAP;
      top = coords.top + coords.height / 2 - CARD_MIN_HEIGHT / 2;
      placed = true;
    } else if (placement === 'bottom' && canFitBelow) {
      top = coords.top + coords.height + GAP;
      left = coords.left + coords.width / 2 - CARD_WIDTH / 2;
      placed = true;
    } else if (placement === 'top' && canFitAbove) {
      top = coords.top - CARD_MIN_HEIGHT - GAP;
      left = coords.left + coords.width / 2 - CARD_WIDTH / 2;
      placed = true;
    }

    // Fallbacks in order of preference
    if (!placed) {
      if (canFitBelow) {
        top = coords.top + coords.height + GAP;
        left = coords.left + coords.width / 2 - CARD_WIDTH / 2;
        placed = true;
      } else if (canFitAbove) {
        top = coords.top - CARD_MIN_HEIGHT - GAP;
        left = coords.left + coords.width / 2 - CARD_WIDTH / 2;
        placed = true;
      }
    }

    // Absolute last resort → centered
    if (!placed) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100000,
        width: `min(${CARD_WIDTH}px, calc(100vw - ${EDGE_PADDING * 2}px))`,
      };
    }

    // Clamp horizontal to viewport
    left = Math.max(
      EDGE_PADDING,
      Math.min(viewport.width - CARD_WIDTH - EDGE_PADDING, left)
    );
    // Clamp vertical to viewport
    top = Math.max(
      EDGE_PADDING,
      Math.min(viewport.height - CARD_MIN_HEIGHT - EDGE_PADDING, top)
    );

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 100000,
      width: `${CARD_WIDTH}px`,
    };
  }, [coords, isMobile, placement, viewport.width, viewport.height]);

  // ----------------------------------------------------------
  // Progress
  // ----------------------------------------------------------
  const progressPct = useMemo(
    () => ((currentStepIndex + 1) / totalSteps) * 100,
    [currentStepIndex, totalSteps]
  );

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  const primaryLabel = isFirst ? 'Start tour' : isLast ? 'Get started' : 'Next';

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-[99999] select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Onboarding step ${currentStepIndex + 1} of ${totalSteps}`}
    >

      {/* ============================================
          SPOTLIGHT OVERLAY
          ============================================ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <mask id="coachmark-cutout-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {coords && !isMobile && (
              <rect
                x={coords.left}
                y={coords.top}
                width={coords.width}
                height={coords.height}
                rx={16}
                ry={16}
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#coachmark-cutout-mask)"
          className="pointer-events-auto"
          onClick={onSkip}
        />
      </svg>

      {/* Highlight ring on the target (desktop only) */}
      {coords && !isMobile && (
        <div
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            height: coords.height,
            pointerEvents: 'none',
            zIndex: 99999,
          }}
          className="rounded-2xl ring-2 ring-teal-500/60"
          aria-hidden="true"
        />
      )}

      {/* ============================================
          TOOLTIP CARD
          ============================================ */}
      <div
        style={tooltipStyle}
        className={`bg-white dark:bg-zinc-950 pointer-events-auto select-text flex flex-col animate-in ${isMobile
          ? 'rounded-t-3xl slide-in-from-bottom duration-200 max-h-[70vh]'
          : coords
            ? 'rounded-3xl fade-in zoom-in-95 duration-150'
            : 'rounded-3xl fade-in zoom-in-95 duration-150'
          }`}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-800 rounded-full" />
          </div>
        )}

        <div className={`overflow-y-auto ${isMobile ? 'px-5 pt-3 pb-6' : 'p-5'}`}>

          {/* ============================================
              HEADER
              ============================================ */}
          <div className="flex items-start justify-between gap-3 mb-3">
            {badgeText ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400">
                <Sparkles className="w-3 h-3" />
                {badgeText}
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={onSkip}
              className="p-1.5 rounded-full text-slate-400 dark:text-slate-500 active:bg-slate-100 dark:active:bg-zinc-900 transition flex-shrink-0"
              aria-label="Skip tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ============================================
              CONTENT
              ============================================ */}
          <div className="mb-4">
            <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white leading-tight tracking-tight">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
              {description}
            </p>
          </div>

          {/* ============================================
              PROGRESS
              ============================================ */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="h-1 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* ============================================
              ACTIONS
              ============================================ */}
          <div className="flex items-center justify-between gap-2">
            {!isFirst ? (
              <button
                onClick={onPrev}
                className="inline-flex items-center gap-1 px-4 py-2.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-xs font-bold active:opacity-70 transition min-h-[44px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <button
                onClick={onSkip}
                className="inline-flex items-center px-4 py-2.5 rounded-full text-slate-500 dark:text-slate-400 text-xs font-bold active:opacity-70 transition min-h-[44px]"
              >
                Skip
              </button>
            )}

            <button
              onClick={onNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-xs font-bold transition min-h-[44px]"
            >
              {primaryLabel}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Keyboard hint (desktop only) */}
          {!isMobile && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-4">
              Press <kbd className="font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-900">Esc</kbd> to skip
            </p>
          )}
        </div>
      </div>

    </div>
  );
};