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
