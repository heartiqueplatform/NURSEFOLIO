/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
// Layouts
import { DefaultLayout } from './layouts/DefaultLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import ExploreNurses from './pages/ExploreNurses';
import PublicProfile from './pages/PublicProfile';
import VerificationInfo from './pages/VerificationInfo';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import LegalPages from './pages/LegalPages';
import NotFound from './pages/NotFound';
// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Dashboard Pages
import DashboardHome from './pages/DashboardHome';
import EditProfile from './pages/EditProfile';
import ExperiencePage from './pages/ExperiencePage';
import EducationPage from './pages/EducationPage';
import CertificationsPage from './pages/CertificationsPage';
import ResearchPage from './pages/ResearchPage';
import PortfolioThemePage from './pages/PortfolioThemePage';
import UploadCVPage from './pages/UploadCVPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Admin Page
import AdminDashboard from './pages/AdminDashboard';
import SkillsPage from './pages/SkillsPage';
import NurseFeed from './pages/NurseFeed';

import VerifyProcedure from './pages/VerifyProcedure';
import LocumPage from './pages/LocumPage';
import PostLocumRequest from './pages/PostLocumRequest';
import LocumApplicants from './pages/LocumApplicants';
import CVEditor from './pages/CVEditor';

// CV Generator — lazy-loaded.
// WHY: @react-pdf/renderer adds ~200KB. Users who never open their CV
// should not download it. The Suspense fallback is a zinc-colored blank
// screen for ~200ms, which reads as a normal transition, not a stall.
const CVGenerator = lazy(() => import('./pages/CVGenerator'));

export default function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>

              {/* Public Pages grouped under DefaultLayout (includes Header/Navbar & Footer) */}
              <Route element={<DefaultLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/verification-info" element={<VerificationInfo />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/legal" element={<LegalPages />} />
              </Route>

              {/* Special public standalone router (no core header) */}
              <Route path="/nurse/:username" element={<PublicProfile />} />

              {/* Auth standalone pages */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/*
                PUBLIC VERIFICATION PAGE — NO AUTH REQUIRED.
                Handles BOTH:
                  - /verify/:procedureId  (single procedure, opened from a link)
                  - /verify/pending       (queue for the logged-in nurse)
                Declared ONCE, outside ProtectedRoute, so students/external
                supervisors can open verification links without an account.
              */}
              <Route path="/verify/:procedureId" element={<VerifyProcedure />} />

              {/* Core Dashboard Layout guardian protected routes */}
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardHome />} />
                <Route path="/dashboard/edit-profile" element={<EditProfile />} />
                <Route path="/dashboard/experiences" element={<ExperiencePage />} />
                <Route path="/dashboard/skills" element={<SkillsPage />} />
                <Route path="/dashboard/education" element={<EducationPage />} />
                <Route path="/dashboard/certifications" element={<CertificationsPage />} />
                <Route path="/dashboard/publications" element={<ResearchPage />} />
                <Route path="/dashboard/theme" element={<PortfolioThemePage />} />
                <Route path="/dashboard/cv" element={<UploadCVPage />} />
                <Route path="/dashboard/settings" element={<SettingsPage />} />
                <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
                <Route path="/explore" element={<ExploreNurses />} />
                <Route path="/feed" element={<NurseFeed />} />
                <Route path="/locum" element={<LocumPage />} />
                <Route path="/locum/new" element={<PostLocumRequest />} />
                <Route path="/locum/:requestId/applicants" element={<LocumApplicants />} />
                {/* Admin administration dashboard */}
                <Route path="/admin" element={<AdminDashboard />} />

                {/* CV Generator — flagship feature. Lazy-loaded so the PDF
                    renderer only ships when the user actually opens the CV. */}
                <Route
                  path="/cv"
                  element={
                    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
                      <CVGenerator />
                    </Suspense>
                  }
                />
              </Route>

              <Route path="/cv/edit" element={<CVEditor />} />

              {/* 404 Guard fallback */}
              <Route path="*" element={<NotFound />} />

            </Routes>

          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}