/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { onboardingSteps } from '../components/onboarding/OnboardingSteps';

const LOCAL_STORAGE_KEY = 'nursefolio_onboarding_backup';

export function useOnboarding() {
  const { user, refreshUser } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Guard to prevent the tour from re-triggering immediately after closing
  const hasDismissed = useRef(false);

  useEffect(() => {
    // 1. Check local storage backup
    const backupCompleted = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';

    // 2. Check if user profile data says they are finished
    if (user && user.onboarding_completed === false && !backupCompleted && !hasDismissed.current) {
      const timer = setTimeout(() => {
        // Re-verify guard inside timeout
        if (!hasDismissed.current) {
          setIsActive(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const completeOnboarding = async () => {
    // Immediate UI feedback
    setIsActive(false);
    hasDismissed.current = true;

    // Safety Net: Save to browser storage
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');

    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Persist to Supabase
      await databaseService.updateProfile(user.id, {
        onboarding_completed: true
      });

      // Update the Auth context
      await refreshUser();
    } catch (err) {
      console.error("Database sync failed, but local backup saved:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  // THIS WAS MISSING AND CAUSED YOUR ERROR:
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const restartOnboarding = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    hasDismissed.current = false;
    setCurrentStep(0);
    setIsActive(true);
  };

  return {
    isActive,
    currentStep,
    stepsCount: onboardingSteps.length,
    activeStepData: onboardingSteps[currentStep],
    isLoading,
    handleNext,
    handlePrev, // This will now work!
    skipOnboarding: completeOnboarding,
    restartOnboarding,
    setCurrentStep
  };
}