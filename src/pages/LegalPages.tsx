/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Shield, FileText, Scale, BadgeAlert,
  Map, CheckCircle, ExternalLink, Download,
  UserX, FileCheck, CheckSquare, RefreshCw,
  Building, Globe, Lock, AlertTriangle
} from 'lucide-react';

type LegalTab = 'privacy' | 'terms' | 'compliance';

export default function LegalPages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as LegalTab) || 'privacy';
  const [activeTab, setActiveTab] = useState<LegalTab>('privacy');

  useEffect(() => {
    if (initialTab === 'privacy' || initialTab === 'terms' || initialTab === 'compliance') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: LegalTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Breadcrumbs & Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
              <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">Home</Link>
              <span>/</span>
              <span className="text-slate-700 dark:text-slate-300">Legal & Regulatory Compliance</span>
            </nav>
            <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
              Legal, Privacy & Compliance Policy
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Official disclosures, terms of service, and regional African & international regulatory alignments.
            </p>
          </div>
          <button
            id="btn-print-legal"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl shadow-sm cursor-pointer transition-all duration-150"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print or Save PDF</span>
          </button>
        </div>

        {/* Tab System Wrapper in Bento Card */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Navigation panel */}
          <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-none">
            <button
              id="tab-privacy"
              onClick={() => handleTabChange('privacy')}
              className={`flex items-center gap-2.5 px-4 py-3 text-left rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer flex-shrink-0 w-full ${activeTab === 'privacy'
                ? 'bg-indigo-600 dark:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700'
                }`}
            >
              <Shield className="w-4 h-4" />
              <span>Privacy Policy</span>
            </button>
            <button
              id="tab-terms"
              onClick={() => handleTabChange('terms')}
              className={`flex items-center gap-2.5 px-4 py-3 text-left rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer flex-shrink-0 w-full ${activeTab === 'terms'
                ? 'bg-indigo-600 dark:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700'
                }`}
            >
              <FileText className="w-4 h-4" />
              <span>Terms of Service</span>
            </button>
            <button
              id="tab-compliance"
              onClick={() => handleTabChange('compliance')}
              className={`flex items-center gap-2.5 px-4 py-3 text-left rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer flex-shrink-0 w-full ${activeTab === 'compliance'
                ? 'bg-indigo-600 dark:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700'
                }`}
            >
              <Scale className="w-4 h-4" />
              <span>Compliance & Kenya Regulations</span>
            </button>
          </div>

          {/* Policy Document Content Block */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-10">

            {/* TAB 1: PRIVACY POLICY */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400 mb-1.5 font-bold text-xs uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    <span>Kenya DPA 2019 & GDPR Compliant</span>
                  </div>
                  <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Privacy Policy</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Last Updated: May 25, 2026. Version 1.2.0</p>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
                  <p>
                    Welcome to <strong>Nursefolio</strong> ("we," "our," or "us"). We are committed to protecting the academic credentials, career statistics, licensing documents, and personal details of nursing practitioners and student members globally and within East Africa (Kenya).
                  </p>
                  <p>
                    This Privacy Policy outlines how your personal data is collected, stored, and protected in absolute accordance with the <strong>Kenya Data Protection Act (DPA), 2019</strong>, the European Union's <strong>General Data Protection Regulation (GDPR)</strong>, and the <strong>Apple App Store Review Guidelines (Guideline 5.1.1: Data Collection & Storage)</strong>.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-6 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-teal-500 rounded-sm inline-block"></span>
                    1. Data We Collect & Primary Purposes
                  </h3>
                  <p>
                    We collect only the essential professional and identity details required to host a highly interactive, certified nurse career portfolio web hub. This includes:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-1">
                    <li><strong>Account Credentials:</strong> Full name, verified email address, chosen custom portfolio slug, and password hashes.</li>
                    <li><strong>Professional Pedigree:</strong> Previous employment records (clinical experiences, departments, and roles), academic history (undergraduate degrees, institutions, and clinical concentrations), board credentials, and published medical journals or research papers.</li>
                    <li><strong>Verification Items:</strong> Nursing Council of Kenya (NCK) state board nursing index/license numbers, local state board documents, work badge photos, or clinical student IDs uploaded to secure document vaults.</li>
                    <li><strong>Custom Attachments:</strong> Personal resumes or Curricula Vitae (CV) in standard PDF format.</li>
                  </ul>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-6 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-sm inline-block"></span>
                    2. Security Framework & Storage Policies
                  </h3>
                  <p>
                    All active records are written securely to isolated databases powered by state-of-the-art backend instances.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-1">
                    <li><strong>Row-Level Security (RLS):</strong> Our storage engines leverage deep access rules verifying authentication. Profiles, experiences, education indexes, and certification files cannot be written/modified by any external viewer. Only you can configure or alter your record.</li>
                    <li><strong>Secure Storage Pools:</strong> Uploaded CVs, license papers, and student cards are stored in isolated binary buckets utilizing industry-grade tokens. They are accessed only for administrative validation.</li>
                    <li><strong>Direct Access Control:</strong> We never sell, rent, or distribute any user portfolio analytics or licensing coordinates to insurance companies, third-party recruiters, or advertising agencies.</li>
                  </ul>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-6 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-red-500 rounded-sm inline-block"></span>
                    3. Your Rights & Absolute Clause of Erasure (De-registration)
                  </h3>
                  <p>
                    Under Chapter IV of Kenya's Data Protection Act, 2019, you have robust and legally enforceable rights over your digital footprints.
                  </p>
                  <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800 p-4 rounded-xl text-rose-950 dark:text-rose-300 flex flex-col sm:flex-row gap-3">
                    <div className="p-1.5 bg-rose-500 text-white rounded-lg h-fit">
                      <UserX className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Right of Erasure (DPA Sec 26 & GDPR Art 17)</p>
                      <p className="text-xs text-rose-900 dark:text-rose-300 mt-0.5 leading-relaxed">
                        You hold the sovereign right to delete your profile entirely at any moment. Doing so immediately and permanently wipes your personal profiles, certifications, historical CV files, research records, and clinical logs from our production systems. You may trigger account deletion directly in your <strong>Dashboard Settings panel</strong>.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-6 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-slate-500 rounded-sm inline-block"></span>
                    4. Third-Party Services
                  </h3>
                  <p>
                    To enforce secure data processing, we coordinate with reliable tech-infra partners:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 mt-1">
                    <li><strong>Supabase API Engine:</strong> Fully managed backend ecosystem supporting real-time user lookup, RLS integrity, and secure PostgreSQL schema containment.</li>
                    <li><strong>Unsplash Graphic Library:</strong> Standard dynamic cover artwork and healthcare backgrounds rendering placeholder visuals under strict standard public tokens.</li>
                  </ul>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 mt-6 text-center">
                    Questions about data processing may be referred to <strong className="text-slate-600 dark:text-slate-300">brianmuthomi851@gmail.com</strong>, designated representative for privacy affairs.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TERMS OF SERVICE */}
            {activeTab === 'terms' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400 mb-1.5 font-bold text-xs uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    <span>User Code & Disclaimers</span>
                  </div>
                  <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Terms of Service</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Last Updated: May 25, 2026</p>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
                  <p>
                    By activating an account, hosting a public nursing profile, or utilizing the analytical tracking systems provided by Nursefolio, you explicitly agree to these integrated Terms of Service.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-6 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-emerald-500 rounded-sm inline-block"></span>
                    1. Professional Code of Conduct & License Accountability
                  </h3>
                  <p>
                    Nursefolio is designed exclusively for verified healthcare practitioners, academic researchers, and accredited nursing students.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-1">
                    <li><strong>License Credential Truth:</strong> You verify that any national credentials, nursing licensure, school student index, or training certificates added to your career profile are completely accurate and belong to you.</li>
                    <li><strong>Prompt Verification:</strong> Users submitting credentials for custom verification Badges grant our platform administration the active authority to look up the stated license within public registers like the <strong>Nursing Council of Kenya (NCK) Online Portal</strong> or individual USA State Boards.</li>
                    <li><strong>Zero Tolerance for Fraud:</strong> Representing oneself as a licensed physician, registered nurse (RN), or nursing officer without authentic, active regulatory accreditation is of extreme hazard. Accounts found with fraudulent licenses will be immediately flagged, deleted, and reported to the relevant regulatory bodies.</li>
                  </ul>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-6 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-red-500 rounded-sm inline-block"></span>
                    2. CRITICAL DISCLAIMER: Zero Medical Consultation Advice
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 p-5 rounded-xl text-slate-800 dark:text-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="p-1 outline outline-amber-200 dark:outline-amber-800 outline-offset-1 bg-amber-500 text-white rounded-lg flex-shrink-0">
                        <BadgeAlert className="w-4 h-4" />
                      </div>
                      <div className="text-xs md:text-sm">
                        <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-[11px] mb-1">
                          No Medical Care, Advisory, or Diagnostics Hosted Here
                        </p>
                        <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                          <strong>NOTICE:</strong> Nursefolio is exclusively a professional credentials portfolio, curriculum vitae hosting, and diagnostic-free networking web app.
                        </p>
                        <ul className="list-disc pl-4 space-y-1 mt-1.5 text-slate-650 dark:text-slate-400">
                          <li><strong>Does NOT Provide Healthcare:</strong> No clinical treatments, health advisories, symptom screenings, virtual nursing assessments, or diagnostic decisions are performed on this platform.</li>
                          <li><strong>No Clinical Patient Data Storage:</strong> Users are strictly banned from archiving, uploading, or displaying individual patient health, HIPAA-protected records, medical charts, or patient identifiers anywhere on their portfolios.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-6 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-sm inline-block"></span>
                    3. Fee Schedules & Optional Premium Upgrades
                  </h3>
                  <p>
                    Registration, standard credential listing, database-driven experience trackers, and resume building are supported fully across standard plans. Verified badges, dedicated bento-stylings, and detailed analytical logs require active activation of packages under specified payment gates.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-6 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-slate-500 rounded-sm inline-block"></span>
                    4. Limitation of Liability & Account Management
                  </h3>
                  <p>
                    We provide the services "as is," without any implied warranty of continuous server availability. We reserve the administrative authority to remove or reject user resumes or custom bio statements that are obscene, unprofessional, or violate national health guidelines.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: REGULATORY COMPLIANCE */}
            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400 mb-1.5 font-bold text-xs uppercase tracking-wider">
                    <Scale className="w-4 h-4" />
                    <span>Kenya & African Union Frameworks</span>
                  </div>
                  <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Compliance & Regional Standards</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Focus: NCK Portal, Kenya DPA 2019, AU Data Convention</p>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">

                  {/* Kenya Regional Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-150 dark:border-slate-700 space-y-3.5">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                      <Map className="w-4 h-4 flex-shrink-0" />
                      <span className="font-bold text-xs uppercase tracking-wider">
                        Kenya Healthcare Regulations Map
                      </span>
                    </div>

                    <div className="space-y-3 text-xs md:text-sm">
                      <p className="text-slate-705 dark:text-slate-400 font-medium leading-relaxed">
                        To serve nursing circles across Nairobi, Mombasa, Kisumu, Nakuru, and the greater East African corridor, the application operates in close alignment with state architectures:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5">
                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-1">
                          <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>ODPC Registration</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Aligned with rules from the Office of the Data Protection Commissioner (ODPC) of Kenya. In compliance with Section 18 of the DPA, we process user portfolios exclusively under express consent and strict professional purposes.
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-1">
                          <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Nursing Council Laws</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Aligns with Code of Ethics and Conduct for Nurses in Kenya. Verification audits compare index structures with NCK standards, guarding public credibility.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800 text-[11px] text-indigo-950 dark:text-indigo-300 flex gap-2">
                        <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Kenya Digital Health Act (2023) Notice:</strong> It is illegal to compromise, fake, or leak healthcare workforce statistics or register unauthorized medical facilities. This system collects professional records strictly with full consent of the respective individual.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New: Kenya-Specific Regulatory Bodies Section */}
                  <div className="space-y-3 mt-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-4 h-4" />
                      <span>Kenya Regulatory Bodies We Align With</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Nursing Council of Kenya (NCK)</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Verification of Registered Nurse (RN), Kenya Registered Community Health Nurse (KRCHN), and nursing student licenses.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Office of the Data Protection Commissioner (ODPC)</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ensuring compliance with Kenya's Data Protection Act, 2019 for all user data processing activities.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Kenya Health Professions Oversight Authority (KHPOA)</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Oversight standards for health professionals' credentials and practice compliance.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-6 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-sky-500 rounded-sm inline-block"></span>
                    Compliance Checklist for App Store Review Inspectors
                  </h3>
                  <p>
                    Below is a direct index of technical and administrative conditions configured to conform with <strong>Apple Developer Guidelines</strong>:
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
                      <div>
                        <strong className="text-xs text-slate-900 dark:text-white uppercase">Guideline 5.1.1(a)(i) - Account Creation Disclosures</strong>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          Every user has immediate visibility of the purpose of licensing documentation collection during registering or submitting verification. No silent background data scraping or hidden tracker processes occur.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
                      <div>
                        <strong className="text-xs text-slate-900 dark:text-white uppercase">Guideline 5.1.1(b)(ii) - Explicit Account Deletion Button</strong>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          In accordance with App Store guidelines, our application DOES NOT force email requests to wipe accounts. An interactive, explicit <strong>"De-activate License & Purge Core Record"</strong> engine is embedded right in the user-restricted Settings panel.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
                      <div>
                        <strong className="text-xs text-slate-900 dark:text-white uppercase">Guideline 5.1.1(b)(vii) - Medical Professional Verification Safety</strong>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          Verification is validated strictly by expert administrators checking real licensing registers. Our database supports automatic 'unverified status' for new accounts, restricting any badge display until actively authorized.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* New: Kenya-Specific Data Protection Rights */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 p-5 rounded-xl mt-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <AlertTriangle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Your Rights Under Kenya Data Protection Act, 2019</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> <strong>Right to be Informed:</strong> You have the right to know how your data is collected and processed.</li>
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> <strong>Right to Access:</strong> Request a copy of all personal data we hold about you.</li>
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> <strong>Right to Rectification:</strong> Correct inaccurate or incomplete data in your profile.</li>
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> <strong>Right to Erasure (Right to be Forgotten):</strong> Request deletion of your account and all associated data.</li>
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> <strong>Right to Object:</strong> Opt out of specific data processing activities.</li>
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> <strong>Right to Data Portability:</strong> Receive your data in a structured, commonly used format.</li>
                    </ul>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-6 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-slate-500 rounded-sm inline-block"></span>
                    General Inquiries & Regulatory Contact Details
                  </h3>
                  <p>
                    Nursefolio stands for safety, integrity, and verified clinical pride. For official requests, board-associated regulatory review reports, or compliance concerns, reach us at:
                  </p>
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-mono text-xs text-slate-650 dark:text-slate-300 space-y-1">
                    <p>📧 Email: medraenursing@gmail.com</p>
                    <p>📍 Office: Nairobi, Kenya</p>
                    <p>🌐 Web: nursefolio-applet.local</p>
                    <p className="pt-2 text-slate-400 dark:text-slate-500 text-[10px] border-t border-slate-200 dark:border-slate-700 mt-2">For DPA-related complaints, you may also contact the Office of the Data Protection Commissioner (ODPC) at complaints@odpc.go.ke</p>
                  </div>
                </div>
              </div>
            )}

            {/* Print/Offline Footer */}
            <div className="hidden print:block pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 mt-12">
              Printed on {new Date().toLocaleDateString()} from the official digital Nursefolio Portfolio Applet legal repository.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}