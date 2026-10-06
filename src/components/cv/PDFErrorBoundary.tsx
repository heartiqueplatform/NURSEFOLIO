/**
 * PDFErrorBoundary.tsx
 *
 * @react-pdf/renderer can fail at runtime for reasons we can't predict:
 * a broken image URL that throws during layout, a worker blocked by a
 * strict CSP, a font cache corrupted by an interrupted first load. When
 * it does, the default is an unstyled blank iframe — the worst possible
 * outcome for a nurse who is trying to send her CV to a hospital.
 *
 * WHY a class component: React error boundaries are the one thing hooks
 * can't replace. This is the canonical use case.
 */

import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback: ReactNode;
}

interface State {
    hasError: boolean;
}

export class PDFErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        // Log for diagnostics but do not surface to the user — the fallback
        // is a better experience than an error message here.
        // eslint-disable-next-line no-console
        console.error('[CV] PDFViewer failed, using HTML fallback:', error);
    }

    render() {
        if (this.state.hasError) return <>{this.props.fallback}</>;
        return this.props.children;
    }
}