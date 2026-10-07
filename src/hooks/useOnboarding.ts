/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { onboardingSteps, OnboardingStep } from '../components/onboarding/OnboardingSteps';

// ==========================================================
// STORAGE KEYS
// ==========================================================
// Two keys, on purpose:
// - The legacy key is what the old hook used. Kept so users
//   who completed the tour before this rewrite don't see it again.
// - The new key is what we write going forward.
const LEGACY_STORAGE_KEY = 'nursefolio_onboarding_backup';
const STORAGE_KEY = 'nursefolio_tour_completed';

// ==========================================================
// HELPERS
// ==========================================================
function readCompletedFlag(): boolean {
  try {
    return (
      localStorage.getItem(STORAGE_KEY) === 'true' ||
      localStorage.getItem(LEGACY_STORAGE_KEY) === 'true'
    );
  } catch {
    return false;
  }
}

function writeCompletedFlag() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
    // Also write the legacy key so an older deployed version
    // of the app doesn't re-show the tour after an auto-update.
    localStorage.setItem(LEGACY_STORAGE_KEY, 'true');
  } catch {
    // localStorage unavailable (private mode, storage full) — continue
  }
}

function clearCompletedFlag() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ==========================================================
// HOOK
// ==========================================================
export function useOnboarding() {
  const { user, refreshUser } = useAuth();

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Prevents re-triggering the tour after the user dismisses it,
  // even if `user` object identity changes and the effect re-runs.
  const hasDismissed = useRef(false);

  // Track which user we've already considered for auto-start.
  // Prevents the tour from firing again on token refresh.
  const triggeredForUser = useRef<string | null>(null);

  // ----------------------------------------------------------
  // Filter steps based on device + available DOM targets
  // ----------------------------------------------------------
  const availableSteps = useMemo<OnboardingStep[]>(() => {
    // Client-side render: filter by whether the target selector exists.
    // If a step has no targetSelector (centered modal), always include it.
    // If a step has skipIfMissing and the selector isn't in the DOM, drop it.
    if (typeof document === 'undefined') return onboardingSteps;

    return onboardingSteps.filter(step => {
      if (!step.targetSelector) return true;
      if (!step.skipIfMissing) return true;

      try {
        return !!document.querySelector(step.targetSelector);
      } catch {
        // Bad selector syntax → skip the step rather than crash
        return false;
      }
    });
  }, [isActive]); // recompute when the tour opens (in case DOM changed)

  const stepsCount = availableSteps.length;
  const activeStepData = availableSteps[currentStep] ?? null;

  // ----------------------------------------------------------
  // Auto-start when appropriate
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user?.id) return;

    // Already dismissed this session → don't restart
    if (hasDismissed.current) return;

    // Already handled this user this session
    if (triggeredForUser.current === user.id) return;

    // User has completed onboarding (either persisted or backup)
    if (user.onboarding_completed === true || readCompletedFlag()) {
      triggeredForUser.current = user.id;
      return;
    }

    // Wait a moment for the dashboard to render before showing the tour
    const timer = setTimeout(() => {
      if (hasDismissed.current) return;
      triggeredForUser.current = user.id;
      setIsActive(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [user?.id, user?.onboarding_completed]);

  // ----------------------------------------------------------
  // Auto-advance if the current step's target disappeared
  // ----------------------------------------------------------
  useEffect(() => {
    if (!isActive) return;
    if (activeStepData !== null) return;

    // Current step's target isn't in the DOM. Advance to the next.
    if (currentStep < stepsCount - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // No more steps — close the tour
      setIsActive(false);
    }
  }, [isActive, activeStepData, currentStep, stepsCount]);

  // ----------------------------------------------------------
  // Complete onboarding — persisted + local
  // ----------------------------------------------------------
  const completeOnboarding = useCallback(async () => {
    // Immediate UI feedback
    setIsActive(false);
    setCurrentStep(0);
    hasDismissed.current = true;

    // Save to local storage first (safety net)
    writeCompletedFlag();

    if (!user?.id) return;

    setIsLoading(true);
    try {
      await databaseService.updateProfile(user.id, {
        onboarding_completed: true,
      });
      await refreshUser();
    } catch (err) {
      // Local backup already saved — the tour won't re-show even if
      // the DB write failed. Log and move on.
      console.error('Onboarding DB sync failed (local backup saved):', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshUser]);

  // ----------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------
  const handleNext = useCallback(() => {
    if (currentStep < stepsCount - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, stepsCount, completeOnboarding]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // ----------------------------------------------------------
  // Restart — used from Settings
  // ----------------------------------------------------------
  const restartOnboarding = useCallback(() => {
    clearCompletedFlag();
    hasDismissed.current = false;
    triggeredForUser.current = null;
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return {
    isActive,
    currentStep,
    stepsCount,
    activeStepData,
    isLoading,
    handleNext,
    handlePrev,
    skipOnboarding: completeOnboarding,
    restartOnboarding,
  };
}