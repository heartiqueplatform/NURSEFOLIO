/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Download, Printer, SlidersHorizontal, Pencil,
    Loader2, AlertCircle, FileText, Smartphone,
} from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { useCVBundle } from '../hooks/useCVBundle';
import { useCVPreferences } from '../hooks/useCVPreferences';
import { CVTemplate } from '../components/cv/CVTemplate';
import { CVPrintFallback } from '../components/cv/CVPrintFallback';
import { CustomizeSheet } from '../components/cv/CustomizeSheet';
import { PDFErrorBoundary } from '../components/cv/PDFErrorBoundary';
import { downloadCV } from '../lib/pdfExport';
import { supabase } from '../lib/supabase';
import '../lib/cvPrint.css';

// ==========================================================
// ENVIRONMENT DETECTION
// ==========================================================
// iOS Safari and many Android browsers fail to render an
// embedded PDFViewer iframe when the parent has a fixed pixel
// width inside an overflow-x-auto container. We detect this
// and fall back to the print-layout preview instead.
const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
const useFallbackPreview = isIOS || isSmallScreen;

// ==========================================================
// MAIN
// ==========================================================
export default function CVGenerator() {
    const navigate = useNavigate();
    const { data, loading, error, refresh } = useCVBundle();

    const [userId, setUserId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    // Load user id
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data: session } = await supabase.auth.getSession();
            if (!cancelled) setUserId(session.session?.user.id ?? null);
        })();
        return () => { cancelled = true; };
    }, []);

    const {
        prefs,
        setSectionVisible,
        setOrder,
        setShowPhoto,
        reset,
    } = useCVPreferences(userId);

    // Page title
    useEffect(() => {
        if (data) {
            document.title = `${data.header.name} — CV`;
            return () => { document.title = 'Nursefolio'; };
        }
    }, [data]);

    // ----------------------------------------------------------
    // Handlers
    // ----------------------------------------------------------
    const handleDownload = useCallback(async () => {
        if (!data || exporting) return;
        setExporting(true);
        setExportError(null);
        try {
            await downloadCV({ bundle: data, prefs });
        } catch (e) {
            setExportError(
                e instanceof Error ? e.message : 'Could not generate the PDF. Please try again.'
            );
        } finally {
            setExporting(false);
        }
    }, [data, prefs, exporting]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const openCustomize = useCallback(() => setSheetOpen(true), []);
    const closeCustomize = useCallback(() => setSheetOpen(false), []);

    // ==========================================================
    // RENDER
    // ==========================================================
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto md:px-6 md:py-8 pb-28 md:pb-8">

                {/* ============================================
            HEADER
            ============================================ */}
                <div className="px-4 md:px-0 pt-4 md:pt-0 pb-4 md:pb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition flex-shrink-0"
                        aria-label="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Your CV
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Live preview, updates with your profile
                        </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <IconButton onClick={() => navigate('/cv/edit')} label="Edit CV content">
                            <Pencil className="w-4 h-4" />
                        </IconButton>
                        <IconButton onClick={handlePrint} label="Print CV">
                            <Printer className="w-4 h-4" />
                        </IconButton>
                        <IconButton onClick={openCustomize} label="Customize layout">
                            <SlidersHorizontal className="w-4 h-4" />
                        </IconButton>
                    </div>
                </div>

                {/* ============================================
            LOADING
            ============================================ */}
                {loading && !data && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 className="w-6 h-6 text-teal-600 dark:text-teal-400 animate-spin" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Building your CV…
                        </p>
                    </div>
                )}

                {/* ============================================
            ERROR — not signed in
            ============================================ */}
                {error === 'not-authenticated' && (
                    <SimpleEmptyState
                        icon={AlertCircle}
                        title="Sign in to build your CV"
                        body="Your CV is built from your Nursefolio profile. Sign in and we'll assemble it in seconds."
                        cta="Sign in"
                        onCta={() => navigate('/login')}
                    />
                )}

                {/* ============================================
            ERROR — build failed
            ============================================ */}
                {error && error !== 'not-authenticated' && (
                    <SimpleEmptyState
                        icon={AlertCircle}
                        tone="rose"
                        title="We couldn't build your CV"
                        body={error}
                        cta="Try again"
                        onCta={() => void refresh()}
                    />
                )}

                {/* ============================================
            SUCCESS — CV preview
            ============================================ */}
                {data && (
                    <>
                        {useFallbackPreview ? (
                            /* MOBILE / iOS: use the print-layout preview.
                               The PDFViewer iframe doesn't render reliably in these
                               environments. The print fallback is styled to match. */
                            <MobilePreview
                                bundle={data}
                                prefs={prefs}
                            />
                        ) : (
                            /* DESKTOP: full PDFViewer with horizontal pan.
                               Only renders on screens where the iframe works reliably. */
                            <DesktopPreview
                                bundle={data}
                                prefs={prefs}
                            />
                        )}

                        {exportError && (
                            <div className="mx-4 md:mx-0 mt-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{exportError}</span>
                            </div>
                        )}
                    </>
                )}

            </div>

            {/* ============================================
          MOBILE ACTION BAR
          ============================================ */}
            {data && (
                <div
                    className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                >
                    <div className="px-4 py-3 flex gap-2">
                        <button
                            onClick={() => navigate('/cv/edit')}
                            className="shrink-0 w-[52px] h-[52px] rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 flex items-center justify-center active:opacity-70 transition"
                            aria-label="Edit CV content"
                        >
                            <Pencil className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={exporting}
                            className="flex-1 h-[52px] rounded-2xl bg-teal-600 active:bg-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                            {exporting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Preparing
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Download PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ============================================
          DESKTOP ACTION BAR
          ============================================ */}
            {data && (
                <div className="hidden md:flex justify-center gap-3 mb-8 -mt-2">
                    <button
                        onClick={() => navigate('/cv/edit')}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[44px]"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit content
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={exporting}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 min-h-[44px]"
                    >
                        {exporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Preparing
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download PDF
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* ============================================
          HIDDEN PRINT LAYOUT
          ============================================ */}
            {data && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'fixed',
                        left: '-10000px',
                        top: 0,
                        pointerEvents: 'none',
                    }}
                >
                    <CVPrintFallback bundle={data} prefs={prefs} />
                </div>
            )}

            {/* ============================================
          CUSTOMIZE SHEET
          ============================================ */}
            <CustomizeSheet
                open={sheetOpen}
                onClose={closeCustomize}
                prefs={prefs}
                onToggle={setSectionVisible}
                onReorder={setOrder}
                onSetShowPhoto={setShowPhoto}
                onReset={reset}
            />
        </div>
    );
}

// ==========================================================
// DESKTOP PREVIEW — full PDF viewer
// ==========================================================
const DesktopPreview = React.memo<{
    bundle: any;
    prefs: any;
}>(({ bundle, prefs }) => (
    <div className="px-6">
        <div className="max-w-3xl mx-auto">
            <div
                className="rounded-3xl overflow-hidden bg-white"
                style={{ height: 'clamp(700px, 90vh, 1000px)' }}
            >
                <PDFErrorBoundary fallback={<CVPrintFallback bundle={bundle} prefs={prefs} />}>
                    <PDFViewer
                        width="100%"
                        height="100%"
                        showToolbar={false}
                        style={{ border: 'none' }}
                    >
                        <CVTemplate bundle={bundle} prefs={prefs} />
                    </PDFViewer>
                </PDFErrorBoundary>
            </div>

            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">
                This is what recruiters see when they download your CV
            </p>
        </div>
    </div>
));
DesktopPreview.displayName = 'DesktopPreview';

// ==========================================================
// MOBILE PREVIEW — print layout instead of iframe
// ==========================================================
const MobilePreview = React.memo<{
    bundle: any;
    prefs: any;
}>(({ bundle, prefs }) => (
    <div className="px-4">
        {/* Notice for mobile users */}
        <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
            <Smartphone className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Preview mode
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Tap <strong className="text-slate-700 dark:text-slate-300">Download PDF</strong> below to see the exact A4 version.
                    This is the readable preview.
                </p>
            </div>
        </div>

        {/* Print-layout preview card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-6">
            <CVPrintFallback bundle={bundle} prefs={prefs} />
        </div>
    </div>
));
MobilePreview.displayName = 'MobilePreview';

// ==========================================================
// ICON BUTTON
// ==========================================================
const IconButton = React.memo<{
    onClick: () => void;
    label: string;
    children: React.ReactNode;
}>(({ onClick, label, children }) => (
    <button
        onClick={onClick}
        aria-label={label}
        className="p-2 rounded-full text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition"
    >
        {children}
    </button>
));
IconButton.displayName = 'IconButton';

// ==========================================================
// SIMPLE EMPTY STATE
// ==========================================================
const SimpleEmptyState = React.memo<{
    icon: any;
    tone?: 'neutral' | 'rose';
    title: string;
    body: string;
    cta: string;
    onCta: () => void;
}>(({ icon: Icon, tone = 'neutral', title, body, cta, onCta }) => {
    const tones = {
        neutral: 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-slate-400',
        rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    };
    return (
        <div className="text-center py-16 px-6">
            <div className={`w-16 h-16 rounded-full ${tones[tone]} flex items-center justify-center mx-auto mb-5`}>
                <Icon className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                {body}
            </p>
            <button
                onClick={onCta}
                className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[48px]"
            >
                {cta}
            </button>
        </div>
    );
});
SimpleEmptyState.displayName = 'SimpleEmptyState';