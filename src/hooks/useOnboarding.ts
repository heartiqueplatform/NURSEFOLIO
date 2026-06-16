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
  const hasDismissed = useRef(false);

  useEffect(() => {
    // 1. Check if they finished in this browser session
    const backupCompleted = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';

    // 2. Check if user profile data says they are finished
    // Note: We check specifically for false, so null/undefined (loading) doesn't trigger it
    if (user && user.onboarding_completed === false && !backupCompleted && !hasDismissed.current) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const completeOnboarding = async () => {
    setIsActive(false);
    hasDismissed.current = true;

    // Safety Net: Save to browser immediately
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');

    if (!user?.id) return;

    setIsLoading(true);
    try {
      // API Call to Supabase
      const { error } = await databaseService.updateProfile(user.id, {
        onboarding_completed: true
      });

      if (error) throw error;

      // Update the AuthContext so the rest of the app knows
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

  // ... handlePrev and other functions stay the same
  return {
    isActive,
    currentStep,
    stepsCount: onboardingSteps.length,
    activeStepData: onboardingSteps[currentStep],
    isLoading,
    handleNext,
    handlePrev,
    skipOnboarding: completeOnboarding,
    restartOnboarding: () => {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      hasDismissed.current = false;
      setCurrentStep(0);
      setIsActive(true);
    }
  };
}