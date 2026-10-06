/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const ONBOARDING_STORAGE_KEY = 'nursefolio_tour_completed';

export interface OnboardingStep {
  title: string;
  description: string;
  /** CSS selector to highlight. Empty = centered modal */
  targetSelector?: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Optional pill text above the title */
  badgeText?: string;
  /** Skip this step if the target element isn't in the DOM */
  skipIfMissing?: boolean;
}

// ==========================================================
// STEPS
// ==========================================================
export const onboardingSteps: OnboardingStep[] = [
  // --------------------------------------------------------
  // 1. Welcome — centered
  // --------------------------------------------------------
  {
    title: 'Welcome to Nursefolio',
    description:
      'Your professional home as a nurse. Build a portfolio, verify your credentials, and get discovered by hospitals and locum coordinators. ' +
      'Here\u2019s a 60-second tour of the essentials.',
    placement: 'center',
    badgeText: 'Welcome',
  },

  // --------------------------------------------------------
  // 2. Public portfolio preview
  // Target: "Preview" link in the DashboardLayout top bar
  // --------------------------------------------------------
  {
    title: 'See your public profile',
    description:
      'This opens what recruiters and colleagues see. You can share the link anywhere — WhatsApp, email, your CV header.',
    targetSelector: '#dashboard-preview-link',
    placement: 'bottom',
    badgeText: 'Step 1 of 4',
    skipIfMissing: true,
  },

  // --------------------------------------------------------
  // 3. Edit profile
  // Target: Sidebar "Edit Profile" link
  // --------------------------------------------------------
  {
    title: 'Fill in your profile',
    description:
      'This is where you add your title, bio, specialties, work history, and contact details. Every field you complete makes you easier to find.',
    targetSelector: '#sidebar-link-edit-profile',
    placement: 'right',
    badgeText: 'Step 2 of 4',
    skipIfMissing: true,
  },

  // --------------------------------------------------------
  // 4. CV upload
  // Target: Sidebar "Upload CV" link
  // --------------------------------------------------------
  {
    title: 'Upload or build your CV',
    description:
      'Drop in an existing PDF, or let Nursefolio generate one from your profile. Either way, recruiters can download it in one tap.',
    targetSelector: '#sidebar-link-upload-cv-resume',
    placement: 'right',
    badgeText: 'Step 3 of 4',
    skipIfMissing: true,
  },

  // --------------------------------------------------------
  // 5. Explore
  // Target: Navbar "Explore" link (desktop) — hidden on mobile sidebar
  // --------------------------------------------------------
  {
    title: 'Explore other nurses',
    description:
      'Discover colleagues by specialty, location, and clinical focus. Endorse each other\u2019s work to build trust signals recruiters actually read.',
    targetSelector: '#nav-link-explore',
    placement: 'bottom',
    badgeText: 'Step 4 of 4',
    skipIfMissing: true,
  },

  // --------------------------------------------------------
  // 6. Closing — centered
  // --------------------------------------------------------
  {
    title: 'You\u2019re all set',
    description:
      'Take two minutes to add your work experience and certifications. The more your profile shows, the more it works for you. Welcome aboard.',
    placement: 'center',
    badgeText: 'Ready',
  },
];