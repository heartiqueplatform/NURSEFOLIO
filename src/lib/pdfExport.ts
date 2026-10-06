/**
 * pdfExport.ts
 *
 * Renders the CV Document to a Blob and triggers a browser download.
 *
 * WHY this file is separated from the template:
 * The template is layout. This file is delivery. When we add email export
 * and WhatsApp export, those flows reuse the same blob producer without
 * duplicating render logic.
 *
 * Fix history:
 * The previous version passed `React.createElement(CVTemplate, props)` to
 * pdf(). That fails with "Cannot read properties of null (reading 'props')"
 * because @react-pdf/renderer's reconciler needs to see a <Document> as the
 * ROOT element, not a component that returns one. A functional wrapper
 * around <Document> is invisible to the reconciler's tree walker.
 *
 * The correct pattern: call the CVTemplate function directly to get its
 * JSX, which is a <Document> element. Pass THAT to pdf(). No wrapper.
 *
 * We preserve the component shape because Step 5 needs it as a real
 * component for <PDFViewer>. We just also expose a pure function that
 * returns the Document element for the exporter to consume.
 *
 * iOS Safari quirk we handle:
 * Safari on iOS does not honor the download attribute on <a> for blob URLs
 * in the same way Chrome does. The reliable path is to open the blob in a
 * new tab and let the OS PDF viewer offer Share/Save. We detect iOS and
 * branch. Android and desktop get a normal download.
 */

import { pdf } from '@react-pdf/renderer';
import { CVTemplate } from '../components/cv/CVTemplate';
import type { CVBundle } from '../services/cvBuilder';
import type { CVPreferences } from '../hooks/useCVPreferences';

export interface ExportOptions {
    bundle: CVBundle;
    prefs: CVPreferences;
    /** Override for tests. Defaults to `${name}-CV.pdf` slug. */
    filename?: string;
}

/** Slugify a name into a safe filename. "Grace W. Kamau" -> "Grace-W-Kamau". */
function slugName(name: string): string {
    return (
        name
            .trim()
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 60) || 'Nurse'
    );
}

function defaultFilename(bundle: CVBundle): string {
    return `${slugName(bundle.header.name)}-CV.pdf`;
}

function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    const iOSLike = /iPad|iPhone|iPod/.test(ua);
    const iPadOS =
        navigator.platform === 'MacIntel' &&
        (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints !== undefined &&
        (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1;
    return iOSLike || iPadOS;
}

/**
 * Produce a Blob of the rendered CV PDF. Does not trigger any download.
 *
 * WHY we call CVTemplate as a plain function here instead of using
 * React.createElement:
 * @react-pdf/renderer walks the element tree looking for a <Document> root.
 * When we pass a component, it sees a function component with no
 * recognizable root and fails on the tree traversal. Calling the function
 * directly gives us the JSX it returns — a real <Document> element — which
 * the reconciler can process.
 *
 * CVTemplate is a pure component with no hooks or state. Calling it as a
 * function is safe and is the pattern @react-pdf/renderer itself documents
 * for this exact case.
 */
export async function renderCVBlob(options: ExportOptions): Promise<Blob> {
    const document = CVTemplate({ bundle: options.bundle, prefs: options.prefs });
    return await pdf(document).toBlob();
}

/**
 * Trigger a browser download (or iOS open-in-new-tab) of the CV PDF.
 * Returns the blob so callers can chain (e.g. upload for WhatsApp share).
 */
export async function downloadCV(options: ExportOptions): Promise<Blob> {
    const blob = await renderCVBlob(options);
    const filename = options.filename ?? defaultFilename(options.bundle);
    const url = URL.createObjectURL(blob);

    if (isIOS()) {
        // iOS Safari: opening in a new tab lands in the PDF viewer, where the
        // share sheet exposes Save to Files / Save to Photos. Anchor download
        // is silently ignored. Verified behavior on iOS 15+.
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    // Revoke after a generous delay. Safari and Chrome both need the URL to
    // stay alive long enough for the browser to actually fetch it.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);

    return blob;
}