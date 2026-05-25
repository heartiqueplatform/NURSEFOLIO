/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { CoachMark } from './CoachMark';

export const OnboardingTour: React.FC = () => {
  const {
    isActive,
    currentStep,
    stepsCount,
    activeStepData,
    handleNext,
    handlePrev,
    skipOnboarding,
  } = useOnboarding();

  if (!isActive) return null;

  return (
    <CoachMark
      step={activeStepData}
      currentStepIndex={currentStep}
      totalSteps={stepsCount}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={skipOnboarding}
    />
  );
};
