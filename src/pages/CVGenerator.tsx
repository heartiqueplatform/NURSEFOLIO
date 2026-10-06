/**
 * CVGenerator.tsx
 *
 * The CV Generator page.
 *
 * Turn F changes:
 * - Header is no longer sticky. The floating bar with backdrop-blur was
 *   covering the CV and adding visual noise. The CV now starts at the top
 *   of the viewport with no header stealing space. Back navigation lives
 *   in the browser and the button still works if the user scrolls back up.
 * - Desktop horizontal scrollbar hidden. Mobile keeps it (users need the
 *   scroll affordance), but on desktop the bar is invisible.
 * - Header contact line renders phone + WhatsApp from the profile.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Download, Printer, SlidersHorizontal, Pencil,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PDFViewer } from '@react-pdf/renderer';
import { useCVBundle } from '../hooks/useCVBundle';
import { useCVPreferences } from '../hooks/useCVPreferences';
import { CVTemplate } from '../components/cv/CVTemplate';
import { CVPrintFallback } from '../components/cv/CVPrintFallback';
import { CustomizeSheet } from '../components/cv/CustomizeSheet';
import { downloadCV } from '../lib/pdfExport';
import { supabase } from '../lib/supabase';
import { PDFErrorBoundary } from '../components/cv/PDFErrorBoundary';
import '../lib/cvPrint.css';

export default function CVGenerator() {
    const navigate = useNavigate();
    const { data, loading, error, refresh } = useCVBundle();

    const [userId, setUserId] = useState<string | null>(null);
    useEffect(() => {
        void (async () => {
            const { data: session } = await supabase.auth.getSession();
            setUserId(session.session?.user.id ?? null);
        })();
    }, []);

    const {
        prefs,
        setSectionVisible,
        setOrder,
        setShowPhoto,
        reset,
    } = useCVPreferences(userId);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    useEffect(() => {
        if (data) {
            document.title = `${data.header.name} — CV`;
            return () => { document.title = 'Nursefolio'; };
        }
    }, [data]);

    const handleDownload = async () => {
        if (!data || exporting) return;
        setExporting(true);
        setExportError(null);
        try {
            await downloadCV({ bundle: data, prefs });
        } catch (e) {
            setExportError(
                e instanceof Error ? e.message : 'Could not generate the PDF. Try again.'
            );
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            {/* Non-sticky header. WHY: the sticky version floated over the CV and
          made the page feel cramped. Back navigation still works via the
          browser gesture or by scrolling to the top. */}
            <header className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 px-4 h-14">
                    <button
                        onClick={() => navigate(-1)}
                        aria-label="Back"
                        className="p-2 -ml-2 rounded-xl active:scale-[98%] transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-semibold text-base">Your CV</h1>
                    <div className="ml-auto flex items-center gap-1">
                        <button
                            onClick={() => navigate('/cv/edit')}
                            aria-label="Edit CV content"
                            className="p-2 rounded-xl active:scale-[98%] transition"
                        >
                            <Pencil className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handlePrint}
                            aria-label="Print CV"
                            className="p-2 rounded-xl active:scale-[98%] transition"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setSheetOpen(true)}
                            aria-label="Customize CV layout"
                            className="p-2 rounded-xl active:scale-[98%] transition"
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="pb-32 md:pb-12">
                {loading && !data && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-6">
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
                        <p className="text-sm text-zinc-500">Building your CV…</p>
                    </div>
                )}

                {error === 'not-authenticated' && (
                    <EmptyState
                        title="Sign in to build your CV"
                        body="Your CV is built from your Nursefolio profile. Sign in and we'll assemble it in seconds."
                        cta="Sign in"
                        onCta={() => navigate('/login')}
                    />
                )}

                {error && error !== 'not-authenticated' && (
                    <EmptyState
                        title="We couldn't build your CV"
                        body={error}
                        cta="Try again"
                        onCta={() => void refresh()}
                    />
                )}

                {data && (
                    <div className="px-3 md:px-6 pt-4 md:pt-6">
                        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mb-3 md:mb-4 md:text-center">
                            Live preview — updates as your profile changes
                        </p>

                        {/* Horizontal-scroll container.
                Mobile: scroll bar hidden but scroll gesture active — users
                swipe to pan the CV. WHY we don't fit-to-width: A4 at 360px
                viewport shrinks 9.5pt text to ~6.7pt, unreadable.
                Desktop: no scroll needed, and the scrollbar is hidden via
                the .no-scrollbar class defined below. */}
                        <div
                            className="
                overflow-x-auto overflow-y-hidden -mx-3 px-3 no-scrollbar
                md:overflow-visible md:mx-auto md:px-0 md:max-w-[760px]
              "
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            <div className="min-w-[680px] md:min-w-0">
                                <div
                                    className="rounded-2xl overflow-hidden shadow-xl bg-white"
                                    style={{ height: 'clamp(560px, 140vw, 1000px)' }}
                                >
                                    <PDFErrorBoundary fallback={<CVPrintFallback bundle={data} prefs={prefs} />}>
                                        <PDFViewer
                                            width="100%"
                                            height="100%"
                                            showToolbar={false}
                                            style={{ border: 'none' }}
                                        >
                                            <CVTemplate bundle={data} prefs={prefs} />
                                        </PDFViewer>
                                    </PDFErrorBoundary>
                                </div>
                            </div>
                        </div>

                        {exportError && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-3 text-center md:mt-4">
                                {exportError}
                            </p>
                        )}
                    </div>
                )}
            </main>

            {data && (
                <div
                    className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <div className="px-4 py-3 flex gap-2">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/cv/edit')}
                            aria-label="Edit CV content"
                            className="shrink-0 min-h-[52px] w-[52px] rounded-2xl border border-zinc-300 dark:border-zinc-700 flex items-center justify-center"
                        >
                            <Pencil className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleDownload}
                            disabled={exporting}
                            className="flex-1 min-h-[52px] rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            <Download className="w-5 h-5" />
                            {exporting ? 'Preparing…' : 'Download PDF'}
                        </motion.button>
                    </div>
                </div>
            )}

            {data && (
                <div className="hidden md:flex justify-center gap-3 mt-6 mb-12">
                    <button
                        onClick={() => navigate('/cv/edit')}
                        className="min-h-[44px] px-5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-medium active:scale-[98%] transition flex items-center gap-2"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit content
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={exporting}
                        className="min-h-[44px] px-6 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium active:scale-[98%] transition flex items-center gap-2 disabled:opacity-60"
                    >
                        <Download className="w-4 h-4" />
                        {exporting ? 'Preparing…' : 'Download PDF'}
                    </button>
                </div>
            )}

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

            <CustomizeSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                prefs={prefs}
                onToggle={setSectionVisible}
                onReorder={setOrder}
                onSetShowPhoto={setShowPhoto}
                onReset={reset}
            />

            {/* Local utility: hide the horizontal scrollbar everywhere it isn't
          wanted. Mobile keeps its scroll gesture; the bar itself is visual
          noise at phone sizes. */}
            <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}

function EmptyState({
    title,
    body,
    cta,
    onCta,
}: {
    title: string;
    body: string;
    cta: string;
    onCta: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">{body}</p>
            <button
                onClick={onCta}
                className="min-h-[44px] px-6 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium active:scale-[98%] transition"
            >
                {cta}
            </button>
        </div>
    );
}