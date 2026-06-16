/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This key is used to save the completion status in the browser's local storage
export const ONBOARDING_STORAGE_KEY = 'nursefolio_tour_completed';

export interface OnboardingStep {
  title: string;
  description: string;
  targetSelector?: string; // CSS selector to highlight (empty means page centered modal)
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  badgeText?: string;
}

export const onboardingSteps: OnboardingStep[] = [
  {
    title: "Welcome to Nursefolio! 🩺✨",
    description: "Welcome, Healthcare Professional! Nursefolio is your personal digital domain designed specifically to help clinical nurses, indices, and academic nursing students host certified portfolios, generate compliant CVs, and network across Kenya and globally. Let's take a quick 1-minute tour to get you up and running!",
    placement: "center",
    badgeText: "Introduction"
  },
  {
    title: "Preview Your Public Portfolio",
    description: "This is your launchpad! Clicking here opens your sleek, fully dynamic public portfolio page in a new window. You can share this URL directly with hospitals, academic boards, and medical recruiters.",
    targetSelector: "#dashboard-header-btn-view",
    placement: "bottom",
    badgeText: "Step 1 of 5"
  },
  {
    title: "Build Your Professional Identity",
    description: "Build your clinical foundation! Use this editor to customize your title, bio, professional specialties (like ICU, Pediatric, or Theatre), contact locations, and contact coordinates.",
    targetSelector: "#sidebar-link-edit-profile",
    placement: "right",
    badgeText: "Step 2 of 5"
  },
  {
    title: "Generate & Host Your CV/Resume",
    description: "Never worry about resume formatting again! Upload your pre-existing CV or use our dynamic builder to let other hospital administrators download your clinical profile in a clean, professional aesthetic.",
    targetSelector: "#sidebar-link-upload-cv-resume",
    placement: "right",
    badgeText: "Step 3 of 5"
  },
  {
    title: "Explore Other Nurses & Network",
    description: "Connect with the clinical community! Use the 'Discover' engine to find nurse colleagues, share clinical expertise, search for researchers in your specialty, and collaborate.",
    targetSelector: "#nav-link-explore",
    placement: "bottom",
    badgeText: "Step 4 of 5"
  },
  {
    title: "Official Nurse Verification System",
    description: "Build clinical trust! Submit your Nursing Council of Kenya (NCK) index, state license, or student badge. Once verified by our administrators, you will earn a green verified trust badge to showcase on your public page.",
    targetSelector: "#sidebar-verification-status",
    placement: "top",
    badgeText: "Step 5 of 5"
  },
  {
    title: "You are All Set! 🎉",
    description: "Your digital clinical presence is ready to shine! Complete your profile by entering your work experience, degrees, and board certifications to stands out to top-tier health networks in East Africa and beyond.",
    placement: "center",
    badgeText: "Ready"
  }
];