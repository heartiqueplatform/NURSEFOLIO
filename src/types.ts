/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'nurse' | 'student' | 'admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type PortfolioTheme = 'modern' | 'minimal' | 'clinical' | 'dark' | 'academic';
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url: string; // Not profile_picture
  cover_url: string;  // Not cover_photo
  bio?: string;
  qualification?: string;
  nursing_level?: string; // e.g., 'Registered Nurse (RN)', 'Family Nurse Practitioner (FNP)', 'Nursing Student'
  specialties: string[];
  skills: string[];
  location?: string;
  years_of_experience?: number;
  availability_status: 'available' | 'open' | 'busy';
  verification_status: VerificationStatus;
  profile_theme: PortfolioTheme;
  cv_url?: string;
  created_at: string;
  views_count: number;
  downloads_count: number;
  search_appearances: number;
  onboarding_completed?: boolean;

  // ========== NEW FIELDS FROM YOUR DATABASE TABLE ==========
  // These match your profiles table columns:
  health_insurance_type?: string | null;
  insurance_number?: string | null;
  vaccinations?: string[] | null;
  last_vaccination_date?: string | null;
  nursing_council_id?: string | null;
  license_expiry_date?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  blood_type?: string | null;
  languages_spoken?: string[] | null;
  available_for_relocation?: boolean | null;
  preferred_shift?: string | null;
  certifications?: string[] | null;  // This is the text[] array from your table

  // Also add these if missing:
  years_experience?: number | null;  // Note: you have years_of_experience, but table uses years_experience
  specialty?: string | null;  // Single specialty field
  theme?: string | null;
  verified?: boolean | null;
  updated_at?: string | null;
  username_updated_at?: string | null;
}

export interface Experience {
  id: string;
  profile_id: string;
  title: string;
  facility: string;
  department?: string;
  location?: string;
  start_date: string;
  end_date?: string; // empty if current
  current: boolean;
  description?: string;
}

export interface Education {
  id: string;
  profile_id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  completed: boolean;
  gpa?: string;
  description?: string;
}

export interface Certification {
  id: string;
  profile_id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date?: string;
  credential_id?: string;
  verification_url?: string;
}

export interface ResearchProject {
  id: string;
  profile_id: string;
  title: string;
  journal_or_publisher?: string;
  publication_date?: string;
  co_authors?: string;
  abstract_text?: string;
  project_url?: string;
}

export interface SocialLinks {
  id: string;
  profile_id: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  website_url?: string;
}

export interface UploadedDocument {
  id: string;
  profile_id: string;
  name: string;
  file_type: 'cv' | 'license' | 'certificate' | 'other';
  file_url: string;
  uploaded_at: string;
}

export interface VerificationRequest {
  id: string;
  profile_id: string;
  license_number?: string;
  license_type?: string;
  state_country?: string;
  student_id_url?: string;
  license_document_url?: string;
  status: VerificationStatus;
  submitted_at: string;
  reviewed_at?: string;
  review_notes?: string;
  // Join info fields
  nurse_name?: string;
  nurse_email?: string;
}

export interface NurseSkill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency?: string;
  created_at?: string;
}

// ============================================
// NEW: CLINICAL LOGBOOK (NCK-Style Verified Procedures)
// ============================================

export type ClinicalVerificationStatus = 'pending' | 'verified' | 'rejected';

export type CompetencyLevel =
  | 'Observed Only'
  | 'Assisted'
  | 'Performed with Supervision'
  | 'Independent'
  | 'Can Teach Others';

export type ProcedureCategory =
  | 'Basic Nursing'
  | 'Medication Administration'
  | 'Wound Care'
  | 'Invasive Procedures'
  | 'Assessment'
  | 'Emergency';

export interface ClinicalProcedure {
  id: string;
  user_id: string;

  // Procedure details
  procedure_name: string;
  category: ProcedureCategory | string;
  attempts_count: number;
  date_performed: string;
  competency_level: CompetencyLevel | string;

  // Clinical setting
  facility_name: string | null;
  department: string | null;
  patient_initials: string | null;  // HIPAA compliant - only initials

  // Supervisor / Staff verification
  supervisor_name: string;
  supervisor_title: string | null;
  supervisor_signature: string | null;
  supervisor_license_number: string | null;
  verification_status: ClinicalVerificationStatus;
  supervisor_comment: string | null;
  verified_at: string | null;

  // Student reflection
  student_notes: string | null;
  challenges_faced: string | null;
  improvement_plan: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// For staff signature link system
export interface ProcedureVerificationRequest {
  id: string;
  procedure_id: string;
  requested_to_email: string;
  request_token: string;
  status: 'pending' | 'sent' | 'expired' | 'completed';
  expires_at: string;
  created_at: string;
}

// ============================================
// NEW: PORTFOLIO STATISTICS
// ============================================

export interface ClinicalLogbookStats {
  totalProcedures: number;
  verifiedProcedures: number;
  pendingProcedures: number;
  rejectedProcedures: number;
  requiredForNCK: number;
  completionPercentage: number;
  proceduresByCategory: {
    category: string;
    count: number;
  }[];
  competencyDistribution: {
    level: string;
    count: number;
  }[];
  recentProcedures: ClinicalProcedure[];
}

// ============================================
// NEW: FORM DATA TYPES
// ============================================

export interface ClinicalProcedureFormData {
  procedure_name: string;
  category: string;
  attempts_count: number;
  date_performed: string;
  competency_level: string;
  facility_name: string;
  department: string;
  patient_initials: string;
  supervisor_name: string;
  supervisor_title: string;
  supervisor_license_number: string;
  student_notes: string;
  challenges_faced: string;
  improvement_plan: string;
}

// ============================================
// NEW: NCK CONSTANTS
// ============================================

export const NCK_REQUIREMENTS = {
  MIN_VERIFIED_PROCEDURES: 20,
  REQUIRED_CATEGORIES: [
    'Basic Nursing',
    'Medication Administration',
    'Wound Care',
    'Invasive Procedures',
    'Assessment',
    'Emergency'
  ],
  COMPETENCY_THRESHOLDS: {
    'Observed Only': 0,
    'Assisted': 2,
    'Performed with Supervision': 5,
    'Independent': 10,
    'Can Teach Others': 15
  }
} as const;

// ============================================
// NEW: HELPER FUNCTIONS (Type Guards & Utilities)
// ============================================

export const getCompetencyWeight = (level: string): number => {
  const weights: Record<string, number> = {
    'Observed Only': 1,
    'Assisted': 2,
    'Performed with Supervision': 3,
    'Independent': 4,
    'Can Teach Others': 5
  };
  return weights[level] || 0;
};

export const getCompetencyColor = (level: string): string => {
  switch (level) {
    case 'Observed Only': return 'bg-slate-400';
    case 'Assisted': return 'bg-sky-500';
    case 'Performed with Supervision': return 'bg-indigo-500';
    case 'Independent': return 'bg-emerald-500';
    case 'Can Teach Others': return 'bg-purple-600';
    default: return 'bg-slate-400';
  }
};

export const getClinicalStatusColor = (status: ClinicalVerificationStatus): string => {
  switch (status) {
    case 'verified': return 'text-emerald-600 bg-emerald-50';
    case 'rejected': return 'text-rose-600 bg-rose-50';
    default: return 'text-amber-600 bg-amber-50';
  }
};

export const getClinicalStatusBadge = (status: ClinicalVerificationStatus): { text: string; color: string } => {
  switch (status) {
    case 'verified':
      return { text: 'Verified', color: 'bg-emerald-100 text-emerald-700' };
    case 'rejected':
      return { text: 'Rejected', color: 'bg-rose-100 text-rose-700' };
    default:
      return { text: 'Pending Signature', color: 'bg-amber-100 text-amber-700' };
  }
};

// Type guard to check if a procedure is verified
export const isProcedureVerified = (procedure: ClinicalProcedure): boolean => {
  return procedure.verification_status === 'verified';
};

// Type guard to check if a procedure needs attention
export const needsSupervisorSignature = (procedure: ClinicalProcedure): boolean => {
  return procedure.verification_status === 'pending';
};