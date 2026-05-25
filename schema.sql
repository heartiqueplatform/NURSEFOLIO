-- Nursefolio Supabase Database Schema Specification
-- Copy and paste this directly into the Supabase SQL Editor to provision all required backend tables, constraints, relationship rules, and automatic profile creation triggers!

-- 1. PROFILES Table (Extends Supabase local auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  qualification TEXT DEFAULT '',
  nursing_level TEXT DEFAULT '',
  specialty TEXT DEFAULT '', -- Comma-separated or serialized specialties
  location TEXT DEFAULT '',
  years_experience INTEGER DEFAULT 0,
  availability_status TEXT DEFAULT 'available', -- 'available', 'open', 'busy'
  theme TEXT DEFAULT 'modern', -- 'modern', 'clinical', 'academic', 'dark'
  verified BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'nurse', -- 'nurse', 'student', 'admin'
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. NURSE SKILLS Table (Supports tag listings)
CREATE TABLE IF NOT EXISTS public.nurse_skills (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency TEXT DEFAULT 'expert',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, skill_name)
);

-- Enable RLS for nurse skills
ALTER TABLE public.nurse_skills ENABLE ROW LEVEL SECURITY;

-- 3. EXPERIENCES Table (Professional employment records)
CREATE TABLE IF NOT EXISTS public.experiences (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_name TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date TEXT, -- YYYY-MM
  end_date TEXT, -- YYYY-MM or null
  current_job BOOLEAN DEFAULT FALSE,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for experiences
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- 4. EDUCATION Table (Academic degrees)
CREATE TABLE IF NOT EXISTS public.education (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  course TEXT NOT NULL, -- e.g. "Bachelor of Science in Nursing"
  start_year INTEGER,
  end_year INTEGER, -- null if continuing
  description TEXT DEFAULT '', -- can save metadata like GPAs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for education
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

-- 5. CERTIFICATIONS Table (Board accreditations)
CREATE TABLE IF NOT EXISTS public.certifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date TEXT, -- YYYY-MM
  certificate_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for certifications
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- 6. RESEARCH PROJECTS Table (Scholarly papers)
CREATE TABLE IF NOT EXISTS public.research_projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '', -- Abstract text
  project_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for research projects
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;

-- 7. VERIFICATION REQUESTS Table (Admin audits)
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_url TEXT DEFAULT '',
  student_id_url TEXT DEFAULT '',
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'declined'
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for verification requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- 8. PROFILE VIEWS Table (Viewer tracking)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id BIGSERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_ip TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profile views
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- 9. ANALYTICS Table (Interactive action logs)
CREATE TABLE IF NOT EXISTS public.analytics (
  id BIGSERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g. 'cv_download'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- 10. UPLOADED DOCUMENTS Table (Resume attachments index)
CREATE TABLE IF NOT EXISTS public.uploaded_documents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'cv' / 'verification'
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for uploaded documents
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;


-- =======================================================
-- ACCESS POLICY DECLARATIONS (Row Level Security Rules)
-- =======================================================

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert or update their own profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Nurse Skills Policies
CREATE POLICY "Skills are viewable by everyone" ON public.nurse_skills
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own skills" ON public.nurse_skills
  FOR ALL USING (auth.uid() = user_id);

-- Experiences Policies
CREATE POLICY "Experiences are viewable by everyone" ON public.experiences
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own experiences" ON public.experiences
  FOR ALL USING (auth.uid() = user_id);

-- Education Policies
CREATE POLICY "Education matches are viewable by everyone" ON public.education
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own academic records" ON public.education
  FOR ALL USING (auth.uid() = user_id);

-- Certifications Policies
CREATE POLICY "Certifications are viewable by everyone" ON public.certifications
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own credentials" ON public.certifications
  FOR ALL USING (auth.uid() = user_id);

-- Research Projects Policies
CREATE POLICY "Research articles are viewable by everyone" ON public.research_projects
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own research papers" ON public.research_projects
  FOR ALL USING (auth.uid() = user_id);

-- Verification Requests Policies
CREATE POLICY "Admins or request authors can retrieve verification requests" ON public.verification_requests
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Request authors can insert new verification payloads" ON public.verification_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update verification statuses" ON public.verification_requests
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Profile Views and Analytics Policies
CREATE POLICY "Views are countable by everyone" ON public.profile_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can record profile impressions" ON public.profile_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Analytics are readable by profile owners" ON public.analytics
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can log metric hits" ON public.analytics
  FOR INSERT WITH CHECK (true);

-- Uploaded Documents index
CREATE POLICY "Document references are visible to author" ON public.uploaded_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can register their document files" ON public.uploaded_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- =======================================================
-- AUTOMATIC PROFILE PROVISIONING TRIGGER (auth.users -> profiles)
-- =======================================================

-- Create trigger function that automatic writes to public.profiles upon auth registration
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  extracted_username TEXT;
  extracted_first TEXT;
  extracted_last TEXT;
BEGIN
  -- Grab metadata values if set
  extracted_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  extracted_first := COALESCE(new.raw_user_meta_data->>'first_name', 'New');
  extracted_last := COALESCE(new.raw_user_meta_data->>'last_name', 'Professional');

  -- Enforce unique custom username format constraint
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = extracted_username) THEN
    extracted_username := extracted_username || '_' || substring(new.id::text, 1, 5);
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    email,
    full_name,
    avatar_url,
    cover_url,
    bio,
    role,
    availability_status,
    verified,
    theme,
    onboarding_completed
  ) VALUES (
    new.id,
    lower(extracted_username),
    new.email,
    extracted_first || ' ' || extracted_last,
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800&h=300',
    'Board practicing clinical nursing practitioner.',
    COALESCE(new.raw_user_meta_data->>'role', 'nurse'),
    'available',
    FALSE,
    'modern',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map the trigger creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
