/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { onboardingSteps } from '../components/onboarding/OnboardingSteps';

export function useOnboarding() {
  const { user, refreshUser } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Automatically start if user is logged in, and onboarding_completed is false or unset
  useEffect(() => {
    if (user && user.onboarding_completed === false) {
      // Small timeout to let dashboard panels completely render and layouts settle
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
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
    setIsActive(false);
    if (!user) return;

    setIsLoading(true);
    try {
      // Persist status dynamically on database
      await databaseService.updateProfile(user.id, {
        onboarding_completed: true
      });
      // Synchronize context user state locally
      await refreshUser();
    } catch (err) {
      console.warn("Failed to update onboarding_completed in database; degrading gracefully.", err);
      // Fallback: manually flag user object locally if Supabase or API has brief hiccup
      try {
        user.onboarding_completed = true;
      } catch (e) {}
    } finally {
      setIsLoading(false);
    }
  };

  const skipOnboarding = async () => {
    await completeOnboarding();
  };

  const restartOnboarding = () => {
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
