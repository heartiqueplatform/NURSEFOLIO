/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { onboardingSteps } from '../components/onboarding/OnboardingSteps';

export function useOnboarding() {
  const { user, refreshUser } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // This ref acts as a "Circuit Breaker"
  // It prevents the tour from re-opening if the user object updates
  // before the database has finished persisting the 'true' state.
  const hasDismissedThisSession = useRef(false);

  // Automatically start if user is logged in, and onboarding_completed is false
  useEffect(() => {
    // Only start if: user exists, not completed, and we haven't already dismissed it just now
    if (user && user.onboarding_completed === false && !hasDismissedThisSession.current) {

      const timer = setTimeout(() => {
        // Double check the guard inside the timer
        if (!hasDismissedThisSession.current) {
          setIsActive(true);
          setCurrentStep(0);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    // 1. Immediately shut down the UI
    setIsActive(false);
    // 2. Set the guard so the useEffect doesn't re-trigger the tour
    hasDismissedThisSession.current = true;

    if (!user) return;

    setIsLoading(true);
    try {
      // 3. Persist status dynamically on database
      await databaseService.updateProfile(user.id, {
        onboarding_completed: true
      });

      // 4. Synchronize context user state
      await refreshUser();
    } catch (err) {
      console.warn("Failed to update onboarding_completed in database; degrading gracefully.", err);
      // Fallback: manually flag user object locally
      try {
        user.onboarding_completed = true;
      } catch (e) { }
    } finally {
      setIsLoading(false);
    }
  };

  const skipOnboarding = async () => {
    await completeOnboarding();
  };

  const restartOnboarding = () => {
    hasDismissedThisSession.current = false; // Reset the guard
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
    handlePrev,
    skipOnboarding,
    restartOnboarding,
    setCurrentStep
  };
}